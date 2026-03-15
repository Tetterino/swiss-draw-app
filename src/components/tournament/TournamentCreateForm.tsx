'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AddIcon from '@mui/icons-material/Add';

interface TournamentCreateFormProps {
  onSubmit: (name: string, bestOf: number) => void;
}

export default function TournamentCreateForm({ onSubmit }: TournamentCreateFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [bestOf, setBestOf] = useState(3);

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim(), bestOf);
      setName('');
      setBestOf(3);
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        size="large"
        fullWidth
        sx={{ py: 1.5 }}
      >
        新しい大会を作成
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>新しい大会を作成</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="大会名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
            />
            <FormControl fullWidth>
              <InputLabel>試合形式</InputLabel>
              <Select
                value={bestOf}
                label="試合形式"
                onChange={(e) => setBestOf(Number(e.target.value))}
              >
                <MenuItem value={1}>Best of 1 (1本先取)</MenuItem>
                <MenuItem value={3}>Best of 3 (2本先取)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>キャンセル</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!name.trim()}>
            作成
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
