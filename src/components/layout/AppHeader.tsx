'use client';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useRouter } from 'next/navigation';
import { useThemeMode } from '@/hooks/useThemeMode';

interface AppHeaderProps {
  title: string;
  backHref?: string;
}

export default function AppHeader({ title, backHref }: AppHeaderProps) {
  const router = useRouter();
  const { resolved, toggle } = useThemeMode();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        {backHref && (
          <IconButton edge="start" onClick={() => router.push(backHref)} sx={{ mr: 1, color: 'text.primary' }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 700, color: 'primary.main' }}>
          {title}
        </Typography>
        <IconButton onClick={toggle} size="small" sx={{ color: 'text.primary' }}>
          {resolved === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
