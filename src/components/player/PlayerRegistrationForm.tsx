'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface PlayerRegistrationFormProps {
  onAdd: (name: string) => void;
}

export default function PlayerRegistrationForm({ onAdd }: PlayerRegistrationFormProps) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <TextField
        label="プレイヤー名"
        value={name}
        onChange={(e) => setName(e.target.value)}
        size="small"
        fullWidth
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
        }}
      />
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={!name.trim()}
        startIcon={<PersonAddIcon />}
        sx={{ whiteSpace: 'nowrap' }}
      >
        追加
      </Button>
    </Box>
  );
}
