'use client';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  title: string;
  backHref?: string;
}

export default function AppHeader({ title, backHref }: AppHeaderProps) {
  const router = useRouter();

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        {backHref && (
          <IconButton edge="start" color="inherit" onClick={() => router.push(backHref)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 700 }}>
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
