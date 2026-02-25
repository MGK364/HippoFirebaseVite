import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
  Box,
  Avatar,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PetsIcon from '@mui/icons-material/Pets';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MedicationIcon from '@mui/icons-material/Medication';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <HomeIcon fontSize="small" />, path: '/' },
    { text: 'Patients', icon: <PetsIcon fontSize="small" />, path: '/patients' },
    { text: 'Formulary', icon: <MedicationIcon fontSize="small" />, path: '/formulary' },
    { text: 'Admin', icon: <AdminPanelSettingsIcon fontSize="small" />, path: '/admin' },
  ];

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser) return '?';
    if (currentUser.displayName) {
      return currentUser.displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return currentUser.email?.[0]?.toUpperCase() || '?';
  };

  // Check if a path is active
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo / Brand */}
      <Box
        sx={{
          px: 2,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          minHeight: 64,
          background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MonitorHeartIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography
            variant="subtitle1"
            sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2, fontSize: '0.95rem' }}
          >
            VetAnesthesia
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
            EMR System
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, pt: 1.5, pb: 1 }}>
        <Typography
          variant="caption"
          sx={{
            px: 2.5,
            py: 1,
            display: 'block',
            color: 'text.secondary',
            fontWeight: 700,
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}
        >
          Navigation
        </Typography>
        <List disablePadding>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItem key={item.text} disablePadding sx={{ px: 0.5 }}>
                <ListItemButton
                  selected={active}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 0.5,
                    py: 1,
                    px: 1.5,
                    position: 'relative',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(21, 101, 192, 0.1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3,
                        height: '60%',
                        backgroundColor: 'primary.main',
                        borderRadius: '0 2px 2px 0',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: active ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: active ? 600 : 500,
                      color: active ? 'primary.main' : 'text.primary',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* User section */}
      <Divider />
      <Box sx={{ px: 1.5, py: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1,
            py: 0.75,
            borderRadius: 2,
            backgroundColor: 'rgba(0,0,0,0.03)',
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: 'primary.main',
              flexShrink: 0,
            }}
          >
            {getUserInitials()}
          </Avatar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'text.primary',
                fontSize: '0.75rem',
              }}
            >
              {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
            </Typography>
            {currentUser?.email && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'text.secondary',
                  fontSize: '0.65rem',
                }}
              >
                {currentUser.email}
              </Typography>
            )}
          </Box>
          <Tooltip title="Logout">
            <IconButton size="small" onClick={handleLogout} sx={{ color: 'text.secondary', flexShrink: 0 }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        {drawer}
      </Drawer>

      {/* Permanent Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Main content area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* App Bar (mobile only) */}
        <AppBar
          position="static"
          sx={{
            display: { xs: 'flex', sm: 'none' },
            background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
            height: 56,
          }}
        >
          <Toolbar sx={{ minHeight: '56px !important', px: 2 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1.5 }}
            >
              <MenuIcon />
            </IconButton>
            <MonitorHeartIcon sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700 }}>
              VetAnesthesia EMR
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            overflow: 'auto',
            backgroundColor: 'background.default',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
