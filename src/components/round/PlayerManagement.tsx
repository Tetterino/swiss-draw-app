'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { Tournament } from '@/types';

interface PlayerManagementProps {
  tournament: Tournament;
  dispatch: React.Dispatch<any>;
}

export default function PlayerManagement({ tournament, dispatch }: PlayerManagementProps) {
  const [expanded, setExpanded] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ id: string; name: string } | null>(null);

  const activePlayers = tournament.players.filter((p) => p.status === 'active');
  const droppedPlayers = tournament.players.filter((p) => p.status === 'dropped');

  const handleDrop = () => {
    if (!dropTarget) return;
    dispatch({
      type: 'DROP_PLAYER',
      payload: { tournamentId: tournament.id, playerId: dropTarget.id },
    });
    setDropTarget(null);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Button
        fullWidth
        variant="outlined"
        color="inherit"
        onClick={() => setExpanded(!expanded)}
        endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{ justifyContent: 'space-between', textTransform: 'none' }}
      >
        <Typography variant="subtitle2">
          プレイヤー管理 ({activePlayers.length}人参加中)
        </Typography>
      </Button>

      <Collapse in={expanded}>
        <List dense disablePadding>
          {activePlayers.map((player) => (
            <ListItem
              key={player.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  size="small"
                  color="error"
                  onClick={() => setDropTarget({ id: player.id, name: player.name })}
                >
                  <PersonOffIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemText primary={player.name} />
            </ListItem>
          ))}
          {droppedPlayers.map((player) => (
            <ListItem key={player.id} sx={{ opacity: 0.5 }}>
              <ListItemText primary={player.name} />
              <Chip label="Drop" size="small" color="default" sx={{ ml: 1 }} />
            </ListItem>
          ))}
        </List>
      </Collapse>

      <ConfirmDialog
        open={!!dropTarget}
        title="プレイヤーをドロップ"
        message={`${dropTarget?.name ?? ''} を大会からドロップ（途中辞退）しますか？この操作は取り消せません。`}
        confirmLabel="ドロップ"
        onConfirm={handleDrop}
        onCancel={() => setDropTarget(null)}
      />
    </Box>
  );
}
