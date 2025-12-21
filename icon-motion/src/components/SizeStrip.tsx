'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ParsedSVG } from '@/types';

// Available icon sizes for the strip
const ICON_SIZES = [16, 24, 32, 48, 64, 96];

interface SizeStripProps {
    parsedSVG: ParsedSVG;
    selectedSize: number;
    onSizeChange: (size: number) => void;
    isAnimating?: boolean;
    strokeColor?: string;
    strokeWidth?: number;
}

/**
 * SizeStrip Component
 * 
 * Shows the icon at multiple sizes in a horizontal strip.
 * Clicking a size updates the primary preview.
 * All icons animate together on hover.
 */
export function SizeStrip({
    parsedSVG,
    selectedSize,
    onSizeChange,
    isAnimating = false,
    strokeColor = 'currentColor',
    strokeWidth = 2,
}: SizeStripProps) {
    return (
        <div className="size-strip">
            <span className="size-strip-label">Size</span>
            <div className="size-strip-items">
                {ICON_SIZES.map((size) => (
                    <button
                        key={size}
                        className={`size-strip-item ${selectedSize === size ? 'size-strip-item--selected' : ''}`}
                        onClick={() => onSizeChange(size)}
                        title={`${size}px`}
                    >
                        {/* Icon Preview at this size */}
                        <div
                            className="size-strip-icon"
                            style={{ width: size, height: size }}
                        >
                            <motion.svg
                                viewBox={parsedSVG.viewBox}
                                width={size}
                                height={size}
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ overflow: 'visible' }}
                            >
                                {parsedSVG.paths.map((path) => {
                                    if (!path.visible) return null;

                                    const fill = path.originalFill && path.originalFill !== 'none'
                                        ? path.originalFill
                                        : 'none';
                                    const stroke = path.originalStroke || strokeColor;
                                    const sw = parseFloat(path.originalStrokeWidth || String(strokeWidth)) || strokeWidth;

                                    return (
                                        <motion.path
                                            key={path.id}
                                            d={path.d}
                                            fill={fill}
                                            stroke={stroke}
                                            strokeWidth={sw}
                                            transform={path.transform || undefined}
                                            initial={{ pathLength: isAnimating ? 0 : 1 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{
                                                duration: 0.4,
                                                ease: 'linear',
                                            }}
                                        />
                                    );
                                })}
                            </motion.svg>
                        </div>

                        {/* Size Label */}
                        <span className="size-strip-size">{size}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default SizeStrip;
