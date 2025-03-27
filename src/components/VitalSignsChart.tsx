import React, { useEffect, useRef } from 'react';
import { Typography, useTheme } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { VitalSign } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface VitalSignsChartProps {
  vitalSigns: VitalSign[];
}

export const VitalSignsChart: React.FC<VitalSignsChartProps> = ({ vitalSigns }) => {
  const theme = useTheme();
  const chartContainer = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ChartJS<'line'>>(null);
  
  // Function to format timestamps
  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Sort vital signs by timestamp
  const sortedVitalSigns = [...vitalSigns].sort((a, b) => {
    const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Extract timestamps for x-axis
  const labels = sortedVitalSigns.map((vs) => formatTime(vs.timestamp));
  
  // Extract data for different vital signs
  const temperatureData = sortedVitalSigns.map((vs) => vs.temperature);
  const heartRateData = sortedVitalSigns.map((vs) => vs.heartRate);
  const respiratoryRateData = sortedVitalSigns.map((vs) => vs.respiratoryRate);
  const systolicData = sortedVitalSigns.map((vs) => vs.bloodPressure.systolic);
  const diastolicData = sortedVitalSigns.map((vs) => vs.bloodPressure.diastolic);
  const meanData = sortedVitalSigns.map((vs) => vs.bloodPressure.mean);
  const oxygenSaturationData = sortedVitalSigns.map((vs) => vs.oxygenSaturation);
  const etCO2Data = sortedVitalSigns.map((vs) => vs.etCO2);
  const anestheticDepthData = sortedVitalSigns.map((vs) => vs.anestheticDepth);
  
  // Set up chart data
  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: temperatureData,
        borderColor: theme.palette.primary.main,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        yAxisID: 'temperature',
        tension: 0.3,
      },
      {
        label: 'Heart Rate (bpm)',
        data: heartRateData,
        borderColor: theme.palette.secondary.main,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        yAxisID: 'pulse',
        tension: 0.3,
      },
      {
        label: 'Respiratory Rate (bpm)',
        data: respiratoryRateData,
        borderColor: theme.palette.success.main,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'respiration',
        tension: 0.3,
      },
      {
        label: 'Systolic BP (mmHg)',
        data: systolicData,
        borderColor: theme.palette.error.main,
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        yAxisID: 'bloodPressure',
        tension: 0.3,
      },
      {
        label: 'Diastolic BP (mmHg)',
        data: diastolicData,
        borderColor: theme.palette.warning.main,
        backgroundColor: 'rgba(255, 205, 86, 0.2)',
        yAxisID: 'bloodPressure',
        tension: 0.3,
        borderDash: [5, 5],
      },
      {
        label: 'Mean BP (mmHg)',
        data: meanData,
        borderColor: '#FF6384',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        yAxisID: 'bloodPressure',
        tension: 0.3,
        borderDash: [10, 5],
      },
      {
        label: 'SpO2 (%)',
        data: oxygenSaturationData,
        borderColor: '#4BC0C0',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'saturation',
        tension: 0.3,
      },
      {
        label: 'ETCO2 (mmHg)',
        data: etCO2Data,
        borderColor: '#9966FF',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        yAxisID: 'etCO2',
        tension: 0.3,
      },
      {
        label: 'Anesthetic Depth (1-5)',
        data: anestheticDepthData,
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        yAxisID: 'score',
        tension: 0.3,
        borderDash: [3, 3],
      },
    ],
  };
  
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          boxWidth: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: 10
        },
      },
      temperature: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
        min: 35,
        max: 42,
      },
      pulse: {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: 'Heart Rate (bpm)',
        },
        min: 40,
        max: 200,
        grid: {
          drawOnChartArea: false,
        },
      },
      respiration: {
        type: 'linear',
        display: false,
        position: 'right',
        title: {
          display: true,
          text: 'Respiratory Rate (bpm)',
        },
        min: 0,
        max: 60,
      },
      bloodPressure: {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: 'Blood Pressure (mmHg)',
        },
        min: 0,
        max: 200,
        grid: {
          drawOnChartArea: false,
        },
      },
      saturation: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'SpO2 (%)',
        },
        min: 80,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      },
      etCO2: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'ETCO2 (mmHg)',
        },
        min: 20,
        max: 80,
        grid: {
          drawOnChartArea: false,
        },
      },
      score: {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: 'Anesthetic Depth (1-5)',
        },
        min: 0,
        max: 5,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };
  
  // Resize handler for chart responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    // Initial resize after render
    setTimeout(handleResize, 100);
    
    // Listen for window resize events
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{ width: '100%', padding: '0', margin: '0' }}>
      <Typography variant="h6" style={{ marginBottom: '16px' }}>
        Vital Signs Chart
      </Typography>

      {vitalSigns.length === 0 ? (
        <Typography style={{ textAlign: 'center', padding: '32px 0' }}>
          No vital signs data available yet.
        </Typography>
      ) : (
        <div 
          ref={chartContainer} 
          style={{
            width: '100%',
            height: '500px',
            padding: '0',
            margin: '0',
            position: 'relative'
          }}
        >
          <Line
            ref={chartInstance}
            data={chartData}
            options={chartOptions}
          />
        </div>
      )}
    </div>
  );
}; 