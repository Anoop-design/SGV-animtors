# Fix Animation Presets - Implementation Plan

This document outlines all identified issues with the current animation preset system and provides a phased implementation plan to fix them.

---

## Executive Summary

The animation preset system has **10 critical issues** that prevent presets from working correctly. The root causes are:

1. **Disconnected data flow** between `AnimationSettings`, `AnimationRecipe`, and `getPathVariants()`
2. **Timeline and Framer Motion are not synchronized** - they use different duration sources
3. **Animation replay logic is incomplete** - doesn't trigger on all relevant state changes

---

## Issues Identified

### Issue #1: Recipe Easing Never Synced from Settings
**Severity:** 🔴 Critical  
**Location:** `page.tsx` lines 142-155

**Problem:**
The `recipe.easing` property is never updated when the user changes the easing dropdown. The sync effect only updates `preset`, `duration`, and `stagger`:

```typescript
// Current code - MISSING easing sync
setRecipe(prev => ({
  ...prev,
  preset: presetToUse,
  duration: settings.duration,
  stagger: settings.staggerAmount,
  // ❌ Missing: easing: settings.easing
}));
```

**Impact:** User changes to easing are ignored. All animations use `DEFAULT_RECIPE.easing` ('easeOut').

---

### Issue #2: Initial Preset Value Mismatch
**Severity:** 🟡 Medium  
**Location:** `page.tsx` line 79, `types.ts`

**Problem:**
Three different initial values for the preset:
- `settings.transformPreset = null` (page.tsx initialization)
- `DEFAULT_RECIPE.preset = 'draw'` (types.ts)
- Sync effect converts `null` → `'none'`

**Impact:** On first load, the UI shows no selection, but `draw` animation plays. Confusing UX.

---

### Issue #3: No Preset Visually Selected Initially
**Severity:** 🟡 Medium  
**Location:** `TransformPanel.tsx` line 398

**Problem:**
```typescript
const isSelected = settings.transformPreset === preset.value;
// When settings.transformPreset is null, no button appears selected
```

**Impact:** Users don't see which preset is active.

---

### Issue #4: Sync Effect Only Runs When Preset Changes
**Severity:** 🔴 Critical  
**Location:** `page.tsx` lines 147-154

**Problem:**
```typescript
if (presetToUse !== recipe.preset) {  // ❌ Only syncs when preset CHANGES
  setRecipe(prev => ({...}))
}
```

When users change duration/stagger/easing **without changing the preset**, the recipe is NOT updated because the condition is false.

**Impact:** Timing changes (duration, stagger) are ignored after initial preset selection.

---

### Issue #5: No Intensity Control in UI
**Severity:** 🟡 Medium  
**Location:** `TransformPanel.tsx`, `getPathVariants()` line 65

**Problem:**
The wiggle animation uses `recipe.intensity`:
```typescript
const angle = 10 * recipe.intensity;
```
But there's no slider in the UI to control intensity.

**Impact:** Wiggle always uses default intensity (1). Users cannot customize wiggle strength.

---

### Issue #6: Trigger Mode Not Applied to Path Animations
**Severity:** 🔴 Critical  
**Location:** `Preview.tsx` lines 556-702

**Problem:**
Trigger mode is applied to parent wrapper, but paths always animate:
```typescript
// Wrapper responds to trigger
<motion.div
  whileHover={settings.trigger === 'hover' ? 'active' : undefined}
  whileTap={settings.trigger === 'click' ? 'active' : undefined}
>
  // But paths ALWAYS animate to 'play' on mount!
  <motion.path
    initial="idle"
    animate="play"  // ❌ Ignores trigger setting
  />
```

**Impact:** Hover and click triggers don't work. Animation always plays on load.

---

### Issue #7: Spring Easing Not Properly Converted
**Severity:** 🔴 Critical  
**Location:** `getPathVariants()` lines 26-30

**Problem:**
```typescript
const baseTransition = {
  duration: recipe.duration,
  ease: recipe.easing as Easing,  // ❌ 'spring' is not a valid Framer Motion ease!
  delay,
};
```

Spring physics requires `type: 'spring'` with `stiffness`/`damping`, not `ease: 'spring'`.

**Impact:** Spring easing is broken. Animations may fail or use wrong physics.

---

### Issue #8: Animation Inconsistent on Reload
**Severity:** 🔴 Critical  
**Location:** `Preview.tsx` lines 267-279

**Problem:**
Animation replay depends on `animationKey` changing, but this only happens in two cases:
1. When `parsedSVG.paths.length` changes (line 272)
2. When `recipe.preset` changes (line 279)

```typescript
// Only triggers on SVG change
useEffect(() => {
  setAnimationKey(prev => prev + 1);
}, [parsedSVG.paths.length]);

// Only triggers on preset change
useEffect(() => {
  setAnimationKey(prev => prev + 1);
}, [recipe.preset]);
```

On page reload:
- If the project is restored from IndexedDB with the same preset and SVG, `animationKey` stays at 0
- React may skip the initial animation if it considers the component "already rendered"
- Framer Motion's `initial="idle" animate="play"` may not fire consistently on hot reload

**Impact:** Animation sometimes doesn't play on page reload. Inconsistent UX.

---

### Issue #9: Timeline Not Synced with Framer Motion Animations
**Severity:** 🔴 Critical  
**Location:** `Preview.tsx` lines 239-311, 684-702

**Problem:**
There are **two separate animation systems** running independently:

1. **CSS Timeline System** (lines 281-311):
   - Uses `requestAnimationFrame` to track `currentTime`
   - Duration calculated from `settings.duration` and `settings.staggerAmount`
   - Drives the progress bar and timecode display

2. **Framer Motion System** (lines 684-702):
   - Uses `getPathVariants(recipe, ...)` for animation
   - Duration comes from `recipe.duration` and `recipe.stagger`
   - Completely independent of the timeline

```typescript
// Timeline uses SETTINGS duration
const totalDuration = useMemo(() => {
  // ...
  let duration = settings.duration;  // ❌ Uses settings!
  // ...
}, [parsedSVG, settings]);

// But motion.path uses RECIPE duration
<motion.path
  variants={getPathVariants(recipe, index)}  // ❌ Uses recipe!
/>
```

**Impact:**
- Timeline progress bar doesn't match actual animation
- Scrubbing the timeline has no effect on actual animation
- Duration changes in UI may not affect either system consistently

---

### Issue #10: Stroke Override Breaks Draw Animation
**Severity:** 🔴 Critical  
**Location:** `Preview.tsx` lines 598-610, 689-694

**Problem:**
When "Override" is enabled, the path stroke is set from `settings.strokeColor`:

```typescript
const strokeColor = settings.overrideColor 
  ? settings.strokeColor 
  : (path.originalStroke || 'currentColor');
```

The **Draw animation** uses `pathLength` which requires:
1. A visible stroke (not `none`)
2. `pathLength={1}` attribute on the path
3. Animation from `pathLength: 0` to `pathLength: 1`

But when `fill` is forced to `none` (line 600-602) and stroke is overridden:
```typescript
let fill = path.originalFill || 'currentColor';
if (settings.forceStroke || settings.fillMode === 'none') {
  fill = 'none';  // Removes fill
}
```

If the original SVG was a **fill-only icon** (no stroke):
- `path.originalStroke` is `null`
- When override is OFF: stroke becomes 'currentColor' (works)
- When override is ON with dark color: should work
- **BUT**: The path may not have stroke-dasharray support for the draw effect

Additionally, the `pathLength={1}` is hardcoded (line 694):
```typescript
<motion.path
  pathLength={1}  // Always 1, but draw animation needs to start at 0!
/>
```

Wait—actually `pathLength={1}` combined with variants should work. Let me check the actual issue...

The real problem: When override is enabled and settings change, `animationKey` doesn't increment, so the animation doesn't re-trigger.

```typescript
// animationKey only changes for preset/SVG changes
key={`${path.id}-${animationKey}`}
```

**Impact:** Changing stroke override doesn't replay the animation. Users have to manually click Replay.

---

## Architecture Diagram

### Current (Broken) Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          page.tsx                                   │
│  ┌──────────────────┐       ┌──────────────────┐                   │
│  │ settings         │       │ recipe           │                   │
│  │ ┌──────────────┐ │       │ ┌──────────────┐ │                   │
│  │ │transformPreset│─┼───?───│ │preset        │ │  ← Partially     │
│  │ │duration      │─┼───?───│ │duration      │ │    synced        │
│  │ │staggerAmount │─┼───?───│ │stagger       │ │                   │
│  │ │easing        │ │   ✗   │ │easing        │ │  ← NOT synced!   │
│  │ │trigger       │ │   ✗   │ │trigger       │ │  ← NOT synced!   │
│  │ └──────────────┘ │       │ └──────────────┘ │                   │
│  └──────────────────┘       └────────┬─────────┘                   │
└─────────────────────────────────────│───────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Preview.tsx                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ getPathVariants(recipe, index)                               │  │
│  │   - Uses recipe.easing (stale!)                              │  │
│  │   - Uses recipe.duration (sometimes stale!)                  │  │
│  │   - Ignores trigger mode                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  <motion.path initial="idle" animate="play" />                      │
│                         ↑                                           │
│                         Always plays! Trigger ignored.              │
└─────────────────────────────────────────────────────────────────────┘
```

### Proposed (Fixed) Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          page.tsx                                   │
│  ┌──────────────────┐                                              │
│  │ recipe (SINGLE   │  ← Unified source of truth                   │
│  │ SOURCE OF TRUTH) │                                              │
│  │ ┌──────────────┐ │                                              │
│  │ │preset        │ │  ← UI directly updates recipe                │
│  │ │duration      │ │                                              │
│  │ │easing        │ │                                              │
│  │ │stagger       │ │                                              │
│  │ │intensity     │ │                                              │
│  │ │trigger       │ │                                              │
│  │ │loop          │ │                                              │
│  │ └──────────────┘ │                                              │
│  └────────┬─────────┘                                              │
└───────────│─────────────────────────────────────────────────────────┘
            │
            ▼ Passed directly
┌─────────────────────────────────────────────────────────────────────┐
│                        Preview.tsx                                  │
│                                                                     │
│  getPathVariants(recipe, index)                                     │
│    - Handles all easing types including spring                      │
│    - Respects trigger mode                                          │
│                                                                     │
│  <motion.path                                                       │
│    initial="idle"                                                   │
│    animate={recipe.trigger === 'auto' ? 'play' : undefined}         │
│    whileHover={recipe.trigger === 'hover' ? 'play' : undefined}     │
│    whileTap={recipe.trigger === 'click' ? 'play' : undefined}       │
│  />                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Fix Data Synchronization (Priority: Critical)
**Estimated Time:** 1-2 hours

#### 1.1 Simplify to Single Source of Truth
Remove the dual `settings` ↔ `recipe` sync and make `recipe` the primary animation state.

**Files to modify:**
- `src/app/page.tsx`

**Changes:**
1. Remove the sync `useEffect` that copies settings to recipe
2. Create `updateRecipe` function similar to `updateSetting`
3. Pass `updateRecipe` to TransformPanel instead of `updateSetting` for animation properties

```typescript
// New: Direct recipe updates
const updateRecipe = <K extends keyof AnimationRecipe>(key: K, value: AnimationRecipe[K]) => {
  setRecipe(prev => ({ ...prev, [key]: value }));
};
```

#### 1.2 Update TransformPanel to Use Recipe Directly
**Files to modify:**
- `src/components/TransformPanel.tsx`

**Changes:**
1. Add `recipe` and `updateRecipe` props
2. Update Duration slider to call `updateRecipe('duration', val)`
3. Update Stagger slider to call `updateRecipe('stagger', val)`
4. Update Easing dropdown to call `updateRecipe('easing', val)`
5. Update Preset buttons to call `updateRecipe('preset', val)`

---

### Phase 2: Fix Trigger Mode (Priority: Critical)
**Estimated Time:** 1 hour

**Files to modify:**
- `src/components/Preview.tsx`

**Changes:**
1. Move trigger logic from wrapper `motion.div` to individual `motion.path` elements
2. Update animate prop based on trigger:

```typescript
<motion.path
  variants={getPathVariants(recipe, index)}
  initial="idle"
  animate={recipe.trigger === 'auto' ? 'play' : undefined}
  whileHover={recipe.trigger === 'hover' ? 'play' : undefined}
  whileTap={recipe.trigger === 'click' ? 'play' : undefined}
/>
```

3. Add cursor style for hover/click triggers:
```typescript
style={{
  cursor: recipe.trigger === 'hover' || recipe.trigger === 'click' ? 'pointer' : 'default'
}}
```

---

### Phase 3: Fix Spring Easing (Priority: Critical)
**Estimated Time:** 30 minutes

**Files to modify:**
- `src/components/Preview.tsx` - `getPathVariants()` function

**Changes:**
Update transition generation to handle spring separately:

```typescript
function getPathVariants(recipe: AnimationRecipe, pathIndex: number): Variants {
  const delay = pathIndex * recipe.stagger;
  
  // Generate transition based on easing type
  const getTransition = () => {
    if (recipe.easing === 'spring') {
      return {
        type: 'spring' as const,
        stiffness: 400,  // Could be made configurable
        damping: 15,
        delay,
      };
    }
    return {
      duration: recipe.duration,
      ease: recipe.easing as Easing,
      delay,
    };
  };

  const baseTransition = getTransition();
  // ... rest of function
}
```

---

### Phase 4: Add Intensity Control (Priority: Medium)
**Estimated Time:** 30 minutes

**Files to modify:**
- `src/components/TransformPanel.tsx`

**Changes:**
1. Add intensity slider to the Timing section (only shown when wiggle or bounce preset is selected)

```tsx
{(recipe.preset === 'wiggle' || recipe.preset === 'bounce') && (
  <div className="controls-field">
    <span className="controls-field-label">Intensity</span>
    <div className="controls-field-input-group">
      <NumberInput
        value={recipe.intensity}
        onChange={(val) => updateRecipe('intensity', val)}
        min={0.5} max={2} step={0.1}
      />
      <Slider
        min={0.5} max={2} step={0.1}
        value={recipe.intensity}
        onChange={(val) => updateRecipe('intensity', val)}
      />
    </div>
  </div>
)}
```

---

### Phase 5: Fix Initial State (Priority: Medium)
**Estimated Time:** 30 minutes

**Files to modify:**
- `src/types.ts`
- `src/app/page.tsx`

**Changes:**
1. Update `DEFAULT_RECIPE` to use `'none'` as initial preset:

```typescript
export const DEFAULT_RECIPE: AnimationRecipe = {
  preset: 'none',  // Changed from 'draw'
  duration: 0.6,
  easing: 'easeOut',
  intensity: 1,
  stagger: 0.15,
  loop: false,
  trigger: 'auto',
};
```

2. Or alternatively, set initial `settings.transformPreset` to `'draw'`:

```typescript
const [settings, setSettings] = useState<AnimationSettings>({
  // ...
  transformPreset: 'draw',  // Changed from null
});
```

Choose one approach based on desired UX (start with animation or no animation).

---

### Phase 6: Clean Up Legacy Code (Priority: Low)
**Estimated Time:** 1 hour

**Files to modify:**
- `src/app/page.tsx`
- `src/types.ts`

**Changes:**
1. Remove `settings.transformPreset` - no longer needed with recipe as source of truth
2. Remove the sync useEffect entirely
3. Consider removing or deprecating AnimationSettings fields that are now in recipe:
   - `settings.duration` → `recipe.duration`
   - `settings.staggerAmount` → `recipe.stagger`  
   - `settings.easing` → `recipe.easing`
   - `settings.trigger` → `recipe.trigger`
   - `settings.loop` → `recipe.loop`

4. Keep AnimationSettings for appearance-related settings:
   - `overrideColor`
   - `strokeColor`
   - `strokeWidth`
   - `lineCap`
   - `lineJoin`
   - etc.

---

### Phase 7: Fix Animation Consistency on Reload (Priority: Critical)
**Estimated Time:** 30 minutes

**Addresses:** Issue #8

**Files to modify:**
- `src/components/Preview.tsx`

**Problem:**
The `animationKey` only increments when preset or SVG changes, but not on initial mount or reload.

**Changes:**
1. Initialize `animationKey` with a timestamp to ensure uniqueness on every mount:

```typescript
// Instead of starting at 0, use current timestamp
const [animationKey, setAnimationKey] = useState(() => Date.now());
```

2. Add a dedicated mount effect to trigger initial animation:

```typescript
// Ensure animation plays on mount
useEffect(() => {
  // Small delay to ensure DOM is ready
  const timer = setTimeout(() => {
    setAnimationKey(Date.now());
    setCurrentTime(0);
    setIsPlaying(true);
  }, 50);
  return () => clearTimeout(timer);
}, []); // Empty dependency = runs once on mount
```

3. Consider using `AnimatePresence` with `mode="wait"` for more reliable animation restarts.

---

### Phase 8: Sync Timeline with Framer Motion (Priority: Critical)
**Estimated Time:** 2 hours

**Addresses:** Issue #9

**Files to modify:**
- `src/components/Preview.tsx`

**Problem:**
Timeline uses `settings.duration` while Framer Motion uses `recipe.duration`. They're not synchronized.

**Options:**

#### Option A: Make Timeline Use Recipe (Recommended)
Update `totalDuration` calculation to use recipe values:

```typescript
const totalDuration = useMemo(() => {
  if (parsedSVG.paths.length === 0) return 0;

  const visiblePaths = parsedSVG.paths.filter(p => p.visible);
  const pathCount = visiblePaths.length;
  
  // Use recipe values for timing
  const baseDuration = recipe.duration;
  const staggerDelay = recipe.stagger;
  
  // Total = base duration + (stagger * (pathCount - 1))
  const maxDelay = (pathCount - 1) * staggerDelay;
  return baseDuration + maxDelay;
}, [parsedSVG.paths, recipe.duration, recipe.stagger]);
```

#### Option B: Make Framer Motion Controllable by Timeline
This is more complex and requires using `useAnimate` hook or `AnimationControls` to programmatically scrub the animation. Not recommended for this use case.

#### Option C: Remove Timeline Scrubbing Feature
If timeline scrubbing isn't critical, simplify to just show progress without scrub capability.

**Recommended: Option A** - Update timeline to use recipe values.

---

### Phase 9: Fix Stroke Override Animation Replay (Priority: High)
**Estimated Time:** 30 minutes

**Addresses:** Issue #10

**Files to modify:**
- `src/components/Preview.tsx`

**Problem:**
When stroke override or other appearance settings change, the animation doesn't replay.

**Changes:**
1. Add effect to re-trigger animation when appearance settings change:

```typescript
// Re-trigger animation when appearance settings change
useEffect(() => {
  if (recipe.preset !== 'none') {
    setAnimationKey(prev => prev + 1);
    setCurrentTime(0);
    setIsPlaying(true);
  }
}, [
  settings.overrideColor,
  settings.strokeColor,
  settings.strokeWidth,
  // Only include settings that affect visual appearance
]);
```

2. Alternatively, create a "visual settings hash" and watch that:

```typescript
const appearanceHash = useMemo(() => 
  `${settings.overrideColor}-${settings.strokeColor}-${settings.strokeWidth}`,
  [settings.overrideColor, settings.strokeColor, settings.strokeWidth]
);

useEffect(() => {
  // Re-trigger on appearance change
  handleReplay();
}, [appearanceHash]);
```

---

## Testing Checklist

After implementing each phase, verify:

### Phase 1 Tests
- [ ] Selecting a preset updates the animation immediately
- [ ] Changing duration slider updates animation
- [ ] Changing stagger slider updates animation
- [ ] Changing easing dropdown updates animation

### Phase 2 Tests
- [ ] Trigger: Auto - Animation plays on page load
- [ ] Trigger: Hover - Animation plays only on mouse hover
- [ ] Trigger: Click - Animation plays only on click
- [ ] Cursor changes appropriately for hover/click triggers

### Phase 3 Tests
- [ ] Spring easing produces bouncy physics animation
- [ ] Other easings (easeOut, linear, etc.) work correctly
- [ ] No console errors about invalid easing values

### Phase 4 Tests
- [ ] Intensity slider appears for Wiggle preset
- [ ] Intensity slider appears for Bounce preset
- [ ] Changing intensity affects amplitude of wiggle/bounce
- [ ] Intensity slider hidden for other presets

### Phase 5 Tests
- [ ] On fresh load, appropriate preset is selected in UI
- [ ] No mismatch between UI selection and actual animation

### Phase 7 Tests (NEW)
- [ ] Animation plays on initial page load
- [ ] Animation plays after page refresh
- [ ] Animation plays after hot reload during development
- [ ] Animation replays when clicking Replay button

### Phase 8 Tests (NEW)
- [ ] Timeline progress bar matches actual animation progress
- [ ] Timecode display is accurate
- [ ] Changing duration updates both timeline and animation
- [ ] Loop behavior works correctly

### Phase 9 Tests (NEW)
- [ ] Enabling stroke override replays the animation
- [ ] Changing stroke color replays the animation
- [ ] Changing stroke width replays the animation
- [ ] Other appearance changes trigger replay

---

## Risk Assessment

| Phase | Risk Level | Potential Issues | Mitigation |
|-------|------------|------------------|------------|
| 1 | Medium | Breaking existing saved projects | Version check on load, migrate old format |
| 2 | Low | Minor - isolated change | Test all trigger modes manually |
| 3 | Low | Minor - isolated change | Verify spring physics feel natural |
| 4 | Low | UI only addition | N/A |
| 5 | Low | Minor - default value change | Test fresh load behavior |
| 6 | Medium | Removing code may break exports | Ensure export still works |
| 7 | Low | Minor timing issue | Test on different browsers |
| 8 | Medium | Timeline behavior changes | Verify user expectations match |
| 9 | Low | Extra re-renders | Debounce if performance issues |

---

## File Change Summary

| File | Phase | Type of Change |
|------|-------|----------------|
| `src/app/page.tsx` | 1, 5, 6 | Refactor state management |
| `src/components/TransformPanel.tsx` | 1, 4 | Update props, add intensity slider |
| `src/components/Preview.tsx` | 2, 3, 7, 8, 9 | Fix animations, timeline sync |
| `src/types.ts` | 5 | Update DEFAULT_RECIPE |

---

## Issue to Phase Mapping

| Issue | Description | Fixed In |
|-------|-------------|----------|
| #1 | Recipe easing never synced | Phase 1 |
| #2 | Initial preset value mismatch | Phase 5 |
| #3 | No preset visually selected | Phase 5 |
| #4 | Sync only runs on preset change | Phase 1 |
| #5 | No intensity control | Phase 4 |
| #6 | Trigger mode not applied | Phase 2 |
| #7 | Spring easing broken | Phase 3 |
| #8 | Animation inconsistent on reload | Phase 7 |
| #9 | Timeline not synced | Phase 8 |
| #10 | Stroke override breaks animation | Phase 9 |

---

## Recommended Order of Implementation

**Critical Path (do first):**
1. **Phase 7** (Fix Animation on Reload) - Quick win, high impact
2. **Phase 8** (Sync Timeline) - Fixes major UX issue
3. **Phase 9** (Stroke Override Replay) - Quick fix

**Core Fixes:**
4. **Phase 3** (Fix Spring Easing) - Quick win, low risk
5. **Phase 2** (Fix Trigger Mode) - Critical functionality
6. **Phase 1** (Fix Data Sync) - Core fix, requires careful testing

**Polish:**
7. **Phase 4** (Add Intensity) - Nice to have
8. **Phase 5** (Fix Initial State) - UX polish
9. **Phase 6** (Cleanup) - Technical debt

---

## Summary

| Category | Count |
|----------|-------|
| Total Issues | 10 |
| Critical Issues | 7 |
| Medium Issues | 3 |
| Implementation Phases | 9 |
| Estimated Total Time | 7-8 hours |

---

*Document Version: 1.1*  
*Created: December 21, 2024*  
*Updated: December 21, 2024 - Added Issues #8, #9, #10 and Phases 7, 8, 9*  
*Status: Ready for Implementation*

