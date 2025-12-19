'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AnimationSettings,
    ParsedPath,
    EasingType,
    StaggerMode,
    TriggerType,
    DEFAULT_PRESETS,
    TRANSFORM_PRESETS,
    GlobalTransform,
    AnimationDirection,
    PathTransform,
    DEFAULT_PATH_TRANSFORM
} from '@/types';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Slider } from '@/components/ui/Slider';
import { NumberInput } from '@/components/ui/NumberInput';
import { EasingEditor } from '@/components/ui/EasingEditor';
import { Dropdown } from '@/components/ui/Dropdown';
import { GripVertical, Eye, EyeOff, X, ChevronDown, ChevronLeft } from 'lucide-react';
import { isInputFocused } from '@/lib/useKeyboardShortcuts';
import '@/styles.css';

interface ControlsPanelProps {
    settings: AnimationSettings;
    updateSetting: <K extends keyof AnimationSettings>(key: K, value: AnimationSettings[K]) => void;
    paths: ParsedPath[];
    onToggleVisibility: (index: number) => void;
    onReorderPath: (fromIndex: number, toIndex: number) => void;
    hoveredPathIndex: number | null;
    setHoveredPathIndex: (index: number | null) => void;
    // Phase 2: Selection & Transform
    selectedPathIndex?: number | null;
    onSelectPath?: (index: number | null) => void;
    updatePathAnimation?: (index: number, animation: Partial<import('@/types').PathTransform> | undefined) => void;
    viewBox?: string;
    // Tab state (lifted to App for Preview sync)
    activeTab: 'stroke' | 'transform';
    onTabChange: (tab: 'stroke' | 'transform') => void;
    // Responsive props
    isOpen?: boolean;
    onClose?: () => void;
}

/**
 * CustomisePanel Component (formerly ControlsPanel)
 * 
 * The right panel containing all animation controls:
 * - Stroke / Transform tab switcher
 * - Stroke: Existing draw animation settings + Layers list
 * - Transform: Future Lucid-style animations
 */
export const ControlsPanel: React.FC<ControlsPanelProps> = ({
    settings,
    updateSetting,
    paths,
    onToggleVisibility,
    onReorderPath,
    hoveredPathIndex,
    setHoveredPathIndex,
    selectedPathIndex,
    onSelectPath,
    updatePathAnimation,
    viewBox,
    activeTab,
    onTabChange,
    isOpen,
    onClose
}) => {
    // Use activeTab from props (lifted to App.tsx for Preview sync)
    const setActiveTab = onTabChange;
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<string>('');
    const [selectedTransformPreset, setSelectedTransformPreset] = useState<string>('');
    const [layersOpen, setLayersOpen] = useState(true);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [showEasingEditor, setShowEasingEditor] = useState(false);
    const easingEditorRef = React.useRef<HTMLDivElement>(null);

    // Transform presets - now apply to globalTransform with initial/final
    const TRANSFORM_PRESETS: { name: string; values: GlobalTransform }[] = [
        { name: 'None', values: { initial: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }, final: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 } } },
        { name: 'Scale Up', values: { initial: { x: 0, y: 0, scale: 0.5, rotate: 0, opacity: 1 }, final: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 } } },
        { name: 'Scale Down', values: { initial: { x: 0, y: 0, scale: 1.5, rotate: 0, opacity: 1 }, final: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 } } },
        { name: 'Rotate 360°', values: { initial: { x: 0, y: 0, scale: 1, rotate: 360, opacity: 1 }, final: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 } } },
        { name: 'Slide Left', values: { initial: { x: -50, y: 0, scale: 1, rotate: 0, opacity: 1 }, final: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 } } },
        { name: 'Slide Right', values: { initial: { x: 50, y: 0, scale: 1, rotate: 0, opacity: 1 }, final: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 } } },
        { name: 'Slide Up', values: { initial: { x: 0, y: -50, scale: 1, rotate: 0, opacity: 1 }, final: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 } } },
        { name: 'Slide Down', values: { initial: { x: 0, y: 50, scale: 1, rotate: 0, opacity: 1 }, final: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 } } },
        { name: 'Fade In', values: { initial: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 0 }, final: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 } } },
    ];

    // Tab switching keyboard shortcuts (1 and 2 keys)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isInputFocused()) return;
            if (e.key === '1') {
                e.preventDefault();
                setActiveTab('stroke');
            } else if (e.key === '2') {
                e.preventDefault();
                setActiveTab('transform');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Click outside to close easing editor
    useEffect(() => {
        if (!showEasingEditor) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (easingEditorRef.current && !easingEditorRef.current.contains(e.target as Node)) {
                setShowEasingEditor(false);
            }
        };

        // Delay to avoid closing immediately on the click that opened it
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEasingEditor]);

    // Helper to get active animation values with new initial/final structure
    const activePath = selectedPathIndex !== null && selectedPathIndex !== undefined ? paths[selectedPathIndex] : null;
    const animation: PathTransform = activePath?.animation || DEFAULT_PATH_TRANSFORM;

    return (
        <div className={`controls-panel ${isOpen ? 'panel-open' : ''}`}>
            {/* Header matches existing ... */}
            <div className="controls-header">
                <span className="controls-header-title">Customise</span>
                <button className="panel-close-btn" onClick={onClose}>
                    <X size={18} />
                </button>
            </div>

            {/* Tab Switcher matches existing ... */}
            <div className="controls-tabs-container">
                <SegmentedControl
                    options={[
                        { label: 'Stroke', value: 'stroke' },
                        { label: 'Transform', value: 'transform' },
                    ]}
                    value={activeTab}
                    onChange={(v) => setActiveTab(v as 'stroke' | 'transform')}
                />
            </div>

            <div className="controls-content hide-scrollbar">
                <AnimatePresence mode="popLayout" initial={false}>
                    {activeTab === 'stroke' ? (
                        /* STROKE TAB CONTENT (Existing) */
                        <motion.div
                            key="stroke-tab"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                            style={{ width: '100%', position: 'absolute', top: 0, left: 0, right: 0, padding: '16px' }}
                        >
                            {/* Layers Section (Collapsible) - At Top */}
                            <div className="controls-section">
                                <button
                                    className="controls-section-header"
                                    onClick={() => setLayersOpen(!layersOpen)}
                                >
                                    <span className="controls-section-title">Layers</span>
                                    <ChevronDown size={16} className={`section-chevron ${layersOpen ? 'open' : ''}`} />
                                </button>
                                <AnimatePresence initial={false}>
                                    {layersOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            {paths.length > 0 ? (
                                                <div className="layers-list">
                                                    {paths.map((path, index) => (
                                                        <div
                                                            key={path.id}
                                                            draggable
                                                            onDragStart={(e) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = 'move'; }}
                                                            onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
                                                            onDragOver={(e) => { e.preventDefault(); if (draggedIndex !== null && draggedIndex !== index) setDragOverIndex(index); }}
                                                            onDragLeave={() => setDragOverIndex(null)}
                                                            onDrop={(e) => { e.preventDefault(); if (draggedIndex !== null && draggedIndex !== index) onReorderPath(draggedIndex, index); setDraggedIndex(null); setDragOverIndex(null); }}
                                                            className={`layer-item ${hoveredPathIndex === index ? 'hovered' : ''} ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''} ${selectedPathIndex === index ? 'selected' : ''}`}
                                                            onMouseEnter={() => setHoveredPathIndex(index)}
                                                            onMouseLeave={() => setHoveredPathIndex(null)}
                                                            onClick={() => onSelectPath && onSelectPath(index)}
                                                            style={{ backgroundColor: selectedPathIndex === index ? 'var(--bg-hover)' : undefined }}
                                                        >
                                                            <div className="layer-drag-handle"><GripVertical size={14} /></div>
                                                            <span className="layer-name truncate">Path {index + 1}</span>
                                                            <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(index); }} className={`layer-visibility-btn ${path.visible ? '' : 'hidden-layer'}`} title={path.visible ? "Hide path" : "Show path"}>
                                                                {path.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="controls-empty-message">Upload an SVG to see layers</p>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Presets Dropdown */}
                            <div className="controls-section controls-presets-section">
                                <span className="controls-section-title">Presets</span>
                                <div className="controls-field">
                                    <Dropdown
                                        options={DEFAULT_PRESETS.map(p => ({ label: p.name, value: p.name }))}
                                        value={selectedPreset}
                                        onChange={(value) => {
                                            setSelectedPreset(value);
                                            const preset = DEFAULT_PRESETS.find(p => p.name === value);
                                            if (preset) {
                                                Object.entries(preset.settings).forEach(([key, value]) => {
                                                    updateSetting(key as keyof AnimationSettings, value as any);
                                                });
                                            }
                                        }}
                                        placeholder="Select a preset..."
                                    />
                                </div>
                            </div>

                            {/* Timing Section */}
                            <div className="controls-section">
                                <span className="controls-section-title">Timing</span>

                                {/* Duration */}
                                <div className="controls-field">
                                    <span className="controls-field-label">Duration</span>
                                    <div className="controls-field-input-group">
                                        <NumberInput value={settings.duration} onChange={(val) => updateSetting('duration', val)} min={0.1} max={10} step={0.1} unit="s" />
                                        <Slider min={0.1} max={10} step={0.1} value={settings.duration} onChange={(val) => updateSetting('duration', val)} />
                                    </div>
                                </div>

                                {/* Delay */}
                                <div className="controls-field">
                                    <span className="controls-field-label">Delay</span>
                                    <div className="controls-field-input-group">
                                        <NumberInput value={settings.delay} onChange={(val) => updateSetting('delay', val)} min={0} max={5} step={0.1} unit="s" />
                                        <Slider min={0} max={5} step={0.1} value={settings.delay} onChange={(val) => updateSetting('delay', val)} />
                                    </div>
                                </div>

                                {/* Stagger */}
                                <div className="controls-field">
                                    <span className="controls-field-label">Stagger</span>
                                    <div className="controls-field-input-group">
                                        <NumberInput value={settings.staggerAmount} onChange={(val) => updateSetting('staggerAmount', val)} min={0.05} max={2} step={0.05} unit="s" />
                                        <Slider min={0.05} max={2} step={0.05} value={settings.staggerAmount} onChange={(val) => updateSetting('staggerAmount', val)} />
                                    </div>
                                </div>

                                {/* Easing */}
                                <div className="controls-field controls-field-with-popover">
                                    <span className="controls-field-label">Easing</span>
                                    <div style={{ flex: 1 }}>
                                        <Dropdown
                                            options={[
                                                { label: 'Ease', value: 'ease' },
                                                { label: 'Linear', value: 'linear' },
                                                { label: 'Ease In', value: 'ease-in' },
                                                { label: 'Ease Out', value: 'ease-out' },
                                                { label: 'Ease In Out', value: 'ease-in-out' },
                                                { label: 'Custom...', value: 'custom' },
                                            ]}
                                            value={settings.easing}
                                            onChange={(val) => {
                                                const newEasing = val as EasingType;
                                                updateSetting('easing', newEasing);
                                                if (newEasing === 'custom') setShowEasingEditor(true);
                                            }}
                                        />
                                    </div>
                                    {settings.easing === 'custom' && showEasingEditor && (
                                        <div className="easing-editor-popover" ref={easingEditorRef}>
                                            <EasingEditor value={settings.customEasing} onChange={(val) => updateSetting('customEasing', val)} onClose={() => setShowEasingEditor(false)} />
                                        </div>
                                    )}
                                </div>

                                {/* Order */}
                                <div className="controls-field">
                                    <span className="controls-field-label">Order</span>
                                    <div style={{ flex: 1 }}>
                                        <Dropdown
                                            options={[
                                                { label: 'Forward', value: 'forward' },
                                                { label: 'Reverse', value: 'reverse' },
                                                { label: 'From Center', value: 'from-center' },
                                                { label: 'Random', value: 'random' },
                                                { label: 'Parallel', value: 'none' },
                                            ]}
                                            value={settings.staggerMode}
                                            onChange={(val) => updateSetting('staggerMode', val as StaggerMode)}
                                        />
                                    </div>
                                </div>

                                {/* Trigger */}
                                <div className="controls-field">
                                    <span className="controls-field-label">Trigger</span>
                                    <div style={{ flex: 1 }}>
                                        <Dropdown
                                            options={[
                                                { label: 'Auto', value: 'auto' },
                                                { label: 'On Hover', value: 'hover' },
                                                { label: 'On Click', value: 'click' },
                                            ]}
                                            value={settings.trigger}
                                            onChange={(val) => updateSetting('trigger', val as TriggerType)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Appearance Section */}
                            <div className="controls-section">
                                <span className="controls-section-title">Appearance</span>

                                {/* Override Toggle */}
                                <div className="controls-field">
                                    <span className="controls-field-label">Override</span>
                                    <SegmentedControl options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]} value={settings.overrideColor ? 'yes' : 'no'} onChange={(v) => updateSetting('overrideColor', v === 'yes')} className="controls-toggle-wide" />
                                </div>

                                {/* Stroke Color */}
                                {settings.overrideColor && (
                                    <div className="controls-field">
                                        <span className="controls-field-label">Stroke color</span>
                                        <div className="controls-color-input-inline">
                                            <input type="color" className="controls-color-picker-inline" value={settings.strokeColor} onChange={(e) => updateSetting('strokeColor', e.target.value)} />
                                            <input type="text" className="controls-color-text-inline" value={settings.strokeColor.toUpperCase()} onChange={(e) => updateSetting('strokeColor', e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                {/* Stroke Width */}
                                {settings.overrideColor && (
                                    <div className="controls-field">
                                        <span className="controls-field-label">Stroke width</span>
                                        <div className="controls-field-input-group">
                                            <input type="text" className="controls-field-input controls-field-input-short" value={settings.strokeWidth} onChange={(e) => { const val = parseFloat(e.target.value); if (!isNaN(val)) updateSetting('strokeWidth', val); }} />
                                            <Slider min={0.5} max={10} step={0.5} value={settings.strokeWidth} onChange={(val) => updateSetting('strokeWidth', val)} />
                                        </div>
                                    </div>
                                )}

                                {/* Line Cap */}
                                <div className="controls-field">
                                    <span className="controls-field-label">Line cap</span>
                                    <div style={{ flex: 1 }}>
                                        <Dropdown options={[{ label: 'Round', value: 'round' }, { label: 'Butt', value: 'butt' }, { label: 'Square', value: 'square' }]} value={settings.lineCap} onChange={(val) => updateSetting('lineCap', val as any)} />
                                    </div>
                                </div>

                                {/* Line Join */}
                                <div className="controls-field">
                                    <span className="controls-field-label">Line join</span>
                                    <div style={{ flex: 1 }}>
                                        <Dropdown options={[{ label: 'Round', value: 'round' }, { label: 'Bevel', value: 'bevel' }, { label: 'Miter', value: 'miter' }]} value={settings.lineJoin} onChange={(val) => updateSetting('lineJoin', val as any)} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* TRANSFORM TAB CONTENT */
                        <motion.div
                            key="transform-tab"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                            style={{ width: '100%', position: 'absolute', top: 0, left: 0, right: 0, padding: '16px' }}
                        >
                            <AnimatePresence mode="popLayout" initial={false}>
                                {selectedPathIndex !== null && activePath ? (
                                    /* === LAYER EDIT SUB-PAGE === */
                                    <motion.div
                                        key="layer-edit"
                                        initial={{ x: '100%' }}
                                        animate={{ x: 0 }}
                                        exit={{ x: '100%' }}
                                        transition={{ type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                                        style={{ width: '100%', position: 'absolute', top: 0, left: 0, right: 0, padding: '16px' }}
                                    >
                                        {/* Top Row: Back Button + Editing Label */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '12px'
                                        }}>
                                            <button
                                                onClick={() => onSelectPath && onSelectPath(null)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '28px',
                                                    height: '28px',
                                                    background: 'var(--bg-button)',
                                                    border: '1px solid var(--border-default)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    color: 'var(--text-primary)',
                                                    flexShrink: 0
                                                }}
                                                title="Back to layers"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <span style={{
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)'
                                            }}>
                                                Editing layer
                                            </span>
                                        </div>

                                        {/* Path Preview Card */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            marginBottom: '16px',
                                            background: 'var(--bg-input)',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border-default)'
                                        }}>
                                            {/* Path Thumbnail */}
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                background: 'var(--bg-card)',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '6px',
                                                flexShrink: 0,
                                                color: 'var(--text-primary)'
                                            }}>
                                                <svg
                                                    viewBox={viewBox || '0 0 24 24'}
                                                    style={{ width: '100%', height: '100%' }}
                                                >
                                                    <path
                                                        d={activePath.d}
                                                        fill="none"
                                                        stroke="var(--text-primary)"
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </div>

                                            {/* Path Name */}
                                            <div style={{
                                                fontWeight: 600,
                                                fontSize: '15px',
                                                color: 'var(--text-primary)'
                                            }}>
                                                Path {selectedPathIndex + 1}
                                            </div>
                                        </div>

                                        {/* Per-Path Timing - Above Animation */}
                                        <div className="controls-section">
                                            <span className="controls-section-title">Timing</span>
                                            <div className="controls-field">
                                                <span className="controls-field-label">Duration</span>
                                                <div className="controls-field-input-group">
                                                    <NumberInput
                                                        value={animation.transition?.duration ?? settings.duration}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            transition: { ...animation.transition, duration: val }
                                                        })}
                                                        min={0.1} max={10} step={0.1}
                                                        unit="s"
                                                    />
                                                    <Slider
                                                        min={0.1} max={5} step={0.1}
                                                        value={animation.transition?.duration ?? settings.duration}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            transition: { ...animation.transition, duration: val }
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="controls-field">
                                                <span className="controls-field-label">Delay</span>
                                                <div className="controls-field-input-group">
                                                    <NumberInput
                                                        value={animation.transition?.delay ?? 0}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            transition: { ...animation.transition, delay: val }
                                                        })}
                                                        min={0} max={10} step={0.1}
                                                        unit="s"
                                                    />
                                                    <Slider
                                                        min={0} max={3} step={0.1}
                                                        value={animation.transition?.delay ?? 0}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            transition: { ...animation.transition, delay: val }
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="controls-field">
                                                <span className="controls-field-label">Easing</span>
                                                <div style={{ flex: 1 }}>
                                                    <Dropdown
                                                        options={[
                                                            { label: 'Linear', value: 'linear' },
                                                            { label: 'Ease', value: 'ease' },
                                                            { label: 'Ease In', value: 'ease-in' },
                                                            { label: 'Ease Out', value: 'ease-out' },
                                                            { label: 'Ease In-Out', value: 'ease-in-out' },
                                                        ]}
                                                        value={animation.transition?.ease ?? settings.easing}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            transition: { ...animation.transition, ease: val }
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Animation Direction */}
                                        <div className="controls-section">
                                            <span className="controls-section-title">Animation</span>
                                            <div className="controls-field">
                                                <span className="controls-field-label">Direction</span>
                                                <SegmentedControl
                                                    options={[
                                                        { label: 'In', value: 'in' },
                                                        { label: 'Out', value: 'out' },
                                                    ]}
                                                    value={settings.animationDirection}
                                                    onChange={(val) => updateSetting('animationDirection', val as AnimationDirection)}
                                                />
                                            </div>
                                        </div>

                                        {/* Transform Controls - Initial → Final */}
                                        <div className="controls-section">
                                            <span className="controls-section-title">Transform</span>

                                            {/* Scale: Initial → Final */}
                                            <div className="controls-field">
                                                <span className="controls-field-label">Scale</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                    <NumberInput
                                                        value={animation.initial.scale}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            initial: { ...animation.initial, scale: val }
                                                        })}
                                                        min={0} max={3} step={0.1}
                                                    />
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                                    <NumberInput
                                                        value={animation.final.scale}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            final: { ...animation.final, scale: val }
                                                        })}
                                                        min={0} max={3} step={0.1}
                                                    />
                                                </div>
                                            </div>

                                            {/* Rotate: Initial → Final */}
                                            <div className="controls-field">
                                                <span className="controls-field-label">Rotate</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                    <NumberInput
                                                        value={animation.initial.rotate}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            initial: { ...animation.initial, rotate: val }
                                                        })}
                                                        min={-360} max={360} step={1}
                                                        unit="°"
                                                    />
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                                    <NumberInput
                                                        value={animation.final.rotate}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            final: { ...animation.final, rotate: val }
                                                        })}
                                                        min={-360} max={360} step={1}
                                                        unit="°"
                                                    />
                                                </div>
                                            </div>

                                            {/* Move X: Initial → Final */}
                                            <div className="controls-field">
                                                <span className="controls-field-label">Move X</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                    <NumberInput
                                                        value={animation.initial.x}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            initial: { ...animation.initial, x: val }
                                                        })}
                                                        min={-200} max={200} step={1}
                                                        unit="px"
                                                    />
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                                    <NumberInput
                                                        value={animation.final.x}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            final: { ...animation.final, x: val }
                                                        })}
                                                        min={-200} max={200} step={1}
                                                        unit="px"
                                                    />
                                                </div>
                                            </div>

                                            {/* Move Y: Initial → Final */}
                                            <div className="controls-field">
                                                <span className="controls-field-label">Move Y</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                    <NumberInput
                                                        value={animation.initial.y}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            initial: { ...animation.initial, y: val }
                                                        })}
                                                        min={-200} max={200} step={1}
                                                        unit="px"
                                                    />
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                                    <NumberInput
                                                        value={animation.final.y}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            final: { ...animation.final, y: val }
                                                        })}
                                                        min={-200} max={200} step={1}
                                                        unit="px"
                                                    />
                                                </div>
                                            </div>

                                            {/* Opacity: Initial → Final */}
                                            <div className="controls-field">
                                                <span className="controls-field-label">Opacity</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                    <NumberInput
                                                        value={animation.initial.opacity}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            initial: { ...animation.initial, opacity: val }
                                                        })}
                                                        min={0} max={1} step={0.1}
                                                    />
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                                    <NumberInput
                                                        value={animation.final.opacity}
                                                        onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                            ...animation,
                                                            final: { ...animation.final, opacity: val }
                                                        })}
                                                        min={0} max={1} step={0.1}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Advanced Transforms (Collapsible) */}
                                        <div className="controls-section">
                                            <button
                                                className="controls-section-header"
                                                onClick={() => setAdvancedOpen(!advancedOpen)}
                                            >
                                                <span className="controls-section-title">Advanced</span>
                                                <ChevronDown size={16} className={`section-chevron ${advancedOpen ? 'open' : ''}`} />
                                            </button>

                                            <AnimatePresence initial={false}>
                                                {advancedOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                                                        style={{ overflow: 'hidden' }}
                                                    >
                                                        {/* Scale X: Initial → Final */}
                                                        <div className="controls-field">
                                                            <span className="controls-field-label">Scale X</span>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                                <NumberInput
                                                                    value={animation.initial.scaleX ?? 1}
                                                                    onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                                        ...animation,
                                                                        initial: { ...animation.initial, scaleX: val }
                                                                    })}
                                                                    min={0} max={3} step={0.1}
                                                                />
                                                                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                                                <NumberInput
                                                                    value={animation.final.scaleX ?? 1}
                                                                    onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                                        ...animation,
                                                                        final: { ...animation.final, scaleX: val }
                                                                    })}
                                                                    min={0} max={3} step={0.1}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Scale Y: Initial → Final */}
                                                        <div className="controls-field">
                                                            <span className="controls-field-label">Scale Y</span>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                                <NumberInput
                                                                    value={animation.initial.scaleY ?? 1}
                                                                    onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                                        ...animation,
                                                                        initial: { ...animation.initial, scaleY: val }
                                                                    })}
                                                                    min={0} max={3} step={0.1}
                                                                />
                                                                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                                                <NumberInput
                                                                    value={animation.final.scaleY ?? 1}
                                                                    onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                                        ...animation,
                                                                        final: { ...animation.final, scaleY: val }
                                                                    })}
                                                                    min={0} max={3} step={0.1}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Skew X: Initial → Final */}
                                                        <div className="controls-field">
                                                            <span className="controls-field-label">Skew X</span>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                                <NumberInput
                                                                    value={animation.initial.skewX ?? 0}
                                                                    onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                                        ...animation,
                                                                        initial: { ...animation.initial, skewX: val }
                                                                    })}
                                                                    min={-90} max={90} step={1}
                                                                    unit="°"
                                                                />
                                                                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                                                <NumberInput
                                                                    value={animation.final.skewX ?? 0}
                                                                    onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                                        ...animation,
                                                                        final: { ...animation.final, skewX: val }
                                                                    })}
                                                                    min={-90} max={90} step={1}
                                                                    unit="°"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Skew Y: Initial → Final */}
                                                        <div className="controls-field">
                                                            <span className="controls-field-label">Skew Y</span>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                                <NumberInput
                                                                    value={animation.initial.skewY ?? 0}
                                                                    onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                                        ...animation,
                                                                        initial: { ...animation.initial, skewY: val }
                                                                    })}
                                                                    min={-90} max={90} step={1}
                                                                    unit="°"
                                                                />
                                                                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                                                <NumberInput
                                                                    value={animation.final.skewY ?? 0}
                                                                    onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                                        ...animation,
                                                                        final: { ...animation.final, skewY: val }
                                                                    })}
                                                                    min={-90} max={90} step={1}
                                                                    unit="°"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Origin X */}
                                                        <div className="controls-field">
                                                            <span className="controls-field-label">Origin X</span>
                                                            <Dropdown
                                                                options={[
                                                                    { label: 'Left', value: '0' },
                                                                    { label: 'Center', value: '0.5' },
                                                                    { label: 'Right', value: '1' },
                                                                ]}
                                                                value={String(animation.originX)}
                                                                onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                                    ...animation,
                                                                    originX: parseFloat(val)
                                                                })}
                                                            />
                                                        </div>

                                                        {/* Origin Y */}
                                                        <div className="controls-field">
                                                            <span className="controls-field-label">Origin Y</span>
                                                            <Dropdown
                                                                options={[
                                                                    { label: 'Top', value: '0' },
                                                                    { label: 'Center', value: '0.5' },
                                                                    { label: 'Bottom', value: '1' },
                                                                ]}
                                                                value={String(animation.originY)}
                                                                onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex, {
                                                                    ...animation,
                                                                    originY: parseFloat(val)
                                                                })}
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Reset Button */}
                                        {activePath.animation && (
                                            <button
                                                onClick={() => updatePathAnimation && updatePathAnimation(selectedPathIndex, undefined)}
                                                style={{
                                                    width: '100%',
                                                    background: 'var(--bg-input)',
                                                    border: '1px solid var(--border-default)',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    fontSize: '13px',
                                                    color: 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    marginTop: '8px'
                                                }}
                                            >
                                                Reset to Global
                                            </button>
                                        )}
                                    </motion.div>
                                ) : (
                                    /* === GLOBAL TRANSFORM VIEW === */
                                    <motion.div
                                        key="global-view"
                                        initial={{ x: '-100%' }}
                                        animate={{ x: 0 }}
                                        exit={{ x: '-100%' }}
                                        transition={{ type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                                        style={{ width: '100%', position: 'absolute', top: 0, left: 0, right: 0, padding: '16px' }}
                                    >
                                        {/* 1. EFFECT */}
                                        <div className="controls-section controls-presets-section">
                                            <span className="controls-section-title">Effect</span>
                                            <div className="controls-field">
                                                <Dropdown
                                                    options={TRANSFORM_PRESETS.map(p => ({ label: p.name, value: p.name }))}
                                                    value={selectedTransformPreset}
                                                    onChange={(name) => {
                                                        setSelectedTransformPreset(name);
                                                        const preset = TRANSFORM_PRESETS.find(p => p.name === name);
                                                        if (preset) {
                                                            updateSetting('globalTransform', preset.values);
                                                        }
                                                    }}
                                                    placeholder="Select effect..."
                                                />
                                            </div>
                                        </div>

                                        {/* 2. LAYERS LIST */}
                                        <div className="controls-section">
                                            <button
                                                className="controls-section-header"
                                                onClick={() => setLayersOpen(!layersOpen)}
                                            >
                                                <span className="controls-section-title">Layers</span>
                                                <ChevronDown size={16} className={`section-chevron ${layersOpen ? 'open' : ''}`} />
                                            </button>
                                            <AnimatePresence initial={false}>
                                                {layersOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                                                        style={{ overflow: 'hidden' }}
                                                    >
                                                        {paths.length > 0 ? (
                                                            <div className="layers-list">
                                                                {paths.map((path, index) => (
                                                                    <div
                                                                        key={path.id}
                                                                        className={`layer-item ${hoveredPathIndex === index ? 'hovered' : ''}`}
                                                                        onMouseEnter={() => setHoveredPathIndex(index)}
                                                                        onMouseLeave={() => setHoveredPathIndex(null)}
                                                                        onClick={() => onSelectPath && onSelectPath(index)}
                                                                    >
                                                                        <div className="layer-drag-handle"><GripVertical size={14} /></div>
                                                                        <span className="layer-name truncate">Path {index + 1}</span>
                                                                        {/* Override badge - more visible styling */}
                                                                        {path.animation && (
                                                                            <span style={{
                                                                                fontSize: '10px',
                                                                                padding: '2px 6px',
                                                                                background: 'var(--bg-button)',
                                                                                color: 'var(--text-secondary)',
                                                                                border: '1px solid var(--border-default)',
                                                                                borderRadius: '4px',
                                                                                marginRight: '4px'
                                                                            }}>Custom</span>
                                                                        )}
                                                                        <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(index); }} className={`layer-visibility-btn ${path.visible ? '' : 'hidden-layer'}`} title={path.visible ? "Hide path" : "Show path"}>
                                                                            {path.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="controls-empty-message">Upload an SVG to see layers</p>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* 3. TIMING (Global) */}
                                        <div className="controls-section">
                                            <span className="controls-section-title">Timing</span>
                                            <div className="controls-field">
                                                <span className="controls-field-label">Duration</span>
                                                <div className="controls-field-input-group">
                                                    <NumberInput
                                                        value={settings.duration}
                                                        onChange={(val) => updateSetting('duration', val)}
                                                        min={0.1} max={10} step={0.1}
                                                        unit="s"
                                                    />
                                                    <Slider
                                                        min={0.1} max={5} step={0.1}
                                                        value={settings.duration}
                                                        onChange={(val) => updateSetting('duration', val)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="controls-field">
                                                <span className="controls-field-label">Delay</span>
                                                <div className="controls-field-input-group">
                                                    <NumberInput
                                                        value={settings.delay}
                                                        onChange={(val) => updateSetting('delay', val)}
                                                        min={0} max={10} step={0.1}
                                                        unit="s"
                                                    />
                                                    <Slider
                                                        min={0} max={3} step={0.1}
                                                        value={settings.delay}
                                                        onChange={(val) => updateSetting('delay', val)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="controls-field">
                                                <span className="controls-field-label">Easing</span>
                                                <div style={{ flex: 1 }}>
                                                    <Dropdown
                                                        options={[
                                                            { label: 'Linear', value: 'linear' },
                                                            { label: 'Ease', value: 'ease' },
                                                            { label: 'Ease In', value: 'ease-in' },
                                                            { label: 'Ease Out', value: 'ease-out' },
                                                            { label: 'Ease In-Out', value: 'ease-in-out' },
                                                        ]}
                                                        value={settings.easing}
                                                        onChange={(val) => updateSetting('easing', val as any)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4. ANIMATION */}
                                        <div className="controls-section">
                                            <span className="controls-section-title">Animation</span>
                                            <div className="controls-field">
                                                <span className="controls-field-label">Direction</span>
                                                <SegmentedControl
                                                    options={[
                                                        { label: 'In', value: 'in' },
                                                        { label: 'Out', value: 'out' },
                                                    ]}
                                                    value={settings.animationDirection}
                                                    onChange={(val) => updateSetting('animationDirection', val as AnimationDirection)}
                                                />
                                            </div>
                                            <div className="controls-field">
                                                <span className="controls-field-label">Trigger</span>
                                                <div style={{ flex: 1 }}>
                                                    <Dropdown
                                                        options={[
                                                            { label: 'None', value: 'none' },
                                                            { label: 'On Hover', value: 'hover' },
                                                            { label: 'On Click', value: 'click' },
                                                            { label: 'On Appear', value: 'appear' },
                                                        ]}
                                                        value={settings.trigger || 'auto'}
                                                        onChange={(val) => updateSetting('trigger', val as TriggerType)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 5. GLOBAL TRANSFORM */}
                                        <div className="controls-section">
                                            <span className="controls-section-title">Global Transform</span>
                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                                                Applies to all paths (Initial → Final)
                                            </p>

                                            {/* Scale: Initial → Final */}
                                            <div className="controls-field">
                                                <span className="controls-field-label">Scale</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                    <NumberInput
                                                        value={settings.globalTransform.initial.scale}
                                                        onChange={(val) => updateSetting('globalTransform', {
                                                            ...settings.globalTransform,
                                                            initial: { ...settings.globalTransform.initial, scale: val }
                                                        })}
                                                        min={0} max={3} step={0.1}
                                                    />
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                                    <NumberInput
                                                        value={settings.globalTransform.final.scale}
                                                        onChange={(val) => updateSetting('globalTransform', {
                                                            ...settings.globalTransform,
                                                            final: { ...settings.globalTransform.final, scale: val }
                                                        })}
                                                        min={0} max={3} step={0.1}
                                                    />
                                                </div>
                                            </div>

                                            {/* Rotate: Initial → Final */}
                                            <div className="controls-field">
                                                <span className="controls-field-label">Rotate</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                    <NumberInput
                                                        value={settings.globalTransform.initial.rotate}
                                                        onChange={(val) => updateSetting('globalTransform', {
                                                            ...settings.globalTransform,
                                                            initial: { ...settings.globalTransform.initial, rotate: val }
                                                        })}
                                                        unit="°"
                                                    />
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                                    <NumberInput
                                                        value={settings.globalTransform.final.rotate}
                                                        onChange={(val) => updateSetting('globalTransform', {
                                                            ...settings.globalTransform,
                                                            final: { ...settings.globalTransform.final, rotate: val }
                                                        })}
                                                        unit="°"
                                                    />
                                                </div>
                                            </div>

                                            {/* Move X: Initial → Final */}
                                            <div className="controls-field">
                                                <span className="controls-field-label">Move X</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                    <NumberInput
                                                        value={settings.globalTransform.initial.x}
                                                        onChange={(val) => updateSetting('globalTransform', {
                                                            ...settings.globalTransform,
                                                            initial: { ...settings.globalTransform.initial, x: val }
                                                        })}
                                                        unit="px"
                                                    />
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                                    <NumberInput
                                                        value={settings.globalTransform.final.x}
                                                        onChange={(val) => updateSetting('globalTransform', {
                                                            ...settings.globalTransform,
                                                            final: { ...settings.globalTransform.final, x: val }
                                                        })}
                                                        unit="px"
                                                    />
                                                </div>
                                            </div>

                                            {/* Move Y: Initial → Final */}
                                            <div className="controls-field">
                                                <span className="controls-field-label">Move Y</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                    <NumberInput
                                                        value={settings.globalTransform.initial.y}
                                                        onChange={(val) => updateSetting('globalTransform', {
                                                            ...settings.globalTransform,
                                                            initial: { ...settings.globalTransform.initial, y: val }
                                                        })}
                                                        unit="px"
                                                    />
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                                    <NumberInput
                                                        value={settings.globalTransform.final.y}
                                                        onChange={(val) => updateSetting('globalTransform', {
                                                            ...settings.globalTransform,
                                                            final: { ...settings.globalTransform.final, y: val }
                                                        })}
                                                        unit="px"
                                                    />
                                                </div>
                                            </div>

                                            {/* Opacity: Initial → Final */}
                                            <div className="controls-field">
                                                <span className="controls-field-label">Opacity</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                    <NumberInput
                                                        value={settings.globalTransform.initial.opacity}
                                                        onChange={(val) => updateSetting('globalTransform', {
                                                            ...settings.globalTransform,
                                                            initial: { ...settings.globalTransform.initial, opacity: val }
                                                        })}
                                                        min={0} max={1} step={0.1}
                                                    />
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                                    <NumberInput
                                                        value={settings.globalTransform.final.opacity}
                                                        onChange={(val) => updateSetting('globalTransform', {
                                                            ...settings.globalTransform,
                                                            final: { ...settings.globalTransform.final, opacity: val }
                                                        })}
                                                        min={0} max={1} step={0.1}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
