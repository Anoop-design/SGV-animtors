import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard shortcut definition
 */
interface KeyboardShortcut {
    /** Key to listen for (e.g., 's', 'Enter', 'ArrowUp') */
    key: string;
    /** Require Cmd (Mac) / Ctrl (Windows) */
    meta?: boolean;
    /** Require Shift */
    shift?: boolean;
    /** Require Alt/Option */
    alt?: boolean;
    /** Handler when shortcut is triggered */
    handler: (e: KeyboardEvent) => void;
    /** Allow while focused on input/textarea (default: false) */
    allowInInput?: boolean;
    /** Description for help modal */
    description?: string;
}

/**
 * Check if the active element is an input or editable
 */
function isInputFocused(): boolean {
    const active = document.activeElement;
    if (!active) return false;

    const tagName = active.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return true;
    }

    // Check for contenteditable
    if (active.getAttribute('contenteditable') === 'true') {
        return true;
    }

    return false;
}

/**
 * Detect if running on Mac
 */
function isMac(): boolean {
    return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

/**
 * Custom hook to manage keyboard shortcuts
 * 
 * @param shortcuts - Array of shortcut definitions
 * @param enabled - Whether shortcuts are active (default: true)
 */
export function useKeyboardShortcuts(
    shortcuts: KeyboardShortcut[],
    enabled: boolean = true
) {
    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled) return;

        for (const shortcut of shortcutsRef.current) {
            const { key, meta, shift, alt, handler, allowInInput } = shortcut;

            // Skip if focused on input and not allowed
            if (!allowInInput && isInputFocused()) {
                continue;
            }

            // Check key match (case-insensitive for letters)
            const keyMatch = e.key.toLowerCase() === key.toLowerCase() || e.key === key;
            if (!keyMatch) continue;

            // Check modifier keys
            const metaMatch = meta ? (e.metaKey || e.ctrlKey) : !(e.metaKey || e.ctrlKey);
            const shiftMatch = shift ? e.shiftKey : !e.shiftKey;
            const altMatch = alt ? e.altKey : !e.altKey;

            if (metaMatch && shiftMatch && altMatch) {
                e.preventDefault();
                handler(e);
                return; // Only trigger first matching shortcut
            }
        }
    }, [enabled]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * Get the modifier key symbol based on platform
 */
export function getModifierKey(): string {
    return isMac() ? '⌘' : 'Ctrl';
}

/**
 * Format a shortcut for display
 */
export function formatShortcut(
    key: string,
    options?: { meta?: boolean; shift?: boolean; alt?: boolean }
): string {
    const parts: string[] = [];

    if (options?.meta) {
        parts.push(getModifierKey());
    }
    if (options?.shift) {
        parts.push('Shift');
    }
    if (options?.alt) {
        parts.push(isMac() ? '⌥' : 'Alt');
    }

    // Format special keys
    const keyDisplay = {
        'ArrowUp': '↑',
        'ArrowDown': '↓',
        'ArrowLeft': '←',
        'ArrowRight': '→',
        'Enter': '↵',
        'Escape': 'Esc',
        ' ': 'Space',
    }[key] || key.toUpperCase();

    parts.push(keyDisplay);

    return parts.join(' + ');
}

export { isInputFocused, isMac };
