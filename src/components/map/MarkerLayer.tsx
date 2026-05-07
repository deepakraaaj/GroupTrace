/**
 * MarkerLayer — renders member dots directly via DOM manipulation
 * (not React re-renders) to satisfy the performance constraint:
 * "MapLibre markers update via direct DOM manipulation, not React rerenders"
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useAppStore } from '../../stores/appStore';
import type { MemberLocation } from '../../types';

const STATUS_COLOR: Record<string, string> = {
  together:  '#4CAF50',
  slow:      '#FFC107',
  separated: '#FF5252',
  offline:   '#757575',
};

interface Props {
  map: maplibregl.Map;
}

function createMarkerEl(member: MemberLocation, isSelf: boolean, isOrganizer: boolean): HTMLElement {
  const el = document.createElement('div');
  el.className  = 'map-marker';
  const size    = isOrganizer ? 40 : isSelf ? 36 : 28;
  const color   = STATUS_COLOR[member.status] ?? '#4CAF50';

  el.style.cssText = `
    width:${size}px;height:${size}px;
    border-radius:50%;
    background:${member.avatarColor};
    border:3px solid ${color};
    display:flex;align-items:center;justify-content:center;
    color:#fff;font-weight:700;font-size:${size > 30 ? 14 : 11}px;
    box-shadow:0 2px 6px rgba(0,0,0,0.5);
    cursor:pointer;
    user-select:none;
  `;
  el.textContent = member.displayName[0].toUpperCase();
  return el;
}

export function MarkerLayer({ map }: Props) {
  const groupState  = useAppStore((s) => s.groupState);
  const user        = useAppStore((s) => s.user);
  const activeGroup = useAppStore((s) => s.activeGroup);

  // marker registry: userId → { marker, el }
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLElement }>>(new Map());

  useEffect(() => {
    if (!groupState) return;

    const members      = groupState.members;
    const myId         = user?.id;
    const organizerId  = activeGroup?.organizer_id;
    const currentIds   = new Set(members.map((m) => m.userId));

    // Remove stale markers
    for (const [uid, { marker }] of markersRef.current.entries()) {
      if (!currentIds.has(uid)) {
        marker.remove();
        markersRef.current.delete(uid);
      }
    }

    // Add / update markers — direct DOM, no React state
    for (const member of members) {
      const isSelf      = member.userId === myId;
      const isOrganizer = member.userId === organizerId;
      const existing    = markersRef.current.get(member.userId);

      if (existing) {
        // Update position (LngLat)
        existing.marker.setLngLat([member.lng, member.lat]);

        // Update border color for status change — direct style mutation
        const color = STATUS_COLOR[member.status] ?? '#4CAF50';
        existing.el.style.borderColor = color;
      } else {
        const el     = createMarkerEl(member, isSelf, isOrganizer);
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([member.lng, member.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 20, closeButton: false })
              .setHTML(`<strong>${member.displayName}</strong><br/>${member.status}`)
          )
          .addTo(map);

        markersRef.current.set(member.userId, { marker, el });
      }
    }
  }, [groupState?.members, user?.id, activeGroup?.organizer_id, map]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up all markers on unmount
  useEffect(() => {
    return () => {
      for (const { marker } of markersRef.current.values()) marker.remove();
      markersRef.current.clear();
    };
  }, []);

  return null; // renders nothing into React tree
}
