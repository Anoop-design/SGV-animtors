'use client';

import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { PresetType } from '@/types';
import { Ban } from 'lucide-react';

interface AnimatedPresetIconProps {
    preset: PresetType;
    isHovered: boolean;
    size?: number;
}

/**
 * AnimatedPresetIcon - SVG icons that demonstrate each animation preset on hover
 * 
 * Each icon shows what the animation does:
 * - Draw: Activity line that draws in
 * - Pop: Star that scales up with overshoot
 * - Wiggle: Bell that shakes
 * - Bounce: Ball that bounces
 * - Draw+Pop: Sparkles that draw then pop
 * 
 * Uses useAnimation hook to ensure animations re-trigger on each hover
 */
export const AnimatedPresetIcon: React.FC<AnimatedPresetIconProps> = ({
    preset,
    isHovered,
    size = 20,
}) => {
    const controls = useAnimation();

    // Common SVG props for consistency
    // Use CSS variable for color to ensure visibility in both light and dark modes
    const svgProps = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'var(--text-primary)',
        strokeWidth: 2,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    };

    // Trigger animation when isHovered changes to true
    useEffect(() => {
        if (isHovered) {
            // Start the animation sequence
            controls.start('hover');
        } else {
            // Reset to initial state
            controls.start('initial');
        }
    }, [isHovered, controls]);

    switch (preset) {
        case 'none':
            // Use Lucide Ban icon - no animation
            return <Ban size={size} color="var(--text-primary)" />;

        case 'draw':
            // Activity/pulse line - draws in on hover
            return (
                <svg {...svgProps}>
                    <motion.path
                        d="M22 12h-4l-3 9L9 3l-3 9H2"
                        initial="initial"
                        animate={controls}
                        variants={{
                            initial: { pathLength: 1 },
                            hover: { pathLength: [0, 1] },
                        }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                </svg>
            );

        case 'pop':
            // Star icon - scales up with overshoot on hover
            return (
                <motion.svg
                    {...svgProps}
                    initial="initial"
                    animate={controls}
                    variants={{
                        initial: { scale: 1, opacity: 1 },
                        hover: { scale: [0.5, 1.2, 1], opacity: [0.5, 1, 1] },
                    }}
                    transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </motion.svg>
            );

        case 'wiggle':
            // Bell icon - shakes left/right on hover
            return (
                <motion.svg
                    {...svgProps}
                    style={{ transformOrigin: 'top center' }}
                    initial="initial"
                    animate={controls}
                    variants={{
                        initial: { rotate: 0 },
                        hover: { rotate: [-12, 12, -8, 8, -4, 4, 0] },
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </motion.svg>
            );

        case 'bounce':
            // Circle/ball icon - bounces up on hover
            // Note: Spring only supports 2 keyframes, so we use tween for multi-keyframe bounce
            return (
                <motion.svg
                    {...svgProps}
                    initial="initial"
                    animate={controls}
                    variants={{
                        initial: { y: 0 },
                        hover: { y: [0, -6, 0, -3, 0] },
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <circle cx="12" cy="12" r="10" />
                </motion.svg>
            );

        case 'draw-pop':
            // Sparkles icon - draws then pops
            return (
                <svg {...svgProps}>
                    {/* Main star - draws then scales */}
                    <motion.g
                        initial="initial"
                        animate={controls}
                        variants={{
                            initial: { scale: 1 },
                            hover: { scale: [0.8, 1.15, 1] },
                        }}
                        transition={{ duration: 0.5, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                        style={{ transformOrigin: 'center' }}
                    >
                        <motion.path
                            d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
                            initial="initial"
                            animate={controls}
                            variants={{
                                initial: { pathLength: 1 },
                                hover: { pathLength: [0, 1] },
                            }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                        />
                    </motion.g>
                    {/* Small sparkle - top right */}
                    <motion.path
                        d="M19 5 19.5 3.5 21 3l-1.5-.5L19 1l-.5 1.5L17 3l1.5.5L19 5Z"
                        initial="initial"
                        animate={controls}
                        variants={{
                            initial: { opacity: 1, scale: 1 },
                            hover: { opacity: [0, 1], scale: [0.5, 1.2, 1] },
                        }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                        style={{ transformOrigin: '19px 3px' }}
                    />
                </svg>
            );

        default:
            return <Ban size={size} color="var(--text-primary)" />;
    }
};
