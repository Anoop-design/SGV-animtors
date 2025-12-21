'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface EasingEditorProps {
    value: string; // e.g., "0.68, -0.55, 0.27, 1.55"
    onChange: (value: string) => void;
    onClose?: () => void;
}

// Common easing presets for quick selection
const EASING_PRESETS = [
    { name: 'Bounce', value: '0.68, -0.55, 0.27, 1.55' },
    { name: 'Elastic', value: '0.68, -0.6, 0.32, 1.6' },
    { name: 'Smooth', value: '0.4, 0, 0.2, 1' },
    { name: 'Sharp', value: '0.4, 0, 0.6, 1' },
    { name: 'Anticipate', value: '0.36, 0, 0.66, -0.56' },
    { name: 'Overshoot', value: '0.34, 1.56, 0.64, 1' },
];

/**
 * EasingEditor - Visual cubic-bezier curve editor
 * 
 * Features:
 * - Draggable control points (P1, P2)
 * - Live preview animation ball
 * - Preset quick-select buttons
 * - Real-time value output
 */
export const EasingEditor: React.FC<EasingEditorProps> = ({ value, onChange, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | undefined>(undefined);

    // Parse initial values
    const parseValue = (v: string): [number, number, number, number] => {
        const parts = v.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 4 && parts.every(n => !isNaN(n))) {
            return parts as [number, number, number, number];
        }
        return [0.25, 0.1, 0.25, 1]; // Default
    };

    const [bezier, setBezier] = useState<[number, number, number, number]>(parseValue(value));
    const [dragging, setDragging] = useState<'p1' | 'p2' | null>(null);
    const [animProgress, setAnimProgress] = useState(0);

    // Canvas dimensions
    const WIDTH = 200;
    const HEIGHT = 200;
    const PADDING = 20;

    // Convert bezier coords to canvas coords
    const toCanvas = (x: number, y: number): [number, number] => {
        // Y is inverted (0 at bottom, 1 at top)
        // X and Y can exceed 0-1 range for bounce effects
        const cx = PADDING + x * (WIDTH - 2 * PADDING);
        const cy = HEIGHT - PADDING - y * (HEIGHT - 2 * PADDING);
        return [cx, cy];
    };

    // Convert canvas coords to bezier coords
    const fromCanvas = (cx: number, cy: number): [number, number] => {
        const x = (cx - PADDING) / (WIDTH - 2 * PADDING);
        const y = (HEIGHT - PADDING - cy) / (HEIGHT - 2 * PADDING);
        return [x, y];
    };

    // Draw the curve
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // Draw grid
        ctx.strokeStyle = 'var(--border-default)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);

        // Horizontal lines
        for (let i = 0; i <= 4; i++) {
            const y = PADDING + (i / 4) * (HEIGHT - 2 * PADDING);
            ctx.beginPath();
            ctx.moveTo(PADDING, y);
            ctx.lineTo(WIDTH - PADDING, y);
            ctx.stroke();
        }

        // Vertical lines
        for (let i = 0; i <= 4; i++) {
            const x = PADDING + (i / 4) * (WIDTH - 2 * PADDING);
            ctx.beginPath();
            ctx.moveTo(x, PADDING);
            ctx.lineTo(x, HEIGHT - PADDING);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Draw diagonal reference line
        ctx.strokeStyle = 'var(--text-muted)';
        ctx.lineWidth = 1;
        const [x0, y0] = toCanvas(0, 0);
        const [x1, y1] = toCanvas(1, 1);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        // Draw bezier curve
        ctx.strokeStyle = 'var(--text-primary)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(...toCanvas(0, 0));

        // Draw curve using cubic bezier
        const [p1x, p1y, p2x, p2y] = bezier;
        ctx.bezierCurveTo(
            ...toCanvas(p1x, p1y),
            ...toCanvas(p2x, p2y),
            ...toCanvas(1, 1)
        );
        ctx.stroke();

        // Draw control lines
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        // P0 to P1
        ctx.beginPath();
        ctx.moveTo(...toCanvas(0, 0));
        ctx.lineTo(...toCanvas(p1x, p1y));
        ctx.stroke();

        // P3 to P2
        ctx.beginPath();
        ctx.moveTo(...toCanvas(1, 1));
        ctx.lineTo(...toCanvas(p2x, p2y));
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw control points
        const drawPoint = (x: number, y: number, isP1: boolean) => {
            const [cx, cy] = toCanvas(x, y);
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.fillStyle = isP1 ? '#3b82f6' : '#10b981';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        };

        drawPoint(p1x, p1y, true);
        drawPoint(p2x, p2y, false);

        // Draw start and end points
        ctx.beginPath();
        ctx.arc(...toCanvas(0, 0), 4, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(...toCanvas(1, 1), 4, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fill();
    }, [bezier]);

    // Draw on mount and bezier change
    useEffect(() => {
        draw();
    }, [draw]);

    // Animation loop for preview ball
    useEffect(() => {
        let startTime: number | null = null;
        const duration = 1500;

        const animate = (time: number) => {
            if (startTime === null) startTime = time;
            const elapsed = time - startTime;
            const t = Math.min(elapsed / duration, 1);

            setAnimProgress(t);

            if (t < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Restart after a pause
                setTimeout(() => {
                    startTime = null;
                    animationRef.current = requestAnimationFrame(animate);
                }, 500);
            }
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    // Calculate eased position for animation ball
    const cubicBezier = (t: number): number => {
        const [p1x, p1y, p2x, p2y] = bezier;
        // Approximate cubic bezier - find Y for given X (t)
        // Using binary search to find the t parameter that gives us x = linearT
        let low = 0, high = 1, mid = 0;
        for (let i = 0; i < 20; i++) {
            mid = (low + high) / 2;
            const x = 3 * (1 - mid) ** 2 * mid * p1x + 3 * (1 - mid) * mid ** 2 * p2x + mid ** 3;
            if (x < t) low = mid;
            else high = mid;
        }
        const y = 3 * (1 - mid) ** 2 * mid * p1y + 3 * (1 - mid) * mid ** 2 * p2y + mid ** 3;
        return y;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const [p1x, p1y] = toCanvas(bezier[0], bezier[1]);
        const [p2x, p2y] = toCanvas(bezier[2], bezier[3]);

        const dist1 = Math.hypot(x - p1x, y - p1y);
        const dist2 = Math.hypot(x - p2x, y - p2y);

        if (dist1 < 15) setDragging('p1');
        else if (dist2 < 15) setDragging('p2');
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!dragging) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const [bx, by] = fromCanvas(x, y);

        // Clamp X to 0-1, allow Y to go beyond for bounce effects
        const clampedX = Math.max(0, Math.min(1, bx));
        const clampedY = Math.max(-1, Math.min(2, by));

        setBezier(prev => {
            if (dragging === 'p1') return [clampedX, clampedY, prev[2], prev[3]];
            return [prev[0], prev[1], clampedX, clampedY];
        });
    };

    const handleMouseUp = () => {
        if (dragging) {
            setDragging(null);
            onChange(bezier.map(n => n.toFixed(2)).join(', '));
        }
    };

    const handlePresetClick = (preset: typeof EASING_PRESETS[0]) => {
        const newBezier = parseValue(preset.value);
        setBezier(newBezier);
        onChange(preset.value);
    };

    const easedProgress = cubicBezier(animProgress);

    return (
        <div className="easing-editor" ref={containerRef}>
            <div className="easing-editor-header">
                <span className="easing-editor-title">Easing Curve</span>
                {onClose && (
                    <button className="easing-editor-close" onClick={onClose}>×</button>
                )}
            </div>

            <div className="easing-editor-content">
                {/* Canvas */}
                <div className="easing-editor-canvas-container">
                    <canvas
                        ref={canvasRef}
                        width={WIDTH}
                        height={HEIGHT}
                        className="easing-editor-canvas"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />

                    {/* Animation preview ball */}
                    <div
                        className="easing-editor-ball"
                        style={{
                            left: `${20 + animProgress * 160}px`,
                            top: `${180 - easedProgress * 160}px`,
                        }}
                    />
                </div>

                {/* Value display */}
                <div className="easing-editor-value">
                    <code>cubic-bezier({bezier.map(n => n.toFixed(2)).join(', ')})</code>
                </div>

                {/* Presets */}
                <div className="easing-editor-presets">
                    {EASING_PRESETS.map(preset => (
                        <button
                            key={preset.name}
                            className="easing-editor-preset-btn"
                            onClick={() => handlePresetClick(preset)}
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
