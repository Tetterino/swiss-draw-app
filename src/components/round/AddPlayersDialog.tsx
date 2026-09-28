'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface AddPlayersDialogProps {
  activeCount: number;
  byePlayerName: string | null;
  onAdd: (names: string[]) => void;
}

export default function AddPlayersDialog({
  activeCount,
  byePlayerName,
  onAdd,
}: AddPlayersDialogProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const names = text
    .split('\n')
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  const close = () => {
    setText('');
    setOpen(false);
  };

  const handleAdd = () => {
    if (names.length === 0) return;
    onAdd(names);
    close();
  };

  const totalAfter = activeCount + names.length;
  const byeAfter = totalAfter % 2 === 1;

  return (
    <>
      <Button
        variant="outlined"
        size="large"
        fullWidth
        startIcon={<PersonAddIcon />}
        onClick={() => setOpen(true)}
        sx={{ py: 1.5 }}
      >
        プレイヤーを追加
      </Button>

      <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>ラウンド1にプレイヤーを追加</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            確定済みのマッチングと入力済みの結果はそのまま残ります。
            {byePlayerName
              ? `BYEの ${byePlayerName} さんが追加プレイヤーと対戦します。`
              : '追加したプレイヤーだけで新しい対戦を組みます。'}
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            1行に1人ずつ入力してください
          </Typography>
          <TextField
            multiline
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
            placeholder={'山田太郎\n鈴木花子'}
            autoFocus
          />

          {names.length > 0 && (
            <Alert severity={byeAfter ? 'warning' : 'success'} sx={{ mt: 2 }}>
              {names.length}人を追加して {totalAfter}人になります。
              {byeAfter ? '奇数のためBYEが1人発生します。' : 'BYEは発生しません。'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>キャンセル</Button>
          <Button onClick={handleAdd} variant="contained" disabled={names.length === 0}>
            追加
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
