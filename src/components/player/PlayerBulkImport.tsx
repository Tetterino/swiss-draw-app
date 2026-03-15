'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

interface PlayerBulkImportProps {
  onImport: (names: string[]) => void;
}

export default function PlayerBulkImport({ onImport }: PlayerBulkImportProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const handleImport = () => {
    const names = text
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length > 0) {
      onImport(names);
      setText('');
      setOpen(false);
    }
  };

  const lineCount = text
    .split('\n')
    .map((n) => n.trim())
    .filter((n) => n.length > 0).length;

  return (
    <>
      <Button variant="outlined" startIcon={<GroupAddIcon />} onClick={() => setOpen(true)} fullWidth>
        一括登録
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>プレイヤー一括登録</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            1行に1人ずつ入力してください
          </Typography>
          <TextField
            multiline
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
            placeholder={'山田太郎\n鈴木花子\n田中一郎'}
            autoFocus
          />
          {lineCount > 0 && (
            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
              {lineCount}人を登録します
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>キャンセル</Button>
          <Button onClick={handleImport} variant="contained" disabled={lineCount === 0}>
            登録
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
