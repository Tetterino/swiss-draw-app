'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import UndoIcon from '@mui/icons-material/Undo';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AppHeader from '@/components/layout/AppHeader';
import NavigationStepper from '@/components/layout/NavigationStepper';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import StandingsTable from '@/components/standings/StandingsTable';
import { useTournament } from '@/hooks/useTournament';
import { useStandings } from '@/hooks/useStandings';

export default function StandingsPage() {
  const params = useParams();
  const router = useRouter();
  const { getTournament, dispatch } = useTournament();
  const [confirmUndo, setConfirmUndo] = useState(false);

  const tournamentId = params.tournamentId as string;
  const tournament = getTournament(tournamentId);
  const standings = useStandings(tournament);

  if (!tournament) return null;

  const winner = standings.length > 0 ? standings[0] : null;
  const lastRound = tournament.rounds.length;

  const handleExportCsv = () => {
    const header = [
      '順位',
      'プレイヤー',
      'MP',
      '勝',
      '敗',
      '分',
      'OMW%',
      'GW%',
      'OGW%',
      '勝手累点',
      '対手累点',
      'ステータス',
    ];
    const rows = standings.map((s) => [
      s.rank,
      s.playerName,
      s.matchPoints,
      s.matchWins,
      s.matchLosses,
      s.matchDraws,
      (s.omwPercent * 100).toFixed(2),
      (s.gwPercent * 100).toFixed(2),
      (s.ogwPercent * 100).toFixed(2),
      s.winTotalPoint,
      s.opponentTotalPoint,
      s.isDropped ? 'Dropped' : 'Active',
    ]);
    const bom = '\uFEFF';
    const csv = bom + [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tournament.name}_standings.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUndoFinish = () => {
    dispatch({ type: 'UNDO_LAST_ROUND', payload: { tournamentId } });
    setConfirmUndo(false);
    router.push(`/tournaments/${tournamentId}/rounds/${lastRound}`);
  };

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

        <Box sx={{ mt: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportCsv}
          >
            CSVエクスポート
          </Button>
          {tournament.phase === 'finished' && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<UndoIcon />}
              onClick={() => setConfirmUndo(true)}
            >
              最終ラウンドを再開する
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => router.push('/')}
          >
            トップに戻る
          </Button>
        </Box>

        <ConfirmDialog
          open={confirmUndo}
          title="最終ラウンドを再開"
          message={`大会終了を取り消し、ラウンド ${lastRound} の結果を修正できるようにしますか？`}
          confirmLabel="再開"
          onConfirm={handleUndoFinish}
          onCancel={() => setConfirmUndo(false)}
        />
      </Container>
    </>
  );
}
