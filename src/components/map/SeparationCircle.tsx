/**
 * Renders a "safe zone" circle on the map using a GeoJSON polygon.
 * Uses MapLibre fill layer — no React rerenders on GPS update.
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { destinationPoint } from '../../utils/math';

interface Props {
  map: maplibregl.Map;
  centerLat: number | null;
  centerLng: number | null;
  radiusMeters: number;
}

const SOURCE_ID = 'separation-circle-source';
const FILL_ID   = 'separation-circle-fill';
const BORDER_ID = 'separation-circle-border';
const STEPS     = 64;

function buildCircleGeoJSON(lat: number, lng: number, radiusM: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  for (let i = 0; i <= STEPS; i++) {
    const bearing = (i / STEPS) * 360;
    const p = destinationPoint(lat, lng, bearing, radiusM);
    coords.push([p.lng, p.lat]);
  }
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  };
}

export function SeparationCircle({ map, centerLat, centerLng, radiusMeters }: Props) {
  const addedRef = useRef(false);

  // Add layers once map style is loaded
  useEffect(() => {
    const addLayers = () => {
      if (addedRef.current || !map.isStyleLoaded()) return;

      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id:     FILL_ID,
        type:   'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color':   '#4CAF50',
          'fill-opacity': 0.08,
        },
      });

      map.addLayer({
        id:     BORDER_ID,
        type:   'line',
        source: SOURCE_ID,
        paint: {
          'line-color':   '#4CAF50',
          'line-width':   2,
          'line-opacity': 0.5,
          'line-dasharray': [4, 4],
        },
      });

      addedRef.current = true;
    };

    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      map.once('load', addLayers);
    }

    return () => {
      if (addedRef.current) {
        if (map.getLayer(FILL_ID))   map.removeLayer(FILL_ID);
        if (map.getLayer(BORDER_ID)) map.removeLayer(BORDER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        addedRef.current = false;
      }
    };
  }, [map]);

  // Update circle geometry on center change (direct source mutation — no React rerender)
  useEffect(() => {
    if (!addedRef.current || !centerLat || !centerLng) return;
    const src = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData({
      type:     'FeatureCollection',
      features: [buildCircleGeoJSON(centerLat, centerLng, radiusMeters)],
    });
  }, [centerLat, centerLng, radiusMeters, map]);

  return null;
}
