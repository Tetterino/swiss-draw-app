'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import AppHeader from '@/components/layout/AppHeader';
import TournamentCreateForm from '@/components/tournament/TournamentCreateForm';
import TournamentCard from '@/components/tournament/TournamentCard';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { useTournament } from '@/hooks/useTournament';

export default function HomePage() {
  const { state, dispatch } = useTournament();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleCreate = (name: string, bestOf: number) => {
    dispatch({ type: 'CREATE_TOURNAMENT', payload: { name, bestOf } });
  };

  const handleDelete = () => {
    if (deleteTarget) {
      dispatch({ type: 'DELETE_TOURNAMENT', payload: deleteTarget });
      setDeleteTarget(null);
    }
  };

  const handleTournamentClick = (id: string) => {
    router.push(`/tournaments/${id}`);
  };

  // Sort by created date descending
  const sortedTournaments = [...state.tournaments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      <AppHeader title="Swiss Draw" />
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TournamentCreateForm onSubmit={handleCreate} />
        </Box>

        {sortedTournaments.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
            大会がありません。新しい大会を作成してください。
          </Typography>
        ) : (
          <Stack spacing={2}>
            {sortedTournaments.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                onClick={() => handleTournamentClick(t.id)}
                onDelete={() => setDeleteTarget(t.id)}
              />
            ))}
          </Stack>
        )}

        <ConfirmDialog
          open={deleteTarget !== null}
          title="大会を削除"
          message="この大会を削除しますか？この操作は元に戻せません。"
          confirmLabel="削除"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </Container>
    </>
  );
}
