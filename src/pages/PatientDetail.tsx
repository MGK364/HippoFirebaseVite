import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Chip,
  Button,
  IconButton,
  Card,
  CardHeader,
  Box
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { 
  getPatient, 
  getVitalSigns, 
  getMedications, 
  getPatientHistory, 
  getAnesthesiaBoluses,
  getAnesthesiaCRIs,
  getMedicalSummary,
  getAnesthesiaPlan,
  getEvents
} from '../services/patients';
import { Patient, VitalSign, Medication, PatientHistory, AnesthesiaBolus, AnesthesiaCRI, MedicalSummary, AnesthesiaPlan, Event } from '../types';
import { VitalSignsChart, VitalSignsChartRef } from '../components/VitalSignsChart';
import { MedicationList } from '../components/MedicationList';
import { VitalSignForm } from '../components/VitalSignForm';
import AnesthesiaMedicationChart, { AnesthesiaMedicationChartRef } from '../components/AnesthesiaMedicationChart';
import MedicalSummaryView from '../components/MedicalSummaryView';
import AnesthesiaPlanView from '../components/AnesthesiaPlanView';
import { useAuth } from '../contexts/AuthContext';
import { calculateMedicationTotals } from '../utils/calculations';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
        <div style={{ padding: '24px', width: '100%' }}>
          {children}
        </div>
      )}
    </div>
  );
};

// Utility function for adding text with page breaks (optional enhancement later)

// Helper function to add Events Log
const addEventsLog = (
  doc: jsPDF,
  events: Event[],
  startY: number,
  margin: number,
  pageWidth: number, // Unused for now, but good practice
  pageHeight: number
): number => {
  let currentY = startY;
  const formatTime = (timestamp: Date) => {
     const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Check for page break before section title
  if (currentY > pageHeight - margin - 10) { // Space for title + one line
    doc.addPage();
    currentY = margin;
  }

  doc.setFontSize(12);
  doc.text('Events Log:', margin, currentY);
  currentY += 7; // Space after title
  doc.setFontSize(10);

  if (events.length > 0) {
     // Sort events by timestamp just in case
     const sortedEvents = [...events].sort((a, b) => {
        const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return dateA.getTime() - dateB.getTime();
     });

    sortedEvents.forEach((event) => {
      // Check for page break before each event line
      if (currentY > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      const eventText = `${formatTime(event.timestamp)} - ${event.type}: ${event.details}`;
      // Use splitTextToSize for potential wrapping if details are long
      const splitText = doc.splitTextToSize(eventText, pageWidth - margin * 2 - 5);
      doc.text(splitText, margin + 5, currentY);
      currentY += (splitText.length * 4); // Adjust Y based on number of lines (approx 4mm per line for size 10)
    });
  } else {
    // Check for page break for 'no events' text
    if (currentY > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }
    doc.text('No events logged.', margin + 5, currentY);
    currentY += 5;
  }
  
  currentY += 5; // Add padding after the section
  return currentY; // Return the Y position after this section
};

export const PatientDetail: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [history, setHistory] = useState<PatientHistory[]>([]);
  const [anesthesiaBoluses, setAnesthesiaBoluses] = useState<AnesthesiaBolus[]>([]);
  const [anesthesiaCRIs, setAnesthesiaCRIs] = useState<AnesthesiaCRI[]>([]);
  const [medicalSummary, setMedicalSummary] = useState<MedicalSummary | null>(null);
  const [anesthesiaPlan, setAnesthesiaPlan] = useState<AnesthesiaPlan | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [medicalSummaryLoading, setMedicalSummaryLoading] = useState(true);
  const [anesthesiaPlanLoading, setAnesthesiaPlanLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const vitalSignsChartRef = useRef<VitalSignsChartRef>(null);
  const anesthesiaMedChartRef = useRef<AnesthesiaMedicationChartRef>(null);
  
  // State to track visible time range for charts
  const [visibleTimeRange, setVisibleTimeRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  
  // When patient ID changes, reset the time range
  useEffect(() => {
    // Clear time ranges when navigating to a different patient
    setVisibleTimeRange(null);
    
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      setMedicalSummaryLoading(true);
      setAnesthesiaPlanLoading(true);
      
      console.log('Fetching patient data for:', patientId);
      
      // Fetch patient details
      const patientData = await getPatient(patientId);
      if (!patientData) {
        setError('Patient not found');
        setLoading(false);
        return;
      }
      setPatient(patientData);
      
      // Fetch vital signs
      const vitalSignsData = await getVitalSigns(patientId);
      setVitalSigns(vitalSignsData);
      console.log('Loaded vital signs:', vitalSignsData.length);
      
      // Fetch medications
      const medicationsData = await getMedications(patientId);
      setMedications(medicationsData);
      
      // Fetch patient history
      const historyData = await getPatientHistory(patientId);
      setHistory(historyData);
      
      // Fetch anesthesia medications
      console.log('Fetching anesthesia medications...');
      const bolusesData = await getAnesthesiaBoluses(patientId);
      setAnesthesiaBoluses(bolusesData);
      console.log('Loaded boluses:', bolusesData.length);
      
      const crisData = await getAnesthesiaCRIs(patientId);
      setAnesthesiaCRIs(crisData);
      console.log('Loaded CRIs:', crisData.length);
      
      // Fetch medical summary
      const summaryData = await getMedicalSummary(patientId);
      setMedicalSummary(summaryData);
      setMedicalSummaryLoading(false);
      
      // Fetch anesthesia plan
      const planData = await getAnesthesiaPlan(patientId);
      setAnesthesiaPlan(planData);
      setAnesthesiaPlanLoading(false);
      
      // Fetch events
      const eventsData = await getEvents(patientId);
      setEvents(eventsData);
      console.log('Loaded events:', eventsData.length);
      
      setError('');
      console.log('Patient data loaded successfully');
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

  const handleBackClick = () => {
    navigate('/patients');
  };

  const handleDataAdded = () => {
    // Refresh the patient data
    if (patientId) {
      fetchPatientData();
    }
  };

  // Handle chart visible range change
  const handleVisibleRangeChange = (range: { start: Date; end: Date }) => {
    setVisibleTimeRange(range);
  };

  // Function to handle PDF download
  const handleDownloadPdf = async () => {
    // Check for patient data and *both* chart refs
    if (!patient || !vitalSignsChartRef.current || !anesthesiaMedChartRef.current) {
      alert('Patient data or chart instances not available for PDF generation.');
      console.error('Missing patient data or chart refs for PDF generation.');
      return;
    }

    console.log('Starting PDF generation...');

    try {
      // --- 1. Get Images from Chart Refs ---
      console.log('Getting Vital Signs chart image...');
      const vitalSignsImageDataUrl = await vitalSignsChartRef.current.getChartImage();
      if (!vitalSignsImageDataUrl) {
        throw new Error('Failed to get vital signs chart image data.');
      }
      console.log('Vital Signs image obtained.');
      
      console.log('Getting Anesthesia Medication chart image...');
      const anesthesiaImageDataUrl = await anesthesiaMedChartRef.current.getChartImage();
      if (!anesthesiaImageDataUrl) {
        throw new Error('Failed to get anesthesia medication chart image data.');
      }
      console.log('Anesthesia image obtained.');
      
      // --- 2. Create PDF Doc ---
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      console.log('jsPDF instance created.');

      // --- 3. Add Content ---
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      let currentY = margin;

      // Add Header
      doc.setFontSize(16);
      doc.text(`Anesthesia Record - ${patient.name}`, margin, currentY + 5);
      currentY += 8; // Increment Y
      doc.setFontSize(10);
      doc.text(`Patient ID: ${patient.id}`, margin, currentY + 5);
      currentY += 5;
      doc.text(`Owner: ${patient.ownerName ?? 'N/A'}`, margin, currentY + 5);
      currentY += 5;
      doc.text(`Weight: ${patient.weight} ${patient.weightUnit ?? 'kg'}`, margin, currentY + 5);
      currentY += 5;
      // Add generated date to header (aligned right)
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin - 50, margin + 5);
      currentY += 8; // Space after header
      
      // Vital Signs Chart Title & Image
      doc.setFontSize(14);
      doc.text('Vital Signs Chart', margin, currentY);
      currentY += 6; // Space after title

      const imgProps = doc.getImageProperties(vitalSignsImageDataUrl);
      const imgWidth = pageWidth - 2 * margin; // Full width within margins
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width; // Maintain aspect ratio
      
      // Check for page break before adding image
      if (currentY + imgHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin; // Reset Y to top margin on new page
      }
      
      console.log(`Adding image to PDF at (${margin}, ${currentY}) with dimensions ${imgWidth}x${imgHeight}`);
      doc.addImage(vitalSignsImageDataUrl, 'PNG', margin, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 10; // Update Y position below image + padding
      console.log('Image added.');

      // Medication Totals
      doc.setFontSize(12);
      doc.text('Medication Totals:', margin, currentY);
      currentY += 5; // Add space before listing
      doc.setFontSize(10);

      if (Object.keys(medicationTotals).length > 0) {
        Object.entries(medicationTotals).forEach(([name, data]) => {
           // Check for page break before each line item
           if (currentY > pageHeight - margin) {
              doc.addPage();
              currentY = margin;
           }
           doc.text(`${name}: ${data.totalAmount.toFixed(2)} ${data.unit}`, margin + 5, currentY);
           currentY += 5; // Increment Y position for the next line
        });
      } else {
         // Check for page break for the 'no medications' text
         if (currentY > pageHeight - margin) {
             doc.addPage();
             currentY = margin;
         }
         doc.text('No medications administered.', margin + 5, currentY);
         currentY += 5;
      }

      // Events Log
      console.log('Adding Events Log...');
      currentY = addEventsLog(doc, events, currentY, margin, pageWidth, pageHeight);
      console.log('Events Log added. Current Y:', currentY);
      
      // Add Anesthesia Medication Chart Title & Image
      doc.setFontSize(14);
      // Check for page break before title
      if (currentY > pageHeight - margin - 10) { 
        doc.addPage();
        currentY = margin;
      }
      doc.text('Anesthesia Medications Chart', margin, currentY);
      currentY += 6; // Space after title

      const anesImgProps = doc.getImageProperties(anesthesiaImageDataUrl);
      const anesImgWidth = pageWidth - 2 * margin;
      const anesImgHeight = (anesImgProps.height * anesImgWidth) / anesImgProps.width;
      
      // Check for page break before adding image
      if (currentY + anesImgHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin; 
      }
      
      console.log(`Adding anesthesia image to PDF at (${margin}, ${currentY}) with dimensions ${anesImgWidth}x${anesImgHeight}`);
      doc.addImage(anesthesiaImageDataUrl, 'PNG', margin, currentY, anesImgWidth, anesImgHeight);
      currentY += anesImgHeight + 10; // Update Y position below image + padding
      console.log('Anesthesia image added.');

      // MORE CONTENT TO BE ADDED HERE (Vitals List)

      // --- 4. Save PDF ---
      doc.save(`AnesthesiaRecord_${patient.name.replace(/\s+/g, '_')}_${patient.id}.pdf`);
      console.log('PDF saved.');

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please check the console for details.');
    } finally {
      // Optional: Stop loading indicator
    }
  };

  if (!patientId) {
    return <Navigate to="/patients" />;
  }

  // Calculate time range for charts with 5-minute rounding
  const getTimeRange = () => {
    const timestamps = [];
    
    // Collect all timestamps from vital signs
    for (const vs of vitalSigns) {
      const timestamp = vs.timestamp instanceof Date ? vs.timestamp : new Date(vs.timestamp);
      if (!isNaN(timestamp.getTime())) {
        timestamps.push(timestamp);
      }
    }
    
    // Collect all timestamps from boluses
    for (const bolus of anesthesiaBoluses) {
      const timestamp = bolus.timestamp instanceof Date ? bolus.timestamp : new Date(bolus.timestamp);
      if (!isNaN(timestamp.getTime())) {
        timestamps.push(timestamp);
      }
    }
    
    // Collect start and end times from CRIs
    for (const cri of anesthesiaCRIs) {
      const startTime = cri.startTime instanceof Date ? cri.startTime : new Date(cri.startTime);
      if (!isNaN(startTime.getTime())) {
        timestamps.push(startTime);
      }
      
      if (cri.endTime) {
        const endTime = cri.endTime instanceof Date ? cri.endTime : new Date(cri.endTime);
        if (!isNaN(endTime.getTime())) {
          timestamps.push(endTime);
        }
      }
    }
    
    // Default time range if no timestamps
    if (timestamps.length === 0) {
      const now = new Date();
      // Default to last hour, rounded to 5-minute intervals
      const endTime = new Date(Math.ceil(now.getTime() / (5 * 60000)) * (5 * 60000));
      const startTime = new Date(Math.floor((now.getTime() - 3600000) / (5 * 60000)) * (5 * 60000));
      return { startTime, endTime };
    }
    
    // Sort timestamps to find earliest and latest
    timestamps.sort((a, b) => a.getTime() - b.getTime());
    
    // Round down to nearest 5-minute interval for start time
    const earliestTime = timestamps[0].getTime();
    const startTime = new Date(Math.floor(earliestTime / (5 * 60000)) * (5 * 60000));
    
    // Round up to nearest 5-minute interval for end time
    const latestTime = timestamps[timestamps.length - 1].getTime();
    const endTime = new Date(Math.ceil(latestTime / (5 * 60000)) * (5 * 60000));
    
    // Add 5 minutes padding on both ends
    startTime.setMinutes(startTime.getMinutes() - 5);
    endTime.setMinutes(endTime.getMinutes() + 5);
    
    return { startTime, endTime };
  };

  // Time range for charts
  const timeRange = getTimeRange();

  // Calculate medication totals
  // Ensure procedureEndTime is passed correctly
  // Find the latest timestamp from all relevant data sources
  const allTimestamps = [
    ...vitalSigns.map(vs => vs.timestamp instanceof Date ? vs.timestamp.getTime() : new Date(vs.timestamp).getTime()),
    ...anesthesiaBoluses.map(b => b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime()),
    ...anesthesiaCRIs.map(c => c.startTime instanceof Date ? c.startTime.getTime() : new Date(c.startTime).getTime()),
    ...anesthesiaCRIs.filter(c => c.endTime).map(c => c.endTime instanceof Date ? c.endTime!.getTime() : new Date(c.endTime!).getTime()),
    ...events.map(e => e.timestamp instanceof Date ? e.timestamp.getTime() : new Date(e.timestamp).getTime()),
  ].filter(t => !isNaN(t)); // Filter out invalid dates

  const procedureEndTime = allTimestamps.length > 0 ? new Date(Math.max(...allTimestamps)) : new Date(); // Use latest time or now
  
  const medicationTotals = calculateMedicationTotals(anesthesiaBoluses, anesthesiaCRIs, procedureEndTime, patient?.weight ? parseFloat(patient.weight) : undefined);

  const calculatedTimeRange = getTimeRange();

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!patient) {
    return <Typography>Patient not found.</Typography>;
  }

  return (
    <Paper sx={{ padding: 2, margin: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handleBackClick}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ textAlign: 'center', flexGrow: 1 }}>
          {patient?.name || 'Patient Record'} - Anesthesia Record
        </Typography>
        <Button 
          variant="contained" 
          color="secondary" 
          startIcon={<PictureAsPdfIcon />}
          onClick={handleDownloadPdf}
        >
           Download Report PDF
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="Patient details tabs" centered variant="scrollable" scrollButtons="auto">
          <Tab label="Vital Signs" />
          <Tab label="Anesthesia Plan" />
          <Tab label="Medical Summary" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {/* Anesthesia Medication Chart */}
        {currentUser && (
          <AnesthesiaMedicationChart 
            ref={anesthesiaMedChartRef}
            key={`anesthesia-chart-${anesthesiaBoluses.length}-${anesthesiaCRIs.length}`}
            patientId={patientId}
            vitalSignsStartTime={timeRange.startTime}
            vitalSignsEndTime={timeRange.endTime}
            visibleTimeRange={visibleTimeRange || undefined}
            onMedicationAdded={handleDataAdded}
            currentUser={currentUser.email || currentUser.uid}
            anesthesiaData={{
              patient: patient,
              anesthesiaPlan: anesthesiaPlan,
              patientWeight: patient?.weight
            }}
          />
        )}
        
        <Box sx={{ my: 2 }}>
          <Typography variant="h6">Medication Totals</Typography>
          {Object.entries(medicationTotals).length > 0 ? (
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
              {Object.entries(medicationTotals).map(([name, data]) => (
                <li key={name}>{`${name}: ${data.totalAmount.toFixed(2)} ${data.unit}`}</li>
              ))}
            </ul>
          ) : (
            <Typography>No medications administered yet.</Typography>
          )}
        </Box>
        
        <div style={{ width: '100%', marginTop: '24px' }}>
          <Card>
            <div ref={chartContainerRef} style={{ width: '100%', backgroundColor: 'white' }}>
              {vitalSigns.length > 0 ? (
                <VitalSignsChart 
                  ref={vitalSignsChartRef}
                  vitalSigns={vitalSigns} 
                  patientId={patientId || ''}
                  onVisibleRangeChange={handleVisibleRangeChange}
                  timeRange={calculatedTimeRange}
                />
              ) : (
                <Typography style={{ padding: '16px' }}>No vital signs data available</Typography>
              )}
            </div>
          </Card>
        </div>
        
        <VitalSignForm patientId={patientId} onVitalSignAdded={handleDataAdded} />
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <div style={{ width: '100%' }}>
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
            />
            <Divider />
            <div style={{ width: '100%', padding: '16px' }}>
              <AnesthesiaPlanView 
                plan={anesthesiaPlan} 
                loading={anesthesiaPlanLoading} 
                patientWeight={patient.weight}
              />
            </div>
          </Card>
        </div>
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        <div style={{ width: '100%' }}>
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
            />
            <Divider />
            <div style={{ width: '100%', padding: '16px' }}>
              <MedicalSummaryView 
                summary={medicalSummary} 
                loading={medicalSummaryLoading} 
              />
            </div>
          </Card>
        </div>
      </TabPanel>
    </Paper>
  );
}; 