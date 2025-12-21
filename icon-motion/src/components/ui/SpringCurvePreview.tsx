'use client';

import React, { useMemo } from 'react';
import '@/styles.css';

// =============================================================================
// SPRING CURVE PREVIEW
// SVG-based visualization of spring animation response curve
// =============================================================================

interface SpringCurvePreviewProps {
    stiffness: number;  // 50-1000
    damping: number;    // 5-50
    mass: number;       // 0.1-5
    width?: number;
    height?: number;
}

// Calculate spring animation curve points
// Uses simplified spring physics approximation
function calculateSpringCurve(
    stiffness: number,
    damping: number,
    mass: number,
    numPoints: number = 100
): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];

    // Spring physics parameters
    const omega0 = Math.sqrt(stiffness / mass); // Natural frequency
    const zeta = damping / (2 * Math.sqrt(stiffness * mass)); // Damping ratio

    // Calculate duration based on settling time (approximately 4/zeta*omega0 for underdamped)
    const duration = zeta < 1
        ? Math.min(4 / (zeta * omega0), 3) // Underdamped
        : Math.min(8 / omega0, 3); // Critically/overdamped

    for (let i = 0; i <= numPoints; i++) {
        const t = (i / numPoints) * duration;
        let y: number;

        if (zeta < 1) {
            // Underdamped oscillation
            const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
            y = 1 - Math.exp(-zeta * omega0 * t) *
                (Math.cos(omegaD * t) + (zeta * omega0 / omegaD) * Math.sin(omegaD * t));
        } else if (zeta === 1) {
            // Critically damped
            y = 1 - (1 + omega0 * t) * Math.exp(-omega0 * t);
        } else {
            // Overdamped
            const r1 = -omega0 * (zeta + Math.sqrt(zeta * zeta - 1));
            const r2 = -omega0 * (zeta - Math.sqrt(zeta * zeta - 1));
            const A1 = r2 / (r2 - r1);
            const A2 = -r1 / (r2 - r1);
            y = 1 - A1 * Math.exp(r1 * t) - A2 * Math.exp(r2 * t);
        }

        points.push({
            x: i / numPoints, // Normalized 0-1
            y: Math.max(0, Math.min(1.2, y)), // Allow slight overshoot
        });
    }

    return points;
}

export const SpringCurvePreview: React.FC<SpringCurvePreviewProps> = ({
    stiffness,
    damping,
    mass,
    width = 280,
    height = 180,
}) => {
    // Padding for the curve area
    const padding = 20;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    // Calculate curve points
    const curvePoints = useMemo(
        () => calculateSpringCurve(stiffness, damping, mass),
        [stiffness, damping, mass]
    );

    // Convert normalized coords to SVG coords
    const toSVG = (x: number, y: number) => ({
        x: padding + x * innerWidth,
        y: padding + (1 - y) * innerHeight * 0.8 + innerHeight * 0.1, // Scale to fit with overshoot
    });

    // Generate path
    const pathData = curvePoints
        .map((p, i) => {
            const svgPoint = toSVG(p.x, p.y);
            return i === 0 ? `M ${svgPoint.x} ${svgPoint.y}` : `L ${svgPoint.x} ${svgPoint.y}`;
        })
        .join(' ');

    return (
        <div className="spring-curve-preview">
            <svg width={width} height={height} className="spring-curve-svg">
                {/* Background */}
                <rect
                    x={padding}
                    y={padding}
                    width={innerWidth}
                    height={innerHeight}
                    fill="var(--bg-input)"
                    rx="8"
                />

                {/* Baseline at y=1 (target value) */}
                <line
                    x1={padding}
                    y1={toSVG(0, 1).y}
                    x2={padding + innerWidth}
                    y2={toSVG(0, 1).y}
                    stroke="var(--border-subtle)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                />

                {/* The spring curve */}
                <path
                    d={pathData}
                    fill="none"
                    stroke="var(--text-secondary)"
                    strokeWidth="2"
                />

                {/* Start point */}
                <circle
                    cx={toSVG(0, 0).x}
                    cy={toSVG(0, 0).y}
                    r="4"
                    fill="var(--text-muted)"
                />

                {/* End point */}
                <circle
                    cx={toSVG(1, curvePoints[curvePoints.length - 1]?.y ?? 1).x}
                    cy={toSVG(1, curvePoints[curvePoints.length - 1]?.y ?? 1).y}
                    r="4"
                    fill="var(--text-muted)"
                />
            </svg>
        </div>
    );
};

export default SpringCurvePreview;
