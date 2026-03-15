'use client';

import { ReactNode } from 'react';
import { TournamentProvider } from '@/hooks/useTournament';

export default function Providers({ children }: { children: ReactNode }) {
  return <TournamentProvider>{children}</TournamentProvider>;
}
