'use client';

import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { Round } from '@/types';

interface RoundProgressBarProps {
  round: Round;
}

export default function RoundProgressBar({ round }: RoundProgressBarProps) {
  const totalMatches = round.matches.filter((m) => !m.isBye).length;
  const completedMatches = round.matches.filter((m) => m.isCompleted && !m.isBye).length;
  const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ flex: 1 }}>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
        {completedMatches}/{totalMatches}
      </Typography>
    </Box>
  );
}
