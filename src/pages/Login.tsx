import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import PetsIcon from '@mui/icons-material/Pets';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #0D3C7A 0%, #1565C0 50%, #0277BD 100%)',
      }}
    >
      {/* Left panel - branding */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 6,
          color: '#fff',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <MonitorHeartIcon sx={{ fontSize: 48, color: '#fff' }} />
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5, textAlign: 'center' }}>
          VetAnesthesia EMR
        </Typography>
        <Typography
          variant="h6"
          sx={{ opacity: 0.85, textAlign: 'center', maxWidth: 380, lineHeight: 1.6, fontWeight: 400 }}
        >
          Veterinary Anesthesia Electronic Medical Record System
        </Typography>

        <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 340 }}>
          {[
            'Real-time vital signs monitoring',
            'Comprehensive anesthesia planning',
            'Pre-op safety checklists',
            'Drug formulary & dose calculations',
          ].map((feature) => (
            <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#4fc3f7',
                  flexShrink: 0,
                }}
              />
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {feature}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right panel - login form */}
      <Box
        sx={{
          flex: { xs: 1, md: 'none' },
          width: { xs: '100%', md: 480 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F4F6F9',
          px: { xs: 2, sm: 4 },
          py: 6,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              mb: 4,
            }}
          >
            <MonitorHeartIcon sx={{ fontSize: 36, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
              VetAnesthesia EMR
            </Typography>
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
            Welcome back
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
            Sign in to access your patient records
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              autoFocus
              sx={{ mb: 2.5 }}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              sx={{ mb: 3.5 }}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      tabIndex={-1}
                    >
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0D3C7A 0%, #1565C0 100%)',
                },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/signup" fontWeight={600}>
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <PetsIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Veterinary Anesthesia Management System
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
