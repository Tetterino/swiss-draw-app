'use client';

import { useState } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import PlayerRenameDialog from '@/components/dialog/PlayerRenameDialog';
import { Player } from '@/types';

interface PlayerListProps {
  players: Player[];
  onRemove?: (playerId: string) => void;
  showRemove?: boolean;
  onRename?: (playerId: string, name: string) => void;
}

export default function PlayerList({ players, onRemove, showRemove = true, onRename }: PlayerListProps) {
  const [renamingPlayer, setRenamingPlayer] = useState<Player | null>(null);

  if (players.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        プレイヤーが登録されていません
      </Typography>
    );
  }

  return (
    <>
      <Paper variant="outlined">
        <List dense disablePadding>
          {players.map((player, index) => (
            <ListItem
              key={player.id}
              divider={index < players.length - 1}
              secondaryAction={
                showRemove && onRemove ? (
                  <IconButton edge="end" size="small" onClick={() => onRemove(player.id)} aria-label="削除">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                ) : undefined
              }
              sx={{
                pr: showRemove && onRemove ? 7 : 2,
                '&:hover .player-edit-button': {
                  opacity: 1,
                },
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pr: 1 }}>
                    <Typography component="span" variant="body2">
                      {index + 1}. {player.name}
                    </Typography>
                    {onRename && (
                      <IconButton
                        className="player-edit-button"
                        size="small"
                        aria-label="名前を編集"
                        onClick={() => setRenamingPlayer(player)}
                        sx={{
                          opacity: 0,
                          transition: 'opacity 0.15s ease',
                          p: 0.25,
                          color: 'text.secondary',
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {onRename && (
        <PlayerRenameDialog
          player={renamingPlayer}
          players={players}
          onClose={() => setRenamingPlayer(null)}
          onSave={onRename}
        />
      )}
    </>
  );
}
