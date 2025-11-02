// Centralized theme tokens for FinishMyWork UI
// Keep this file purely for design constants; Tailwind reads CSS variables from globals.

export const theme = {
  colors: {
    // Light
    light: {
      background: '#FFFFFF',
      surface: '#F9FAFB',
      card: '#FFFFFF',
      text: '#0B0B0D',
      muted: '#6B7280',
      border: '#E5E7EB',
    },
    // Dark
    dark: {
      background: '#0B0B0D',
      surface: '#1A1A1E',
      card: '#131316',
      text: '#F5F5F6',
      muted: '#9CA3AF',
      border: '#2A2A2F',
    },
    accent: {
      from: '#8B5CF6', // purple-500
      to: '#6D28D9',   // purple-700
    },
    status: {
      open: '#10B981', // green-500
      inProgress: '#F59E0B', // amber-500
      completed: '#9CA3AF', // gray-400
    },
  },
  radii: {
    card: '1rem', // rounded-2xl equivalent in CSS variables if needed
  },
  shadows: {
    glow: '0 12px 30px rgba(109, 40, 217, 0.18)',
    glowHover: '0 16px 40px rgba(109, 40, 217, 0.28)',
    card: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.25)',
  },
}

export type Theme = typeof theme
