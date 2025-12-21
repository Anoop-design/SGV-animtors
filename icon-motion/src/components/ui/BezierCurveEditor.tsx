'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import '@/styles.css';

// =============================================================================
// BEZIER CURVE EDITOR
// Interactive SVG-based cubic bezier curve editor with draggable control points
// =============================================================================

interface BezierCurveEditorProps {
    value: [number, number, number, number]; // [x1, y1, x2, y2]
    onChange: (value: [number, number, number, number]) => void;
    width?: number;
    height?: number;
}

export const BezierCurveEditor: React.FC<BezierCurveEditorProps> = ({
    value,
    onChange,
    width = 280,
    height = 180,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragging, setDragging] = useState<'p1' | 'p2' | null>(null);

    // Padding for the curve area
    const padding = 20;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    // Convert bezier coords (0-1) to SVG coords
    const toSVG = (x: number, y: number) => ({
        x: padding + x * innerWidth,
        y: padding + (1 - y) * innerHeight, // Flip Y axis
    });

    // Convert SVG coords to bezier coords (0-1)
    const toBezier = (svgX: number, svgY: number) => ({
        x: Math.max(0, Math.min(1, (svgX - padding) / innerWidth)),
        y: Math.max(0, Math.min(1, 1 - (svgY - padding) / innerHeight)),
    });

    // Control points in SVG coords
    const p0 = toSVG(0, 0); // Start point (fixed)
    const p1 = toSVG(value[0], value[1]); // First control point
    const p2 = toSVG(value[2], value[3]); // Second control point
    const p3 = toSVG(1, 1); // End point (fixed)

    // Generate bezier path
    const curvePath = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

    // Handle mouse/touch events
    const handleMouseDown = (point: 'p1' | 'p2') => (e: React.MouseEvent) => {
        e.preventDefault();
        setDragging(point);
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!dragging || !svgRef.current) return;

            const rect = svgRef.current.getBoundingClientRect();
            const svgX = e.clientX - rect.left;
            const svgY = e.clientY - rect.top;
            const { x, y } = toBezier(svgX, svgY);

            const newValue: [number, number, number, number] = [...value];
            if (dragging === 'p1') {
                newValue[0] = x;
                newValue[1] = y;
            } else {
                newValue[2] = x;
                newValue[3] = y;
            }
            onChange(newValue);
        },
        [dragging, value, onChange]
    );

    const handleMouseUp = useCallback(() => {
        setDragging(null);
    }, []);

    // Add/remove global event listeners for dragging
    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, handleMouseMove, handleMouseUp]);

    return (
        <div className="bezier-curve-editor">
            <svg
                ref={svgRef}
                width={width}
                height={height}
                className="bezier-curve-svg"
            >
                {/* Background */}
                <rect
                    x={padding}
                    y={padding}
                    width={innerWidth}
                    height={innerHeight}
                    fill="var(--bg-input)"
                    rx="8"
                />

                {/* Handle lines from endpoints to control points - more visible */}
                <line
                    x1={p0.x}
                    y1={p0.y}
                    x2={p1.x}
                    y2={p1.y}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <line
                    x1={p3.x}
                    y1={p3.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                />

                {/* The bezier curve - thicker for visibility */}
                <path
                    d={curvePath}
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />

                {/* Start point (fixed) - gray */}
                <circle
                    cx={p0.x}
                    cy={p0.y}
                    r="7"
                    fill="#9ca3af"
                    className="bezier-endpoint"
                />

                {/* End point (fixed) - gray */}
                <circle
                    cx={p3.x}
                    cy={p3.y}
                    r="7"
                    fill="#9ca3af"
                    className="bezier-endpoint"
                />

                {/* Control point 1 (draggable) - blue, larger */}
                <circle
                    cx={p1.x}
                    cy={p1.y}
                    r="10"
                    fill="#3b82f6"
                    className="bezier-control-point"
                    onMouseDown={handleMouseDown('p1')}
                    style={{ cursor: dragging === 'p1' ? 'grabbing' : 'grab' }}
                />

                {/* Control point 2 (draggable) - blue, larger */}
                <circle
                    cx={p2.x}
                    cy={p2.y}
                    r="10"
                    fill="#3b82f6"
                    className="bezier-control-point"
                    onMouseDown={handleMouseDown('p2')}
                    style={{ cursor: dragging === 'p2' ? 'grabbing' : 'grab' }}
                />
            </svg>
        </div>
    );
};

export default BezierCurveEditor;
