export interface ThemeTokens {
  background: string;
  surface: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  text: string;
  muted: string;
  border: string;
  danger: string;
}

export const lightTheme: ThemeTokens = {
  background: '#FFFACD', // Lemon Chiffon
  surface:    'rgba(255,255,255,0.72)',
  primary:    '#B81104', // Milano Red
  primarySoft:'rgba(184,17,4,0.12)',
  onPrimary:  '#FFFFFF',
  text:       '#1A1A1A',
  muted:      '#6B6B6B',
  border:     'rgba(0,0,0,0.10)',
  danger:     '#C0392B',
};

export const darkTheme: ThemeTokens = {
  background: '#0B0B0D', // Flamengo
  surface:    'rgba(255,255,255,0.08)',
  primary:    '#E6141E',
  primarySoft:'rgba(230,20,30,0.18)',
  onPrimary:  '#FFFFFF',
  text:       '#F0F0F0',
  muted:      '#9B9B9B',
  border:     'rgba(255,255,255,0.12)',
  danger:     '#E74C3C',
};

export const spacing = {
  xs:  4,
  sm:  8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm:  8,
  md: 12,
  lg: 20,
  xl: 32,
} as const;
