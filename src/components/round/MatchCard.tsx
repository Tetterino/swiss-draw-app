'use client';

import { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ButtonBase from '@mui/material/ButtonBase';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ReplayIcon from '@mui/icons-material/Replay';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import { Match, Player, GameResult } from '@/types';

interface PendingResult {
  games: GameResult;
  winnerId: string | null;
  isDraw: boolean;
  isBothLoss: boolean;
}

interface MatchCardProps {
  match: Match;
  players: Player[];
  bestOf: number;
  onChangeResult: (matchId: string, games: GameResult, winnerId: string | null, isDraw: boolean, isBothLoss: boolean) => void;
  tableNumber: number;
  pendingResult?: PendingResult;
  canDrop?: boolean;
  onDropPlayer?: (playerId: string, playerName: string) => void;
}

export default function MatchCard({ match, players, bestOf, onChangeResult, tableNumber, pendingResult, canDrop, onDropPlayer }: MatchCardProps) {
  const player1 = players.find((p) => p.id === match.player1Id);
  const player2 = match.player2Id ? players.find((p) => p.id === match.player2Id) : null;

  // Counter state — initialise from pending result or match data
  const initial = pendingResult ? pendingResult.games : match.games;
  const [p1Wins, setP1Wins] = useState(initial.player1Wins);
  const [p2Wins, setP2Wins] = useState(initial.player2Wins);
  const [draws, setDraws] = useState(initial.draws);

  const winsNeeded = Math.ceil(bestOf / 2);
  const totalGames = p1Wins + p2Wins + draws;
  const canAdd = totalGames < bestOf;

  // Both-loss state
  const [isBothLoss, setIsBothLoss] = useState(
    pendingResult ? pendingResult.isBothLoss : (match.isBothLoss ?? false)
  );

  const inputDisabled = match.isCompleted || isBothLoss;

  // Notify parent on score change
  useEffect(() => {
    if (p1Wins + p2Wins + draws === 0 && !isBothLoss) return;

    let winnerId: string | null = null;
    let isDraw = false;

    if (!isBothLoss && player1 && player2) {
      if (p1Wins > p2Wins) {
        winnerId = player1.id;
      } else if (p2Wins > p1Wins) {
        winnerId = player2.id;
      } else {
        isDraw = true;
      }
    }

    onChangeResult(match.id, { player1Wins: p1Wins, player2Wins: p2Wins, draws }, winnerId, isDraw, isBothLoss);
  }, [p1Wins, p2Wins, draws, isBothLoss]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    setP1Wins(0);
    setP2Wins(0);
    setDraws(0);
    setIsBothLoss(false);
    // Explicitly notify parent to clear pending result
    onChangeResult(match.id, { player1Wins: 0, player2Wins: 0, draws: 0 }, null, false, false);
  };

  const handleBothLoss = () => {
    setP1Wins(0);
    setP2Wins(0);
    setDraws(0);
    setIsBothLoss(true);
  };

  if (!player1) return null;

  const zoneSx = {
    borderRadius: 1,
    py: 1,
    px: 0.5,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'action.hover',
  } as const;

  const playerZoneSx = {
    ...zoneSx,
    flex: 1,
    userSelect: 'none',
    WebkitTouchCallout: 'none',
    transition: 'background-color 0.1s',
    '&:active': { backgroundColor: 'action.selected' },
  } as const;

  const dropButtonSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0.5,
    py: 0.5,
    borderRadius: 1,
    color: 'text.secondary',
    '&:hover': { color: 'error.main' },
  } as const;

  // Drop row — 3-column layout aligned with tap zones above
  const dropRow = canDrop && onDropPlayer && (
    <Box sx={{ display: 'flex', mt: 0.75, gap: 0.5 }}>
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {player1.status === 'active' && (
          <ButtonBase onClick={() => onDropPlayer(player1.id, player1.name)} sx={dropButtonSx}>
            <PersonOffIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption">Drop</Typography>
          </ButtonBase>
        )}
      </Box>
      <Box sx={{ minWidth: 72 }} />
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {player2 && player2.status === 'active' && (
          <ButtonBase onClick={() => onDropPlayer(player2.id, player2.name)} sx={dropButtonSx}>
            <PersonOffIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption">Drop</Typography>
          </ButtonBase>
        )}
      </Box>
    </Box>
  );

  // BYE match — same card layout as normal matches but with forced result
  if (match.isBye) {
    return (
      <Card
        variant="outlined"
        sx={{
          borderColor: 'success.main',
          borderWidth: 2,
        }}
      >
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              BYE
            </Typography>
            <Chip label="完了" size="small" color="success" variant="outlined" />
          </Box>

          {/* Three-zone layout matching normal cards — score area dimmed */}
          <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0.5, opacity: 0.5 }}>
            <Box sx={{ ...zoneSx, flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'center' }} noWrap>
                {player1.name}
              </Typography>
            </Box>

            <Box sx={{ ...zoneSx, minWidth: 72 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {winsNeeded} - 0
              </Typography>
            </Box>

            <Box sx={{ ...zoneSx, flex: 1 }}>
              <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center' }} noWrap>
                &mdash;
              </Typography>
            </Box>
          </Box>

          {dropRow}
        </CardContent>
      </Card>
    );
  }

  if (!player2) return null;

  // Display values
  const displayWinnerId = pendingResult ? pendingResult.winnerId : match.winnerId;
  const displayBothLoss = isBothLoss;
  const hasInput = p1Wins + p2Wins + draws > 0 || isBothLoss;

  const statusChip = match.isCompleted ? (
    <Chip label="完了" size="small" color="success" variant="outlined" />
  ) : hasInput ? (
    <Chip label="入力済" size="small" color="info" variant="outlined" />
  ) : (
    <Chip label="未入力" size="small" color="warning" variant="outlined" />
  );

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: match.isCompleted ? 'success.main' : hasInput ? 'info.main' : 'divider',
        borderWidth: match.isCompleted || hasInput ? 2 : 1,
      }}
    >
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Header: table number + status + reset */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Table {tableNumber}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {hasInput && !match.isCompleted && (
              <Chip
                label="リセット"
                size="small"
                variant="outlined"
                icon={<ReplayIcon />}
                onClick={handleReset}
                sx={{ height: 24, '& .MuiChip-label': { px: 0.5, fontSize: '0.7rem' }, '& .MuiChip-icon': { fontSize: 14 } }}
              />
            )}
            {statusChip}
          </Box>
        </Box>

        {/* Score zones — player name tappable for +1 */}
        <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0.5 }}>
          <ButtonBase
            sx={playerZoneSx}
            onClick={() => { if (canAdd && p1Wins < winsNeeded) setP1Wins((v) => v + 1); }}
            disabled={inputDisabled || !canAdd || p1Wins >= winsNeeded}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: displayWinnerId === player1.id ? 700 : 400,
                width: '100%',
                textAlign: 'center',
                ...(displayBothLoss ? { color: 'error.main' } : {}),
              }}
              noWrap
            >
              {player1.name}
            </Typography>
          </ButtonBase>

          <Box sx={{ ...zoneSx, minWidth: 72 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, ...(displayBothLoss ? { color: 'error.main' } : {}) }}>
              {p1Wins} - {p2Wins}
            </Typography>
            {displayBothLoss ? (
              <Typography variant="caption" color="error">
                両負け
              </Typography>
            ) : bestOf > 1 ? (
              <Typography variant="caption" color="text.secondary">
                引分 {draws}
              </Typography>
            ) : null}
          </Box>

          <ButtonBase
            sx={playerZoneSx}
            onClick={() => { if (canAdd && p2Wins < winsNeeded) setP2Wins((v) => v + 1); }}
            disabled={inputDisabled || !canAdd || p2Wins >= winsNeeded}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: displayWinnerId === player2.id ? 700 : 400,
                width: '100%',
                textAlign: 'center',
                ...(displayBothLoss ? { color: 'error.main' } : {}),
              }}
              noWrap
            >
              {player2.name}
            </Typography>
          </ButtonBase>
        </Box>

        {/* Controls row: +/- buttons and both-loss */}
        {!match.isCompleted && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.75, gap: 0.5 }}>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 0.25 }}>
              <IconButton size="small" onClick={() => setP1Wins((v) => v - 1)} disabled={inputDisabled || p1Wins === 0}>
                <RemoveIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setP1Wins((v) => v + 1)} disabled={inputDisabled || !canAdd || p1Wins >= winsNeeded}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              {displayBothLoss ? (
                <Box sx={{ minWidth: 72 }} />
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={handleBothLoss}
                  sx={{ fontSize: '0.7rem', py: 0.25, px: 1, minWidth: 0, whiteSpace: 'nowrap' }}
                >
                  両負け
                </Button>
              )}
            </Box>

            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 0.25 }}>
              <IconButton size="small" onClick={() => setP2Wins((v) => v - 1)} disabled={inputDisabled || p2Wins === 0}>
                <RemoveIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setP2Wins((v) => v + 1)} disabled={inputDisabled || !canAdd || p2Wins >= winsNeeded}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Draw controls for BO3+ */}
        {!match.isCompleted && bestOf > 1 && !displayBothLoss && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 0.5, gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">引分</Typography>
            <IconButton size="small" onClick={() => setDraws((v) => v - 1)} disabled={inputDisabled || draws === 0}>
              <RemoveIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small" onClick={() => setDraws((v) => v + 1)} disabled={inputDisabled || !canAdd}>
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        )}

        {dropRow}
      </CardContent>
    </Card>
  );
}
