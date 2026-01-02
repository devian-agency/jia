// JIA App Theme Configuration
export const theme = {
  colors: {
    // Primary - Deep Romantic Rose
    primary: {
      50: "#fdf2f4",
      100: "#fce7eb",
      200: "#f9d0d9",
      300: "#f4a9bb",
      400: "#eb7a97",
      500: "#df5278",
      600: "#cb3562",
      700: "#ab2550",
      800: "#8e2348",
      900: "#792143",
    },
    // Secondary - Soft Purple Dream
    secondary: {
      50: "#f5f3ff",
      100: "#ede9fe",
      200: "#ddd6fe",
      300: "#c4b5fd",
      400: "#a78bfa",
      500: "#8b5cf6",
      600: "#7c3aed",
      700: "#6d28d9",
      800: "#5b21b6",
      900: "#4c1d95",
    },
    // Accent - Warm Coral
    accent: {
      400: "#fb7185",
      500: "#f43f5e",
      600: "#e11d48",
    },
    // Dark backgrounds
    dark: {
      primary: "#0a0a0f",
      secondary: "#14141f",
      tertiary: "#1e1e2d",
      card: "#252538",
      border: "#353548",
    },
    // Text colors
    text: {
      primary: "#ffffff",
      secondary: "#a1a1aa",
      muted: "#71717a",
    },
    // Status colors
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    fontFamily: {
      primary: "instrument",
      system: "System",
    },
    sizes: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
  },
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    glow: {
      shadowColor: "#df5278",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 10,
    },
  },
};

export type Theme = typeof theme;
