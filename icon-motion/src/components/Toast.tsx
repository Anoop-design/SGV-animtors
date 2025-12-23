'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Info } from 'lucide-react';
import '@/styles.css';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: () => void;
}

// Animation variants for toast
const toastVariants = {
    initial: {
        opacity: 0,
        x: 100,
        scale: 0.9,
    },
    animate: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 400,
            damping: 25,
        },
    },
    exit: {
        opacity: 0,
        x: 50,
        scale: 0.9,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * Toast Component
 * 
 * A notification toast with Framer Motion animations.
 * Slides in from right with spring animation, exits with fade.
 */
export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'success',
    duration = 3000,
    onClose
}) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <Check size={16} />;
            case 'error': return <X size={16} />;
            case 'info': return <Info size={16} />;
        }
    };

    return (
        <motion.div
            className={`toast toast-${type}`}
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
        >
            <div className="toast-content">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
                >
                    {getIcon()}
                </motion.div>
                <span className="toast-message">{message}</span>
            </div>
            <motion.button
                className="toast-close"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <X size={14} />
            </motion.button>
        </motion.div>
    );
};

interface ToastContainerProps {
    toasts: Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' }>;
    removeToast: (id: string) => void;
}

/**
 * ToastContainer Component
 * 
 * Container with AnimatePresence for smooth toast transitions.
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container">
            <AnimatePresence mode="popLayout">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

/**
 * useToast Hook
 * 
 * Hook to manage toast state.
 */
export function useToast() {
    const [toasts, setToasts] = React.useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' }>>([]);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return { toasts, addToast, removeToast };
}
