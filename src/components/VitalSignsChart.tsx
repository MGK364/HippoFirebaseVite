import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Box, Typography, useTheme } from '@mui/material';
import { VitalSign } from '../types';

// Register Chart.js components
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
  const chartRef = useRef<ChartJS<"line">>(null);
  
  // Sort vital signs by timestamp (oldest first)
  const sortedVitalSigns = [...vitalSigns].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  // Format timestamps for display
  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Extract labels (timestamps) for the x-axis
  const labels = sortedVitalSigns.map(vs => formatTime(vs.timestamp));
  
  // Create datasets for the chart
  const heartRateData = {
    label: 'Heart Rate (bpm)',
    data: sortedVitalSigns.map(vs => vs.heartRate),
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light,
    tension: 0.2,
    yAxisID: 'y'
  };
  
  const respiratoryRateData = {
    label: 'Respiratory Rate (bpm)',
    data: sortedVitalSigns.map(vs => vs.respiratoryRate),
    borderColor: theme.palette.secondary.main,
    backgroundColor: theme.palette.secondary.light,
    tension: 0.2,
    yAxisID: 'y'
  };
  
  const temperatureData = {
    label: 'Temperature (°C)',
    data: sortedVitalSigns.map(vs => vs.temperature),
    borderColor: theme.palette.error.main,
    backgroundColor: theme.palette.error.light,
    tension: 0.2,
    yAxisID: 'y1'
  };
  
  const systolicBPData = {
    label: 'Systolic BP (mmHg)',
    data: sortedVitalSigns.map(vs => vs.bloodPressure.systolic),
    borderColor: theme.palette.warning.main,
    backgroundColor: theme.palette.warning.light,
    tension: 0.2,
    yAxisID: 'y2'
  };
  
  const diastolicBPData = {
    label: 'Diastolic BP (mmHg)',
    data: sortedVitalSigns.map(vs => vs.bloodPressure.diastolic),
    borderColor: theme.palette.warning.dark,
    backgroundColor: theme.palette.warning.dark,
    tension: 0.2,
    borderDash: [5, 5],
    yAxisID: 'y2'
  };
  
  const oxygenSaturationData = {
    label: 'SpO2 (%)',
    data: sortedVitalSigns.map(vs => vs.oxygenSaturation),
    borderColor: theme.palette.info.main,
    backgroundColor: theme.palette.info.light,
    tension: 0.2,
    yAxisID: 'y3'
  };
  
  // Chart data
  const data = {
    labels,
    datasets: [
      heartRateData,
      respiratoryRateData,
      temperatureData,
      systolicBPData,
      diastolicBPData,
      oxygenSaturationData
    ]
  };

  // Chart options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 100,
    plugins: {
      legend: {
        position: 'top',
        display: true,
        labels: {
          // This more specific font property overrides the global property
          font: {
            size: 12,
          },
          boxWidth: 15,
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time'
        },
        ticks: {
          autoSkip: true,
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Heart/Respiratory Rate (bpm)'
        },
        min: 0,
        max: 200
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Temperature (°C)'
        },
        min: 35,
        max: 43,
        grid: {
          drawOnChartArea: false,
        },
      },
      y2: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Blood Pressure (mmHg)'
        },
        min: 0,
        max: 200,
        grid: {
          drawOnChartArea: false,
        },
      },
      y3: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'SpO2 (%)'
        },
        min: 80,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  };
  
  // Add resize observer to handle responsive behavior
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current) {
        chartRef.current.update();
      }
    });
    
    const chartContainer = document.getElementById('vital-signs-chart-container');
    if (chartContainer) {
      resizeObserver.observe(chartContainer);
    }
    
    return () => {
      if (chartContainer) {
        resizeObserver.unobserve(chartContainer);
      }
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <Box id="vital-signs-chart-container" sx={{ height: 500, width: '100%' }}>
      {vitalSigns.length > 0 ? (
        <Line ref={chartRef} options={options} data={data} />
      ) : (
        <Typography textAlign="center">No vital sign data available</Typography>
      )}
    </Box>
  );
}; 