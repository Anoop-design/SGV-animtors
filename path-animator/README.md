# Path Animator

Path Animator is a developer tool to generate "draw-on" stroke animations for SVGs. It runs entirely in the browser using the SVG `stroke-dasharray` and `stroke-dashoffset` technique.

## Features

- **Input**: Paste raw SVG code or upload files.
- **Parsing**: Automatically detects shapes (rect, circle, line, etc.) and converts them to paths where necessary.
- **Preview**: Real-time preview with adjustable background, duration, easing, and stagger effects.
- **Controls**: 
  - Fill handling (fade-in, preserve, none)
  - Stroke overrides (color, width)
  - Animation looping
- **Export**: Get optimized CSS or React components.

## How it works

1. **Parsing**: The app parses the input SVG string using the browser's `DOMParser`.
2. **Measurement**: It renders the paths in the DOM to calculate `path.getTotalLength()` for every shape.
3. **Animation**:
   - Sets `stroke-dasharray` to the path length.
   - Sets `stroke-dashoffset` to the path length (hiding the stroke).
   - Animates `stroke-dashoffset` to 0 using CSS Keyframes.

## Limitations (v1)

- Complex `defs`, `masks`, and `clip-paths` are ignored to simplify the animation engine.
- `transform` attributes on groups (`<g>`) are not flattened, so animations might behave unexpectedly if the SVG relies heavily on nested transforms.
- Only standard SVG shapes (`path`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`) are supported.

## Tech Stack

- React 18
- Tailwind CSS
- TypeScript
- Lucide React Icons
