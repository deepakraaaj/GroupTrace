import { Icon } from '../ui/Icon';

const REPLIES = [
  { id: 'ok',      label: 'All Good', icon: 'check' },
  { id: 'wait',    label: 'Wait for me', icon: 'shield' },
  { id: 'stop',    label: 'Need a break', icon: 'silence' },
  { id: 'fuel',    label: 'Petrol/Fuel', icon: 'settings' },
  { id: 'lost',    label: 'I am lost', icon: 'alert-circle' },
];

export function QuickReplyBar() {
  const handleReply = (id: string) => {
    console.log('Sending quick reply:', id);
    // In a real app, send message to Supabase
  };

  return (
    <div className="quick-reply-bar">
      <div className="reply-scroll">
        {REPLIES.map((r) => (
          <button 
            key={r.id} 
            className="reply-pill"
            onClick={() => handleReply(r.id)}
          >
            <Icon name={r.icon as any} size={14} />
            <span>{r.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        .quick-reply-bar {
          width: 100%;
          overflow: hidden;
          padding: 4px 0;
        }
        .reply-scroll {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 4px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        .reply-scroll::-webkit-scrollbar {
          display: none;
        }
        .reply-pill {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(24, 24, 27, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          scroll-snap-align: start;
          transition: var(--transition-fast);
        }
        .reply-pill:active {
          background: var(--color-accent);
          color: #000;
          border-color: var(--color-accent);
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}
