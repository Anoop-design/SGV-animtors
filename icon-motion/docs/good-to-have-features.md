# Good-to-Have Features

> Enhancement ideas for Icon Motion - features to implement after MVP.

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| 🔴 P0 | Should do soon after MVP |
| 🟡 P1 | Nice to have |
| 🟢 P2 | Future consideration |

---

## 1. Keyboard Shortcuts 🔴

Global shortcuts for power users.

### Shortcuts Map

| Shortcut | Action | Context |
|----------|--------|---------|
| `Space` | Play/Pause animation | Global |
| `R` | Replay animation | Global |
| `⌘/Ctrl + C` | Copy export code | When icon loaded |
| `⌘/Ctrl + V` | Paste SVG from clipboard | Global |
| `⌘/Ctrl + S` | Save current (to localStorage) | When icon loaded |
| `⌘/Ctrl + E` | Open export modal | When icon loaded |
| `1` | Select Draw preset | When icon loaded |
| `2` | Select Pop preset | When icon loaded |
| `3` | Select Bounce preset | When icon loaded |
| `4` | Select Wiggle preset | When icon loaded |
| `↑` / `↓` | Increase/decrease speed | When icon loaded |
| `[` / `]` | Decrease/increase duration | When icon loaded |
| `Esc` | Close modals/dropdowns | Global |
| `?` | Show shortcuts help | Global |

### Implementation

```typescript
// useKeyboardShortcuts.ts
import { useEffect } from 'react';

export const useKeyboardShortcuts = (handlers: {
  onPlay?: () => void;
  onReplay?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onPresetChange?: (index: number) => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlers.onPlay?.();
          break;
        case 'r':
          handlers.onReplay?.();
          break;
        case 'c':
          if (e.metaKey || e.ctrlKey) {
            handlers.onCopy?.();
          }
          break;
        case 'v':
          if (e.metaKey || e.ctrlKey) {
            handlers.onPaste?.();
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          handlers.onPresetChange?.(parseInt(e.key) - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};
```

### Shortcuts Help Modal

```
┌─────────────────────────────────────────────────────┐
│  Keyboard Shortcuts                           [×]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Playback                                           │
│  Space ................ Play / Pause               │
│  R .................... Replay                      │
│                                                     │
│  Presets                                            │
│  1-4 .................. Switch preset              │
│  ↑/↓ .................. Adjust speed               │
│                                                     │
│  Actions                                            │
│  ⌘C ................... Copy code                  │
│  ⌘V ................... Paste SVG                  │
│  ⌘E ................... Export                     │
│                                                     │
│  ? to toggle this help                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 2. Paste SVG from Clipboard 🔴

Allow users to paste SVG directly without file picker.

### User Flow

```
User copies SVG from Figma/browser
        ↓
⌘V or Ctrl+V anywhere in Icon Motion
        ↓
Detect clipboard content
        ↓
If valid SVG → Load into editor
If not SVG → Ignore (or show hint)
```

### Implementation

```typescript
// usePasteHandler.ts
import { useEffect } from 'react';

export const usePasteHandler = (onPaste: (svg: string) => void) => {
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Try to get SVG from clipboard
      const text = e.clipboardData?.getData('text/plain') || '';
      
      // Check if it's valid SVG
      if (isValidSVG(text)) {
        e.preventDefault();
        onPaste(text);
      }
      
      // Also check for image (SVG file)
      const items = e.clipboardData?.items;
      if (items) {
        for (const item of items) {
          if (item.type === 'image/svg+xml') {
            const blob = item.getAsFile();
            if (blob) {
              const text = await blob.text();
              onPaste(text);
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onPaste]);
};

const isValidSVG = (text: string): boolean => {
  const trimmed = text.trim();
  return trimmed.startsWith('<svg') || trimmed.startsWith('<?xml');
};
```

### UI Feedback

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   📁 Drop SVG here, or paste with ⌘V               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

When pasted successfully:
```
✅ SVG pasted from clipboard
```

---

## 3. Icon Search (Open Source Icons) 🔴

Search and load icons from popular open-source libraries.

### Supported Icon Libraries

| Library | Icons | License |
|---------|-------|---------|
| [Lucide](https://lucide.dev) | 1400+ | MIT |
| [Heroicons](https://heroicons.com) | 300+ | MIT |
| [Feather](https://feathericons.com) | 280+ | MIT |
| [Phosphor](https://phosphoricons.com) | 6000+ | MIT |
| [Tabler](https://tabler-icons.io) | 4000+ | MIT |

### UI Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🔍 Search icons...                                    [×]  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Library: [All ▼]  [Lucide] [Heroicons] [Feather] [Phosphor]       │
│                                                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │bell│ │home│ │user│ │mail│ │star│ │heart││gear│ │search│         │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘          │
│                                                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │menu│ │check││close│ │plus│ │minus││arrow││edit│ │trash│         │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘          │
│                                                                     │
│  Showing 16 of 1,429 icons                    [Load more ↓]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Search Behavior

| Input | Result |
|-------|--------|
| "bell" | Shows bell, bell-ring, bell-off, etc. |
| "arrow" | Shows all arrow variants |
| "social" | Shows twitter, facebook, linkedin, etc. |

### Implementation Options

#### Option A: Fetch from CDN (Recommended)

```typescript
// Fetch icons on-demand from jsDelivr/unpkg
const fetchLucideIcon = async (name: string): Promise<string> => {
  const url = `https://unpkg.com/lucide-static@latest/icons/${name}.svg`;
  const response = await fetch(url);
  return response.text();
};
```

**Pros:** No build-time bundling, always up-to-date
**Cons:** Requires network, slight latency

#### Option B: Pre-bundled Index

```typescript
// Bundle icon metadata (name, tags) at build time
// Fetch actual SVG on demand
const iconIndex = [
  { name: 'bell', tags: ['notification', 'alert', 'ring'] },
  { name: 'home', tags: ['house', 'building', 'main'] },
  // ... 1400+ entries
];
```

**Pros:** Instant search, smart tags
**Cons:** Larger initial bundle (~50KB for index)

#### Option C: API Endpoint

```typescript
// Backend search API
const searchIcons = async (query: string): Promise<Icon[]> => {
  const res = await fetch(`/api/icons/search?q=${query}`);
  return res.json();
};
```

**Pros:** Fastest search, fuzzy matching
**Cons:** Requires backend

### For MVP: Option A + Local index of popular 100 icons

```typescript
// Popular icons pre-loaded for instant access
const POPULAR_ICONS = [
  'bell', 'home', 'user', 'mail', 'star', 'heart', 
  'settings', 'search', 'menu', 'check', 'x', 'plus',
  'minus', 'arrow-right', 'arrow-left', 'arrow-up', 
  'arrow-down', 'edit', 'trash', 'copy', 'download',
  'upload', 'share', 'link', 'eye', 'eye-off',
  // ... 100 most common icons
];
```

### Icon Card Component

```
┌───────────────┐
│   ┌───────┐   │
│   │  SVG  │   │  ← Icon preview
│   │       │   │
│   └───────┘   │
│               │
│    bell       │  ← Icon name
│    Lucide     │  ← Source library
└───────────────┘
```

**Click**: Load into editor
**Hover**: Show preview animation (if already animated)

---

## 4. Sample Icons (Quick Start) 🔴

Pre-loaded icons for immediate testing.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  📁 Drop SVG here, paste ⌘V, or search...                          │
│                                                                     │
│  ── Try with samples ──                                            │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                        │
│  │ 🔔 │ │ ⚙️ │ │ ❤️ │ │ 📧 │ │ 🏠 │ │ 🔍 │                        │
│  │bell│ │gear│ │heart│ │mail│ │home│ │search│                       │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

One-click to load sample icon + apply Draw preset.

---

## 5. More Features (Lower Priority)

### Shareable Preview Links 🟡

```
https://iconmotion.app/preview/abc123
```
- Generate unique link
- Anyone can view animation
- Copy code from shared link
- No account required

### Export as GIF/Video 🟡

For portfolios, Dribbble, presentations:
```
Export as: [React] [CSS] [GIF] [MP4] [WebP]
```

### Batch Processing 🟢

Upload multiple SVGs, apply same animation, export all.

### Figma Plugin 🟢

Export animated icons directly from Figma.

### CLI Tool 🟢

```bash
npx iconmotion animate icon.svg --preset draw -o AnimatedIcon.tsx
```

### Custom Preset Saving 🟢

Save your own animation presets for reuse.

---

## Implementation Order

| Phase | Features |
|-------|----------|
| **MVP** | Core animation + export |
| **Post-MVP 1** | Keyboard shortcuts, Paste SVG |
| **Post-MVP 2** | Icon search, Sample icons |
| **v1.1** | Shareable links, GIF export |
| **v2.0** | Batch, Figma plugin, CLI |

---

*Document Version: 1.0*  
*Created: December 20, 2024*
