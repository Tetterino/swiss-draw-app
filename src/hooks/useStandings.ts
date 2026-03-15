'use client';

import { useMemo } from 'react';
import { Tournament, PlayerStanding } from '@/types';
import { calculateStandings } from '@/lib/swiss/standings';

export function useStandings(tournament: Tournament | undefined): PlayerStanding[] {
  return useMemo(() => {
    if (!tournament) return [];
    return calculateStandings(tournament);
  }, [tournament]);
}
