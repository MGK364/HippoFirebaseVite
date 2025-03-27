import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, useTheme, Container } from '@mui/material';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [chartWidth, setChartWidth] = useState<number>(0);
  
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
  
  // Set chart options with responsive scaling
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    layout: {
      padding: {
        top: 5,
        right: 15,
        bottom: 5,
        left: 15
      }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'center',
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          padding: 8,
          font: {
            size: 11
          }
        },
      },
      tooltip: {
        enabled: true,
        intersect: false,
        mode: 'index',
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: theme.palette.divider,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 10
          },
          autoSkip: true,
          maxTicksLimit: 10
        },
      },
      temperature: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Temperature (°C)',
          font: {
            size: 10
          }
        },
        min: 35,
        max: 42,
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          font: {
            size: 10
          }
        }
      },
      pulse: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Heart Rate (bpm)',
          font: {
            size: 10
          }
        },
        min: 40,
        max: 200,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 10
          }
        }
      },
      respiration: {
        type: 'linear',
        display: false,
        position: 'right',
        title: {
          display: true,
          text: 'Respiratory Rate (bpm)',
          font: {
            size: 10
          }
        },
        min: 0,
        max: 60,
        ticks: {
          font: {
            size: 10
          }
        }
      },
      bloodPressure: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Blood Pressure (mmHg)',
          font: {
            size: 10
          }
        },
        min: 0,
        max: 200,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 10
          }
        }
      },
      saturation: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'SpO2 (%)',
          font: {
            size: 10
          }
        },
        min: 80,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 10
          }
        }
      },
      etCO2: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'ETCO2 (mmHg)',
          font: {
            size: 10
          }
        },
        min: 20,
        max: 80,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 10
          }
        }
      },
      score: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Anesthetic Depth (1-5)',
          font: {
            size: 10
          }
        },
        min: 0,
        max: 5,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 10
          }
        }
      },
    },
    animation: {
      duration: 300,
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 7,
      },
      line: {
        borderWidth: 2,
      },
    },
  };
  
  // Force resize on mount and when dependencies change
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.resize();
    }
  }, [chartWidth, vitalSigns]);
  
  // Use ResizeObserver to update chart when container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    // Initial sizing - force an immediate resize
    const updateChartSize = () => {
      if (containerRef.current && chartRef.current) {
        const parentWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth;
        setChartWidth(parentWidth);
        
        // Force a layout calculation and resize
        setTimeout(() => {
          if (chartRef.current) {
            chartRef.current.resize();
            chartRef.current.update();
          }
        }, 0);
      }
    };
    
    // Initial call
    updateChartSize();
    
    const resizeObserver = new ResizeObserver(() => {
      updateChartSize();
    });

    // Observe both the container and its parent
    resizeObserver.observe(containerRef.current);
    if (containerRef.current.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }
    
    // Also observe window resize events
    window.addEventListener('resize', updateChartSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateChartSize);
    };
  }, []);

  return (
    <Box sx={{ 
      width: '100%', 
      paddingBottom: 2,
      display: 'flex',
      flexDirection: 'column',
      flex: 1
    }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Vital Signs Chart
      </Typography>

      {vitalSigns.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No vital signs data available yet. Add vital signs to visualize them here.
        </Typography>
      ) : (
        <Box
          ref={containerRef}
          sx={{
            width: '100%', 
            height: '500px',
            position: 'relative',
            flex: 1,
            display: 'block',
            boxSizing: 'border-box',
            '& canvas': {
              width: '100% !important',
              maxWidth: 'none !important'
            }
          }}
        >
          <Line
            ref={chartRef}
            data={chartData}
            options={chartOptions}
            height="100%"
            width="100%"
          />
        </Box>
      )}
    </Box>
  );
}; 