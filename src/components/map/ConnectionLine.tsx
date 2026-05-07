/**
 * Draws a live line between the current rider and the selected target rider.
 * This stays on the MapLibre canvas so it updates without React rerenders.
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface Props {
  map: maplibregl.Map;
  startLat: number | null;
  startLng: number | null;
  endLat: number | null;
  endLng: number | null;
}

const SOURCE_ID = 'connection-line-source';
const LINE_ID   = 'connection-line-layer';

function buildLineGeoJSON(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [startLng, startLat],
        [endLng, endLat],
      ],
    },
    properties: {},
  };
}

export function ConnectionLine({ map, startLat, startLng, endLat, endLng }: Props) {
  const addedRef = useRef(false);

  useEffect(() => {
    const addLayer = () => {
      if (addedRef.current || !map.isStyleLoaded()) return;

      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: LINE_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#38bdf8',
          'line-width': 4,
          'line-opacity': 0.9,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      });

      addedRef.current = true;
    };

    if (map.isStyleLoaded()) {
      addLayer();
    } else {
      map.once('load', addLayer);
    }

    return () => {
      if (addedRef.current) {
        if (map.getLayer(LINE_ID)) map.removeLayer(LINE_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        addedRef.current = false;
      }
    };
  }, [map]);

  useEffect(() => {
    if (
      !addedRef.current ||
      startLat == null ||
      startLng == null ||
      endLat == null ||
      endLng == null
    ) {
      return;
    }

    const src = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    src.setData({
      type: 'FeatureCollection',
      features: [buildLineGeoJSON(startLat, startLng, endLat, endLng)],
    });
  }, [startLat, startLng, endLat, endLng, map]);

  return null;
}
