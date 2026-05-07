import { Icon } from '../ui/Icon';

export function TripSummary() {
  const stats = [
    { label: 'Distance', value: '42.5', unit: 'km', icon: 'map' },
    { label: 'Duration', value: '1:45', unit: 'hrs', icon: 'silence' },
    { label: 'Avg Speed', value: '34', unit: 'km/h', icon: 'compass' },
    { label: 'Group Sync', value: '98', unit: '%', icon: 'users' },
  ];

  return (
    <div className="trip-summary-modern">
      <h3 className="summary-title">Journey Statistics</h3>
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon-wrap">
              <Icon name={s.icon as any} size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{s.label}</span>
              <div className="stat-value-group">
                <span className="stat-value">{s.value}</span>
                <span className="stat-unit">{s.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="trip-route-preview">
        <div className="route-header">
           <Icon name="compass" size={16} />
           <span>Route Overview</span>
        </div>
        <div className="route-visual">
           <div className="route-line" />
           <div className="route-dot start" />
           <div className="route-dot end" />
        </div>
        <div className="route-points">
           <span>Start: Base Camp</span>
           <span>End: Summit Peak</span>
        </div>
      </div>

      <style>{`
        .trip-summary-modern {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .summary-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-sub);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          gap: 16px;
          align-items: center;
          transition: var(--transition-fast);
        }
        .stat-card:hover {
          border-color: var(--color-accent);
          transform: translateY(-2px);
          background: var(--color-surface-2);
        }
        .stat-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--color-surface-2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-accent);
          flex-shrink: 0;
        }
        .stat-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-sub);
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 800;
          font-family: var(--font-mono);
          letter-spacing: -0.02em;
        }
        .stat-unit {
          font-size: 12px;
          color: var(--color-muted);
          margin-left: 4px;
          font-weight: 600;
        }
        .trip-route-preview {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 24px;
        }
        .route-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 24px;
        }
        .route-visual {
          height: 4px;
          background: var(--color-surface-3);
          position: relative;
          border-radius: 2px;
          margin: 0 10px 16px;
        }
        .route-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--grad-primary);
          border-radius: 2px;
        }
        .route-dot {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid var(--color-bg);
        }
        .route-dot.start { left: -6px; background: var(--color-accent); }
        .route-dot.end { right: -6px; background: var(--color-accent); }
        .route-points {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-sub);
        }
      `}</style>
    </div>
  );
}
