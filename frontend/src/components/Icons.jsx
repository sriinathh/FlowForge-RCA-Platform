import React from 'react';

// Computes a constrained pixel size based on utility class name, defaulting to a crisp 16px
const parseSize = (className = '') => {
  if (typeof className !== 'string') return 16;
  if (className.includes('w-3.5') || className.includes('w-3-5') || className.includes('h-3.5')) return 14;
  if (className.includes('w-3') || className.includes('h-3')) return 12;
  if (className.includes('w-4') || className.includes('h-4')) return 16;
  if (className.includes('w-5') || className.includes('h-5')) return 18;
  if (className.includes('w-6') || className.includes('h-6')) return 20;
  if (className.includes('w-7') || className.includes('h-7')) return 22;
  if (className.includes('w-8') || className.includes('h-8')) return 24;
  if (className.includes('w-10') || className.includes('h-10')) return 28;
  if (className.includes('w-12') || className.includes('h-12')) return 32;
  return 16;
};

// Base SVG wrapper ensuring strict dimensions across all browsers
const IconBase = ({ className = 'w-4 h-4', style = {}, children, viewBox = '0 0 24 24' }) => {
  const size = parseSize(className);
  return (
    <svg
      className={className}
      width={size}
      height={size}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
        flexShrink: 0,
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
};

export const ServerIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/>
    <line x1="6" y1="18" x2="6.01" y2="18"/>
  </IconBase>
);

export const ActivityIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </IconBase>
);

export const ShieldAlertIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </IconBase>
);

export const ZapIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </IconBase>
);

export const CheckCircleIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </IconBase>
);

export const AlertTriangleIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </IconBase>
);

export const XCircleIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </IconBase>
);

export const RefreshIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 21h5v-5"/>
  </IconBase>
);

export const BarChartIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </IconBase>
);

export const LayersIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </IconBase>
);

export const FlameIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </IconBase>
);

export const ClockIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </IconBase>
);

export const TerminalIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <polyline points="4 17 10 11 4 5"/>
    <line x1="12" y1="19" x2="20" y2="19"/>
  </IconBase>
);

export const BotIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/>
    <line x1="8" y1="16" x2="8.01" y2="16"/>
    <line x1="16" y1="16" x2="16.01" y2="16"/>
  </IconBase>
);

export const SparklesIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M3 5h4"/>
    <path d="M19 17v4"/>
    <path d="M17 19h4"/>
  </IconBase>
);

export const TrendingUpIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </IconBase>
);

export const SlidersIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <line x1="4" y1="21" x2="4" y2="14"/>
    <line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/>
    <line x1="20" y1="12" x2="20" y2="3"/>
    <line x1="1" y1="14" x2="7" y2="14"/>
    <line x1="9" y1="8" x2="15" y2="8"/>
    <line x1="17" y1="16" x2="23" y2="16"/>
  </IconBase>
);

export const DownloadIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </IconBase>
);

export const SendIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </IconBase>
);

export const FileTextIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </IconBase>
);

export const CopyIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </IconBase>
);

export const ArrowRight = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </IconBase>
);

export const FilterIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </IconBase>
);

export const SearchIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </IconBase>
);

export const BellIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </IconBase>
);

export const SettingsIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </IconBase>
);

export const SunIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </IconBase>
);

export const MoonIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </IconBase>
);

export const ChevronDownIcon = ({ className = 'w-3.5 h-3.5', style = {} }) => (
  <IconBase className={className} style={style}>
    <polyline points="6 9 12 15 18 9"/>
  </IconBase>
);

export const ChevronRightIcon = ({ className = 'w-3.5 h-3.5', style = {} }) => (
  <IconBase className={className} style={style}>
    <polyline points="9 18 15 12 9 6"/>
  </IconBase>
);

export const ChevronLeftIcon = ({ className = 'w-3.5 h-3.5', style = {} }) => (
  <IconBase className={className} style={style}>
    <polyline points="15 18 9 12 15 6"/>
  </IconBase>
);

export const MenuIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </IconBase>
);

export const DatabaseIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </IconBase>
);

export const BuildingIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
    <line x1="9" y1="22" x2="9" y2="22.01"/>
    <line x1="15" y1="22" x2="15" y2="22.01"/>
    <line x1="9" y1="6" x2="9.01" y2="6"/>
    <line x1="15" y1="6" x2="15.01" y2="6"/>
    <line x1="9" y1="10" x2="9.01" y2="10"/>
    <line x1="15" y1="10" x2="15.01" y2="10"/>
    <line x1="9" y1="14" x2="9.01" y2="14"/>
    <line x1="15" y1="14" x2="15.01" y2="14"/>
    <line x1="9" y1="18" x2="9.01" y2="18"/>
    <line x1="15" y1="18" x2="15.01" y2="18"/>
  </IconBase>
);

export const GlobeIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </IconBase>
);

export const UserIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </IconBase>
);

export const CheckIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <polyline points="20 6 9 17 4 12"/>
  </IconBase>
);

export const CloseIcon = ({ className = 'w-4 h-4', style = {} }) => (
  <IconBase className={className} style={style}>
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </IconBase>
);
