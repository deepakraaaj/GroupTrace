import React from 'react';

interface Props {
  children: React.ReactNode;
}

export function PageTransition({ children }: Props) {
  return (
    <div className="page-transition-wrapper">
      {children}
      <style>{`
        .page-transition-wrapper {
          width: 100%;
          height: 100%;
          animation: slide-in 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes slide-in {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
