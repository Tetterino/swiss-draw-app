'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ConfirmDialog from '@/components/layout/ConfirmDialog';
import { Player } from '@/types';

export interface PlayerRenameDialogProps {
  /** 編集対象。null のときは閉じた状態 */
  player: Player | null;
  /** 重複判定用（編集中のプレイヤー以外と比較） */
  players: Player[];
  onClose: () => void;
  onSave: (playerId: string, name: string) => void;
}

export default function PlayerRenameDialog({ player, players, onClose, onSave }: PlayerRenameDialogProps) {
  const [editName, setEditName] = useState('');
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);

  useEffect(() => {
    if (player) {
      setEditName(player.name);
      setDuplicateConfirmOpen(false);
    } else {
      setEditName('');
      setDuplicateConfirmOpen(false);
    }
  }, [player]);

  const trimmedName = editName.trim();
  const isEmptyName = trimmedName.length === 0;

  const hasOtherPlayerWithName = (name: string): boolean => {
    if (!player) return false;
    return players.some((p) => p.id !== player.id && p.name === name);
  };

  const performSave = () => {
    if (!player) return;
    onSave(player.id, trimmedName);
    onClose();
  };

  const handleSave = () => {
    if (!player) return;
    if (isEmptyName) return;
    if (hasOtherPlayerWithName(trimmedName)) {
      setDuplicateConfirmOpen(true);
      return;
    }
    performSave();
  };

  const handleConfirmDuplicateSave = () => {
    performSave();
  };

  return (
    <>
      <Dialog open={!!player} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle>プレイヤー名の編集</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="プレイヤー名"
            placeholder={player?.name ?? ''}
            fullWidth
            value={editName}
            error={isEmptyName}
            helperText={isEmptyName ? 'プレイヤー名を入力してください' : undefined}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained" disabled={!trimmedName}>
            保存
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={duplicateConfirmOpen}
        title="名前が重複しています"
        message={`「${trimmedName}」は既に他のプレイヤーに登録されています。このまま保存しますか？（保存時に名前が調整される場合があります）`}
        confirmLabel="保存する"
        cancelLabel="キャンセル"
        onConfirm={handleConfirmDuplicateSave}
        onCancel={() => setDuplicateConfirmOpen(false)}
      />
    </>
  );
}
