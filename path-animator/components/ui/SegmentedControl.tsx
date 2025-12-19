import React from 'react';
import '../../styles.css';

interface SegmentedControlProps<T extends string> {
    options: { label: string; value: T }[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
    disabled?: boolean;
}

/**
 * SegmentedControl Component
 * 
 * A toggle between multiple options with animated sliding pill indicator.
 * Uses CSS-only positioning for reliable animation (no JS measurements).
 * 
 * CSS Classes used (see styles.css for customization):
 * - .segmented-control: Outer container
 * - .segmented-indicator: Animated sliding pill
 * - .segmented-option: Individual option button
 * - .segmented-option.selected: Currently selected option
 * 
 * Props:
 * - options: Array of { label, value } pairs
 * - value: Currently selected value
 * - onChange: Callback when selection changes
 * - disabled: Disable all interactions
 */
export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    className = '',
    disabled = false
}: SegmentedControlProps<T>) {
    const selectedIndex = options.findIndex(opt => opt.value === value);
    const optionCount = options.length;

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
        if (disabled) return;

        let newIndex = currentIndex;

        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        }

        if (newIndex !== currentIndex) {
            onChange(options[newIndex].value);
        }
    };

    // CSS-only indicator positioning using CSS custom properties
    const indicatorStyle: React.CSSProperties = {
        '--option-count': optionCount,
        '--selected-index': selectedIndex,
    } as React.CSSProperties;

    return (
        <div
            className={`segmented-control ${className} ${disabled ? 'disabled' : ''}`}
            role="tablist"
            aria-label="Options"
            style={indicatorStyle}
        >
            {/* Animated indicator pill - CSS-only positioning */}
            <div
                className="segmented-indicator"
                aria-hidden="true"
            />

            {/* Option buttons */}
            {options.map((option, index) => (
                <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={value === option.value}
                    tabIndex={value === option.value ? 0 : -1}
                    onClick={() => !disabled && onChange(option.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={`segmented-option ${value === option.value ? 'selected' : ''}`}
                    disabled={disabled}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
