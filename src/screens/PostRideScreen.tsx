import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { supabase } from '../services/supabaseClient';

interface RideSummary {
  name: string;
  source: string;
  destination: string;
  participantCount: number;
  createdAt: string;
}

export function PostRideScreen() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [summary, setSummary] = useState<RideSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      if (!sessionId) return;

      try {
        const { data, error } = await supabase
          .from('groups')
          .select(`
            name,
            source,
            destination,
            created_at,
            group_members(count)
          `)
          .eq('id', sessionId)
          .single();

        if (error) throw error;

        setSummary({
          name: data.name,
          source: data.source,
          destination: data.destination,
          participantCount: data.group_members?.[0]?.count || 0,
          createdAt: data.created_at,
        });
      } catch (e) {
        console.error('Failed to load summary:', e);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="screen screen--center">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="screen screen--center">
        <Icon name="alert-circle" size={48} />
        <p>Could not load ride summary</p>
      </div>
    );
  }

  return (
    <div className="screen screen--center post-ride-screen">
      <div className="summary-card">
        <div className="summary-icon success">
          <Icon name="check" size={64} />
        </div>

        <h1>Ride Completed!</h1>

        <div className="summary-details">
          <div className="detail-item">
            <span className="detail-label">Ride Name</span>
            <span className="detail-value">{summary.name}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Route</span>
            <span className="detail-value">
              {summary.source} → {summary.destination}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Participants</span>
            <span className="detail-value">{summary.participantCount} people</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Date</span>
            <span className="detail-value">
              {new Date(summary.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        <div className="summary-actions">
          <button
            className="btn-primary btn-xl"
            onClick={() => navigate('/')}
            style={{ width: '100%' }}
          >
            Back to Home
            <Icon name="arrow-right" size={20} />
          </button>
        </div>
      </div>

      <style>{`
        .post-ride-screen {
          background: var(--color-bg);
        }

        .summary-card {
          max-width: 450px;
          width: 100%;
          padding: 40px 20px;
        }

        .summary-icon {
          text-align: center;
          margin-bottom: 24px;
          color: var(--color-accent);
        }

        .summary-icon.success {
          animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .summary-card h1 {
          text-align: center;
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 40px;
          letter-spacing: -0.02em;
        }

        .summary-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 40px;
          padding: 24px;
          background: var(--color-surface);
          border-radius: 16px;
          border: 1px solid var(--color-border);
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-sub);
          font-weight: 600;
        }

        .detail-value {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          line-height: 1.4;
        }

        .summary-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
