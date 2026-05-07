import React from 'react';

export type IconName =
  | 'eye'
  | 'shield'
  | 'vibrate'
  | 'volume'
  | 'silence'
  | 'compass'
  | 'users'
  | 'copy'
  | 'qr'
  | 'arrow-left'
  | 'arrow-right'
  | 'zap'
  | 'key'
  | 'chevron-right'
  | 'history'
  | 'settings'
  | 'check'
  | 'alert-circle'
  | 'map'
  | 'user'
  | 'plus'
  | 'search'
  | 'log-out';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
}

export function Icon({ name, size = 24, className, ...props }: IconProps) {
  const renderPath = () => {
    switch (name) {
      case 'eye':
        return (
          <>
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        );
      case 'shield':
        return <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;
      case 'vibrate':
        return (
          <>
            <path d="m2 8 2 2-2 2 2 2-2 2" />
            <path d="m22 8-2 2 2 2-2 2 2 2" />
            <rect width="8" height="14" x="8" y="5" rx="1" />
          </>
        );
      case 'volume':
        return (
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        );
      case 'silence':
        return (
          <>
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 13H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4l5-4v18l-5-4z" />
          </>
        );
      case 'compass':
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </>
        );
      case 'users':
        return (
          <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        );
      case 'copy':
        return (
          <>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </>
        );
      case 'qr':
        return (
          <>
            <rect width="5" height="5" x="3" y="3" />
            <rect width="5" height="5" x="16" y="3" />
            <rect width="5" height="5" x="3" y="16" />
            <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
            <path d="M21 21v.01" />
            <path d="M12 7v3a2 2 0 0 1-2 2H7" />
            <path d="M3 12h.01" />
            <path d="M12 3h.01" />
            <path d="M12 16v.01" />
            <path d="M16 12h1" />
            <path d="M21 12v.01" />
            <path d="M12 21v-1" />
          </>
        );
      case 'arrow-left':
        return (
          <>
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </>
        );
      case 'arrow-right':
        return (
          <>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </>
        );
      case 'zap':
        return <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />;
      case 'key':
        return (
          <>
            <path d="m21 2-2 2" />
            <circle cx="7.5" cy="15.5" r="5.5" />
            <path d="m21 2-9.6 9.6" />
            <path d="m15.5 7.5 3 3" />
          </>
        );
      case 'chevron-right':
        return <path d="m9 18 6-6-6-6" />;
      case 'history':
        return (
          <>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
          </>
        );
      case 'settings':
        return (
          <>
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </>
        );
      case 'check':
        return <path d="M20 6 9 17l-5-5" />;
      case 'alert-circle':
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </>
        );
      case 'map':
        return (
          <>
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </>
        );
      case 'user':
        return (
          <>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </>
        );
      case 'plus':
        return (
          <>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </>
        );
      case 'search':
        return (
          <>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </>
        );
      case 'log-out':
        return (
          <>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {renderPath()}
    </svg>
  );
}
