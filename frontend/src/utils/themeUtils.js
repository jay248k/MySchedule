/**
 * Central Theme & Color Combinations Engine
 * Manages dynamic theme modes (Light, Dark Navy, OLED Black, Warm Paper)
 * and rich color combinations / brand accents across every page.
 */

export const COLOR_COMBINATIONS = [
  {
    id: 'electric-sapphire',
    name: 'Electric Sapphire',
    primary: '#1769FF',
    secondary: '#3B82F6',
    hover: '#0F58E2',
    light: 'rgba(23, 105, 255, 0.14)',
    glow: 'rgba(23, 105, 255, 0.35)',
    gradient: 'linear-gradient(135deg, #1769FF 0%, #3B82F6 100%)',
    tag: 'Classic · Productive · Professional',
    sidebarTone: '#0B2454',
  },
  {
    id: 'cyber-indigo',
    name: 'Cyber Indigo',
    primary: '#6366F1',
    secondary: '#818CF8',
    hover: '#4F46E5',
    light: 'rgba(99, 102, 241, 0.15)',
    glow: 'rgba(99, 102, 241, 0.35)',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    tag: 'Modern · Tech · Balanced',
    sidebarTone: '#111827',
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    primary: '#10B981',
    secondary: '#34D399',
    hover: '#059669',
    light: 'rgba(16, 185, 129, 0.15)',
    glow: 'rgba(16, 185, 129, 0.35)',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    tag: 'Fresh · Growth · Wellness',
    sidebarTone: '#064E3B',
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Amethyst',
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    hover: '#7C3AED',
    light: 'rgba(139, 92, 246, 0.15)',
    glow: 'rgba(139, 92, 246, 0.35)',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #C084FC 100%)',
    tag: 'Luxury · Elegance · Deep Focus',
    sidebarTone: '#2E1065',
  },
  {
    id: 'sunset-coral',
    name: 'Sunset Coral',
    primary: '#F97316',
    secondary: '#FB923C',
    hover: '#EA580C',
    light: 'rgba(249, 115, 22, 0.15)',
    glow: 'rgba(249, 115, 22, 0.35)',
    gradient: 'linear-gradient(135deg, #F97316 0%, #F59E0B 100%)',
    tag: 'High Energy · Creative · Warm',
    sidebarTone: '#431407',
  },
  {
    id: 'crimson-ruby',
    name: 'Crimson Ruby',
    primary: '#F43F5E',
    secondary: '#FB7185',
    hover: '#E11D48',
    light: 'rgba(244, 63, 94, 0.15)',
    glow: 'rgba(244, 63, 94, 0.35)',
    gradient: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
    tag: 'Bold · High Impact · Dynamic',
    sidebarTone: '#4C0519',
  },
  {
    id: 'nordic-cyan',
    name: 'Nordic Cyan',
    primary: '#06B6D4',
    secondary: '#22D3EE',
    hover: '#0891B2',
    light: 'rgba(6, 182, 212, 0.15)',
    glow: 'rgba(6, 182, 212, 0.35)',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
    tag: 'Calm · Precision · Flow',
    sidebarTone: '#083344',
  },
  {
    id: 'golden-amber',
    name: 'Golden Amber',
    primary: '#F59E0B',
    secondary: '#FBBF24',
    hover: '#D97706',
    light: 'rgba(245, 158, 11, 0.15)',
    glow: 'rgba(245, 158, 11, 0.35)',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
    tag: 'Optimistic · Radiant · Achievement',
    sidebarTone: '#451A03',
  },
  {
    id: 'stealth-slate',
    name: 'Stealth Slate',
    primary: '#475569',
    secondary: '#64748B',
    hover: '#334155',
    light: 'rgba(71, 85, 105, 0.15)',
    glow: 'rgba(71, 85, 105, 0.35)',
    gradient: 'linear-gradient(135deg, #475569 0%, #1E293B 100%)',
    tag: 'Minimalist · Stealth · Monochromatic',
    sidebarTone: '#0F172A',
  },
];

export const THEME_MODES = [
  {
    id: 'light',
    name: 'Airy Light',
    description: 'Crisp, high-contrast, modern clean workspace',
    pageBg: '#F3F8FF',
    cardBg: '#FFFFFF',
    cardHover: '#FAFCFF',
    textPrimary: '#102653',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    borderColor: '#DFEAFE',
    borderSubtle: '#EEF4FF',
    sidebarBg: '#0B2454',
    sidebarActive: '#17387B',
  },
  {
    id: 'dark',
    name: 'Deep Navy (Dark)',
    description: 'Subtle slate blue midnight for focused evening productivity',
    pageBg: '#0A1124',
    cardBg: '#101E3D',
    cardHover: '#15274E',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    borderColor: '#1A2D56',
    borderSubtle: '#142447',
    sidebarBg: '#071738',
    sidebarActive: '#0D265A',
  },
  {
    id: 'oled',
    name: 'OLED Pure Black',
    description: 'Pitch black, ultra high-contrast for battery & eye strain relief',
    pageBg: '#000000',
    cardBg: '#0B0F17',
    cardHover: '#111827',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    borderColor: '#1F2937',
    borderSubtle: '#111827',
    sidebarBg: '#030712',
    sidebarActive: '#1F2937',
  },
  {
    id: 'warm',
    name: 'Warm Paper',
    description: 'Soft cream tones inspired by premium notebooks',
    pageBg: '#FAF7F2',
    cardBg: '#FFFFFF',
    cardHover: '#F5EFE6',
    textPrimary: '#292524',
    textSecondary: '#78716C',
    textMuted: '#A8A29E',
    borderColor: '#E7E5E4',
    borderSubtle: '#F5F5F4',
    sidebarBg: '#1C1917',
    sidebarActive: '#292524',
  },
];

/**
 * Utility to convert hex to rgba string
 */
export function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(23, 105, 255, ${alpha})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Lighten / darken a hex color
 */
export function adjustColorBrightness(hex, percent) {
  let cleanHex = (hex || '#1769FF').replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
}

/**
 * Applies both theme mode and color combination dynamically to documentElement CSS custom properties
 */
export function applyThemeToDocument({
  theme = 'light',
  colorCombinationId = 'electric-sapphire',
  accentColor = '#1769FF',
}) {
  const root = document.documentElement;

  // 1. Resolve Theme Mode
  const modeConfig = THEME_MODES.find((m) => m.id === theme) || THEME_MODES[0];

  // Set theme attributes on HTML root
  if (theme === 'dark' || theme === 'oled') {
    root.classList.add('dark-mode');
  } else {
    root.classList.remove('dark-mode');
  }
  root.setAttribute('data-theme', theme);

  // Apply theme mode variables
  root.style.setProperty('--page-bg', modeConfig.pageBg);
  root.style.setProperty('--card-bg', modeConfig.cardBg);
  root.style.setProperty('--card-hover', modeConfig.cardHover);
  root.style.setProperty('--text-primary', modeConfig.textPrimary);
  root.style.setProperty('--text-secondary', modeConfig.textSecondary);
  root.style.setProperty('--text-muted', modeConfig.textMuted);
  root.style.setProperty('--border-color', modeConfig.borderColor);
  root.style.setProperty('--border-subtle', modeConfig.borderSubtle);
  root.style.setProperty('--sidebar-bg', modeConfig.sidebarBg);
  root.style.setProperty('--sidebar-active', modeConfig.sidebarActive);

  // 2. Resolve Color Combination
  let combo = COLOR_COMBINATIONS.find((c) => c.id === colorCombinationId);
  if (!combo) {
    combo = COLOR_COMBINATIONS.find((c) => c.primary.toLowerCase() === (accentColor || '').toLowerCase());
  }

  const primary = combo ? combo.primary : (accentColor || '#1769FF');
  const secondary = combo ? combo.secondary : adjustColorBrightness(primary, 20);
  const hover = combo ? combo.hover : adjustColorBrightness(primary, -15);
  const light = combo ? combo.light : hexToRgba(primary, 0.15);
  const glow = combo ? combo.glow : hexToRgba(primary, 0.35);
  const gradient = combo ? combo.gradient : `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;

  root.style.setProperty('--primary-color', primary);
  root.style.setProperty('--primary-hover', hover);
  root.style.setProperty('--primary-light', light);
  root.style.setProperty('--primary-glow', glow);
  root.style.setProperty('--primary-gradient', gradient);

  root.setAttribute('data-color-combo', combo ? combo.id : 'custom');

  return {
    theme,
    colorCombinationId: combo ? combo.id : 'custom',
    primary,
    modeConfig,
  };
}
