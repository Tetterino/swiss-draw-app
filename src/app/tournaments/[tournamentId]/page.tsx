'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTournament } from '@/hooks/useTournament';

export default function TournamentDashboard() {
  const params = useParams();
  const router = useRouter();
  const { getTournament, state } = useTournament();

  const tournamentId = params.tournamentId as string;
  const tournament = getTournament(tournamentId);

  useEffect(() => {
    if (!state.loaded) return;
    if (!tournament) {
      router.replace('/');
      return;
    }

    switch (tournament.phase) {
      case 'registration':
        router.replace(`/tournaments/${tournamentId}/players`);
        break;
      case 'rounds': {
        const currentRound = tournament.rounds.length;
        router.replace(`/tournaments/${tournamentId}/rounds/${currentRound}`);
        break;
      }
      case 'finished':
        router.replace(`/tournaments/${tournamentId}/standings`);
        break;
    }
  }, [tournament, tournamentId, router, state.loaded]);

  return null;
}
