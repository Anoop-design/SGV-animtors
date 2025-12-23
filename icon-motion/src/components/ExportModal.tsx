'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CircleCheck, Download, RotateCcw } from 'lucide-react';
import { ParsedSVG, AnimationSettings, AnimationRecipe, DEFAULT_RECIPE, PresetType } from '@/types';
import { generateExport, generateProExport, ExportType } from '@/lib/generate-export';
import '@/styles.css';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    parsedSVG: ParsedSVG;
    settings: AnimationSettings;
    recipe?: AnimationRecipe;
}

type ExportFormat = 'react-pro' | 'framer-motion' | 'css' | 'svg';

interface FormatTab {
    id: ExportFormat;
    name: string;
    icon: React.ReactNode;
}

// Official SVG icons - matching the Header dropdown logos
const ReactLogo = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="2.5" />
        <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)" />
    </svg>
);

// Official Framer Motion "M" swoosh logo
const FramerMotionLogo = () => (
    <svg width="16" height="16" viewBox="0 0 34 33" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_export_fm)">
            <path d="M12.838 10.5055L6.12 22.4945H0L5.245 13.1335C6.059 11.6815 8.088 10.5055 9.778 10.5055H12.838ZM27.846 13.5025C27.846 11.8475 29.216 10.5055 30.906 10.5055C32.596 10.5055 33.966 11.8475 33.966 13.5025C33.966 15.1585 32.596 16.5005 30.906 16.5005C29.216 16.5005 27.846 15.1585 27.846 13.5025ZM13.985 10.5055H20.105L13.387 22.4945H7.267L13.985 10.5055ZM21.214 10.5055H27.334L22.088 19.8675C21.275 21.3185 19.246 22.4945 17.556 22.4945H14.496L21.214 10.5055Z" fill="currentColor" />
        </g>
        <defs>
            <clipPath id="clip0_export_fm">
                <rect width="33.966" height="33" fill="currentColor" />
            </clipPath>
        </defs>
    </svg>
);

// CSS3 shield logo
const CssLogo = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 3h16l-2 18-6 2-6-2L4 3z" />
        <path d="M8 8h8l-.5 5H9l-.25 3 3.25 1 3-1" />
    </svg>
);

// SVG file icon
const SvgLogo = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 15l2 2 4-4" />
    </svg>
);

const FORMAT_TABS: FormatTab[] = [
    { id: 'react-pro', name: 'React + Framer Motion', icon: <ReactLogo /> },
    { id: 'framer-motion', name: 'Framer Motion', icon: <FramerMotionLogo /> },
    { id: 'css', name: 'CSS', icon: <CssLogo /> },
    { id: 'svg', name: 'SVG', icon: <SvgLogo /> },
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

    // Normalize easing for Framer Motion
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

    // Get filename based on format
    const getFilename = () => {
        switch (selectedFormat) {
            case 'svg': return 'animated-icon.svg';
            case 'css': return 'animated-icon.css';
            default: return 'AnimatedIcon.tsx';
        }
    };

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

    // Keyboard shortcuts
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
                            <h2 className="export-modal-title">Export animation</h2>
                            <button className="export-modal-close" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Format Tabs - with animated indicator */}
                        <div
                            className="export-format-tabs"
                            style={{
                                '--tab-count': FORMAT_TABS.length,
                                '--selected-index': FORMAT_TABS.findIndex(f => f.id === selectedFormat),
                            } as React.CSSProperties}
                        >
                            {/* Animated sliding indicator */}
                            <div className="export-tab-indicator" aria-hidden="true" />

                            {FORMAT_TABS.map((format) => (
                                <button
                                    key={format.id}
                                    className={`export-format-tab ${selectedFormat === format.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedFormat(format.id)}
                                >
                                    <span className="export-tab-icon">{format.icon}</span>
                                    <span className="export-tab-name">{format.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Main Content: Side-by-Side Layout */}
                        <div className="export-content-grid">
                            {/* Left: Live Preview */}
                            <div className="export-preview-panel">
                                {/* Floating Replay Button */}
                                <button
                                    className="export-replay-floating"
                                    onClick={handleReplay}
                                    title="Replay animation (R)"
                                >
                                    <span>
                                        <RotateCcw size={13} />
                                        Replay
                                    </span>
                                </button>

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
                            </div>

                            {/* Right: Code Panel */}
                            <div className="export-code-panel">
                                <div className="export-code-header">
                                    <span className="export-code-filename">{getFilename()}</span>
                                    <div className="export-code-actions">
                                        <button
                                            className="export-action-btn"
                                            onClick={handleDownload}
                                            title="Download file"
                                        >
                                            <span>
                                                <Download size={13} />
                                                Export
                                            </span>
                                        </button>
                                        <button
                                            className={`export-action-btn ${copied ? 'copied' : ''}`}
                                            onClick={handleCopy}
                                            title="Copy to clipboard"
                                        >
                                            <span className="export-copy-icon-wrapper">
                                                <AnimatePresence mode="wait">
                                                    {copied ? (
                                                        <motion.div
                                                            key="check"
                                                            initial={{ scale: 0, rotate: -180 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            exit={{ scale: 0, rotate: 180 }}
                                                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                                            className="export-copy-icon"
                                                        >
                                                            <CircleCheck size={20} />
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            key="copy"
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0.8, opacity: 0 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="export-copy-icon"
                                                        >
                                                            <Copy size={15} />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </span>
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
