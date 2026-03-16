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
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: 'rgba(18, 18, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Toolbar>
        {backHref && (
          <IconButton edge="start" color="inherit" onClick={() => router.push(backHref)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 700, color: '#00bcd4' }}>
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
