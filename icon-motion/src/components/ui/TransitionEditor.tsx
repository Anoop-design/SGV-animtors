'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { RecipeTransition, DEFAULT_RECIPE_TRANSITION } from '@/types';
import { Slider } from '@/components/ui/Slider';
import { NumberInput } from '@/components/ui/NumberInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Dropdown } from '@/components/ui/Dropdown';
import '@/styles.css';

// =============================================================================
// TRANSITION EDITOR COMPONENT
// Modal for editing ease/spring transition settings
// =============================================================================

interface TransitionEditorProps {
    isOpen: boolean;
    onClose: () => void;
    transition: RecipeTransition;
    onChange: (transition: RecipeTransition) => void;
}

// Preset ease options
const EASE_PRESETS = [
    { label: 'Ease Out', value: 'easeOut' },
    { label: 'Ease In', value: 'easeIn' },
    { label: 'Ease In Out', value: 'easeInOut' },
    { label: 'Linear', value: 'linear' },
    { label: 'Custom', value: 'custom' },
];

export const TransitionEditor: React.FC<TransitionEditorProps> = ({
    isOpen,
    onClose,
    transition,
    onChange,
}) => {
    // Local state for editing
    const [localTransition, setLocalTransition] = useState<RecipeTransition>(transition);

    // Update local state when prop changes
    React.useEffect(() => {
        setLocalTransition(transition);
    }, [transition]);

    // Helper to update a single field
    const updateField = <K extends keyof RecipeTransition>(key: K, value: RecipeTransition[K]) => {
        const updated = { ...localTransition, [key]: value };
        setLocalTransition(updated);
        onChange(updated);
    };

    // Handle type change (ease/spring)
    const handleTypeChange = (type: 'ease' | 'spring') => {
        const updated = { ...localTransition, type };
        setLocalTransition(updated);
        onChange(updated);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="transition-editor-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="transition-editor"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                    >
                        {/* Header */}
                        <div className="transition-editor-header">
                            <span className="transition-editor-title">Transition</span>
                            <button className="transition-editor-close" onClick={onClose}>
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="transition-editor-content">
                            {/* Type Toggle (Ease/Spring) */}
                            <div className="controls-field">
                                <span className="controls-field-label">Type</span>
                                <SegmentedControl
                                    options={[
                                        { label: 'Ease', value: 'ease' },
                                        { label: 'Spring', value: 'spring' },
                                    ]}
                                    value={localTransition.type}
                                    onChange={(v) => handleTypeChange(v as 'ease' | 'spring')}
                                />
                            </div>

                            {/* Ease Settings */}
                            {localTransition.type === 'ease' && (
                                <>
                                    {/* Duration */}
                                    <div className="controls-field">
                                        <span className="controls-field-label">Duration</span>
                                        <div className="controls-field-input-group">
                                            <NumberInput
                                                value={localTransition.duration}
                                                onChange={(val) => updateField('duration', val)}
                                                min={0.1} max={5} step={0.1} unit="s"
                                            />
                                            <Slider
                                                min={0.1} max={3} step={0.1}
                                                value={localTransition.duration}
                                                onChange={(val) => updateField('duration', val)}
                                            />
                                        </div>
                                    </div>

                                    {/* Delay */}
                                    <div className="controls-field">
                                        <span className="controls-field-label">Delay</span>
                                        <div className="controls-field-input-group">
                                            <NumberInput
                                                value={localTransition.delay}
                                                onChange={(val) => updateField('delay', val)}
                                                min={0} max={3} step={0.1} unit="s"
                                            />
                                            <Slider
                                                min={0} max={2} step={0.1}
                                                value={localTransition.delay}
                                                onChange={(val) => updateField('delay', val)}
                                            />
                                        </div>
                                    </div>

                                    {/* Ease Preset */}
                                    <div className="controls-field">
                                        <span className="controls-field-label">Easing</span>
                                        <div style={{ flex: 1 }}>
                                            <Dropdown
                                                options={EASE_PRESETS}
                                                value={typeof localTransition.ease === 'string' ? localTransition.ease : 'custom'}
                                                onChange={(val) => updateField('ease', val)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Spring Settings */}
                            {localTransition.type === 'spring' && (
                                <>
                                    {/* Stiffness */}
                                    <div className="controls-field">
                                        <span className="controls-field-label">Stiffness</span>
                                        <div className="controls-field-input-group">
                                            <NumberInput
                                                value={localTransition.stiffness}
                                                onChange={(val) => updateField('stiffness', val)}
                                                min={50} max={1000} step={10}
                                            />
                                            <Slider
                                                min={50} max={800} step={10}
                                                value={localTransition.stiffness}
                                                onChange={(val) => updateField('stiffness', val)}
                                            />
                                        </div>
                                    </div>

                                    {/* Damping */}
                                    <div className="controls-field">
                                        <span className="controls-field-label">Damping</span>
                                        <div className="controls-field-input-group">
                                            <NumberInput
                                                value={localTransition.damping}
                                                onChange={(val) => updateField('damping', val)}
                                                min={5} max={50} step={1}
                                            />
                                            <Slider
                                                min={5} max={40} step={1}
                                                value={localTransition.damping}
                                                onChange={(val) => updateField('damping', val)}
                                            />
                                        </div>
                                    </div>

                                    {/* Mass */}
                                    <div className="controls-field">
                                        <span className="controls-field-label">Mass</span>
                                        <div className="controls-field-input-group">
                                            <NumberInput
                                                value={localTransition.mass}
                                                onChange={(val) => updateField('mass', val)}
                                                min={0.1} max={5} step={0.1}
                                            />
                                            <Slider
                                                min={0.1} max={3} step={0.1}
                                                value={localTransition.mass}
                                                onChange={(val) => updateField('mass', val)}
                                            />
                                        </div>
                                    </div>

                                    {/* Delay */}
                                    <div className="controls-field">
                                        <span className="controls-field-label">Delay</span>
                                        <div className="controls-field-input-group">
                                            <NumberInput
                                                value={localTransition.delay}
                                                onChange={(val) => updateField('delay', val)}
                                                min={0} max={3} step={0.1} unit="s"
                                            />
                                            <Slider
                                                min={0} max={2} step={0.1}
                                                value={localTransition.delay}
                                                onChange={(val) => updateField('delay', val)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default TransitionEditor;
