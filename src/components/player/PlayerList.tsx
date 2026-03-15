'use client';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { Player } from '@/types';

interface PlayerListProps {
  players: Player[];
  onRemove?: (playerId: string) => void;
  showRemove?: boolean;
}

export default function PlayerList({ players, onRemove, showRemove = true }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        プレイヤーが登録されていません
      </Typography>
    );
  }

  return (
    <Paper variant="outlined">
      <List dense disablePadding>
        {players.map((player, index) => (
          <ListItem
            key={player.id}
            divider={index < players.length - 1}
            secondaryAction={
              showRemove && onRemove ? (
                <IconButton edge="end" size="small" onClick={() => onRemove(player.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              ) : undefined
            }
          >
            <ListItemText
              primary={`${index + 1}. ${player.name}`}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
