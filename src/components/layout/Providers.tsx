'use client';

import { ReactNode } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { TournamentProvider } from '@/hooks/useTournament';
import { ThemeModeProvider } from '@/hooks/useThemeMode';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeModeProvider>
      <CssBaseline />
      <TournamentProvider>{children}</TournamentProvider>
    </ThemeModeProvider>
  );
}
