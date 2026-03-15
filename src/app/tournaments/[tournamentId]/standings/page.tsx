'use client';

import { useParams, useRouter } from 'next/navigation';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AppHeader from '@/components/layout/AppHeader';
import NavigationStepper from '@/components/layout/NavigationStepper';
import StandingsTable from '@/components/standings/StandingsTable';
import { useTournament } from '@/hooks/useTournament';
import { useStandings } from '@/hooks/useStandings';

export default function StandingsPage() {
  const params = useParams();
  const router = useRouter();
  const { getTournament } = useTournament();

  const tournamentId = params.tournamentId as string;
  const tournament = getTournament(tournamentId);
  const standings = useStandings(tournament);

  if (!tournament) return null;

  const winner = standings.length > 0 ? standings[0] : null;

  return (
    <>
      <AppHeader title={tournament.name} backHref="/" />
      <NavigationStepper
        phase={tournament.phase}
        currentRound={tournament.rounds.length}
        totalRounds={tournament.totalRounds}
      />

      <Container maxWidth="md" sx={{ py: 2 }}>
        {tournament.phase === 'finished' && winner && (
          <Box sx={{ textAlign: 'center', mb: 3, py: 2 }}>
            <EmojiEventsIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {winner.playerName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              優勝 - {winner.matchWins}勝 {winner.matchLosses}敗 {winner.matchDraws}分
            </Typography>
          </Box>
        )}

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          最終順位表
        </Typography>

        <StandingsTable standings={standings} />

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => router.push('/')}
          >
            トップに戻る
          </Button>
        </Box>
      </Container>
    </>
  );
}
