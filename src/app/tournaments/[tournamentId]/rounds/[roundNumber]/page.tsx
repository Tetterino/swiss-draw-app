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
import UndoIcon from '@mui/icons-material/Undo';
import AppHeader from '@/components/layout/AppHeader';
import NavigationStepper from '@/components/layout/NavigationStepper';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import MatchCard from '@/components/round/MatchCard';
import RoundProgressBar from '@/components/round/RoundProgressBar';
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
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ id: string; name: string } | null>(null);
  const [undropTarget, setUndropTarget] = useState<{ id: string; name: string } | null>(null);
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

  // All non-bye matches either already completed or have pending input
  const allMatchesReady = nonByeMatches.every(
    (m) => m.isCompleted || pendingResults[m.id]
  );
  const hasPendingResults = Object.keys(pendingResults).length > 0;

  const isLastRound = roundNumber >= tournament.totalRounds;
  const standingsTabIndex = tournament.rounds.length;
  const currentTabValue = showStandings ? standingsTabIndex : roundNumber - 1;

  const handleChangeResult = (matchId: string, games: GameResult, winnerId: string | null, isDraw: boolean) => {
    if (games.player1Wins === 0 && games.player2Wins === 0 && games.draws === 0) {
      setPendingResults((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    } else {
      setPendingResults((prev) => ({
        ...prev,
        [matchId]: { games, winnerId, isDraw },
      }));
    }
  };

  const confirmPendingResults = () => {
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
    confirmPendingResults();
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
    confirmPendingResults();
    dispatch({ type: 'COMPLETE_ROUND', payload: { tournamentId, roundNumber } });
    dispatch({ type: 'FINISH_TOURNAMENT', payload: tournamentId });
    setConfirmFinish(false);
    router.push(`/tournaments/${tournamentId}/standings`);
  };

  const handleUndoRound = () => {
    dispatch({ type: 'UNDO_LAST_ROUND', payload: { tournamentId } });
    setConfirmUndo(false);
    if (tournament.phase === 'finished') {
      // Stay on the same round (just re-opened)
      router.refresh();
    } else {
      router.push(`/tournaments/${tournamentId}/rounds/${roundNumber - 1}`);
    }
  };

  const handleDropPlayer = () => {
    if (!dropTarget) return;
    dispatch({
      type: 'DROP_PLAYER',
      payload: { tournamentId, playerId: dropTarget.id },
    });
    setDropTarget(null);
  };

  const handleUndropPlayer = () => {
    if (!undropTarget) return;
    dispatch({
      type: 'UNDROP_PLAYER',
      payload: { tournamentId, playerId: undropTarget.id },
    });
    setUndropTarget(null);
  };

  // Sort matches: by combined match points (descending), BYE at bottom
  const standingMap = new Map(standings.map((s) => [s.playerId, s.matchPoints]));
  const sortedMatches = [...round.matches].sort((a, b) => {
    if (a.isBye !== b.isBye) return a.isBye ? 1 : -1;
    const totalA = (standingMap.get(a.player1Id) ?? 0) + (standingMap.get(a.player2Id ?? '') ?? 0);
    const totalB = (standingMap.get(b.player1Id) ?? 0) + (standingMap.get(b.player2Id ?? '') ?? 0);
    return totalB - totalA;
  });

  const canDrop = isLatestRound && !round.isCompleted;

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
              {sortedMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  players={tournament.players}
                  bestOf={tournament.bestOf}
                  onChangeResult={handleChangeResult}
                  tableNumber={match.isBye ? 0 : round.matches.filter((m) => !m.isBye).indexOf(match) + 1}
                  pendingResult={pendingResults[match.id]}
                  canDrop={canDrop}
                  onDropPlayer={(playerId, playerName) => setDropTarget({ id: playerId, name: playerName })}
                  onUndropPlayer={(playerId, playerName) => setUndropTarget({ id: playerId, name: playerName })}
                />
              ))}
            </Stack>

            {(allMatchesCompleted || (allMatchesReady && hasPendingResults)) && !round.isCompleted && (
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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
                  <>
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
                    <Button
                      variant="outlined"
                      color="success"
                      size="large"
                      fullWidth
                      startIcon={<EmojiEventsIcon />}
                      onClick={() => setConfirmFinish(true)}
                      sx={{ py: 1.5 }}
                    >
                      このラウンドで大会を終了
                    </Button>
                  </>
                )}
              </Box>
            )}

            {isLatestRound && tournament.rounds.length >= 2 && (!round.isCompleted || tournament.phase === 'finished') && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  color="warning"
                  size="large"
                  fullWidth
                  startIcon={<UndoIcon />}
                  onClick={() => setConfirmUndo(true)}
                  sx={{ py: 1.5 }}
                >
                  {tournament.phase === 'finished' ? '最終ラウンドを再開する' : '前のラウンドに戻す'}
                </Button>
              </Box>
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

        <ConfirmDialog
          open={!!dropTarget}
          title="プレイヤーをドロップ"
          message={`${dropTarget?.name ?? ''} を大会からドロップ（途中辞退）しますか？`}
          confirmLabel="ドロップ"
          onConfirm={handleDropPlayer}
          onCancel={() => setDropTarget(null)}
        />

        <ConfirmDialog
          open={!!undropTarget}
          title="プレイヤーを復帰"
          message={`${undropTarget?.name ?? ''} を大会に復帰させますか？次のラウンドからマッチングに含まれます。`}
          confirmLabel="復帰"
          onConfirm={handleUndropPlayer}
          onCancel={() => setUndropTarget(null)}
        />

        <ConfirmDialog
          open={confirmUndo}
          title={tournament.phase === 'finished' ? '最終ラウンドを再開' : 'ラウンドを戻す'}
          message={
            tournament.phase === 'finished'
              ? `大会終了を取り消し、ラウンド ${roundNumber} の結果を修正できるようにしますか？`
              : `ラウンド ${roundNumber} を削除して、ラウンド ${roundNumber - 1} に戻しますか？前ラウンドの結果はそのまま残ります。`
          }
          confirmLabel={tournament.phase === 'finished' ? '再開' : '戻す'}
          onConfirm={handleUndoRound}
          onCancel={() => setConfirmUndo(false)}
        />
      </Container>
    </>
  );
}
