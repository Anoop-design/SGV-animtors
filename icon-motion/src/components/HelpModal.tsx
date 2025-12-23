'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { getModifierKey } from '@/lib/useKeyboardShortcuts';
import '@/styles.css';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Animation variants
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalVariants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 400,
            damping: 30,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: 0.15,
        },
    },
};

const contentVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.15 },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.1 },
    },
};

/**
 * HelpModal Component
 * 
 * Two-tab modal with Framer Motion animations matching ExportModal.
 */
export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = React.useState<'shortcuts' | 'cheatsheet'>('shortcuts');
    const mod = getModifierKey();

    // Close on Escape key
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="help-modal-backdrop"
                        onClick={onClose}
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    />

                    {/* Modal */}
                    <motion.div
                        className="help-modal"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Header */}
                        <div className="help-modal-header">
                            <h2 className="help-modal-title">Help</h2>
                            <motion.button
                                className="help-modal-close"
                                onClick={onClose}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <X size={18} />
                            </motion.button>
                        </div>

                        {/* Tab Switcher */}
                        <div className="help-modal-tabs">
                            <SegmentedControl
                                options={[
                                    { label: 'Shortcuts', value: 'shortcuts' },
                                    { label: 'Cheatsheet', value: 'cheatsheet' },
                                ]}
                                value={activeTab}
                                onChange={(v) => setActiveTab(v as 'shortcuts' | 'cheatsheet')}
                            />
                        </div>

                        {/* Content with slide transitions like path-animator */}
                        <div className="help-modal-content-wrapper">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {activeTab === 'shortcuts' ? (
                                    <motion.div
                                        key="shortcuts-tab"
                                        className="help-modal-content"
                                        initial={{ x: '-100%', opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: '-100%', opacity: 0 }}
                                        transition={{ type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                                    >
                                        <div className="shortcuts-content">
                                            {/* Playback */}
                                            <div className="shortcut-section">
                                                <h3 className="shortcut-section-title">Playback</h3>
                                                <div className="shortcut-list">
                                                    <ShortcutRow keys={['R']} description="Replay animation" />
                                                    <ShortcutRow keys={['L']} description="Toggle loop" />
                                                </div>
                                            </div>

                                            {/* Presets */}
                                            <div className="shortcut-section">
                                                <h3 className="shortcut-section-title">Presets</h3>
                                                <div className="shortcut-list">
                                                    <ShortcutRow keys={['1', '-', '9']} description="Select preset (Draw, Pop, Wiggle...)" />
                                                    <ShortcutRow keys={['G']} description="Cycle trigger mode" />
                                                </div>
                                            </div>

                                            {/* SVG Input */}
                                            <div className="shortcut-section">
                                                <h3 className="shortcut-section-title">SVG Input</h3>
                                                <div className="shortcut-list">
                                                    <ShortcutRow keys={[mod, 'Shift', 'V']} description="Paste SVG from clipboard" />
                                                    <ShortcutRow keys={[mod, 'Shift', 'U']} description="Upload SVG file" />
                                                </div>
                                            </div>

                                            {/* UI */}
                                            <div className="shortcut-section">
                                                <h3 className="shortcut-section-title">UI</h3>
                                                <div className="shortcut-list">
                                                    <ShortcutRow keys={['T']} description="Toggle theme" />
                                                    <ShortcutRow keys={['?']} description="Show this help" />
                                                    <ShortcutRow keys={['Esc']} description="Close modals" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="cheatsheet-tab"
                                        className="help-modal-content"
                                        initial={{ x: '100%', opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: '100%', opacity: 0 }}
                                        transition={{ type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                                    >
                                        <div className="cheatsheet-content">
                                            {/* Timing */}
                                            <div className="cheatsheet-section">
                                                <h3 className="cheatsheet-section-title">⏱ Timing</h3>
                                                <ul className="cheatsheet-list">
                                                    <li><strong>0.3–0.5s</strong> — Snappy, micro-interactions</li>
                                                    <li><strong>1–2s</strong> — Elegant reveals</li>
                                                    <li><strong>3–5s</strong> — Dramatic intros</li>
                                                </ul>
                                            </div>

                                            {/* Easing */}
                                            <div className="cheatsheet-section">
                                                <h3 className="cheatsheet-section-title">📈 Easing</h3>
                                                <ul className="cheatsheet-list">
                                                    <li><code>ease-out</code> — Natural, satisfying ending</li>
                                                    <li><code>ease-in-out</code> — Smooth for loops</li>
                                                    <li><code>linear</code> — Mechanical, robotic feel</li>
                                                    <li><code>ease-in</code> — Building anticipation</li>
                                                </ul>
                                            </div>

                                            {/* Stagger */}
                                            <div className="cheatsheet-section">
                                                <h3 className="cheatsheet-section-title">🎭 Stagger Modes</h3>
                                                <ul className="cheatsheet-list">
                                                    <li><strong>Sequential</strong> — Left → Right flow</li>
                                                    <li><strong>Reverse</strong> — Right → Left reveal</li>
                                                    <li><strong>Parallel</strong> — All paths at once</li>
                                                </ul>
                                            </div>

                                            {/* Stroke */}
                                            <div className="cheatsheet-section">
                                                <h3 className="cheatsheet-section-title">✏️ Stroke Width</h3>
                                                <ul className="cheatsheet-list">
                                                    <li><strong>1–2px</strong> — Delicate, elegant</li>
                                                    <li><strong>2–4px</strong> — Balanced, versatile</li>
                                                    <li><strong>4–8px</strong> — Bold, chunky</li>
                                                </ul>
                                            </div>

                                            {/* Tips */}
                                            <div className="cheatsheet-section">
                                                <h3 className="cheatsheet-section-title">💡 Tips</h3>
                                                <ul className="cheatsheet-list">
                                                    <li>Use <code>ease-in-out</code> for seamless loops</li>
                                                    <li>Match stagger amount to duration for rhythm</li>
                                                    <li>Override color for consistent brand look</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

/** Individual shortcut row */
const ShortcutRow: React.FC<{ keys: string[]; description: string }> = ({ keys, description }) => (
    <div className="shortcut-row">
        <div className="shortcut-keys">
            {keys.map((key, i) => (
                key === '/' ? (
                    <span key={i} className="shortcut-separator">/</span>
                ) : (
                    <kbd key={i} className="shortcut-key">{key}</kbd>
                )
            ))}
        </div>
        <span className="shortcut-description">{description}</span>
    </div>
);
