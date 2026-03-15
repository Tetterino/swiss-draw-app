'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { Tournament } from '@/types';

const phaseLabels: Record<string, { label: string; color: 'default' | 'primary' | 'success' }> = {
  registration: { label: '登録中', color: 'default' },
  rounds: { label: '進行中', color: 'primary' },
  finished: { label: '終了', color: 'success' },
};

interface TournamentCardProps {
  tournament: Tournament;
  onClick: () => void;
  onDelete: () => void;
}

export default function TournamentCard({ tournament, onClick, onDelete }: TournamentCardProps) {
  const phaseInfo = phaseLabels[tournament.phase];
  const currentRound = tournament.rounds.length;

  return (
    <Card elevation={2}>
      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        <CardActionArea onClick={onClick} sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                {tournament.name}
              </Typography>
              <Chip label={phaseInfo.label} color={phaseInfo.color} size="small" />
            </Box>
            <Typography variant="body2" color="text.secondary">
              参加者: {tournament.players.length}人 / Best of {tournament.bestOf}
              {tournament.phase !== 'registration' && ` / ラウンド ${currentRound}/${tournament.totalRounds}`}
            </Typography>
          </CardContent>
        </CardActionArea>
        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
}
