import { useState, useEffect, useRef } from 'react';
import { Icon } from '../ui/Icon';

interface SearchResult {
  properties: {
    name: string;
    city?: string;
    state?: string;
    country?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lng, lat]
  };
}

interface Props {
  onSelect: (name: string, lat: number, lng: number) => void;
  placeholder?: string;
}

export function GeoSearch({ onSelect, placeholder = 'Search for a destination...' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
        );
        const data = await response.json();
        setResults(data.features || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (res: SearchResult) => {
    const name = res.properties.name;
    const [lng, lat] = res.geometry.coordinates;
    const label = [
      name,
      res.properties.city,
      res.properties.country
    ].filter(Boolean).join(', ');
    
    setQuery(label);
    setShowDropdown(false);
    onSelect(label, lat, lng);
  };

  return (
    <div className="geo-search" ref={containerRef}>
      <div className="search-input-wrapper">
        <Icon name="search" size={18} />
        <input
          type="text"
          className="text-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          onFocus={() => query.length >= 3 && setShowDropdown(true)}
        />
        {loading && <div className="search-spinner" />}
      </div>

      {showDropdown && results.length > 0 && (
        <ul className="search-dropdown slide-up">
          {results.map((res, i) => (
            <li key={i} className="search-item" onClick={() => handleSelect(res)}>
              <div className="item-icon">
                <Icon name="map" size={16} />
              </div>
              <div className="item-content">
                <div className="item-name">{res.properties.name}</div>
                <div className="item-meta">
                  {[res.properties.city, res.properties.state, res.properties.country]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <style>{`
        .geo-search {
          position: relative;
          width: 100%;
        }
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-input-wrapper .icon {
          position: absolute;
          left: 14px;
          color: var(--color-text-sub);
          pointer-events: none;
        }
        .search-input-wrapper .text-input {
          padding-left: 42px;
          padding-right: 42px;
        }
        .search-spinner {
          position: absolute;
          right: 14px;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .search-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-xl);
          z-index: 1000;
          list-style: none;
          margin: 0;
          padding: 6px;
          overflow: hidden;
        }
        .search-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.2s;
        }
        .search-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .item-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-accent);
          flex-shrink: 0;
        }
        .item-name {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          line-height: 1.2;
        }
        .item-meta {
          font-size: 11px;
          color: var(--color-text-sub);
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}
