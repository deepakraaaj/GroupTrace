import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { GroupPin, PinType } from '../../types';

const PIN_EMOJI: Record<PinType, string> = {
  wait_here:  '✋',
  danger:     '⚠️',
  petrol:     '⛽',
  regroup:    '📍',
  checkpoint: '🏁',
};

interface Props {
  map: maplibregl.Map;
  pins: GroupPin[];
}

function createPinEl(pin: GroupPin): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = `
    font-size:28px;line-height:1;cursor:pointer;
    filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));
  `;
  el.textContent = PIN_EMOJI[pin.pin_type] ?? '📍';
  return el;
}

export function PinLayer({ map, pins }: Props) {
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  useEffect(() => {
    const activeIds = new Set(pins.filter((p) => p.is_active).map((p) => p.id));

    // Remove inactive / deleted
    for (const [id, marker] of markersRef.current.entries()) {
      if (!activeIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    // Add new active pins
    for (const pin of pins) {
      if (!pin.is_active || markersRef.current.has(pin.id)) continue;

      const el     = createPinEl(pin);
      const popup  = new maplibregl.Popup({ offset: 24, closeButton: false })
        .setHTML(`<strong>${PIN_EMOJI[pin.pin_type]} ${pin.pin_type.replace('_', ' ')}</strong>${pin.message ? `<br/>${pin.message}` : ''}`);
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([pin.longitude, pin.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.set(pin.id, marker);
    }
  }, [pins, map]);

  useEffect(() => {
    return () => {
      for (const m of markersRef.current.values()) m.remove();
      markersRef.current.clear();
    };
  }, []);

  return null;
}
