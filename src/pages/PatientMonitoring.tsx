import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Container,
  Divider 
} from '@mui/material';
import MedicationTimeline, { CRIMedication, BolusMedication } from '../components/MedicationTimeline';
import MedicationAdministration from '../components/MedicationAdministration';
import ActiveMedications from '../components/ActiveMedications';
import VitalSignsChart from '../components/VitalSignsChart';

// Mock data for vital signs
const mockTimeData = Array.from({ length: 20 }).map((_, i) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - (20 - i) * 3);
  return date;
});

const mockHeartRateData = [80, 82, 85, 88, 90, 92, 95, 100, 105, 110, 105, 100, 98, 95, 90, 92, 94, 95, 94, 93];
const mockRespRateData = [15, 16, 17, 18, 20, 22, 24, 26, 25, 24, 22, 20, 18, 16, 15, 16, 18, 19, 18, 17];
const mockSpo2Data = [98, 98, 97, 97, 96, 96, 95, 94, 93, 92, 93, 94, 95, 96, 97, 98, 98, 99, 99, 98];
const mockTempData = [38.1, 38.2, 38.3, 38.4, 38.6, 38.8, 39.0, 39.2, 39.3, 39.4, 39.3, 39.1, 38.9, 38.7, 38.5, 38.4, 38.3, 38.2, 38.1, 38.0];

// Mock data for medications
const generateMockMedications = () => {
  const now = new Date();
  
  // Generate CRI medications
  const cris: CRIMedication[] = [
    {
      id: 'cri-1',
      name: 'Ketamine',
      rate: 10,
      unit: 'mcg/kg/min',
      startTime: new Date(now.getTime() - 60 * 60000), // 60 minutes ago
      color: '#4CAF50'
    },
    {
      id: 'cri-2',
      name: 'Lidocaine',
      rate: 50,
      unit: 'mcg/kg/min',
      startTime: new Date(now.getTime() - 58 * 60000), // 58 minutes ago
      color: '#2196F3'
    }
  ];
  
  // Generate bolus medications
  const boluses: BolusMedication[] = [
    {
      id: 'bolus-1',
      name: 'Hydromorphone',
      dose: 10,
      unit: 'mg',
      time: new Date(now.getTime() - 61 * 60000), // 61 minutes ago
      color: '#FFC107'
    }
  ];
  
  return { cris, boluses };
};

const PatientMonitoring: React.FC = () => {
  const [startTime, setStartTime] = useState(mockTimeData[0]);
  const [endTime, setEndTime] = useState(mockTimeData[mockTimeData.length - 1]);
  const [activeCRIs, setActiveCRIs] = useState<CRIMedication[]>([]);
  const [recentBoluses, setRecentBoluses] = useState<BolusMedication[]>([]);
  
  // New state for zoom and pan
  const [visibleTimeRange, setVisibleTimeRange] = useState<{
    startIndex: number;
    endIndex: number;
    startTime: Date;
    endTime: Date;
  }>({
    startIndex: 0,
    endIndex: mockTimeData.length - 1,
    startTime: mockTimeData[0],
    endTime: mockTimeData[mockTimeData.length - 1]
  });
  
  useEffect(() => {
    // Load mock data
    const { cris, boluses } = generateMockMedications();
    setActiveCRIs(cris);
    setRecentBoluses(boluses);
  }, []);
  
  // Handler for updating visible time range (called from VitalSignsChart)
  const handleVisibleRangeChange = useCallback((startIndex: number, endIndex: number) => {
    setVisibleTimeRange({
      startIndex,
      endIndex,
      startTime: mockTimeData[startIndex],
      endTime: mockTimeData[endIndex]
    });
  }, []);
  
  // Handler for adding a new medication
  const handleAddMedication = (
    medication: Omit<CRIMedication, 'id' | 'color'> | Omit<BolusMedication, 'id' | 'color'>, 
    type: 'cri' | 'bolus'
  ) => {
    if (type === 'cri') {
      const criMed = medication as Omit<CRIMedication, 'id' | 'color'>;
      const newCRI: CRIMedication = {
        ...criMed,
        id: `cri-${Date.now()}`,
        color: getRandomColor(),
      };
      setActiveCRIs([...activeCRIs, newCRI]);
    } else {
      const bolusMed = medication as Omit<BolusMedication, 'id' | 'color'>;
      const newBolus: BolusMedication = {
        ...bolusMed,
        id: `bolus-${Date.now()}`,
        color: getRandomColor(),
      };
      setRecentBoluses([...recentBoluses, newBolus]);
    }
  };
  
  // Handler for editing CRI rate
  const handleEditRate = (medicationId: string, newRate: number) => {
    setActiveCRIs(activeCRIs.map(cri => 
      cri.id === medicationId 
        ? { ...cri, rate: newRate } 
        : cri
    ));
  };
  
  // Handler for stopping a CRI
  const handleStopMedication = (medicationId: string) => {
    setActiveCRIs(activeCRIs.map(cri => 
      cri.id === medicationId 
        ? { ...cri, endTime: new Date() } 
        : cri
    ));
  };
  
  // Generate a random color for new medications
  const getRandomColor = () => {
    const colors = ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#FF5722', '#607D8B', '#795548'];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
          Patient Monitoring
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Main content area */}
          <Box sx={{ flex: '1 1 auto', width: { xs: '100%', md: '75%' } }}>
            {/* Vital Signs Chart with zoom/pan capability */}
            <VitalSignsChart
              timeData={mockTimeData}
              heartRateData={mockHeartRateData}
              respRateData={mockRespRateData}
              spo2Data={mockSpo2Data}
              tempData={mockTempData}
              height={400}
              onVisibleRangeChange={handleVisibleRangeChange}
            />
            
            {/* Medication Timeline synced with vital signs chart */}
            <MedicationTimeline
              startTime={startTime}
              endTime={endTime}
              visibleStartTime={visibleTimeRange.startTime}
              visibleEndTime={visibleTimeRange.endTime}
              cris={activeCRIs}
              boluses={recentBoluses}
              onEditRate={(id) => handleEditRate(id, activeCRIs.find(cri => cri.id === id)?.rate || 0)}
              onStopMedication={handleStopMedication}
            />
            
            {/* Medication Administration Controls */}
            <MedicationAdministration
              activeCRIs={activeCRIs.filter(cri => !cri.endTime)}
              recentBoluses={recentBoluses}
              onAddMedication={handleAddMedication}
              onEditRate={handleEditRate}
              onStopMedication={handleStopMedication}
            />
          </Box>
          
          {/* Sidebar */}
          <Box sx={{ width: { xs: '100%', md: '25%' }, minWidth: { md: '300px' } }}>
            {/* Active Medications Sidebar */}
            <ActiveMedications
              activeCRIs={activeCRIs.filter(cri => !cri.endTime)}
              recentBoluses={recentBoluses}
              onEditRate={(id) => handleEditRate(id, activeCRIs.find(cri => cri.id === id)?.rate || 0)}
              onStopMedication={handleStopMedication}
            />
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default PatientMonitoring; 