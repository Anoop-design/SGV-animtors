'use client';

import React from 'react';
import { Download, Moon, Sun, Copy, FileDown, Code, HelpCircle, Menu, Sliders } from 'lucide-react';
import { AnimatedLogo } from '@/components/icons/AnimatedLogo';
import '@/styles.css';
import { ExportType } from '@/lib/generate-export';

// Brand Logo Components
const ReactLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="2.5" />
    <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)" />
  </svg>
);

// Framer Motion - The motion "M" swoosh logo
const FramerMotionLogo = ({ size = 16 }: { size?: number }) => (
  <svg width="20" height="20" viewBox="0 0 34 33" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_22_1389)">
      <path d="M12.838 10.5055L6.12 22.4945H0L5.245 13.1335C6.059 11.6815 8.088 10.5055 9.778 10.5055H12.838ZM27.846 13.5025C27.846 11.8475 29.216 10.5055 30.906 10.5055C32.596 10.5055 33.966 11.8475 33.966 13.5025C33.966 15.1585 32.596 16.5005 30.906 16.5005C29.216 16.5005 27.846 15.1585 27.846 13.5025ZM13.985 10.5055H20.105L13.387 22.4945H7.267L13.985 10.5055ZM21.214 10.5055H27.334L22.088 19.8675C21.275 21.3185 19.246 22.4945 17.556 22.4945H14.496L21.214 10.5055Z" fill="currentColor" />
    </g>
    <defs>
      <clipPath id="clip0_22_1389">
        <rect width="33.966" height="33" fill="currentColor" />
      </clipPath>
    </defs>
  </svg>


);

// GSAP - Stylized "G" logo
const GsapLogo = ({ size = 16 }: { size?: number }) => (
  <svg width="20" height="20" viewBox="0 0 82 82" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_22_1398)">
      <path d="M23.8101 40.013V40.026L22.7351 44.691C22.6771 44.955 22.4131 45.149 22.1091 45.149H20.8101C20.7634 45.1492 20.718 45.1643 20.6805 45.1922C20.6431 45.2201 20.6156 45.2593 20.6021 45.304C19.4041 49.368 17.7821 52.162 15.6401 53.839C13.8181 55.267 11.5721 55.932 8.57109 55.932C5.87509 55.932 4.05709 55.065 2.51509 53.354C0.47809 51.09 -0.36391 47.388 0.14609 42.926C1.06509 34.549 5.41009 26.096 13.7761 26.096C16.3211 26.073 18.3191 26.858 19.7091 28.426C21.1791 30.083 21.9251 32.58 21.9291 35.847C21.9254 35.9903 21.866 36.1264 21.7635 36.2266C21.661 36.3267 21.5234 36.3828 21.3801 36.383H15.2501C15.1427 36.3797 15.0406 36.3354 14.9649 36.2591C14.8892 36.1828 14.8456 36.0804 14.8431 35.973C14.7931 33.714 14.1231 32.613 12.7911 32.613C10.4411 32.613 9.05509 35.803 8.32009 37.572C7.29309 40.042 6.77009 42.724 6.87309 45.396C6.92209 46.64 7.12209 48.39 8.30309 49.114C9.35009 49.757 10.8441 49.331 11.7491 48.619C12.6531 47.908 13.3811 46.677 13.6871 45.554C13.7301 45.398 13.7331 45.277 13.6921 45.222C13.6491 45.167 13.5301 45.154 13.4391 45.154H11.8651C11.7818 45.1543 11.6994 45.1363 11.6238 45.1014C11.5481 45.0665 11.481 45.0155 11.4271 44.952C11.3857 44.9024 11.3564 44.844 11.3413 44.7812C11.3262 44.7184 11.3258 44.653 11.3401 44.59L12.4161 39.916C12.4691 39.676 12.6861 39.496 12.9531 39.463V39.452H23.2831C23.3071 39.452 23.3321 39.452 23.3551 39.457C23.6231 39.491 23.8121 39.741 23.8071 40.013H23.8101Z" fill="currentColor" />
      <path d="M41.5941 34.65C41.5896 34.7924 41.5299 34.9274 41.4277 35.0266C41.3254 35.1257 41.1885 35.1811 41.0461 35.181H35.4001C35.0301 35.181 34.7211 34.881 34.7211 34.516C34.7211 32.868 34.1511 32.066 32.9851 32.066C31.8191 32.066 31.067 32.783 31.045 34.034C31.02 35.429 31.809 36.696 34.055 38.874C37.012 41.648 38.197 44.106 38.14 47.354C38.047 52.605 34.476 56 29.042 56C26.267 56 24.147 55.257 22.737 53.793C21.306 52.307 20.6501 50.125 20.7871 47.308C20.7917 47.1656 20.8517 47.0307 20.9541 46.9317C21.0566 46.8328 21.1936 46.7777 21.336 46.778H27.1761C27.2575 46.7794 27.3376 46.7989 27.4105 46.8351C27.4835 46.8712 27.5476 46.9231 27.598 46.987C27.6422 47.0397 27.6745 47.1012 27.6928 47.1675C27.7111 47.2337 27.7149 47.3031 27.7041 47.371C27.6391 48.387 27.816 49.146 28.216 49.566C28.472 49.838 28.829 49.976 29.274 49.976C30.353 49.976 30.9851 49.213 31.0091 47.886C31.0291 46.738 30.666 45.731 28.688 43.696C26.133 41.2 23.842 38.621 23.913 34.566C23.955 32.215 24.8891 30.064 26.5441 28.51C28.2941 26.868 30.687 26 33.465 26C36.248 26.02 38.3571 26.813 39.7341 28.359C41.0381 29.825 41.6661 31.941 41.5961 34.649L41.5941 34.65Z" fill="currentColor" />
      <path d="M59.096 55.012L59.133 27.08C59.1341 27.0101 59.1211 26.9406 59.095 26.8757C59.0688 26.8108 59.03 26.7518 58.9807 26.7022C58.9314 26.6525 58.8727 26.6132 58.808 26.5866C58.7433 26.5599 58.6739 26.5465 58.604 26.547H49.866C49.572 26.547 49.443 26.799 49.359 26.967L36.707 54.842V54.847L36.702 54.853C36.562 55.196 36.828 55.563 37.199 55.563H43.307C43.637 55.563 43.855 55.463 43.963 55.255L45.176 52.34C45.325 51.952 45.353 51.916 45.777 51.916H51.613C52.019 51.916 52.028 51.924 52.021 52.321L51.89 55.031C51.889 55.1009 51.9021 55.1702 51.9283 55.235C51.9545 55.2998 51.9934 55.3587 52.0427 55.4082C52.0919 55.4578 52.1506 55.497 52.2152 55.5236C52.2798 55.5501 52.3491 55.5636 52.419 55.563H58.589C58.6654 55.564 58.7411 55.5482 58.8107 55.5168C58.8803 55.4853 58.9422 55.439 58.992 55.381C59.035 55.3307 59.0665 55.2716 59.0845 55.2079C59.1024 55.1442 59.1063 55.0774 59.096 55.012ZM48.286 45.686C48.229 45.686 48.184 45.685 48.148 45.681C48.1266 45.6794 48.1059 45.6731 48.0872 45.6625C48.0686 45.652 48.0525 45.6375 48.0401 45.62C48.0277 45.6025 48.0193 45.5825 48.0154 45.5615C48.0116 45.5404 48.0125 45.5187 48.018 45.498C48.03 45.457 48.047 45.403 48.071 45.335L52.448 34.508C52.486 34.401 52.534 34.296 52.584 34.194C52.655 34.049 52.741 34.039 52.768 34.147C52.791 34.237 52.266 45.265 52.266 45.265C52.225 45.678 52.206 45.695 51.799 45.729L48.29 45.688H48.282L48.286 45.686Z" fill="currentColor" />
      <path d="M71.545 26.547H66.906C66.661 26.547 66.386 26.677 66.321 26.969L59.866 54.998C59.8518 55.0614 59.8523 55.1272 59.8676 55.1903C59.8828 55.2534 59.9124 55.3122 59.954 55.362C60.0078 55.4254 60.0748 55.4763 60.1502 55.5112C60.2257 55.5461 60.3079 55.5641 60.391 55.564H66.189C66.5 55.564 66.714 55.411 66.772 55.146C66.772 55.146 67.475 51.978 67.476 51.968C67.526 51.721 67.44 51.529 67.218 51.413C67.113 51.359 67.009 51.305 66.906 51.25L65.901 50.728L64.901 50.206L64.514 50.005C64.4827 49.9892 64.4565 49.9648 64.4385 49.9347C64.4204 49.9046 64.4113 49.8701 64.412 49.835C64.4133 49.7833 64.4347 49.7341 64.4717 49.6979C64.5087 49.6616 64.5583 49.6413 64.61 49.641L67.788 49.655C68.738 49.66 69.689 49.593 70.624 49.421C77.204 48.206 81.574 42.936 81.7 35.765C81.807 29.645 78.391 26.544 71.55 26.544L71.545 26.547ZM69.966 43.227H69.842C69.564 43.227 69.514 43.197 69.505 43.187C69.501 43.18 71.338 35.114 71.339 35.103C71.386 34.87 71.384 34.736 71.24 34.657C71.056 34.555 68.374 33.141 68.374 33.141C68.3428 33.1247 68.3167 33.0999 68.2988 33.0695C68.281 33.0391 68.272 33.0043 68.273 32.969C68.2743 32.9176 68.2957 32.8688 68.3325 32.8329C68.3693 32.7971 68.4186 32.777 68.47 32.777H72.711C74.031 32.817 74.767 33.998 74.732 36.014C74.671 39.506 73.011 43.104 69.966 43.228V43.227Z" fill="currentColor" />
    </g>
    <defs>
      <clipPath id="clip0_22_1398">
        <rect width="82" height="30" fill="currentColor" transform="translate(0 26)" />
      </clipPath>
    </defs>
  </svg>

);

const VueLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 3h4l6 10.5L18 3h4L12 22 2 3z" />
    <path d="M7.5 3h3L12 6l1.5-3h3L12 11 7.5 3z" fill="currentColor" opacity="0.6" />
  </svg>
);

interface HeaderProps {
  onExport: (type: ExportType) => void;
  onDownload: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onShowHelp?: () => void;
  onShowExportModal?: () => void;
  // Mobile responsive props
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
  leftPanelOpen?: boolean;
  rightPanelOpen?: boolean;
}

/**
 * Header Component
 * 
 * The top navigation bar containing:
 * - Animated logo with wiggle on hover
 * - Theme toggle button
 * - Export buttons (icon-only and dropdown)
 * 
 * CSS Classes used (see styles.css for customization):
 * - .header: Main container
 * - .header-logo: Logo wrapper
 * - .header-logo-image: Logo image container
 * - .header-title: "SVG animator" text
 * - .header-subtitle: "By Framerlists" text
 * - .header-btn-icon: Icon-only button
 * - .header-btn-export: Export button with text
 */
export const Header: React.FC<HeaderProps> = ({
  onExport,
  onDownload,
  theme,
  onToggleTheme,
  onShowHelp,
  onShowExportModal,
  onToggleLeftPanel,
  onToggleRightPanel,
  leftPanelOpen,
  rightPanelOpen
}) => {
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  const exportOptions = [
    { preview: true, label: 'Export with Preview...', desc: 'View & copy code', icon: Code, primary: true },
    { divider: true },
    { type: 'svg' as ExportType, label: 'Quick Copy SVG', desc: 'Animated SVG', icon: Copy, shortcut: '⌘S' },
    { download: true, label: 'Download SVG', desc: 'Save as .svg file', icon: FileDown },
  ];

  return (
    <header className="header">
      {/* Logo Section - Animated logo only, no text */}
      <div className="header-logo">
        {/* Mobile: Left panel toggle */}
        <button
          className="header-mobile-toggle"
          onClick={onToggleLeftPanel}
          title="Toggle SVG panel"
        >
          <Menu size={20} />
        </button>

        {/* Animated Logo - Wiggles on hover, uses currentColor for theme support */}
        <AnimatedLogo size={70} duration={500} />
      </div>

      {/* Export Buttons */}
      <div className="header-actions">
        {/* Mobile: Right panel toggle */}
        <button
          className="header-mobile-toggle"
          onClick={onToggleRightPanel}
          title="Toggle Controls"
        >
          <Sliders size={20} />
        </button>

        {/* Help button */}
        <button
          className="header-btn-icon"
          onClick={onShowHelp}
          title="Keyboard shortcuts (?)"
        >
          <div className="header-btn-icon-inner">
            <HelpCircle size={18} />
          </div>
        </button>

        {/* Theme toggle button */}
        <button
          className="header-btn-icon"
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Switch to dark mode (T)' : 'Switch to light mode (T)'}
        >
          <div className="header-btn-icon-inner">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </div>
        </button>

        {/* Export dropdown button */}
        <div style={{ position: 'relative' }}>
          <button
            className="header-btn-export"
            onClick={() => setShowExportMenu(!showExportMenu)}
          >
            <div className="header-btn-export-inner">
              <Download size={16} />
              <span className="header-btn-export-text">Export</span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showExportMenu && (
            <>
              {/* Backdrop to close menu on click outside */}
              <div
                className="export-menu-backdrop"
                onClick={() => setShowExportMenu(false)}
              />

              <div className="export-menu animate-slideDown">
                {exportOptions.map((option, index) => {
                  if ('divider' in option && option.divider) {
                    return <div key={`divider-${index}`} className="export-menu-divider" />;
                  }

                  const Icon = option.icon!;

                  return (
                    <button
                      key={option.label}
                      className="export-menu-item"
                      onClick={() => {
                        if ('preview' in option && option.preview) {
                          onShowExportModal?.();
                        } else if ('download' in option && option.download) {
                          onDownload();
                        } else if (option.type) {
                          onExport(option.type);
                        }
                        setShowExportMenu(false);
                      }}
                    >
                      <Icon size={16} className="export-menu-icon" />
                      <div className="export-menu-content">
                        <span className="export-menu-label">{option.label}</span>
                        <span className="export-menu-desc">{option.desc}</span>
                      </div>
                      {option.shortcut && (
                        <span className="export-menu-shortcut">{option.shortcut}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};