'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AppHeader from '@/components/layout/AppHeader';
import NavigationStepper from '@/components/layout/NavigationStepper';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import MatchCard from '@/components/round/MatchCard';
import RoundProgressBar from '@/components/round/RoundProgressBar';
import PlayerManagement from '@/components/round/PlayerManagement';
import StandingsTable from '@/components/standings/StandingsTable';
import { useTournament } from '@/hooks/useTournament';
import { useStandings } from '@/hooks/useStandings';
import { generatePairings } from '@/lib/swiss/pairing';
import { GameResult } from '@/types';

interface PendingResult {
  games: GameResult;
  winnerId: string | null;
  isDraw: boolean;
}

export default function RoundPage() {
  const params = useParams();
  const router = useRouter();
  const { getTournament, dispatch } = useTournament();
  const [confirmNext, setConfirmNext] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [showStandings, setShowStandings] = useState(false);
  const [pendingResults, setPendingResults] = useState<Record<string, PendingResult>>({});

  const tournamentId = params.tournamentId as string;
  const roundNumber = parseInt(params.roundNumber as string, 10);
  const tournament = getTournament(tournamentId);
  const standings = useStandings(tournament);

  if (!tournament) return null;

  const round = tournament.rounds.find((r) => r.roundNumber === roundNumber);
  if (!round) return null;

  const nonByeMatches = round.matches.filter((m) => !m.isBye);
  const allMatchesCompleted = nonByeMatches.every((m) => m.isCompleted);
  const isLatestRound = roundNumber === tournament.rounds.length;

  // Check if all non-bye matches have pending results (for batch confirm)
  const allMatchesHavePendingOrCompleted = nonByeMatches.every(
    (m) => m.isCompleted || pendingResults[m.id]
  );
  const hasPendingResults = Object.keys(pendingResults).length > 0;
  const canBatchConfirm = !allMatchesCompleted && allMatchesHavePendingOrCompleted && hasPendingResults;

  const isLastRound = roundNumber >= tournament.totalRounds;
  const standingsTabIndex = tournament.rounds.length;
  const currentTabValue = showStandings ? standingsTabIndex : roundNumber - 1;

  const handleChangeResult = (matchId: string, games: GameResult, winnerId: string | null, isDraw: boolean) => {
    setPendingResults((prev) => ({
      ...prev,
      [matchId]: { games, winnerId, isDraw },
    }));
  };

  const handleBatchConfirm = () => {
    // Dispatch all pending results at once
    for (const [matchId, result] of Object.entries(pendingResults)) {
      dispatch({
        type: 'UPDATE_MATCH_RESULT',
        payload: {
          tournamentId,
          roundNumber,
          matchId,
          games: result.games,
          winnerId: result.winnerId,
          isDraw: result.isDraw,
        },
      });
    }
    setPendingResults({});
  };

  const handleNextRound = () => {
    dispatch({ type: 'COMPLETE_ROUND', payload: { tournamentId, roundNumber } });

    const nextRound = generatePairings(
      tournament.players,
      tournament.rounds.map((r) => (r.roundNumber === roundNumber ? { ...r, isCompleted: true } : r)),
      tournament.bestOf,
      tournament.players
    );
    dispatch({ type: 'ADD_ROUND', payload: { tournamentId, round: nextRound } });

    setConfirmNext(false);
    router.push(`/tournaments/${tournamentId}/rounds/${roundNumber + 1}`);
  };

  const handleFinishTournament = () => {
    dispatch({ type: 'COMPLETE_ROUND', payload: { tournamentId, roundNumber } });
    dispatch({ type: 'FINISH_TOURNAMENT', payload: tournamentId });
    setConfirmFinish(false);
    router.push(`/tournaments/${tournamentId}/standings`);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    if (newValue === standingsTabIndex) {
      setShowStandings(true);
    } else {
      setShowStandings(false);
      if (newValue + 1 !== roundNumber) {
        router.push(`/tournaments/${tournamentId}/rounds/${newValue + 1}`);
      }
    }
  };

  return (
    <>
      <AppHeader title={tournament.name} backHref="/" />
      <NavigationStepper
        phase={tournament.phase}
        currentRound={roundNumber}
        totalRounds={tournament.totalRounds}
      />

      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Tabs
          value={currentTabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          {tournament.rounds.map((r) => (
            <Tab key={r.roundNumber} label={`R${r.roundNumber}`} />
          ))}
          <Tab label="順位表" />
        </Tabs>

        {showStandings ? (
          <StandingsTable standings={standings} />
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                ラウンド {roundNumber}
              </Typography>
              <RoundProgressBar round={round} />
            </Box>

            <Stack spacing={1.5}>
              {[...round.matches]
                .sort((a, b) => {
                  if (a.isBye !== b.isBye) return a.isBye ? 1 : -1;
                  const standingMap = new Map(standings.map((s) => [s.playerId, s.matchPoints]));
                  const totalA = (standingMap.get(a.player1Id) ?? 0) + (standingMap.get(a.player2Id ?? '') ?? 0);
                  const totalB = (standingMap.get(b.player1Id) ?? 0) + (standingMap.get(b.player2Id ?? '') ?? 0);
                  return totalB - totalA;
                })
                .map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  players={tournament.players}
                  bestOf={tournament.bestOf}
                  onChangeResult={handleChangeResult}
                  tableNumber={match.isBye ? 0 : round.matches.filter((m) => !m.isBye).indexOf(match) + 1}
                  pendingResult={pendingResults[match.id]}
                />
              ))}
            </Stack>

            {canBatchConfirm && (
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<CheckCircleIcon />}
                  onClick={handleBatchConfirm}
                  sx={{ py: 1.5 }}
                >
                  ラウンド結果を一括確定
                </Button>
              </Box>
            )}

            {allMatchesCompleted && !round.isCompleted && (
              <Box sx={{ mt: 3 }}>
                {isLastRound ? (
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    fullWidth
                    startIcon={<EmojiEventsIcon />}
                    onClick={() => setConfirmFinish(true)}
                    sx={{ py: 1.5 }}
                  >
                    大会を終了して結果を確認
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    endIcon={<NavigateNextIcon />}
                    onClick={() => setConfirmNext(true)}
                    sx={{ py: 1.5 }}
                  >
                    次のラウンドへ (ラウンド {roundNumber + 1})
                  </Button>
                )}
              </Box>
            )}

            {isLatestRound && !round.isCompleted && (
              <PlayerManagement
                tournament={tournament}
                dispatch={dispatch}
              />
            )}
          </>
        )}

        <ConfirmDialog
          open={confirmNext}
          title="次のラウンドへ"
          message="全試合の結果を確定し、次のラウンドのマッチングを生成しますか？"
          confirmLabel="次へ"
          onConfirm={handleNextRound}
          onCancel={() => setConfirmNext(false)}
        />

        <ConfirmDialog
          open={confirmFinish}
          title="大会を終了"
          message="全ラウンドの結果を確定し、大会を終了しますか？"
          confirmLabel="終了"
          onConfirm={handleFinishTournament}
          onCancel={() => setConfirmFinish(false)}
        />
      </Container>
    </>
  );
}
