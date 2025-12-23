'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import '../../styles.css';

export interface DropdownOption {
    label: React.ReactNode;
    value: string;
}

interface DropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: React.ReactNode;
    className?: string;
    /** Optional simple string to display when selected (instead of full label) */
    displayValue?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className = '',
    displayValue
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Update menu position when dropdown opens
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const menuHeight = options.length * 40 + 8; // Estimate menu height
            const viewportHeight = window.innerHeight;

            // Check if there's enough space below
            const spaceBelow = viewportHeight - rect.bottom;
            const shouldFlip = spaceBelow < menuHeight && rect.top > menuHeight;

            setMenuPosition({
                top: shouldFlip ? rect.top - menuHeight - 4 : rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        }
    }, [isOpen, options.length]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            // Check if click is inside trigger container OR the portal menu
            const isInsideTrigger = dropdownRef.current?.contains(target);
            const isInsideMenu = menuRef.current?.contains(target);

            if (!isInsideTrigger && !isInsideMenu) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div
            className={`relative w-full ${className}`}
            ref={dropdownRef}
        >
            <button
                ref={triggerRef}
                className="custom-dropdown-trigger"
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <span className="truncate">
                    {selectedOption ? (displayValue || selectedOption.label) : placeholder}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <ChevronDown size={14} className="text-text-muted" />
                </motion.div>
            </button>

            {/* Render menu in portal with AnimatePresence for smooth enter/exit */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={menuRef}
                            className="custom-dropdown-menu"
                            style={{
                                position: 'fixed',
                                top: menuPosition.top,
                                left: menuPosition.left,
                                width: menuPosition.width,
                                zIndex: 9999,
                            }}
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{
                                type: 'spring',
                                stiffness: 500,
                                damping: 30,
                                mass: 0.8
                            }}
                        >
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    className={`custom-dropdown-option ${value === option.value ? 'active' : ''}`}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span>{option.label}</span>
                                    {value === option.value && <Check size={14} />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
