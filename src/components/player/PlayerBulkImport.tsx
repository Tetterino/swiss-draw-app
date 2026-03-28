'use client';

import { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

const CSV_HEADER = 'プレイヤーID,ニックネーム';
/**
 * CSVファイルを読み込んでプレイヤー名の配列を返す
 * @param text CSVファイルのテキスト
 * @returns プレイヤー名の配列
 */
function parseCsvToNames(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  return lines
    .filter((line) => line !== CSV_HEADER)
    .map((line) => {
      const commaIndex = line.indexOf(',');
      if (commaIndex >= 0) {
        const name = line.slice(commaIndex + 1).trim();
        const id = line.slice(0, commaIndex).trim();
        return name || id || '';
      }
      return line;
    })
    .filter((n) => n.length > 0);
}

interface PlayerBulkImportProps {
  onImport: (names: string[]) => void;
}

export default function PlayerBulkImport({ onImport }: PlayerBulkImportProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // CSVファイルを選択したときの処理
  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buf = await file.arrayBuffer();
    const utf8Text = new TextDecoder('utf-8').decode(buf);
    // UTF-8 デコード失敗時は置換文字 (U+FFFD) が含まれるので Shift_JIS で再デコード
    const csvText = utf8Text.includes('\uFFFD')
      ? new TextDecoder('shift-jis').decode(buf)
      : utf8Text;

    const names = parseCsvToNames(csvText);
    setText(names.join('\n'));
    e.target.value = '';
  };

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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              1行に1人ずつ入力してください
            </Typography>
            {/* CSVファイルを選択するボタン */}
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              style={{ display: 'none' }}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<FolderOpenIcon />}
              onClick={() => inputRef.current?.click()}
            >
              CSVファイルで追加
            </Button>
          </Box>
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
