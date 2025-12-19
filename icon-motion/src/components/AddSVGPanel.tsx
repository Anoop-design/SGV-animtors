'use client';

import React from 'react';
import { UploadZone } from '@/components/ui/UploadZone';
import { AlertTriangle, Heart, Layers, Briefcase, GraduationCap, Bell, AlertCircle, Shield, AlertOctagon, Zap, X } from 'lucide-react';
import '@/styles.css';

interface AddSVGPanelProps {
    svgInput: string;
    setSvgInput: (value: string) => void;
    warnings: string[];
    // Responsive props
    isOpen?: boolean;
    onClose?: () => void;
}

// Example SVG icons for the grid
const EXAMPLE_ICONS = [
    {
        name: 'Heart',
        icon: Heart,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`
    },
    {
        name: 'Layers',
        icon: Layers,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>`
    },
    {
        name: 'Briefcase',
        icon: Briefcase,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>`
    },
    {
        name: 'Graduation',
        icon: GraduationCap,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`
    },
    {
        name: 'Bell',
        icon: Bell,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`
    },
    {
        name: 'Alert',
        icon: AlertCircle,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`
    },
    {
        name: 'Shield',
        icon: Shield,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`
    },
    {
        name: 'Stop',
        icon: AlertOctagon,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`
    },
    {
        name: 'Zap',
        icon: Zap,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`
    }
];

/**
 * AddSVGPanel Component
 * 
 * Left panel for SVG upload and code input.
 * 
 * CSS Classes:
 * - .add-svg-panel: Main container
 * - .add-svg-header: Header with "Add SVG" title
 * - .add-svg-content: Content area
 */
export const AddSVGPanel: React.FC<AddSVGPanelProps> = ({
    svgInput,
    setSvgInput,
    warnings,
    isOpen,
    onClose
}) => {
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
                    <UploadZone onFileSelect={setSvgInput} />
                </div>

                {/* Example Icons Section */}
                <div className="add-svg-section">
                    <span className="add-svg-section-title">Try examples</span>
                    <div className="example-icons-grid">
                        {EXAMPLE_ICONS.map((example) => {
                            const IconComponent = example.icon;
                            return (
                                <button
                                    key={example.name}
                                    className="example-icon-btn"
                                    onClick={() => setSvgInput(example.svg)}
                                    title={example.name}
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
};
