import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import '../styles.css';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: () => void;
}

/**
 * Toast Component
 * 
 * A notification toast that appears and auto-dismisses.
 * 
 * CSS Classes:
 * - .toast: Main container
 * - .toast-success/error/info: Type variants
 * - .toast-content: Icon and message wrapper
 * - .toast-close: Close button
 */
export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'success',
    duration = 3000,
    onClose
}) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 200); // Wait for exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`toast toast-${type} ${isVisible ? 'toast-enter' : 'toast-exit'}`}>
            <div className="toast-content">
                {type === 'success' && <Check size={16} />}
                {type === 'error' && <X size={16} />}
                <span className="toast-message">{message}</span>
            </div>
            <button className="toast-close" onClick={() => { setIsVisible(false); setTimeout(onClose, 200); }}>
                <X size={14} />
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' }>;
    removeToast: (id: string) => void;
}

/**
 * ToastContainer Component
 * 
 * Container that positions and manages multiple toasts.
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

/**
 * useToast Hook
 * 
 * Hook to manage toast state.
 */
export function useToast() {
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' }>>([]);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return { toasts, addToast, removeToast };
}
