import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppStore } from '../../stores/appStore';
import { haversineMeters } from '../../utils/math';
import { ConnectionLine } from './ConnectionLine';
import { MarkerLayer } from './MarkerLayer';
import { PinLayer } from './PinLayer';
import { SeparationCircle } from './SeparationCircle';

const DEMO_STYLE_URL = 'https://demotiles.maplibre.org/style.json';

const FALLBACK_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-base',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

function resolveMapStyle(styleUrl?: string): StyleSpecification | string {
  const trimmed = styleUrl?.trim();

  // The demo style stops at zoom 6, which makes this screen look like a flat
  // colored slab at the default ride zoom. Fall back to a real street map.
  if (!trimmed || trimmed === DEMO_STYLE_URL) {
    return FALLBACK_MAP_STYLE;
  }

  return trimmed;
}

const MAP_STYLE = resolveMapStyle(import.meta.env.VITE_MAP_STYLE as string | undefined);

interface Props {
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
}

export function MapView({ initialLat = 20.5937, initialLng = 78.9629, initialZoom = 13 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  const myPosition  = useAppStore((s) => s.myPosition);
  const groupState  = useAppStore((s) => s.groupState);
  const activeGroup = useAppStore((s) => s.activeGroup);
  const pins        = useAppStore((s) => s.pins);
  const user        = useAppStore((s) => s.user);
  const rideSetup   = useAppStore((s) => s.rideSetup);

  const connectionLine = useMemo(() => {
    if (!groupState || !user) return null;

    const selfMember = groupState.members.find((member) => member.userId === user.id);
    const startLat = myPosition?.lat ?? selfMember?.lat ?? null;
    const startLng = myPosition?.lng ?? selfMember?.lng ?? null;

    if (startLat == null || startLng == null) return null;

    const others = groupState.members.filter((member) => member.userId !== user.id);
    if (others.length === 0) return null;

    const target = others.reduce((closest, member) => {
      const currentDistance = haversineMeters(startLat, startLng, member.lat, member.lng);
      const closestDistance = haversineMeters(startLat, startLng, closest.lat, closest.lng);
      return currentDistance < closestDistance ? member : closest;
    });

    return {
      startLat,
      startLng,
      endLat: target.lat,
      endLng: target.lng,
    };
  }, [groupState?.members, myPosition?.lat, myPosition?.lng, user?.id]);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: maplibregl.Map | null = null;

    try {
      map = new maplibregl.Map({
        container:    containerRef.current,
        style:        MAP_STYLE,
        center:       [initialLng, initialLat],
        zoom:         initialZoom,
        attributionControl: false,
        pitchWithRotate:    false,
        dragRotate:         false,
        // No animations — battery + low-end constraint
        fadeDuration: 0,
      });
    } catch (error) {
      console.error(error);
      setMapFailed(true);
      return;
    }

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    mapRef.current = map;

    const handleLoad = () => {
      setIsLoaded(true);
      map.resize();
    };
    map.once('load', handleLoad);

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(containerRef.current);

    requestAnimationFrame(() => map.resize());

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pan to my position on first GPS fix
  const hasCenteredRef = useRef(false);
  useEffect(() => {
    if (!mapRef.current || !myPosition || hasCenteredRef.current) return;
    mapRef.current.setCenter([myPosition.lng, myPosition.lat]);
    hasCenteredRef.current = true;
  }, [myPosition]);

  // Destination marker
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    
    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    if (rideSetup.destinationLat != null && rideSetup.destinationLng != null) {
      const el = document.createElement('div');
      el.style.cssText = 'font-size:32px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4)); cursor:pointer;';
      el.textContent = '🚩';
      
      destMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([rideSetup.destinationLng, rideSetup.destinationLat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong>Destination</strong><br/>${rideSetup.destinationName || 'Target'}`))
        .addTo(mapRef.current);
    }
  }, [rideSetup.destinationLat, rideSetup.destinationLng, rideSetup.destinationName, isLoaded]);

  return (
    <div className="map-wrapper">
      <div ref={containerRef} className="map-container">
        {mapFailed ? (
          <div className="map-loading">
            <div>
              <div className="map-unavailable-title">Map unavailable</div>
              <div className="map-unavailable-sub">
                This browser cannot create a WebGL map. The rest of the ride screen still works.
              </div>
            </div>
          </div>
        ) : !isLoaded && (
          <div className="map-loading">Loading map…</div>
        )}
      </div>
      {!mapFailed && isLoaded && mapRef.current && groupState && activeGroup && (
        <>
          <MarkerLayer map={mapRef.current} />
          <PinLayer map={mapRef.current} pins={pins} />
          {connectionLine && (
            <ConnectionLine
              map={mapRef.current}
              startLat={connectionLine.startLat}
              startLng={connectionLine.startLng}
              endLat={connectionLine.endLat}
              endLng={connectionLine.endLng}
            />
          )}
          <SeparationCircle
            map={mapRef.current}
            centerLat={groupState.centerLat}
            centerLng={groupState.centerLng}
            radiusMeters={activeGroup.settings.separationThresholdMeters}
          />
        </>
      )}
    </div>
  );
}
