/**
 * DistanceLayer — shows all pairwise distances between riders
 *
 * Algorithm: Distance Graph Visualization
 * 1. Calculate all pairwise distances (O(n²))
 * 2. Sort edges by distance for better visualization
 * 3. Draw lines and labels for each pair
 * 4. Color code: green (near) → yellow (medium) → red (separated)
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useAppStore } from '../../stores/appStore';
import { haversineMeters } from '../../utils/math';
import type { MemberLocation } from '../../types';

interface DistanceEdge {
  from: MemberLocation;
  to: MemberLocation;
  distance: number;
  isSeparated: boolean;
}

function computeDistanceGraph(
  members: MemberLocation[],
  separationThresholdMeters: number
): DistanceEdge[] {
  const edges: DistanceEdge[] = [];

  // O(n²) pairwise distance calculation
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const from = members[i];
      const to = members[j];
      const distance = haversineMeters(from.lat, from.lng, to.lat, to.lng);
      const isSeparated = distance > separationThresholdMeters;

      edges.push({
        from,
        to,
        distance,
        isSeparated,
      });
    }
  }

  // Sort by distance for consistent rendering
  edges.sort((a, b) => a.distance - b.distance);
  return edges;
}

function getEdgeColor(distance: number, isSeparated: boolean, threshold: number): string {
  if (isSeparated) return 'rgba(239, 68, 68, 0.6)'; // red
  if (distance > threshold * 0.7) return 'rgba(251, 191, 36, 0.5)'; // yellow/orange
  return 'rgba(76, 175, 80, 0.4)'; // green
}

function getLineWidth(distance: number, isSeparated: boolean): number {
  if (isSeparated) return 3;
  return 2;
}

interface Props {
  map: maplibregl.Map;
  members: MemberLocation[];
  separationThresholdMeters: number;
}

export function DistanceLayer({ map, members, separationThresholdMeters }: Props) {
  const sourceIdRef = useRef('distance-edges');
  const layerIdRef = useRef('distance-edges-layer');
  const labelsRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  useEffect(() => {
    if (members.length < 2) {
      // Remove source/layer if not enough members
      if (map.getLayer(layerIdRef.current)) {
        map.removeLayer(layerIdRef.current);
      }
      if (map.getSource(sourceIdRef.current)) {
        map.removeSource(sourceIdRef.current);
      }
      for (const marker of labelsRef.current.values()) {
        marker.remove();
      }
      labelsRef.current.clear();
      return;
    }

    // Compute distance graph
    const edges = computeDistanceGraph(members, separationThresholdMeters);

    // Build GeoJSON LineStrings for all edges
    const features = edges.map((edge) => ({
      type: 'Feature',
      properties: {
        distance: Math.round(edge.distance),
        isSeparated: edge.isSeparated ? 1 : 0,
        color: getEdgeColor(edge.distance, edge.isSeparated, separationThresholdMeters),
        width: getLineWidth(edge.distance, edge.isSeparated),
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [edge.from.lng, edge.from.lat],
          [edge.to.lng, edge.to.lat],
        ],
      },
    }));

    const sourceId = sourceIdRef.current;
    const layerId = layerIdRef.current;

    // Create or update source
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });

      // Create layer
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['get', 'width'],
          'line-opacity': 0.7,
        },
      });
    } else {
      // Update source data
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features,
      });
    }

    // Update distance labels (remove old, add new)
    for (const marker of labelsRef.current.values()) {
      marker.remove();
    }
    labelsRef.current.clear();

    // Add distance labels at midpoint of each edge
    for (const edge of edges) {
      const midLat = (edge.from.lat + edge.to.lat) / 2;
      const midLng = (edge.from.lng + edge.to.lng) / 2;
      const distanceKm = (edge.distance / 1000).toFixed(2);

      const labelEl = document.createElement('div');
      labelEl.className = 'distance-label';
      labelEl.style.cssText = `
        background: rgba(24, 24, 27, 0.9);
        color: ${edge.isSeparated ? '#ef4444' : '#10b981'};
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        font-family: monospace;
        border: 1px solid ${edge.isSeparated ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'};
        white-space: nowrap;
        pointer-events: none;
        user-select: none;
      `;
      labelEl.textContent = `${distanceKm}km`;

      const marker = new maplibregl.Marker({ element: labelEl, anchor: 'center' })
        .setLngLat([midLng, midLat])
        .addTo(map);

      const key = `${edge.from.userId}-${edge.to.userId}`;
      labelsRef.current.set(key, marker);
    }

    console.log('[DistanceLayer] Rendered', edges.length, 'distance edges');
  }, [members, separationThresholdMeters, map]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const sourceId = sourceIdRef.current;
      const layerId = layerIdRef.current;

      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
      for (const marker of labelsRef.current.values()) {
        marker.remove();
      }
      labelsRef.current.clear();
    };
  }, [map]);

  return null; // renders nothing into React tree
}
