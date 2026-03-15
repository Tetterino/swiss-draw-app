'use client';

import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import { Match, Player, GameResult } from '@/types';
import MatchResultInput from './MatchResultInput';

interface PendingResult {
  games: GameResult;
  winnerId: string | null;
  isDraw: boolean;
}

interface MatchCardProps {
  match: Match;
  players: Player[];
  bestOf: number;
  onChangeResult: (matchId: string, games: GameResult, winnerId: string | null, isDraw: boolean) => void;
  tableNumber: number;
  pendingResult?: PendingResult;
}

export default function MatchCard({ match, players, bestOf, onChangeResult, tableNumber, pendingResult }: MatchCardProps) {
  const [expanded, setExpanded] = useState(!match.isCompleted);

  const player1 = players.find((p) => p.id === match.player1Id);
  const player2 = match.player2Id ? players.find((p) => p.id === match.player2Id) : null;

  if (!player1) return null;

  // BYE match
  if (match.isBye) {
    return (
      <Card variant="outlined" sx={{ opacity: 0.7 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {player1.name}
            </Typography>
            <Chip label="BYE" size="small" color="default" />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!player2) return null;

  // Determine display score: use pending result if available, otherwise match data
  const displayGames = pendingResult ? pendingResult.games : match.games;
  const displayWinnerId = pendingResult ? pendingResult.winnerId : match.winnerId;
  const hasScore = match.isCompleted || !!pendingResult;

  const statusChip = match.isCompleted ? (
    <Chip label="完了" size="small" color="success" variant="outlined" />
  ) : pendingResult ? (
    <Chip label="入力済" size="small" color="info" variant="outlined" />
  ) : (
    <Chip label="未入力" size="small" color="warning" variant="outlined" />
  );

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: match.isCompleted ? 'success.main' : pendingResult ? 'info.main' : 'divider',
        borderWidth: match.isCompleted || pendingResult ? 2 : 1,
      }}
    >
      <CardContent
        sx={{ cursor: 'pointer', py: 1.5, '&:last-child': { pb: 1.5 } }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: hasScore ? 0.5 : 0 }}>
          <Typography variant="caption" color="text.secondary">
            Table {tableNumber}
          </Typography>
          {statusChip}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, my: 1 }}>
          <Typography
            variant="body1"
            sx={{
              flex: 1,
              textAlign: 'right',
              fontWeight: displayWinnerId === player1.id ? 700 : 400,
            }}
            noWrap
          >
            {player1.name}
          </Typography>
          {hasScore ? (
            <Typography variant="h6" sx={{ fontWeight: 700, minWidth: 60, textAlign: 'center' }}>
              {displayGames.player1Wins} - {displayGames.player2Wins}
            </Typography>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ minWidth: 40, textAlign: 'center' }}>
              vs
            </Typography>
          )}
          <Typography
            variant="body1"
            sx={{
              flex: 1,
              textAlign: 'left',
              fontWeight: displayWinnerId === player2.id ? 700 : 400,
            }}
            noWrap
          >
            {player2.name}
          </Typography>
        </Box>

        {hasScore && displayGames.draws > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
            (引き分け: {displayGames.draws})
          </Typography>
        )}
      </CardContent>

      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2 }}>
          <MatchResultInput
            match={match}
            player1={player1}
            player2={player2}
            bestOf={bestOf}
            onChange={(games, winnerId, isDraw) => {
              onChangeResult(match.id, games, winnerId, isDraw);
            }}
          />
        </Box>
      </Collapse>
    </Card>
  );
}
