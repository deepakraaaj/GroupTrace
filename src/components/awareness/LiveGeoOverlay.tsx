import { useAppStore } from '../../stores/appStore';
import { msToKmh } from '../../utils/math';

export function LiveGeoOverlay() {
  const myPosition = useAppStore((s) => s.myPosition);

  if (!myPosition) return null;

  return (
    <div className="live-geo-overlay">
      <div className="geo-item">
        <span className="geo-label">LAT</span>
        <span className="geo-value">{myPosition.lat.toFixed(6)}</span>
      </div>
      <div className="geo-item">
        <span className="geo-label">LNG</span>
        <span className="geo-value">{myPosition.lng.toFixed(6)}</span>
      </div>
      <div className="geo-divider" />
      <div className="geo-metrics">
        <div className="metric">
          <span className="metric-label">SPD</span>
          <span className="metric-value">
            {myPosition.speed != null ? Math.round(msToKmh(myPosition.speed)) : 0}
            <small>km/h</small>
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">ACC</span>
          <span className="metric-value">
            {Math.round(myPosition.accuracy ?? 0)}
            <small>m</small>
          </span>
        </div>
      </div>

      <style>{`
        .live-geo-overlay {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: fit-content;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .geo-item {
          display: flex;
          align-items: baseline;
          gap: 8px;
          line-height: 1;
        }
        .geo-label {
          font-size: 9px;
          font-weight: 800;
          color: var(--color-accent);
          width: 24px;
          opacity: 0.8;
        }
        .geo-value {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.02em;
        }
        .geo-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 4px 0;
        }
        .geo-metrics {
          display: flex;
          gap: 16px;
        }
        .metric {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .metric-label {
          font-size: 9px;
          font-weight: 800;
          color: var(--color-text-sub);
        }
        .metric-value {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: baseline;
          gap: 1px;
        }
        .metric-value small {
          font-size: 8px;
          font-weight: 500;
          opacity: 0.6;
          margin-left: 1px;
        }
      `}</style>
    </div>
  );
}
