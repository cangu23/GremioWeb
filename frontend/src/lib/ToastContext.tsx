'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '380px',
        }}
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="glass"
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'slideIn 0.3s ease',
              borderLeft: `4px solid ${
                toast.type === 'success' ? 'var(--success)' :
                toast.type === 'error' ? 'var(--error)' :
                'var(--primary)'
              }`,
              cursor: 'pointer',
            }}
            onClick={() => removeToast(toast.id)}
          >
            <span style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1 }}>
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'i'}
            </span>
            <span style={{ fontSize: '0.9rem', flex: 1 }}>{toast.message}</span>
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: () => {} };
  }
  return context;
};
