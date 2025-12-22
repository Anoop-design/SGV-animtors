'use client';

import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { PresetType } from '@/types';

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
 * - Fade: Eye that fades in
 * - Slide: Arrow that slides up
 * - Spin: Loader that rotates
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
            controls.start('hover');
        } else {
            controls.start('initial');
        }
    }, [isHovered, controls]);

    switch (preset) {
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
            // Circle/ball icon - bounces up on hover (no opacity fade)
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

        case 'fade':
            // Eye icon - fades in on hover
            return (
                <motion.svg
                    {...svgProps}
                    initial="initial"
                    animate={controls}
                    variants={{
                        initial: { opacity: 1 },
                        hover: { opacity: [0, 1] },
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                </motion.svg>
            );

        case 'slide':
            // Arrow up icon - slides up on hover
            return (
                <motion.svg
                    {...svgProps}
                    initial="initial"
                    animate={controls}
                    variants={{
                        initial: { y: 0, opacity: 1 },
                        hover: { y: [6, 0], opacity: [0, 1] },
                    }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                    <path d="m5 12 7-7 7 7" />
                    <path d="M12 19V5" />
                </motion.svg>
            );

        case 'spin':
            // Loader icon - spins on hover
            return (
                <motion.svg
                    {...svgProps}
                    initial="initial"
                    animate={controls}
                    variants={{
                        initial: { rotate: 0 },
                        hover: { rotate: 360 },
                    }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </motion.svg>
            );

        case 'pulse':
            // Heart icon - pulses on hover
            return (
                <motion.svg
                    {...svgProps}
                    initial="initial"
                    animate={controls}
                    variants={{
                        initial: { scale: 1 },
                        hover: { scale: [1, 1.15, 1, 1.1, 1] },
                    }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </motion.svg>
            );

        default:
            // Fallback - simple circle
            return (
                <svg {...svgProps}>
                    <circle cx="12" cy="12" r="10" />
                </svg>
            );
    }
};
