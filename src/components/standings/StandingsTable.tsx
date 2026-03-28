'use client';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import { PlayerStanding } from '@/types';

interface StandingsTableProps {
  standings: PlayerStanding[];
  showTiebreakers?: boolean;
}

function formatPercent(value: number): string {
  return (value * 100).toFixed(2) + '%';
}

const darkGroupColors = [
  'rgba(0, 188, 212, 0.50)', // グループ0: 1位
  'rgba(0, 188, 212, 0.35)', // グループ1: 2-3位
  'rgba(0, 188, 212, 0.22)', // グループ2: 4-7位
  'rgba(0, 188, 212, 0.13)', // グループ3: 8-15位
  'rgba(0, 188, 212, 0.07)', // グループ4: 16-31位
  'rgba(0, 188, 212, 0.03)', // グループ5: 32位
];

const lightGroupColors = [
  'rgba(0, 131, 148, 0.75)', // グループ0: 1位
  'rgba(0, 131, 148, 0.52)', // グループ1: 2-3位
  'rgba(0, 131, 148, 0.33)', // グループ2: 4-7位
  'rgba(0, 131, 148, 0.19)', // グループ3: 8-15位
  'rgba(0, 131, 148, 0.09)', // グループ4: 16-31位
  'rgba(0, 131, 148, 0.03)', // グループ5: 32位
];

function getRankColor(rank: number, isDark: boolean): string | undefined {
  if (rank > 32) return undefined;
  const group = rank === 1 ? 0 : Math.floor(Math.log2(rank));
  return isDark ? darkGroupColors[group] : lightGroupColors[group];
}

export default function StandingsTable({ standings, showTiebreakers = true }: StandingsTableProps) {
  const isDark = useTheme().palette.mode === 'dark';

  if (standings.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        順位データがありません
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>プレイヤー</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>MP</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>戦績</TableCell>
            {showTiebreakers && (
              <>
                <Tooltip title="Opponent Match Win % - 対戦相手の勝率の平均" arrow>
                  <TableCell align="center" sx={{ fontWeight: 700, cursor: 'help' }}>OMW%</TableCell>
                </Tooltip>
                <Tooltip title="Game Win % - 自分のゲーム勝率" arrow>
                  <TableCell align="center" sx={{ fontWeight: 700, cursor: 'help' }}>GW%</TableCell>
                </Tooltip>
                <Tooltip title="Opponent Game Win % - 対戦相手のゲーム勝率の平均" arrow>
                  <TableCell align="center" sx={{ fontWeight: 700, cursor: 'help' }}>OGW%</TableCell>
                </Tooltip>
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {standings.map((s) => (
            <TableRow
              key={s.playerId}
              sx={{
                backgroundColor: getRankColor(s.rank, isDark),
                opacity: s.isDropped ? 0.5 : 1,
              }}
            >
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: s.rank === 1 ? 700 : 400 }}>
                  {s.rank}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: s.rank === 1 ? 700 : 400 }} noWrap>
                  {s.playerName}
                  {s.isDropped && (
                    <Chip label="Drop" size="small" color="error" variant="outlined" sx={{ ml: 1 }} />
                  )}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{s.matchPoints}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2">
                  {s.matchWins}-{s.matchLosses}-{s.matchDraws}
                </Typography>
              </TableCell>
              {showTiebreakers && (
                <>
                  <TableCell align="center">
                    <Typography variant="body2">{formatPercent(s.omwPercent)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{formatPercent(s.gwPercent)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{formatPercent(s.ogwPercent)}</Typography>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
