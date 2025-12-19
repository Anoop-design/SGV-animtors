import { ParsedPath, ParsedSVG } from "../types";
import { generateId } from "./utils";

// Helper to convert basic shapes to path d attribute
function shapeToPath(el: Element): string | null {
  const tag = el.tagName.toLowerCase();

  const n = (attr: string) => parseFloat(el.getAttribute(attr) || "0");

  switch (tag) {
    case 'rect': {
      const x = n('x'), y = n('y'), w = n('width'), h = n('height');
      const rx = n('rx') || n('ry');
      // Simple rect without rounded corners for MVP robust parsing
      // Proper rounded rects are complex to manually compute without a library
      // We will fallback to a standard rectangle if rx/ry exist but basic parsing needed
      // If we wanted perfect rounded rects, we'd need full arc commands.
      return `M${x},${y} h${w} v${h} h-${w} Z`;
    }
    case 'circle': {
      const cx = n('cx'), cy = n('cy'), r = n('r');
      // Two arcs to make a circle
      return `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 -${r * 2},0`;
    }
    case 'ellipse': {
      const cx = n('cx'), cy = n('cy'), rx = n('rx'), ry = n('ry');
      return `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 -${rx * 2},0`;
    }
    case 'line': {
      const x1 = n('x1'), y1 = n('y1'), x2 = n('x2'), y2 = n('y2');
      return `M${x1},${y1} L${x2},${y2}`;
    }
    case 'polyline':
    case 'polygon': {
      const points = el.getAttribute('points');
      if (!points) return null;
      const pts = points.trim().split(/\s+|,/).filter(p => p !== '');
      if (pts.length < 2) return null;

      let d = `M${pts[0]} ${pts[1]}`;
      for (let i = 2; i < pts.length; i += 2) {
        d += ` L${pts[i]} ${pts[i + 1]}`;
      }
      if (tag === 'polygon') d += ' Z';
      return d;
    }
    case 'path':
      return el.getAttribute('d');
    default:
      return null;
  }
}

export function parseSVG(svgString: string): ParsedSVG {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svgEl = doc.querySelector("svg");
  const warnings: string[] = [];
  const paths: ParsedPath[] = [];

  if (!svgEl) {
    return { viewBox: "0 0 24 24", paths: [], warnings: ["No <svg> element found."] };
  }

  // ViewBox Inference
  let viewBox = svgEl.getAttribute("viewBox");
  if (!viewBox) {
    const w = svgEl.getAttribute("width");
    const h = svgEl.getAttribute("height");
    if (w && h) {
      // Basic heuristic: strip 'px' if present
      const wp = parseFloat(w);
      const hp = parseFloat(h);
      if (!isNaN(wp) && !isNaN(hp)) {
        viewBox = `0 0 ${wp} ${hp}`;
      } else {
        viewBox = "0 0 100 100";
        warnings.push("Could not determine viewBox from width/height. Defaulting to 0 0 100 100.");
      }
    } else {
      viewBox = "0 0 100 100";
      warnings.push("No viewBox or width/height found. Defaulting to 0 0 100 100.");
    }
  }

  // Split a path d attribute into multiple subpaths if it contains multiple M commands
  const splitPathIntoSubpaths = (d: string): string[] => {
    // Normalize the path - add space before M/m for easier splitting
    const normalized = d.replace(/([Mm])/g, ' $1').trim();

    // Split on M or m commands, keeping the command with each segment
    const segments = normalized.split(/(?=\s[Mm])/);

    // Clean up and filter out empty segments
    const subpaths = segments
      .map(s => s.trim())
      .filter(s => s.length > 0 && /^[Mm]/.test(s));

    // If there's only one subpath or the split failed, return original
    if (subpaths.length <= 1) {
      return [d];
    }

    return subpaths;
  };

  // Recursive extraction of shapes
  const extractShapes = (element: Element) => {
    // Skip defs, mask, clipPath, etc. for v1
    const tagName = element.tagName.toLowerCase();
    if (['defs', 'mask', 'clippath', 'style', 'script', 'title', 'desc'].includes(tagName)) return;

    // Convert basic shapes or use path
    const d = shapeToPath(element);

    if (d) {
      // Extract styles
      const fillAttr = element.getAttribute('fill');
      const strokeAttr = element.getAttribute('stroke');
      const strokeWidthAttr = element.getAttribute('stroke-width');
      const transformAttr = element.getAttribute('transform');

      // Determine if this is a stroke-based icon (should split) or fill-based (keep as one)
      // Split only if: has stroke attribute AND (fill is 'none' or not set, or stroke is explicitly set)
      const hasStroke = strokeAttr && strokeAttr !== 'none';
      const hasFill = fillAttr && fillAttr !== 'none';
      const isStrokeBasedIcon = hasStroke && !hasFill;

      // Only split into subpaths for stroke-based icons
      const subpaths = isStrokeBasedIcon ? splitPathIntoSubpaths(d) : [d];

      for (const subpath of subpaths) {
        paths.push({
          id: `path-${generateId()}`,
          d: subpath,
          originalFill: fillAttr !== 'none' ? (fillAttr || null) : null,
          originalStroke: strokeAttr !== 'none' ? (strokeAttr || null) : null,
          originalStrokeWidth: strokeWidthAttr || null,
          transform: transformAttr || null,
          length: 0, // Will be calculated in the component via ref
          visible: true
        });
      }
    }

    // Children
    Array.from(element.children).forEach(child => extractShapes(child));
  };

  extractShapes(svgEl);

  if (paths.length === 0) {
    warnings.push("No animatable shapes found.");
  }

  return {
    viewBox,
    width: svgEl.getAttribute("width") || undefined,
    height: svgEl.getAttribute("height") || undefined,
    paths,
    warnings
  };
}