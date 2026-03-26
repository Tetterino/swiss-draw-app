'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material/styles';
import { buildTheme } from '@/theme';

type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeModeContextType {
  preference: ThemePreference;
  resolved: PaletteMode;
  toggle: () => void;
}

const STORAGE_KEY = 'swiss-draw-theme';

const ThemeModeContext = createContext<ThemeModeContextType | null>(null);

function getSystemMode(): PaletteMode {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function loadPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [systemMode, setSystemMode] = useState<PaletteMode>('dark');
  const [mounted, setMounted] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    setPreference(loadPreference());
    setSystemMode(getSystemMode());
    setMounted(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemMode(e.matches ? 'dark' : 'light');
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const resolved: PaletteMode = preference === 'system' ? systemMode : preference;

  const toggle = () => {
    const next: ThemePreference = resolved === 'dark' ? 'light' : 'dark';
    setPreference(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const theme = useMemo(() => buildTheme(resolved), [resolved]);

  // Avoid hydration mismatch: render dark by default until mounted
  const activeTheme = useMemo(() => (mounted ? theme : buildTheme('dark')), [mounted, theme]);

  return (
    <ThemeModeContext.Provider value={{ preference, resolved, toggle }}>
      <ThemeProvider theme={activeTheme}>
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
}
