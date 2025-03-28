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
import { useAuth } from './contexts/AuthContext';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// PrivateRoute component to handle authentication checks
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  
  // Show loading state if auth state is still being checked
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
            
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
