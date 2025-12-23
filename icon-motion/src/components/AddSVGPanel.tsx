'use client';

import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { UploadZone, UploadZoneHandle } from '@/components/ui/UploadZone';
import { AlertTriangle, Heart, Layers, Bell, AlertCircle, Shield, Zap, Loader, X, PanelRight, Star } from 'lucide-react';
import { PresetType, TriggerType } from '@/types';
import '@/styles.css';

interface AddSVGPanelProps {
    svgInput: string;
    setSvgInput: (value: string) => void;
    warnings: string[];
    // Responsive props
    isOpen?: boolean;
    onClose?: () => void;
    // Quick Start handler
    onQuickStart?: (svg: string, preset: PresetType, trigger: TriggerType) => void;
}

export interface AddSVGPanelHandle {
    triggerUpload: () => void;
}

// Quick Start items - pre-made animated icon demos
interface QuickStartItem {
    id: string;
    name: string;
    svg: string;
    preset: PresetType;
    trigger: TriggerType;
    icon: React.ElementType;
}

const QUICK_START_ITEMS: QuickStartItem[] = [
    {
        id: 'draw-star',
        name: 'Draw',
        icon: Star,
        preset: 'draw',
        trigger: 'auto',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
    },
    {
        id: 'pop-alert',
        name: 'Pop',
        icon: AlertCircle,
        preset: 'pop',
        trigger: 'hover',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`
    },
    {
        id: 'wiggle-bell',
        name: 'Wiggle',
        icon: Bell,
        preset: 'wiggle',
        trigger: 'click',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`
    },
    {
        id: 'bounce-zap',
        name: 'Bounce',
        icon: Zap,
        preset: 'bounce',
        trigger: 'auto',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`
    },
    {
        id: 'panel-toggle',
        name: 'Panel',
        icon: PanelRight,
        preset: 'panel',
        trigger: 'hover',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/></svg>`
    },
    {
        id: 'spin-loader',
        name: 'Spin',
        icon: Loader,
        preset: 'spin',
        trigger: 'auto',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>`
    },
    {
        id: 'pulse-heart',
        name: 'Pulse',
        icon: Heart,
        preset: 'pulse',
        trigger: 'auto',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`
    },
    {
        id: 'slide-layers',
        name: 'Slide',
        icon: Layers,
        preset: 'slide',
        trigger: 'auto',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>`
    },
    {
        id: 'fade-shield',
        name: 'Fade',
        icon: Shield,
        preset: 'fade',
        trigger: 'auto',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`
    }
];

/**
 * AddSVGPanel Component
 * 
 * Left panel for SVG upload and Quick Start animated examples.
 * 
 * CSS Classes:
 * - .add-svg-panel: Main container
 * - .add-svg-header: Header with title
 * - .add-svg-content: Content area
 */
export const AddSVGPanel = forwardRef<AddSVGPanelHandle, AddSVGPanelProps>(({
    svgInput,
    setSvgInput,
    warnings,
    isOpen,
    onClose,
    onQuickStart
}, ref) => {
    const uploadRef = useRef<UploadZoneHandle>(null);

    // Expose triggerUpload for keyboard shortcuts
    useImperativeHandle(ref, () => ({
        triggerUpload: () => uploadRef.current?.triggerUpload(),
    }));

    const handleQuickStart = (item: QuickStartItem) => {
        if (onQuickStart) {
            onQuickStart(item.svg, item.preset, item.trigger);
        } else {
            // Fallback: just set the SVG
            setSvgInput(item.svg);
        }
    };

    return (
        <div className={`add-svg-panel ${isOpen ? 'panel-open' : ''}`}>
            {/* Header */}
            <div className="add-svg-header">
                <span className="add-svg-header-title">Add SVG</span>
                {/* Mobile close button */}
                <button className="panel-close-btn" onClick={onClose}>
                    <X size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="add-svg-content hide-scrollbar">
                {/* Upload Zone */}
                <div className="add-svg-section">
                    <UploadZone ref={uploadRef} onFileSelect={setSvgInput} />
                </div>

                {/* Quick Start Section */}
                <div className="add-svg-section">
                    <span className="add-svg-section-title">Quick Start</span>
                    <div className="quick-start-grid">
                        {QUICK_START_ITEMS.map((item) => {
                            const IconComponent = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    className="quick-start-btn"
                                    onClick={() => handleQuickStart(item)}
                                    title={`${item.name} - ${item.trigger}`}
                                >
                                    <IconComponent size={20} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* SVG Code Section */}
                <div className="add-svg-section">
                    <span className="add-svg-section-title">SVG code</span>
                    <textarea
                        value={svgInput}
                        onChange={(e) => setSvgInput(e.target.value)}
                        placeholder="Paste SVG code here..."
                        className="add-svg-code-textarea hide-scrollbar"
                    />
                </div>

                {/* Warnings display */}
                {warnings.length > 0 && (
                    <div className="add-svg-warnings">
                        <AlertTriangle style={{ width: 14, height: 14, color: '#ef4444', flexShrink: 0 }} />
                        <div className="add-svg-warnings-text">
                            {warnings.map((w, i) => <p key={i}>{w}</p>)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

AddSVGPanel.displayName = 'AddSVGPanel';
