'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PanelMorphIconProps {
    isExpanded: boolean;
    size?: number;
    strokeWidth?: number;
    color?: string;
}

/**
 * PanelMorphIcon - Animated panel toggle icon
 * 
 * Morphs between:
 * - Default: PanelRight (two sections, outlined)
 * - Expanded: Filled right panel
 */
export const PanelMorphIcon: React.FC<PanelMorphIconProps> = ({
    isExpanded,
    size = 24,
    strokeWidth = 2,
    color = 'currentColor'
}) => {
    const springTransition = {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25,
    };

    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {/* Outer rounded rect - always visible */}
            <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                ry="2"
            />

            {/* Divider line - stays static */}
            <line
                x1={15}
                y1={3}
                x2={15}
                y2={21}
            />

            {/* Fill panel - expands from right edge inward */}
            <motion.rect
                y="3"
                rx="0"
                ry="0"
                fill={color}
                stroke="none"
                animate={{
                    x: isExpanded ? 15 : 21,
                    width: isExpanded ? 6 : 0,
                    height: 18,
                    opacity: isExpanded ? 1 : 0,
                }}
                transition={springTransition}
            />
        </svg>
    );
};
