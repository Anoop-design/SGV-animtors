"use client";

import React, { forwardRef, useImperativeHandle, useState } from "react";
import { motion } from "framer-motion";

// =============================================================================
// ANIMATED LOGO COMPONENT
// Wiggle animation triggered on hover
// Uses currentColor for light/dark mode support
// Exact match to exported animation code
// =============================================================================

export interface AnimatedLogoProps {
    /** Width of the icon in pixels */
    size?: number;
    /** Icon color - defaults to currentColor for theme support */
    color?: string;
    /** Animation duration in milliseconds */
    duration?: number;
    /** Additional CSS class name */
    className?: string;
}

export interface AnimatedLogoRef {
    /** Start the animation */
    animate: () => void;
    /** Reset to initial state */
    reset: () => void;
}

export const AnimatedLogo = forwardRef<AnimatedLogoRef, AnimatedLogoProps>(
    (
        {
            size = 100,
            color = "currentColor", // Uses currentColor for light/dark mode support
            duration = 600,
            className,
        },
        ref
    ) => {
        const [isAnimating, setIsAnimating] = useState(false);
        const speedMultiplier = duration / 600;

        const fill = "none";
        const stroke = color;

        // Expose imperative methods
        useImperativeHandle(ref, () => ({
            animate: () => setIsAnimating(true),
            reset: () => setIsAnimating(false),
        }));

        // Event handlers for hover trigger
        const handleHover = () => {
            if (!isAnimating) {
                setIsAnimating(true);
            }
        };

        const handleHoverEnd = () => {
            setIsAnimating(false);
        };

        return (
            <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 526 526"
                width={size}
                height={size}
                fill="none"
                className={className}
                onMouseEnter={handleHover}
                onMouseLeave={handleHoverEnd}
                style={{ cursor: "pointer", transformOrigin: "center" }}
            >
                {/* X - first stroke */}
                <motion.path
                    d="M143.377 326.582L35.2275 187.329"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={31.235}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ rotate: 0, opacity: 1 }}
                    animate={isAnimating ? { rotate: [0, -12, 12, -12, 0], opacity: 1 } : { rotate: 0, opacity: 1 }}
                    transition={{
                        duration: duration / 1000,
                        delay: 0.000 * speedMultiplier,
                        ease: "easeOut"
                    }}
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                />
                {/* X - second stroke */}
                <motion.path
                    d="M35.2275 326.582L143.376 187.329"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={31.235}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ rotate: 0, opacity: 1 }}
                    animate={isAnimating ? { rotate: [0, -12, 12, -12, 0], opacity: 1 } : { rotate: 0, opacity: 1 }}
                    transition={{
                        duration: duration / 1000,
                        delay: 0.050 * speedMultiplier,
                        ease: "easeOut"
                    }}
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                />
                {/* i - stem */}
                <motion.path
                    d="M187.778 326.406V286.701"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={25.8657}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ rotate: 0, opacity: 1 }}
                    animate={isAnimating ? { rotate: [0, -12, 12, -12, 0], opacity: 1 } : { rotate: 0, opacity: 1 }}
                    transition={{
                        duration: duration / 1000,
                        delay: 0.100 * speedMultiplier,
                        ease: "easeOut"
                    }}
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                />
                {/* i - dot */}
                <motion.path
                    d="M186.243 251.436H187.746"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={26.4296}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ rotate: 0, opacity: 1 }}
                    animate={isAnimating ? { rotate: [0, -12, 12, -12, 0], opacity: 1 } : { rotate: 0, opacity: 1 }}
                    transition={{
                        duration: duration / 1000,
                        delay: 0.150 * speedMultiplier,
                        ease: "easeOut"
                    }}
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                />
                {/* C */}
                <motion.path
                    d="M243.211 286.187C252.998 286.187 259.647 290.799 261.821 295.474L261.844 295.524L261.869 295.575C262.332 296.525 262.521 297.399 262.521 298.254C262.521 298.361 262.511 298.434 262.502 298.48C262.399 298.532 262.138 298.633 261.624 298.633C260.919 298.633 260.612 298.56 260.516 298.53C260.428 298.457 260.116 298.163 259.569 297.279H259.57C257.775 294.36 255.674 291.67 252.92 289.734C250.012 287.689 246.766 286.754 243.211 286.754C237.66 286.754 232.868 289.215 229.668 293.627C226.625 297.824 225.323 303.334 225.323 309.282C225.323 315.217 226.608 320.744 229.642 324.963C232.838 329.409 237.647 331.904 243.259 331.904C246.546 331.904 249.668 331.095 252.484 329.26C255.223 327.476 257.302 324.961 258.969 322.125C259.365 321.458 259.668 321.052 259.884 320.805C259.989 320.686 260.066 320.613 260.114 320.571C260.16 320.53 260.185 320.515 260.189 320.512C260.192 320.51 260.193 320.51 260.197 320.508C260.202 320.506 260.23 320.495 260.292 320.481C260.422 320.45 260.707 320.404 261.244 320.404C261.83 320.404 262.048 320.592 262.082 320.625C262.108 320.65 262.127 320.676 262.142 320.712C262.157 320.748 262.189 320.842 262.189 321.019C262.189 321.982 261.903 323.061 261.323 324.027L261.288 324.085C258.749 328.42 252.485 332.471 243.211 332.471C235.438 332.471 229.959 330.138 226.418 326.539C222.865 322.926 220.544 317.303 220.543 309.33C220.543 301.329 222.867 295.708 226.416 292.104C229.952 288.512 235.431 286.187 243.211 286.187Z"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={12.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ rotate: 0, opacity: 1 }}
                    animate={isAnimating ? { rotate: [0, -12, 12, -12, 0], opacity: 1 } : { rotate: 0, opacity: 1 }}
                    transition={{
                        duration: duration / 1000,
                        delay: 0.200 * speedMultiplier,
                        ease: "easeOut"
                    }}
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                />
                {/* O - outer */}
                <motion.path
                    d="M313.856 286.187C321.544 286.187 327.173 288.559 330.866 292.248C334.558 295.935 336.951 301.573 336.951 309.33C336.951 317.086 334.558 322.724 330.866 326.411C327.173 330.099 321.544 332.471 313.856 332.471C306.139 332.471 300.499 330.097 296.802 326.409C293.107 322.722 290.714 317.086 290.714 309.33C290.714 301.58 293.115 295.942 296.818 292.252C300.524 288.559 306.166 286.187 313.856 286.187Z"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={12.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ rotate: 0, opacity: 1 }}
                    animate={isAnimating ? { rotate: [0, -12, 12, -12, 0], opacity: 1 } : { rotate: 0, opacity: 1 }}
                    transition={{
                        duration: duration / 1000,
                        delay: 0.250 * speedMultiplier,
                        ease: "easeOut"
                    }}
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                />
                {/* O - inner */}
                <motion.path
                    d="M313.856 286.944C308.23 286.944 303.377 289.459 300.101 293.782C296.939 297.953 295.493 303.437 295.493 309.33C295.493 315.208 296.921 320.693 300.077 324.87C303.355 329.206 308.215 331.714 313.856 331.714C319.497 331.714 324.357 329.206 327.634 324.87C330.791 320.693 332.218 315.208 332.218 309.33C332.218 303.438 330.773 297.954 327.612 293.783C324.335 289.459 319.482 286.944 313.856 286.944Z"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={12.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ rotate: 0, opacity: 1 }}
                    animate={isAnimating ? { rotate: [0, -12, 12, -12, 0], opacity: 1 } : { rotate: 0, opacity: 1 }}
                    transition={{
                        duration: duration / 1000,
                        delay: 0.300 * speedMultiplier,
                        ease: "easeOut"
                    }}
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                />
                {/* N */}
                <motion.path
                    d="M407.836 286.139C408.435 286.139 408.785 286.231 408.952 286.294C409.104 286.352 409.14 286.395 409.141 286.396C409.146 286.401 409.219 286.476 409.301 286.712C409.389 286.965 409.49 287.417 409.49 288.126V330.673C409.49 331.321 409.397 331.732 409.318 331.957C409.279 332.068 409.242 332.136 409.22 332.172C409.199 332.208 409.185 332.223 409.182 332.226C409.179 332.229 409.176 332.233 409.164 332.241C409.153 332.248 409.12 332.268 409.056 332.292C408.928 332.341 408.636 332.423 408.12 332.423C407.25 332.423 406.907 332.28 406.704 332.17C406.438 332.026 405.878 331.636 404.98 330.444L404.975 330.438L404.971 330.433L384.762 303.741L382.902 301.283H373.287V330.436C373.287 331.146 373.185 331.597 373.098 331.847C373.016 332.08 372.945 332.152 372.941 332.157C372.94 332.157 372.902 332.203 372.741 332.263C372.565 332.329 372.202 332.423 371.585 332.423C370.978 332.423 370.607 332.33 370.413 332.257C370.233 332.19 370.171 332.13 370.152 332.11C370.131 332.089 370.054 332.006 369.972 331.778C369.885 331.537 369.786 331.107 369.786 330.436V287.984C369.786 287.358 369.88 286.954 369.962 286.725C370.041 286.506 370.115 286.426 370.134 286.406C370.151 286.388 370.2 286.339 370.344 286.284C370.5 286.224 370.816 286.139 371.347 286.139C372.211 286.139 372.531 286.282 372.723 286.387C373.003 286.541 373.573 286.951 374.533 288.179L394.528 314.412L396.388 316.854H405.99V288.126C405.99 287.456 406.089 287.029 406.175 286.791C406.256 286.565 406.332 286.484 406.353 286.463C406.372 286.444 406.436 286.38 406.625 286.31C406.828 286.235 407.212 286.139 407.836 286.139Z"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={12.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ rotate: 0, opacity: 1 }}
                    animate={isAnimating ? { rotate: [0, -12, 12, -12, 0], opacity: 1 } : { rotate: 0, opacity: 1 }}
                    transition={{
                        duration: duration / 1000,
                        delay: 0.350 * speedMultiplier,
                        ease: "easeOut"
                    }}
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                />
                {/* S - part 1 */}
                <motion.path
                    d="M448.274 325.231C448.448 325.231 448.528 325.247 448.548 325.251C448.563 325.255 448.581 325.258 448.622 325.278C448.729 325.329 449.04 325.505 449.699 326.105C452.926 329.408 457.13 331.606 461.906 332.341C458.205 332.055 455.139 331.309 452.817 330.293C449.887 329.012 448.608 327.534 448.129 326.435C447.925 325.783 447.895 325.448 447.895 325.326C447.895 325.301 447.896 325.278 447.897 325.257C447.989 325.243 448.113 325.231 448.274 325.231Z"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={12.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ rotate: 0, opacity: 1 }}
                    animate={isAnimating ? { rotate: [0, -12, 12, -12, 0], opacity: 1 } : { rotate: 0, opacity: 1 }}
                    transition={{
                        duration: duration / 1000,
                        delay: 0.400 * speedMultiplier,
                        ease: "easeOut"
                    }}
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                />
                {/* S - part 2 */}
                <motion.path
                    d="M460.815 286.517C459.419 286.879 458.069 287.432 456.839 288.227C454.146 289.968 452.14 292.856 452.017 296.525L452.011 296.882L452.016 297.191C452.06 298.736 452.445 300.337 453.328 301.843C454.252 303.418 455.521 304.549 456.805 305.36C459.182 306.861 462.194 307.624 465.123 308.145L465.156 308.151L465.191 308.157L473.121 309.478C478.133 310.339 480.88 311.782 482.358 313.238C483.663 314.523 484.572 316.399 484.573 319.741C484.573 323.502 483.049 326.405 480.174 328.548C477.907 330.238 474.597 331.584 470.22 332.163C471.897 331.82 473.496 331.268 474.929 330.449C477.808 328.803 480.361 325.793 480.361 321.586C480.361 320.048 480.039 318.306 479.032 316.634C478.043 314.991 476.674 313.886 475.352 313.131C472.979 311.777 469.863 311.075 466.734 310.514L459.069 309.142L459.026 309.134L458.198 308.98C454.162 308.168 451.61 306.737 450.094 305.205C448.579 303.673 447.657 301.608 447.657 298.633C447.657 294.952 449.192 292.08 451.968 289.962C454.086 288.346 457.07 287.086 460.815 286.517Z"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={12.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ rotate: 0, opacity: 1 }}
                    animate={isAnimating ? { rotate: [0, -12, 12, -12, 0], opacity: 1 } : { rotate: 0, opacity: 1 }}
                    transition={{
                        duration: duration / 1000,
                        delay: 0.450 * speedMultiplier,
                        ease: "easeOut"
                    }}
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                />
                {/* S - part 3 */}
                <motion.path
                    d="M469.987 286.46C472.844 286.812 475.227 287.482 477.078 288.342C479.854 289.633 481.057 291.142 481.494 292.338L481.537 292.456L481.57 292.536C481.575 292.57 481.587 292.667 481.589 292.856C481.49 292.881 481.335 292.907 481.116 292.907C480.404 292.907 480.147 292.813 480.046 292.772C479.931 292.725 479.636 292.585 479.055 292.059C477.314 290.237 475.388 288.651 473.07 287.552C472.052 287.07 471.025 286.714 469.987 286.46Z"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={12.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ rotate: 0, opacity: 1 }}
                    animate={isAnimating ? { rotate: [0, -12, 12, -12, 0], opacity: 1 } : { rotate: 0, opacity: 1 }}
                    transition={{
                        duration: duration / 1000,
                        delay: 0.500 * speedMultiplier,
                        ease: "easeOut"
                    }}
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                />
            </motion.svg>
        );
    }
);

AnimatedLogo.displayName = "AnimatedLogo";

export default AnimatedLogo;
