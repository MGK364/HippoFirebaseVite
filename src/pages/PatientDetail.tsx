import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Button,
  IconButton,
  Card,
  CardHeader,
  Box,
  Chip,
  alpha,
  useTheme,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ChecklistIcon from '@mui/icons-material/Checklist';
import SummarizeIcon from '@mui/icons-material/Summarize';
import PetsIcon from '@mui/icons-material/Pets';
import ScaleIcon from '@mui/icons-material/Scale';
import {
  getPatient,
  getVitalSigns,
  getAnesthesiaBoluses,
  getAnesthesiaCRIs,
  getMedicalSummary,
  getAnesthesiaPlan,
  getEvents,
} from '../services/patients';
import { Patient, VitalSign, AnesthesiaBolus, AnesthesiaCRI, MedicalSummary, AnesthesiaPlan, Event } from '../types';
import { VitalSignsChart } from '../components/VitalSignsChart';
import { QuickVitalSignEntry } from '../components/QuickVitalSignEntry';
import AnesthesiaMedicationChart from '../components/AnesthesiaMedicationChart';
import MedicalSummaryView from '../components/MedicalSummaryView';
import AnesthesiaPlanView from '../components/AnesthesiaPlanView';
import PreOpChecklistView from '../components/PreOpChecklistView';
import PostOpSummaryView from '../components/PostOpSummaryView';
import { VitalSignActionDialog } from '../components/VitalSignActionDialog';
import { ProcedureTimer } from '../components/ProcedureTimer';
import { AnesthesiaDataLog } from '../components/AnesthesiaDataLog';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { getAuth } from 'firebase/auth';
import { User } from 'firebase/auth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && (
        <Box sx={{ pt: 3, width: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const addEventsLog = (
  doc: jsPDF,
  events: Event[],
  startY: number,
  margin: number,
  pageWidth: number,
  pageHeight: number
): number => {
  let currentY = startY;
  const formatTime = (timestamp: Date) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (currentY > pageHeight - margin - 10) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFontSize(12);
  doc.text('Events Log:', margin, currentY);
  currentY += 7;
  doc.setFontSize(10);

  if (events.length > 0) {
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return dateA.getTime() - dateB.getTime();
    });

    sortedEvents.forEach((event) => {
      if (currentY > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      const eventText = `${formatTime(event.timestamp)} - ${event.type}: ${event.details}`;
      const splitText = doc.splitTextToSize(eventText, pageWidth - margin * 2 - 5);
      doc.text(splitText, margin + 5, currentY);
      currentY += splitText.length * 4;
    });
  } else {
    if (currentY > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }
    doc.text('No events logged.', margin + 5, currentY);
    currentY += 5;
  }

  currentY += 5;
  return currentY;
};

export const PatientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [anesthesiaBoluses, setAnesthesiaBoluses] = useState<AnesthesiaBolus[]>([]);
  const [anesthesiaCRIs, setAnesthesiaCRIs] = useState<AnesthesiaCRI[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [anesthesiaPlan, setAnesthesiaPlan] = useState<AnesthesiaPlan | null>(null);
  const [anesthesiaPlanLoading, setAnesthesiaPlanLoading] = useState(true);
  const [medicalSummary, setMedicalSummary] = useState<MedicalSummary | null>(null);
  const [medicalSummaryLoading, setMedicalSummaryLoading] = useState(true);
  const [visibleTimeRange, setVisibleTimeRange] = useState<{ start: Date; end: Date } | null>(null);
  const vitalSignsChartRef = useRef<any>(null);
  const anesthesiaMedChartRef = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedVitalSign, setSelectedVitalSign] = useState<VitalSign | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!patientId) {
      setError('No patient ID provided');
      setLoading(false);
      return;
    }
    setVisibleTimeRange(null);
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    if (!patientId) {
      setError('No patient ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMedicalSummaryLoading(true);
      setAnesthesiaPlanLoading(true);

      const patientData = await getPatient(patientId);
      if (!patientData) {
        setError('Patient not found');
        setLoading(false);
        return;
      }
      setPatient(patientData);

      const [vitalSignsData, bolusesData, crisData, summaryData, planData, eventsData] = await Promise.all([
        getVitalSigns(patientId),
        getAnesthesiaBoluses(patientId),
        getAnesthesiaCRIs(patientId),
        getMedicalSummary(patientId),
        getAnesthesiaPlan(patientId),
        getEvents(patientId),
      ]);

      setVitalSigns(vitalSignsData);
      setAnesthesiaBoluses(bolusesData);
      setAnesthesiaCRIs(crisData);
      setMedicalSummary(summaryData);
      setMedicalSummaryLoading(false);
      setAnesthesiaPlan(planData);
      setAnesthesiaPlanLoading(false);
      setEvents(eventsData);
      setError('');
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError('Failed to load patient data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDataAdded = () => {
    if (patientId) fetchPatientData();
  };

  const handleVisibleRangeChange = (range: { start: Date; end: Date }) => {
    setVisibleTimeRange(range);
  };

  const handleDownloadPdf = async () => {
    try {
      const margin = 10;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `${patient?.name || 'Patient'} - Anesthesia Record`,
        pageWidth / 2,
        margin,
        { align: 'center' }
      );

      doc.setFontSize(10);
      let currentY = margin + 10;
      doc.text(`Species: ${patient?.species || 'Not specified'}`, margin, currentY);
      currentY += 5;
      doc.text(`Breed: ${patient?.breed || 'Not specified'}`, margin, currentY);
      currentY += 5;
      doc.text(`Weight: ${patient?.weight || 'Not specified'}`, margin, currentY);
      currentY += 5;
      doc.text(`Age: ${patient?.age || 'Not specified'}`, margin, currentY);
      currentY += 5;
      doc.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, margin, currentY);
      currentY += 10;

      if (vitalSignsChartRef.current && vitalSignsChartRef.current.getChartImage) {
        try {
          const chartImage = await vitalSignsChartRef.current.getChartImage();
          if (chartImage) {
            if (currentY > pageHeight / 2) {
              doc.addPage();
              currentY = margin;
            }
            doc.setFontSize(12);
            doc.text('Vital Signs Chart', margin, currentY);
            currentY += 5;
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = 70;
            doc.addImage(chartImage, 'PNG', margin, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 10;
          }
        } catch (error) {
          console.error('Error capturing vital signs chart:', error);
        }
      }

      if (anesthesiaMedChartRef.current && anesthesiaMedChartRef.current.getChartImage) {
        try {
          const medChartImage = await anesthesiaMedChartRef.current.getChartImage();
          if (medChartImage) {
            if (currentY > pageHeight - 100) {
              doc.addPage();
              currentY = margin;
            }
            doc.setFontSize(12);
            doc.text('Anesthesia Medications', margin, currentY);
            currentY += 5;
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = 100;
            doc.addImage(medChartImage, 'PNG', margin, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 10;
          }
        } catch (error) {
          console.error('Error capturing medication chart:', error);
        }
      }

      currentY = addEventsLog(doc, events, currentY, margin, pageWidth, pageHeight);

      const fileName = `${patient?.name || 'patient'}_anesthesia_record_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (!patientId) {
    return <Navigate to="/patients" />;
  }

  const getTimeRange = () => {
    const timestamps: Date[] = [];

    for (const vs of vitalSigns) {
      const timestamp = vs.timestamp instanceof Date ? vs.timestamp : new Date(vs.timestamp);
      if (!isNaN(timestamp.getTime())) timestamps.push(timestamp);
    }
    for (const bolus of anesthesiaBoluses) {
      const timestamp = bolus.timestamp instanceof Date ? bolus.timestamp : new Date(bolus.timestamp);
      if (!isNaN(timestamp.getTime())) timestamps.push(timestamp);
    }
    for (const cri of anesthesiaCRIs) {
      const startTime = cri.startTime instanceof Date ? cri.startTime : new Date(cri.startTime);
      if (!isNaN(startTime.getTime())) timestamps.push(startTime);
      if (cri.endTime) {
        const endTime = cri.endTime instanceof Date ? cri.endTime : new Date(cri.endTime);
        if (!isNaN(endTime.getTime())) timestamps.push(endTime);
      }
    }

    if (timestamps.length === 0) {
      const now = new Date();
      const endTime = new Date(Math.ceil(now.getTime() / (5 * 60000)) * (5 * 60000));
      const startTime = new Date(Math.floor((now.getTime() - 3600000) / (5 * 60000)) * (5 * 60000));
      return { startTime, endTime };
    }

    timestamps.sort((a, b) => a.getTime() - b.getTime());
    const startTime = new Date(Math.floor(timestamps[0].getTime() / (5 * 60000)) * (5 * 60000));
    const endTime = new Date(Math.ceil(timestamps[timestamps.length - 1].getTime() / (5 * 60000)) * (5 * 60000));
    startTime.setMinutes(startTime.getMinutes() - 5);
    endTime.setMinutes(endTime.getMinutes() + 5);

    return { startTime, endTime };
  };

  const calculatedTimeRange = getTimeRange();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'error.light', borderRadius: 2 }}>
        <Typography color="error">{error}</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/patients')}>
          Back to Patients
        </Button>
      </Paper>
    );
  }

  if (!patient) {
    return <Typography>Patient not found.</Typography>;
  }

  // Get ASA status color
  const getAsaColor = (asa?: string) => {
    switch (asa) {
      case 'I': return 'success';
      case 'II': return 'info';
      case 'III': return 'warning';
      case 'IV': case 'V': case 'E': return 'error';
      default: return 'default';
    }
  };

  const tabs = [
    { label: 'Vital Signs', icon: <MonitorHeartIcon fontSize="small" /> },
    { label: 'Anesthesia Plan', icon: <MedicalServicesIcon fontSize="small" /> },
    { label: 'Medical Summary', icon: <AssignmentIcon fontSize="small" /> },
    { label: 'Pre-Op Checklist', icon: <ChecklistIcon fontSize="small" /> },
    { label: 'Post-Op Summary', icon: <SummarizeIcon fontSize="small" /> },
  ];

  return (
    <Box>
      {/* Back button + Page title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Tooltip title="Back to Patients">
          <IconButton
            onClick={() => navigate('/patients')}
            size="small"
            sx={{
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.06) },
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="body2" color="text.secondary">
          Patients
        </Typography>
        <Typography variant="body2" color="text.secondary">/</Typography>
        <Typography variant="body2" fontWeight={600}>{patient.name}</Typography>
      </Box>

      {/* Patient Header Card */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Colored top bar */}
        <Box
          sx={{
            height: 6,
            background: 'linear-gradient(90deg, #1565C0 0%, #00897B 100%)',
          }}
        />
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {/* Patient info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PetsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h5" fontWeight={700}>
                  {patient.name}
                </Typography>
                <Chip
                  label={patient.status}
                  size="small"
                  color={patient.status === 'Active' ? 'success' : 'default'}
                  sx={{ height: 22 }}
                />
                {medicalSummary?.asaStatus && (
                  <Chip
                    label={`ASA ${medicalSummary.asaStatus}`}
                    size="small"
                    color={getAsaColor(medicalSummary.asaStatus) as any}
                    sx={{ height: 22, fontWeight: 700 }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {patient.species}{patient.breed ? ` · ${patient.breed}` : ''}
                </Typography>
                {patient.age && (
                  <Typography variant="body2" color="text.secondary">
                    Age: {patient.age}
                  </Typography>
                )}
                {patient.weight && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ScaleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {patient.weight} kg
                    </Typography>
                  </Box>
                )}
                {patient.ownerName && (
                  <Typography variant="body2" color="text.secondary">
                    Owner: {patient.ownerName}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate(`/patients/${patientId}/edit`)}
            >
              Edit Patient
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPdf}
              color="secondary"
            >
              Export PDF
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="Patient details tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                py: 1.5,
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={tab.label}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                id={`patient-tab-${index}`}
                aria-controls={`patient-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {/* Unified chart card — medication swimlane + vital signs share same time axis */}
        <Card sx={{ overflow: 'visible', mb: 2 }}>
          <ProcedureTimer
            events={events}
            patientId={patientId}
            currentUser={currentUser?.email || currentUser?.uid || 'unknown-user'}
            onEventAdded={handleDataAdded}
            onLogEvent={() => vitalSignsChartRef.current?.openEventLog()}
          />

          <AnesthesiaMedicationChart
            ref={anesthesiaMedChartRef}
            key={`anesthesia-chart-${anesthesiaBoluses.length}-${anesthesiaCRIs.length}`}
            patientId={patientId}
            vitalSignsStartTime={calculatedTimeRange.startTime}
            vitalSignsEndTime={calculatedTimeRange.endTime}
            visibleTimeRange={visibleTimeRange || undefined}
            onMedicationAdded={handleDataAdded}
            currentUser={currentUser?.email || currentUser?.uid || 'unknown-user'}
            anesthesiaData={{
              patient: patient,
              anesthesiaPlan: anesthesiaPlan,
              patientWeight: patient?.weight,
            }}
          />

          <div ref={chartContainerRef} style={{ width: '100%', backgroundColor: 'white' }}>
            {vitalSigns.length > 0 ? (
              <VitalSignsChart
                ref={vitalSignsChartRef}
                vitalSigns={vitalSigns}
                patientId={patientId || ''}
                onVisibleRangeChange={handleVisibleRangeChange}
                timeRange={calculatedTimeRange}
                externalEvents={events}
                onEventAdded={handleDataAdded}
                species={patient?.species}
                onVitalSignClick={(vs) => {
                  setSelectedVitalSign(vs);
                  setActionDialogOpen(true);
                }}
              />
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <MonitorHeartIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography color="text.secondary">No vital signs data recorded yet</Typography>
              </Box>
            )}
          </div>

          {/* ── Collapsible data log — events + vital signs tables ── */}
          <AnesthesiaDataLog events={events} vitalSigns={vitalSigns} />

          <QuickVitalSignEntry
            patientId={patientId}
            vitalSigns={vitalSigns}
            onVitalSignAdded={handleDataAdded}
            currentUser={currentUser?.email || currentUser?.uid || 'unknown-user'}
          />
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Card>
          <CardHeader
            title="Anesthesia and Pain Management Plan"
            action={
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate(`/patients/${patientId}/anesthesia-plan/edit`)}
              >
                Edit Plan
              </Button>
            }
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              borderBottom: '1px solid',
              borderColor: 'divider',
              '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1rem' },
            }}
          />
          <Box sx={{ p: 2 }}>
            <AnesthesiaPlanView
              plan={anesthesiaPlan}
              loading={anesthesiaPlanLoading}
              patientWeight={patient.weight}
            />
          </Box>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardHeader
            title="Medical Summary"
            action={
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate(`/patients/${patientId}/medical-summary/edit`)}
              >
                Edit Medical Summary
              </Button>
            }
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              borderBottom: '1px solid',
              borderColor: 'divider',
              '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1rem' },
            }}
          />
          <Box sx={{ p: 2 }}>
            <MedicalSummaryView summary={medicalSummary} loading={medicalSummaryLoading} />
          </Box>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <PreOpChecklistView patient={patient} />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <PostOpSummaryView patient={patient} anesthesiaPlan={anesthesiaPlan} />
      </TabPanel>

      {/* ── Vital Sign Action Dialog (edit / void / delete) ─────────── */}
      <VitalSignActionDialog
        open={actionDialogOpen}
        onClose={() => { setActionDialogOpen(false); setSelectedVitalSign(null); }}
        vitalSign={selectedVitalSign}
        patientId={patientId || ''}
        currentUser={currentUser?.email || currentUser?.uid || 'unknown-user'}
        onVitalSignUpdated={handleDataAdded}
        species={patient?.species}
      />
    </Box>
  );
};
