'use client';

import { createContext, useContext, useMemo, useSyncExternalStore, ReactNode } from 'react';
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
const DARK_QUERY = '(prefers-color-scheme: dark)';

// What the server renders with. The first client render must match it, so both
// snapshots below fall back to these values while there is no browser to ask.
const SSR_PREFERENCE: ThemePreference = 'system';
const SSR_MODE: PaletteMode = 'dark';

const ThemeModeContext = createContext<ThemeModeContextType | null>(null);

// --- stored preference (localStorage) ---

const preferenceListeners = new Set<() => void>();

function subscribePreference(onChange: () => void): () => void {
  preferenceListeners.add(onChange);
  // Keep other tabs of the same tournament in sync.
  window.addEventListener('storage', onChange);
  return () => {
    preferenceListeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Private browsing and blocked site data both throw here.
  }
  return 'system';
}

function storePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Not persisting is better than crashing the toggle.
  }
  preferenceListeners.forEach((listener) => listener());
}

// --- system theme (matchMedia) ---

function subscribeSystemMode(onChange: () => void): () => void {
  const mql = window.matchMedia(DARK_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getSystemMode(): PaletteMode {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  // useSyncExternalStore renders the server snapshot during hydration and swaps
  // in the real value afterwards, so localStorage and matchMedia can be read
  // without the first client render disagreeing with the server HTML.
  const preference = useSyncExternalStore(subscribePreference, getPreference, () => SSR_PREFERENCE);
  const systemMode = useSyncExternalStore(subscribeSystemMode, getSystemMode, () => SSR_MODE);

  const resolved: PaletteMode = preference === 'system' ? systemMode : preference;

  const toggle = () => {
    storePreference(resolved === 'dark' ? 'light' : 'dark');
  };

  const activeTheme = useMemo(() => buildTheme(resolved), [resolved]);

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
