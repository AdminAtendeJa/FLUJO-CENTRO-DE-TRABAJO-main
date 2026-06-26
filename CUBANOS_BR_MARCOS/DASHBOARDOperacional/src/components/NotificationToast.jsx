
import React, { useEffect } from 'react';

const NotificationToast = ({ notification, onClose }) => {
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // Auto-close after 5 seconds

            return () => clearTimeout(timer);
        }
    }, [notification, onClose]);

    if (!notification) return null;

    const getToastStyle = () => {
        const baseStyle = {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            color: 'white',
            zIndex: 1000,
            minWidth: '300px',
            maxWidth: '400px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
        };

        switch (notification.type) {
            case 'success':
                return { ...baseStyle, background: 'var(--color-success, #22c55e)' };
            case 'error':
                return { ...baseStyle, background: 'var(--color-error, #ef4444)' };
            case 'warning':
                return { ...baseStyle, background: 'var(--color-warning, #f59e0b)' };
            case 'info':
            default:
                return { ...baseStyle, background: 'var(--color-primary, #3b82f6)' };
        }
    };

    return (
        <div style={getToastStyle()}>
            <div>{notification.message}</div>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    marginLeft: 'auto'
                }}
            >
                ×
            </button>
        </div>
    );
};

export { NotificationToast };