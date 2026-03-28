'use client';

import { createTheme, type PaletteMode } from '@mui/material/styles';

const shared = {
  typography: {
    fontFamily: '"Noto Sans JP", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none' as const,
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
};

export function buildTheme(mode: PaletteMode) {
  return createTheme({
    ...shared,
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#00bcd4' : '#0288d1',
      },
      secondary: {
        main: '#e040fb',
      },
      ...(mode === 'dark'
        ? {
            background: { default: '#121212', paper: '#1e1e1e' },
          }
        : {}),
    },
  });
}

// Default export for backwards compat (dark)
const theme = buildTheme('dark');
export default theme;
