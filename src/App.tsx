import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { PatientsList } from './pages/PatientsList';
import { PatientDetail } from './pages/PatientDetail';
import MedicalSummaryEdit from './pages/MedicalSummaryEdit';
import AnesthesiaPlanEdit from './pages/AnesthesiaPlanEdit';
import AdminDashboard from './pages/AdminDashboard';
import NewPatient from './pages/NewPatient';
import EditPatient from './pages/EditPatient';
import FormularyPage from './pages/FormularyPage';
import { useAuth } from './contexts/AuthContext';

// Professional medical-grade theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1565C0',
      light: '#5e92f3',
      dark: '#003c8f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00897B',
      light: '#4ebaaa',
      dark: '#005b4f',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F4F6F9',
      paper: '#FFFFFF',
    },
    success: {
      main: '#2E7D32',
      light: '#60ad5e',
      dark: '#005005',
    },
    warning: {
      main: '#E65100',
      light: '#ff833a',
      dark: '#ac1900',
    },
    error: {
      main: '#C62828',
      light: '#ff5f52',
      dark: '#8e0000',
    },
    info: {
      main: '#0277BD',
      light: '#58a5f0',
      dark: '#004c8c',
    },
    text: {
      primary: '#1A2332',
      secondary: '#5A6A7E',
    },
    divider: 'rgba(0,0,0,0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.25px',
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 600,
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F4F6F9',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        },
        elevation3: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#5A6A7E',
            backgroundColor: '#F4F6F9',
            borderBottom: '2px solid rgba(0,0,0,0.08)',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child .MuiTableCell-body': {
            borderBottom: 0,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0,0,0,0.06)',
          padding: '12px 16px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minWidth: 100,
          padding: '10px 20px',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0,0,0,0.15)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0,0,0,0.3)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          width: 'calc(100% - 16px)',
          '&.Mui-selected': {
            backgroundColor: 'rgba(21, 101, 192, 0.1)',
            color: '#1565C0',
            '& .MuiListItemIcon-root': {
              color: '#1565C0',
            },
            '&:hover': {
              backgroundColor: 'rgba(21, 101, 192, 0.15)',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#5A6A7E',
        },
      },
    },
  },
});

// PrivateRoute component to handle authentication checks
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Wrapper component for layout
const PrivateLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <PrivateRoute>
      <Layout>{children}</Layout>
    </PrivateRoute>
  );
};

// Main App Component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Private routes */}
            <Route path="/" element={<PrivateLayout><PatientsList /></PrivateLayout>} />
            <Route path="/patients" element={<PrivateLayout><PatientsList /></PrivateLayout>} />
            <Route path="/patients/new" element={<PrivateLayout><NewPatient /></PrivateLayout>} />
            <Route path="/patients/:patientId" element={<PrivateLayout><PatientDetail /></PrivateLayout>} />
            <Route path="/patients/:patientId/edit" element={<PrivateLayout><EditPatient /></PrivateLayout>} />
            <Route path="/patients/:patientId/medical-summary/edit" element={<PrivateLayout><MedicalSummaryEdit /></PrivateLayout>} />
            <Route path="/patients/:patientId/anesthesia-plan/edit" element={<PrivateLayout><AnesthesiaPlanEdit /></PrivateLayout>} />
            <Route path="/admin" element={<PrivateLayout><AdminDashboard /></PrivateLayout>} />
            <Route path="/formulary" element={<PrivateLayout><FormularyPage /></PrivateLayout>} />

            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
