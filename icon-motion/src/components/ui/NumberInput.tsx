'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface NumberInputProps {
    /** Current value */
    value: number;
    /** Called when value changes */
    onChange: (value: number) => void;
    /** Minimum allowed value */
    min?: number;
    /** Maximum allowed value */
    max?: number;
    /** Base step for arrow key nudging */
    step?: number;
    /** Unit suffix to display (e.g., "s" for seconds) */
    unit?: string;
    /** Number of decimal places to show */
    decimals?: number;
    /** Additional className */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
}

/**
 * NumberInput Component
 * 
 * Enhanced numeric input with:
 * - Arrow key nudging (↑/↓)
 * - Shift modifier for 10x step
 * - Alt/Option modifier for 0.1x step
 * - Enter to confirm, Escape to revert
 * - Unit suffix display
 * 
 * CSS Classes:
 * - Uses .controls-field-input from styles.css
 */
export const NumberInput: React.FC<NumberInputProps> = ({
    value,
    onChange,
    min = -Infinity,
    max = Infinity,
    step = 0.1,
    unit = '',
    decimals = 2,
    className = '',
    placeholder,
}) => {
    const [inputValue, setInputValue] = useState(formatValue(value));
    const [isFocused, setIsFocused] = useState(false);
    const originalValueRef = useRef(value);
    const inputRef = useRef<HTMLInputElement>(null);

    // Format number for display
    function formatValue(num: number): string {
        return num.toFixed(decimals) + unit;
    }

    // Parse input string to number
    function parseValue(str: string): number | null {
        // Remove unit suffix if present
        const cleaned = str.replace(new RegExp(unit + '$'), '').trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
    }

    // Clamp value within min/max bounds
    function clamp(num: number): number {
        return Math.min(max, Math.max(min, num));
    }

    // Update display when value prop changes (and not focused)
    useEffect(() => {
        if (!isFocused) {
            setInputValue(formatValue(value));
        }
    }, [value, isFocused, decimals, unit]);

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    // Handle focus
    const handleFocus = () => {
        setIsFocused(true);
        originalValueRef.current = value;
        // Select all text on focus
        setTimeout(() => {
            inputRef.current?.select();
        }, 0);
    };

    // Handle blur - confirm value
    const handleBlur = () => {
        setIsFocused(false);
        const parsed = parseValue(inputValue);
        if (parsed !== null) {
            const clamped = clamp(parsed);
            onChange(clamped);
            setInputValue(formatValue(clamped));
        } else {
            // Revert to current value if invalid
            setInputValue(formatValue(value));
        }
    };

    // Handle key down for nudging and Enter/Escape
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        const { key, shiftKey, altKey } = e;

        // Arrow key nudging
        if (key === 'ArrowUp' || key === 'ArrowDown') {
            e.preventDefault();

            // Calculate step multiplier
            let multiplier = 1;
            if (shiftKey) multiplier = 10;
            else if (altKey) multiplier = 0.1;

            const delta = key === 'ArrowUp' ? step * multiplier : -step * multiplier;
            const newValue = clamp(value + delta);

            onChange(newValue);
            setInputValue(formatValue(newValue));
            return;
        }

        // Enter - confirm and blur
        if (key === 'Enter') {
            e.preventDefault();
            inputRef.current?.blur();
            return;
        }

        // Escape - revert and blur
        if (key === 'Escape') {
            e.preventDefault();
            onChange(originalValueRef.current);
            setInputValue(formatValue(originalValueRef.current));
            inputRef.current?.blur();
            return;
        }
    }, [value, step, min, max, onChange, decimals, unit]);

    return (
        <input
            ref={inputRef}
            type="text"
            className={`controls-field-input ${className}`}
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
        />
    );
};
