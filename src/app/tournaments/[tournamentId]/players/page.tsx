'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AppHeader from '@/components/layout/AppHeader';
import NavigationStepper from '@/components/layout/NavigationStepper';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import PlayerRegistrationForm from '@/components/player/PlayerRegistrationForm';
import PlayerBulkImport from '@/components/player/PlayerBulkImport';
import PlayerList from '@/components/player/PlayerList';
import { useTournament } from '@/hooks/useTournament';
import { generatePairings } from '@/lib/swiss/pairing';

export default function PlayersPage() {
  const params = useParams();
  const router = useRouter();
  const { getTournament, dispatch } = useTournament();
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [customRounds, setCustomRounds] = useState<number | null>(null);

  const tournamentId = params.tournamentId as string;
  const tournament = getTournament(tournamentId);

  if (!tournament) return null;

  const handleAddPlayer = (name: string) => {
    dispatch({ type: 'ADD_PLAYER', payload: { tournamentId, name } });
  };

  const handleBulkImport = (names: string[]) => {
    dispatch({ type: 'ADD_PLAYERS_BULK', payload: { tournamentId, names } });
  };

  const handleRemovePlayer = (playerId: string) => {
    dispatch({ type: 'REMOVE_PLAYER', payload: { tournamentId, playerId } });
  };

  const activePlayers = tournament.players.filter((p) => p.status === 'active');
  const canStart = activePlayers.length >= 2;
  const defaultRounds = Math.ceil(Math.log2(Math.max(activePlayers.length, 2)));
  const totalRounds = customRounds ?? defaultRounds;

  const handleStartTournament = () => {
    const firstRound = generatePairings(tournament.players, [], tournament.bestOf, tournament.players);
    dispatch({
      type: 'START_TOURNAMENT',
      payload: { tournamentId, rounds: [firstRound], totalRounds },
    });
    router.push(`/tournaments/${tournamentId}/rounds/1`);
  };

  return (
    <>
      <AppHeader title={tournament.name} backHref="/" />
      <NavigationStepper phase={tournament.phase} />
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <PlayerRegistrationForm onAdd={handleAddPlayer} />
          <PlayerBulkImport onImport={handleBulkImport} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              登録プレイヤー ({activePlayers.length}人)
            </Typography>
            {activePlayers.length % 2 === 1 && activePlayers.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                奇数のためBYEが発生します
              </Typography>
            )}
          </Box>

          <PlayerList players={activePlayers} onRemove={handleRemovePlayer} />

          {!canStart && (
            <Alert severity="info">大会を開始するには2人以上のプレイヤーが必要です。</Alert>
          )}

          {canStart && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                ラウンド数
              </Typography>
              <IconButton
                size="small"
                onClick={() => setCustomRounds(Math.max(1, totalRounds - 1))}
                disabled={totalRounds <= 1}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
                {totalRounds}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setCustomRounds(totalRounds + 1)}
              >
                <AddIcon fontSize="small" />
              </IconButton>
              {customRounds !== null && customRounds !== defaultRounds && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setCustomRounds(null)}
                >
                  推奨値({defaultRounds})に戻す
                </Typography>
              )}
            </Box>
          )}

          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<PlayArrowIcon />}
            disabled={!canStart}
            onClick={() => setStartDialogOpen(true)}
            sx={{ py: 1.5 }}
          >
            大会を開始 ({totalRounds}ラウンド)
          </Button>
        </Box>

        <ConfirmDialog
          open={startDialogOpen}
          title="大会を開始"
          message={`${activePlayers.length}人で大会を開始しますか？開始後はプレイヤーの追加・削除ができなくなります。`}
          confirmLabel="開始"
          onConfirm={handleStartTournament}
          onCancel={() => setStartDialogOpen(false)}
        />
      </Container>
    </>
  );
}
