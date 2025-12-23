'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Preview } from '@/components/Preview';
import { AddSVGPanel, AddSVGPanelHandle } from '@/components/AddSVGPanel';
import { TransformPanel } from '@/components/TransformPanel';
import { HelpModal } from '@/components/HelpModal';
import { ExportModal } from '@/components/ExportModal';
import { ToastContainer, useToast } from '@/components/Toast';
import { AnimationSettings, DEFAULT_ICON, ParsedSVG, DEFAULT_PATH_TRANSFORM, DEFAULT_GLOBAL_TRANSFORM, PathTransform, AnimationRecipe, DEFAULT_RECIPE, PresetType, TriggerType, PRESET_OPTIONS } from '@/types';
import { parseSVG } from '@/lib/svg-utils';
import { generateExport, generateProExport, downloadSVG, ExportType } from '@/lib/generate-export';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import {
  Project,
  saveProject,
  loadProject,
  getLastProjectId,
  createEmptyProject,
  debounce,
} from '@/lib/storage';

/**
 * Main Icon Motion Editor Page
 * 
 * Layout Structure (3-column):
 * - Header (top navigation with theme toggle)
 * - Main content area:
 *   - AddSVGPanel (220px fixed width) - Left
 *   - Preview (flexible width) - Center
 *   - ControlsPanel (240px fixed width) - Right
 */
export default function IconMotionEditor() {
  // Project state
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // SVG state
  const [svgInput, setSvgInput] = useState(DEFAULT_ICON);
  const [parsedSVG, setParsedSVG] = useState<ParsedSVG>({ viewBox: '0 0 24 24', paths: [], warnings: [] });

  // UI state
  const [hoveredPathIndex, setHoveredPathIndex] = useState<number | null>(null);
  const [selectedPathIndex, setSelectedPathIndex] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Responsive panel state
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);


  // Animation mode is now always 'transform' (stroke tab removed)

  const { toasts, addToast, removeToast } = useToast();
  const previewRef = useRef<{ togglePlay: () => void; handleReplay: () => void } | null>(null);
  const addSvgPanelRef = useRef<AddSVGPanelHandle>(null);

  // Animation Recipe state - single source of truth for animation config
  const [recipe, setRecipe] = useState<AnimationRecipe>(DEFAULT_RECIPE);

  // Direct recipe update function - avoids broken sync with settings
  const updateRecipe = useCallback(<K extends keyof AnimationRecipe>(
    key: K,
    value: AnimationRecipe[K]
  ) => {
    setRecipe(prev => ({ ...prev, [key]: value }));
  }, []);

  const [settings, setSettings] = useState<AnimationSettings>({
    duration: 2,
    delay: 0.2,
    staggerMode: 'forward',
    staggerAmount: 0.3,
    easing: 'easeOut',
    customEasing: '0.68, -0.55, 0.27, 1.55',
    overrideColor: false,
    strokeColor: '#D5D5D5',
    strokeWidth: 2,
    useOriginalColors: true,
    forceStroke: true,
    lineCap: 'round',
    lineJoin: 'round',
    fillMode: 'none',
    loop: false,
    trigger: 'auto',
    transformPreset: null,
    globalTransform: DEFAULT_GLOBAL_TRANSFORM,
    animationDirection: 'in',
    springStiffness: 400,
    springDamping: 15,
  });

  // Debounced save function
  const debouncedSave = useMemo(
    () =>
      debounce(async (projectToSave: Project) => {
        await saveProject(projectToSave);
      }, 1000),
    []
  );

  // Load project on mount
  useEffect(() => {
    async function initializeProject() {
      try {
        const lastProjectId = getLastProjectId();
        let loadedProject: Project | undefined;

        if (lastProjectId) {
          loadedProject = await loadProject(lastProjectId);
        }

        if (loadedProject) {
          // Restore state from loaded project
          setProject(loadedProject);
          setSvgInput(loadedProject.svgSource || DEFAULT_ICON);
          if (loadedProject.settings) {
            setSettings(loadedProject.settings);
          }
          if (loadedProject.parsedSVG) {
            setParsedSVG(loadedProject.parsedSVG);
          }
        } else {
          // Create new project
          const newProject = createEmptyProject('Untitled Project');
          newProject.svgSource = DEFAULT_ICON;
          setProject(newProject);
          await saveProject(newProject);
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        // Fallback to new project
        const newProject = createEmptyProject('Untitled Project');
        newProject.svgSource = DEFAULT_ICON;
        setProject(newProject);
      } finally {
        setIsLoading(false);
      }
    }

    initializeProject();
  }, []);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // NOTE: Removed broken sync useEffect - recipe is now updated directly via updateRecipe

  // Parse SVG when input changes and autosave
  useEffect(() => {
    const parsed = parseSVG(svgInput);
    setParsedSVG(parsed);

    // Autosave project when SVG changes
    if (project && !isLoading) {
      const updatedProject: Project = {
        ...project,
        svgSource: svgInput,
        parsedSVG: parsed,
        updatedAt: Date.now(),
      };
      setProject(updatedProject);
      debouncedSave(updatedProject);
    }
  }, [svgInput, isLoading]);

  // Autosave when settings change
  useEffect(() => {
    if (project && !isLoading) {
      const updatedProject: Project = {
        ...project,
        settings,
        updatedAt: Date.now(),
      };
      setProject(updatedProject);
      debouncedSave(updatedProject);
    }
  }, [settings, isLoading]);

  // Preset order matching PRESET_OPTIONS in types.ts
  const PRESET_KEYS: PresetType[] = ['draw', 'pop', 'wiggle', 'bounce', 'draw-pop', 'fade', 'slide', 'spin', 'pulse'];

  // Trigger order for cycling
  const TRIGGER_ORDER: TriggerType[] = ['auto', 'hover', 'click'];

  // Cycle to next trigger
  const cycleTrigger = useCallback(() => {
    const currentIndex = TRIGGER_ORDER.indexOf(recipe.trigger);
    const nextIndex = (currentIndex + 1) % TRIGGER_ORDER.length;
    updateRecipe('trigger', TRIGGER_ORDER[nextIndex]);
    addToast(`Trigger: ${TRIGGER_ORDER[nextIndex]}`, 'info');
  }, [recipe.trigger, updateRecipe, addToast]);

  // Paste SVG from clipboard
  const handlePasteSVG = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes('<svg')) {
        setSvgInput(text);
        addToast('SVG pasted!', 'success');
      } else {
        addToast('Clipboard does not contain SVG', 'error');
      }
    } catch {
      addToast('Failed to read clipboard', 'error');
    }
  }, [addToast]);

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    // R - replay animation
    {
      key: 'r',
      handler: () => previewRef.current?.handleReplay(),
    },
    // G - cycle trigger (Auto → Hover → Click)
    {
      key: 'g',
      handler: cycleTrigger,
    },
    // L - toggle loop
    {
      key: 'l',
      handler: () => updateRecipe('loop', !recipe.loop),
    },
    // T - toggle theme
    {
      key: 't',
      handler: () => toggleTheme(),
    },
    // ? - show help modal
    {
      key: '?',
      shift: true,
      handler: () => setShowHelpModal(true),
    },
    // Escape - close modals
    {
      key: 'Escape',
      handler: () => {
        setShowHelpModal(false);
        setShowExportModal(false);
      },
      allowInInput: true,
    },
    // Cmd/Ctrl + Shift + V - Paste SVG from clipboard
    {
      key: 'v',
      meta: true,
      shift: true,
      handler: handlePasteSVG,
    },
    // Cmd/Ctrl + Shift + U - Upload file
    {
      key: 'u',
      meta: true,
      shift: true,
      handler: () => addSvgPanelRef.current?.triggerUpload(),
    },
    // E - open export modal
    {
      key: 'e',
      handler: () => setShowExportModal(true),
    },
    // Number keys 1-9 for presets
    ...PRESET_KEYS.map((preset, index) => ({
      key: String(index + 1),
      handler: () => {
        updateRecipe('preset', preset);
        addToast(`Preset: ${PRESET_OPTIONS[index].label}`, 'info');
      },
    })),
  ]);

  // Callback to update path lengths from Preview component
  const updatePathLength = useCallback((index: number, length: number) => {
    setParsedSVG(prev => {
      const newPaths = [...prev.paths];
      if (newPaths[index]) {
        newPaths[index] = { ...newPaths[index], length };
      }
      return { ...prev, paths: newPaths };
    });
  }, []);

  const updateSetting = <K extends keyof AnimationSettings>(key: K, value: AnimationSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = (type: ExportType) => {
    // Use Pro export with recipe for the advanced export
    const code = type === 'framer-motion-pro'
      ? generateProExport(parsedSVG, settings, recipe, 'AnimatedIcon')
      : generateExport(parsedSVG, settings, type);
    navigator.clipboard.writeText(code);

    const labels: Record<ExportType, string> = {
      'svg': 'SVG',
      'css': 'CSS',
      'react': 'React component',
      'framer-motion': 'Framer Motion code',
      'framer-motion-pro': 'React component (Pro)',
      'gsap': 'GSAP code',
      'vue': 'Vue component'
    };

    addToast(`${labels[type]} copied to clipboard!`, 'success');
  };

  const handleDownload = () => {
    const svgCode = generateExport(parsedSVG, settings, 'svg');
    downloadSVG(svgCode, 'animated-icon.svg');
    addToast('SVG downloaded!', 'success');
  };

  const togglePathVisibility = (index: number) => {
    setParsedSVG(prev => {
      const newPaths = [...prev.paths];
      newPaths[index] = { ...newPaths[index], visible: !newPaths[index].visible };
      return { ...prev, paths: newPaths };
    });
  };

  const reorderPaths = (fromIndex: number, toIndex: number) => {
    setParsedSVG(prev => {
      const newPaths = [...prev.paths];
      const [movedPath] = newPaths.splice(fromIndex, 1);
      newPaths.splice(toIndex, 0, movedPath);
      return { ...prev, paths: newPaths };
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';

    // Check if View Transitions API is supported
    // @ts-ignore - startViewTransition is not yet in TypeScript DOM types
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    // Use View Transitions API for smooth wipe animation
    // @ts-ignore
    document.startViewTransition(() => {
      setTheme(newTheme);
    });
  };

  /* Update animation properties for a specific path */
  const updatePathAnimation = (index: number, animation: Partial<PathTransform> | undefined) => {
    setParsedSVG(prev => {
      const newPaths = [...prev.paths];
      if (newPaths[index]) {
        if (!animation) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { animation: _, ...rest } = newPaths[index];
          newPaths[index] = rest;
        } else {
          newPaths[index] = {
            ...newPaths[index],
            animation: {
              ...(newPaths[index].animation || DEFAULT_PATH_TRANSFORM),
              ...animation
            }
          };
        }
      }
      return { ...prev, paths: newPaths };
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Top Header */}
      <Header
        onExport={handleExport}
        onDownload={handleDownload}
        theme={theme}
        onToggleTheme={toggleTheme}
        onShowHelp={() => setShowHelpModal(true)}
        onShowExportModal={() => setShowExportModal(true)}
        onToggleLeftPanel={() => setLeftPanelOpen(prev => !prev)}
        onToggleRightPanel={() => setRightPanelOpen(prev => !prev)}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
      />

      {/* Main Content - 3 Column Layout */}
      <main className="app-main">
        {/* Mobile overlay backdrop */}
        {(leftPanelOpen || rightPanelOpen) && (
          <div
            className="panel-backdrop"
            onClick={() => {
              setLeftPanelOpen(false);
              setRightPanelOpen(false);
            }}
          />
        )}

        {/* Left Panel - Add SVG */}
        <AddSVGPanel
          ref={addSvgPanelRef}
          svgInput={svgInput}
          setSvgInput={setSvgInput}
          warnings={parsedSVG.warnings}
          isOpen={leftPanelOpen}
          onClose={() => setLeftPanelOpen(false)}
          onQuickStart={(svg, preset, trigger) => {
            setSvgInput(svg);
            updateRecipe('preset', preset);
            updateRecipe('trigger', trigger);
            // Draw presets need individual mode (pathLength per path)
            if (preset === 'draw' || preset === 'draw-pop') {
              updateRecipe('layerMode', 'individual');
            }
            // Spin/pulse look better with unified mode (whole icon animates together)
            if (preset === 'spin' || preset === 'pulse') {
              updateRecipe('layerMode', 'unified');
            }
          }}
        />

        {/* Center - Preview Area */}
        <Preview
          ref={previewRef}
          parsedSVG={parsedSVG}
          settings={settings}
          updateSetting={updateSetting}
          updatePathLength={updatePathLength}
          hoveredPathIndex={hoveredPathIndex}
          selectedPathIndex={selectedPathIndex}
          onSelectPath={setSelectedPathIndex}
          onHoverPath={setHoveredPathIndex}
          recipe={recipe}
          updateRecipe={updateRecipe}
        />

        {/* Right Panel - Transform Controls */}
        <TransformPanel
          settings={settings}
          updateSetting={updateSetting}
          recipe={recipe}
          updateRecipe={updateRecipe}
          paths={parsedSVG.paths}
          onToggleVisibility={togglePathVisibility}
          onReorderPath={reorderPaths}
          hoveredPathIndex={hoveredPathIndex}
          setHoveredPathIndex={setHoveredPathIndex}
          selectedPathIndex={selectedPathIndex}
          onSelectPath={setSelectedPathIndex}
          updatePathAnimation={updatePathAnimation}
          viewBox={parsedSVG.viewBox}
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
        />
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {/* Export Modal with Live Preview */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        parsedSVG={parsedSVG}
        settings={settings}
        recipe={recipe}
      />
    </div>
  );
}
