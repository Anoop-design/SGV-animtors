'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, Copy, Check, Download, Code2, FileCode2, Palette, RotateCcw, Play } from 'lucide-react';
import { ParsedSVG, AnimationSettings, AnimationRecipe, DEFAULT_RECIPE, PresetType } from '@/types';
import { generateExport, generateProExport, ExportType, downloadSVG } from '@/lib/generate-export';
import '@/styles.css';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    parsedSVG: ParsedSVG;
    settings: AnimationSettings;
    recipe?: AnimationRecipe;
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
        description: 'Production-ready with TypeScript',
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
        description: 'Pure CSS keyframes',
        icon: <Palette size={18} />,
    },
    {
        id: 'svg',
        name: 'Animated SVG',
        description: 'Self-contained SVG',
        icon: <FileCode2 size={18} />,
    },
];

// Get animation variants based on preset
const getPreviewVariants = (preset: PresetType, intensity: number = 0.5) => {
    switch (preset) {
        case 'spin':
            return { initial: { rotate: 0 }, animate: { rotate: 360 } };
        case 'pop':
            return { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 } };
        case 'wiggle':
            const angle = Math.round(20 * intensity);
            return { initial: { rotate: 0 }, animate: { rotate: [0, -angle, angle, -angle, 0] } };
        case 'bounce':
            return { initial: { y: 20 }, animate: { y: [20, -8, 3, 0] } };
        case 'fade':
            return { initial: { opacity: 0 }, animate: { opacity: 1 } };
        case 'slide':
            return { initial: { y: 15, opacity: 0 }, animate: { y: 0, opacity: 1 } };
        case 'pulse':
            return { initial: { scale: 1 }, animate: { scale: [1, 1.15, 1, 1.1, 1] } };
        case 'draw':
        case 'draw-pop':
        default:
            return { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 } };
    }
};

export const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    parsedSVG,
    settings,
    recipe = DEFAULT_RECIPE,
}) => {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('react-pro');
    const [copied, setCopied] = useState(false);
    const [isAnimating, setIsAnimating] = useState(true);
    const [animationKey, setAnimationKey] = useState(0);
    const codeRef = useRef<HTMLPreElement>(null);

    // Get visible paths
    const visiblePaths = parsedSVG.paths.filter(p => p.visible);

    // Get animation settings
    const variants = getPreviewVariants(recipe.preset, recipe.intensity);
    const isContinuous = recipe.preset === 'spin' || recipe.preset === 'pulse';
    const duration = recipe.transition?.duration ?? recipe.duration;
    // Normalize easing for Framer Motion (spring and custom not valid for ease prop)
    const getValidEasing = () => {
        const validEasings = ['linear', 'easeIn', 'easeOut', 'easeInOut'] as const;
        if (validEasings.includes(recipe.easing as typeof validEasings[number])) {
            return recipe.easing as typeof validEasings[number];
        }
        return 'easeOut';
    };
    const normalizedEasing = getValidEasing();

    // Generate export code based on selected format
    const exportCode = React.useMemo(() => {
        switch (selectedFormat) {
            case 'react-pro':
                return generateProExport(parsedSVG, settings, recipe, 'AnimatedIcon');
            case 'framer-motion':
                return generateExport(parsedSVG, settings, 'framer-motion');
            case 'css':
                return generateExport(parsedSVG, settings, 'css');
            case 'svg':
                return generateExport(parsedSVG, settings, 'svg');
            default:
                return '';
        }
    }, [parsedSVG, settings, recipe, selectedFormat]);

    // Replay animation
    const handleReplay = useCallback(() => {
        setIsAnimating(false);
        setAnimationKey(prev => prev + 1);
        setTimeout(() => setIsAnimating(true), 50);
    }, []);

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

    // Reset states when modal opens
    useEffect(() => {
        if (isOpen) {
            setCopied(false);
            setIsAnimating(true);
            setAnimationKey(0);
        }
    }, [isOpen]);

    // Reset copied state when format changes
    useEffect(() => {
        setCopied(false);
    }, [selectedFormat]);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'r' || e.key === 'R') handleReplay();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose, handleReplay]);

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
                        className="export-modal export-modal-wide"
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

                        {/* Main Content: Side-by-Side Layout */}
                        <div className="export-content-grid">
                            {/* Left: Live Preview */}
                            <div className="export-preview-panel">
                                <div className="export-preview-header">
                                    <span className="export-preview-label">Live Preview</span>
                                    <button className="export-replay-btn" onClick={handleReplay} title="Replay animation (R)">
                                        <RotateCcw size={14} />
                                        Replay
                                    </button>
                                </div>

                                {/* Animated Icon Preview */}
                                <div className="export-preview-canvas">
                                    <motion.svg
                                        key={animationKey}
                                        viewBox={parsedSVG.viewBox}
                                        className="export-preview-svg"
                                        initial={recipe.layerMode === 'unified' ? variants.initial : undefined}
                                        animate={isAnimating && recipe.layerMode === 'unified' ? variants.animate : undefined}
                                        transition={{
                                            duration: duration,
                                            ease: normalizedEasing,
                                            repeat: isContinuous && recipe.loop ? Infinity : 0,
                                        }}
                                        style={{ transformOrigin: 'center' }}
                                    >
                                        {visiblePaths.map((path, index) => (
                                            <motion.path
                                                key={index}
                                                d={path.d}
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                initial={recipe.layerMode === 'individual' ? variants.initial : undefined}
                                                animate={isAnimating && recipe.layerMode === 'individual' ? variants.animate : undefined}
                                                transition={{
                                                    duration: duration,
                                                    delay: index * recipe.stagger,
                                                    ease: normalizedEasing,
                                                    repeat: isContinuous && recipe.loop ? Infinity : 0,
                                                }}
                                                style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                                            />
                                        ))}
                                    </motion.svg>
                                </div>

                                {/* Props Summary */}
                                <div className="export-props-summary">
                                    <span className="export-props-title">Configurable Props</span>
                                    <div className="export-props-list">
                                        <code>size={24}</code>
                                        <code>color="currentColor"</code>
                                        <code>trigger="{recipe.trigger}"</code>
                                        {recipe.loop && <code>loop</code>}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Code Panel */}
                            <div className="export-code-panel">
                                <div className="export-code-header">
                                    <span className="export-code-filename">
                                        {selectedFormat === 'svg' ? 'animated-icon.svg' :
                                            selectedFormat === 'css' ? 'animated-icon.css' : 'AnimatedIcon.tsx'}
                                    </span>
                                    <div className="export-code-actions">
                                        <button
                                            className={`export-action-btn ${copied ? 'copied' : ''}`}
                                            onClick={handleCopy}
                                            title="Copy to clipboard"
                                        >
                                            <AnimatePresence mode="wait">
                                                {copied ? (
                                                    <motion.span
                                                        key="check"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                        className="export-copy-success"
                                                    >
                                                        <Check size={16} />
                                                        Copied!
                                                    </motion.span>
                                                ) : (
                                                    <motion.span
                                                        key="copy"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                    >
                                                        <Copy size={16} />
                                                        Copy
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
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
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ExportModal;
