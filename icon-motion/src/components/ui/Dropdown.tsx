'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
}

export const Dropdown: React.FC<DropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

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
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

    const menu = isOpen ? (
        <div
            className="custom-dropdown-menu"
            style={{
                position: 'fixed',
                top: menuPosition.top,
                left: menuPosition.left,
                width: menuPosition.width,
                zIndex: 9999,
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
        </div>
    ) : null;

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
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Render menu in portal to escape overflow constraints */}
            {menu && createPortal(menu, document.body)}
        </div>
    );
};
