import React, { createContext, useContext, useState, useCallback } from 'react';

interface Notification {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface NotificationContextType {
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 3000);
  }, []);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {notifications.map(notif => (
          <div
            key={notif.id}
            onClick={() => removeNotification(notif.id)}
            style={{
              padding: '16px 24px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              minWidth: '300px',
              maxWidth: '500px',
              cursor: 'pointer',
              animation: 'slideIn 0.3s ease-out',
              backgroundColor: notif.type === 'success' ? '#10b981' :
                              notif.type === 'error' ? '#ef4444' :
                              notif.type === 'warning' ? '#f59e0b' : '#3b82f6',
              color: 'white',
              fontWeight: '500',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '18px' }}>
              {notif.type === 'success' ? '✓' :
               notif.type === 'error' ? '✕' :
               notif.type === 'warning' ? '⚠' : 'ℹ'}
            </span>
            <span>{notif.message}</span>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
