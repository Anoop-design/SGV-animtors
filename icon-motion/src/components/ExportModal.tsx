'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Download, Code2, FileCode2, Palette } from 'lucide-react';
import { ParsedSVG, AnimationSettings } from '@/types';
import { generateExport, generateProExport, ExportType, downloadSVG } from '@/lib/generate-export';
import '@/styles.css';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    parsedSVG: ParsedSVG;
    settings: AnimationSettings;
}

type ExportFormat = 'react-pro' | 'framer-motion' | 'css' | 'svg';

interface FormatOption {
    id: ExportFormat;
    name: string;
    description: string;
    icon: React.ReactNode;
}

const FORMAT_OPTIONS: FormatOption[] = [
    {
        id: 'react-pro',
        name: 'React + Framer Motion',
        description: 'Production-ready component with TypeScript',
        icon: <Code2 size={18} />,
    },
    {
        id: 'framer-motion',
        name: 'Framer Motion (Basic)',
        description: 'Simple animated component',
        icon: <FileCode2 size={18} />,
    },
    {
        id: 'css',
        name: 'CSS Animation',
        description: 'Pure CSS keyframe animation',
        icon: <Palette size={18} />,
    },
    {
        id: 'svg',
        name: 'Animated SVG',
        description: 'Self-contained SVG with SMIL',
        icon: <FileCode2 size={18} />,
    },
];

export const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    parsedSVG,
    settings,
}) => {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('react-pro');
    const [copied, setCopied] = useState(false);
    const codeRef = useRef<HTMLPreElement>(null);

    // Generate export code based on selected format
    const exportCode = React.useMemo(() => {
        switch (selectedFormat) {
            case 'react-pro':
                return generateProExport(parsedSVG, settings, 'AnimatedIcon');
            case 'framer-motion':
                return generateExport(parsedSVG, settings, 'framer-motion');
            case 'css':
                return generateExport(parsedSVG, settings, 'css');
            case 'svg':
                return generateExport(parsedSVG, settings, 'svg');
            default:
                return '';
        }
    }, [parsedSVG, settings, selectedFormat]);

    // Copy to clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(exportCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Download as file
    const handleDownload = () => {
        const extensions: Record<ExportFormat, string> = {
            'react-pro': 'tsx',
            'framer-motion': 'tsx',
            'css': 'css',
            'svg': 'svg',
        };

        const filename = `animated-icon.${extensions[selectedFormat]}`;
        const mimeTypes: Record<string, string> = {
            tsx: 'text/typescript',
            css: 'text/css',
            svg: 'image/svg+xml',
        };

        const blob = new Blob([exportCode], { type: mimeTypes[extensions[selectedFormat]] });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Reset copied state when format changes
    useEffect(() => {
        setCopied(false);
    }, [selectedFormat]);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="export-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="export-modal"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="export-modal-header">
                            <h2 className="export-modal-title">Export Animation</h2>
                            <button className="export-modal-close" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Format Selector */}
                        <div className="export-format-selector">
                            {FORMAT_OPTIONS.map((format) => (
                                <button
                                    key={format.id}
                                    className={`export-format-option ${selectedFormat === format.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedFormat(format.id)}
                                >
                                    <span className="export-format-icon">{format.icon}</span>
                                    <div className="export-format-text">
                                        <span className="export-format-name">{format.name}</span>
                                        <span className="export-format-desc">{format.description}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Code Preview */}
                        <div className="export-code-container">
                            <div className="export-code-header">
                                <span className="export-code-filename">
                                    {selectedFormat === 'svg' ? 'animated-icon.svg' :
                                        selectedFormat === 'css' ? 'animated-icon.css' : 'AnimatedIcon.tsx'}
                                </span>
                                <div className="export-code-actions">
                                    <button
                                        className="export-action-btn"
                                        onClick={handleCopy}
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                    <button
                                        className="export-action-btn"
                                        onClick={handleDownload}
                                        title="Download file"
                                    >
                                        <Download size={16} />
                                        Download
                                    </button>
                                </div>
                            </div>
                            <pre ref={codeRef} className="export-code-content">
                                <code>{exportCode}</code>
                            </pre>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ExportModal;
