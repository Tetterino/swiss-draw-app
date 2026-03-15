'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Match, Player, GameResult } from '@/types';

interface MatchResultInputProps {
  match: Match;
  player1: Player;
  player2: Player;
  bestOf: number;
  onChange: (games: GameResult, winnerId: string | null, isDraw: boolean) => void;
}

export default function MatchResultInput({ match, player1, player2, bestOf, onChange }: MatchResultInputProps) {
  const [p1Wins, setP1Wins] = useState(match.games.player1Wins);
  const [p2Wins, setP2Wins] = useState(match.games.player2Wins);
  const [draws, setDraws] = useState(match.games.draws);

  const winsNeeded = Math.ceil(bestOf / 2);
  const totalGames = p1Wins + p2Wins + draws;
  const maxGames = bestOf;

  const canAdd = totalGames < maxGames;

  // Notify parent on every score change
  useEffect(() => {
    if (p1Wins + p2Wins + draws === 0) return;

    let winnerId: string | null = null;
    let isDraw = false;

    if (p1Wins > p2Wins) {
      winnerId = player1.id;
    } else if (p2Wins > p1Wins) {
      winnerId = player2.id;
    } else {
      isDraw = true;
    }

    onChange({ player1Wins: p1Wins, player2Wins: p2Wins, draws }, winnerId, isDraw);
  }, [p1Wins, p2Wins, draws]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        {/* Player 1 */}
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }} noWrap>
            {player1.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <IconButton size="small" onClick={() => setP1Wins(Math.max(0, p1Wins - 1))} disabled={p1Wins === 0}>
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography variant="h5" sx={{ minWidth: 32, textAlign: 'center', fontWeight: 700 }}>
              {p1Wins}
            </Typography>
            <IconButton size="small" onClick={() => setP1Wins(p1Wins + 1)} disabled={!canAdd || p1Wins >= winsNeeded}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="h6" color="text.secondary">-</Typography>

        {/* Player 2 */}
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }} noWrap>
            {player2.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <IconButton size="small" onClick={() => setP2Wins(Math.max(0, p2Wins - 1))} disabled={p2Wins === 0}>
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography variant="h5" sx={{ minWidth: 32, textAlign: 'center', fontWeight: 700 }}>
              {p2Wins}
            </Typography>
            <IconButton size="small" onClick={() => setP2Wins(p2Wins + 1)} disabled={!canAdd || p2Wins >= winsNeeded}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {bestOf > 1 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">引き分け:</Typography>
          <IconButton size="small" onClick={() => setDraws(Math.max(0, draws - 1))} disabled={draws === 0}>
            <RemoveIcon fontSize="small" />
          </IconButton>
          <Typography variant="body1" sx={{ minWidth: 24, textAlign: 'center' }}>{draws}</Typography>
          <IconButton size="small" onClick={() => setDraws(draws + 1)} disabled={!canAdd}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
