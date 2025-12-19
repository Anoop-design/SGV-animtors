import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Preview } from './components/Preview';
import { AddSVGPanel } from './components/AddSVGPanel';
import { ControlsPanel } from './components/ControlsPanel';
import { HelpModal } from './components/HelpModal';
import { ToastContainer, useToast } from './components/Toast';
import { AnimationSettings, DEFAULT_ICON, ParsedSVG, DEFAULT_PATH_TRANSFORM, DEFAULT_GLOBAL_TRANSFORM } from './types';
import { parseSVG } from './lib/svg-utils';
import { generateExport, downloadSVG, ExportType } from './lib/generate-export';
import { useKeyboardShortcuts } from './lib/useKeyboardShortcuts';
import './styles.css';

/**
 * Main App Component
 * 
 * Layout Structure (3-column):
 * - Header (top navigation with theme toggle)
 * - Main content area:
 *   - AddSVGPanel (220px fixed width) - Left
 *   - Preview (flexible width) - Center
 *   - ControlsPanel (240px fixed width) - Right
 * 
 * CSS Classes used:
 * - .app-shell: Main container
 * - .app-main: Content area below header
 */
function App() {
  const [svgInput, setSvgInput] = useState(DEFAULT_ICON);
  const [parsedSVG, setParsedSVG] = useState<ParsedSVG>({ viewBox: '0 0 24 24', paths: [], warnings: [] });
  const [hoveredPathIndex, setHoveredPathIndex] = useState<number | null>(null);
  const [selectedPathIndex, setSelectedPathIndex] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Responsive panel state
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Animation mode - controls which animation plays in Preview
  const [activeTab, setActiveTab] = useState<'stroke' | 'transform'>('stroke');

  const { toasts, addToast, removeToast } = useToast();
  const previewRef = useRef<{ togglePlay: () => void; handleReplay: () => void } | null>(null);

  const [settings, setSettings] = useState<AnimationSettings>({
    duration: 2,
    delay: 0.2,
    staggerMode: 'sequential',
    staggerAmount: 0.3,
    easing: 'ease-in-out',
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
    interactionTrigger: 'none',
    globalTransform: DEFAULT_GLOBAL_TRANSFORM,
    animationDirection: 'in'
  });

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Parse SVG when input changes
  useEffect(() => {
    const parsed = parseSVG(svgInput);
    setParsedSVG(parsed);
  }, [svgInput]);

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    // Space - toggle play/pause
    {
      key: ' ',
      handler: () => previewRef.current?.togglePlay(),
    },
    // R - restart animation
    {
      key: 'r',
      handler: () => previewRef.current?.handleReplay(),
    },
    // Cmd/Ctrl + S - copy SVG
    {
      key: 's',
      meta: true,
      handler: () => handleExport('svg'),
    },
    // Cmd/Ctrl + E - open export menu
    {
      key: 'e',
      meta: true,
      handler: () => setExportMenuOpen(prev => !prev),
    },
    // Cmd/Ctrl + D - download SVG
    {
      key: 'd',
      meta: true,
      handler: () => handleDownload(),
    },
    // T - toggle theme (just T key, no modifiers to avoid browser conflicts)
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
        setExportMenuOpen(false);
      },
      allowInInput: true,
    },
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
    const code = generateExport(parsedSVG, settings, type);
    navigator.clipboard.writeText(code);

    const labels: Record<ExportType, string> = {
      'svg': 'SVG',
      'css': 'CSS',
      'react': 'React component',
      'framer-motion': 'Framer Motion code',
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
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  /* 
   * Update animation properties for a specific path 
   */
  const updatePathAnimation = (index: number, animation: Partial<import('./types').PathTransform> | undefined) => {
    setParsedSVG(prev => {
      const newPaths = [...prev.paths];
      if (newPaths[index]) {
        // If animation is undefined, remove it
        if (!animation) {
          const { animation: _, ...rest } = newPaths[index];
          newPaths[index] = rest;
        } else {
          // Merge existing animation with new updates
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

  return (
    <div className="app-shell">
      {/* Top Header */}
      <Header
        onExport={handleExport}
        onDownload={handleDownload}
        theme={theme}
        onToggleTheme={toggleTheme}
        onShowHelp={() => setShowHelpModal(true)}
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
          svgInput={svgInput}
          setSvgInput={setSvgInput}
          warnings={parsedSVG.warnings}
          isOpen={leftPanelOpen}
          onClose={() => setLeftPanelOpen(false)}
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
          animationMode={activeTab}
        />

        {/* Right Panel - Controls */}
        <ControlsPanel
          settings={settings}
          updateSetting={updateSetting}
          paths={parsedSVG.paths}
          onToggleVisibility={togglePathVisibility}
          onReorderPath={reorderPaths}
          hoveredPathIndex={hoveredPathIndex}
          setHoveredPathIndex={setHoveredPathIndex}
          selectedPathIndex={selectedPathIndex}
          onSelectPath={setSelectedPathIndex}
          updatePathAnimation={updatePathAnimation}
          viewBox={parsedSVG.viewBox}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
        />
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
}

export default App;