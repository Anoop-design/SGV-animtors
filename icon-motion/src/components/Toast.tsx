'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Info } from 'lucide-react';
import '@/styles.css';

interface ToastData {
    id: string;
    message: string;
    type?: 'success' | 'error' | 'info';
}

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: () => void;
    index: number;        // Position in stack (0 = front)
    totalVisible: number; // Total currently visible
    isHovered: boolean;   // Is container hovered
}

// Constants for stacking
const MAX_VISIBLE = 3;
const MAX_TOASTS = 4;    // Maximum toasts in queue
const STACK_OFFSET = 10;  // px between stacked toasts
const STACK_SCALE = 0.04; // Scale reduction per level

/**
 * Single Toast Component with stacking support
 */
export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'success',
    duration = 1500,  // Faster dismissal (1.5s)
    onClose,
    index,
    totalVisible,
    isHovered
}) => {
    useEffect(() => {
        // Only auto-dismiss if not hovered
        if (!isHovered) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose, isHovered]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <Check size={16} />;
            case 'error': return <X size={16} />;
            case 'info': return <Info size={16} />;
        }
    };

    // Calculate stacking transforms
    // Old toasts go UP and BEHIND (smaller), new ones at FRONT (full size)
    const getStackStyles = () => {
        if (isHovered) {
            // Expanded - show as list, first on top, last at bottom
            return {
                y: -index * 56, // Negative = older ones go UP
                scale: 1,
                opacity: 1,
                zIndex: totalVisible - index,
            };
        }

        // Stacked - newer on front (bottom), older go behind (up)
        const behind = Math.min(index, MAX_VISIBLE - 1);
        return {
            y: -behind * STACK_OFFSET, // Negative = older ones stack UP
            scale: 1 - (behind * STACK_SCALE),
            opacity: index >= MAX_VISIBLE ? 0 : 1 - (behind * 0.15),
            zIndex: totalVisible - index, // Higher index = lower z (behind)
        };
    };


    const stackStyles = getStackStyles();

    return (
        <motion.div
            className={`toast toast-${type}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{
                opacity: stackStyles.opacity,
                y: stackStyles.y,
                scale: stackStyles.scale,
                zIndex: stackStyles.zIndex,
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
            }}
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                transformOrigin: 'center bottom',
            }}
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
    toasts: ToastData[];
    removeToast: (id: string) => void;
}

/**
 * ToastContainer - Stacking toast container
 * 
 * Shows max 3 toasts stacked, expands on hover.
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Keep original order: oldest first (index 0), newest last
    // The stacking logic makes newest (last) appear at front, oldest goes up/behind
    const totalVisible = Math.min(toasts.length, MAX_VISIBLE);

    // Calculate container height for hover expansion (grows upward)
    const containerHeight = isHovered
        ? toasts.length * 56
        : Math.min(toasts.length, MAX_VISIBLE) * STACK_OFFSET + 52;

    return (
        <motion.div
            className="toast-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{ height: containerHeight }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'auto',
                minWidth: 280,
                zIndex: 9999,
            }}
        >
            <AnimatePresence mode="popLayout">
                {toasts.map((toast, index) => {
                    // Reverse index for stacking: last item (newest) = index 0
                    const stackIndex = toasts.length - 1 - index;
                    return (
                        <Toast
                            key={toast.id}
                            message={toast.message}
                            type={toast.type}
                            onClose={() => removeToast(toast.id)}
                            index={stackIndex}
                            totalVisible={totalVisible}
                            isHovered={isHovered}
                        />
                    );
                })}
            </AnimatePresence>
        </motion.div>
    );
};




/**
 * useToast Hook
 * 
 * Hook to manage toast state with deduplication.
 */
export function useToast() {
    const [toasts, setToasts] = React.useState<ToastData[]>([]);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);

        setToasts(prev => {
            // Replace duplicate messages instead of stacking
            const existing = prev.find(t => t.message === message);
            let newToasts: ToastData[];

            if (existing) {
                // Remove old, add new with same message (resets timer)
                newToasts = [...prev.filter(t => t.message !== message), { id, message, type }];
            } else {
                newToasts = [...prev, { id, message, type }];
            }

            // Limit queue size - remove oldest if over limit
            if (newToasts.length > MAX_TOASTS) {
                newToasts = newToasts.slice(-MAX_TOASTS);
            }

            return newToasts;
        });
    };


    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return { toasts, addToast, removeToast };
}
