import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Typography, useTheme, Button, Box, Tooltip as MuiTooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  TimeScale,
  ChartData,
  ChartOptions,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';
import { VitalSign, Event } from '../types';
import EventForm from './EventForm';
import { getEvents } from '../services/patients';

// Register the required chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  ChartTooltip,
  Legend
);

interface VitalSignsChartProps {
  vitalSigns: VitalSign[];
  patientId: string;
  onVisibleRangeChange?: (range: {
    start: Date;
    end: Date;
  }) => void;
  timeRange?: {
    startTime: Date;
    endTime: Date;
  };
}

// Define the type for the forwarded ref
export interface VitalSignsChartRef {
  getChart: () => ChartJS | null;
  getChartImage: () => Promise<string | undefined>;
}

export const VitalSignsChart = forwardRef<VitalSignsChartRef, VitalSignsChartProps>(({ 
  vitalSigns,
  patientId,
  onVisibleRangeChange,
  timeRange,
}, ref) => {
  const theme = useTheme();
  const chartContainer = useRef<HTMLDivElement>(null);
  const chartInstanceRefInternal = useRef<ChartJS<'line'> | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartData<'line'>>({ datasets: [] });
  const [chartOptions, setChartOptions] = useState<ChartOptions<'line'>>({});

  // Expose the chart instance and image getter via the ref
  useImperativeHandle(ref, () => ({
    getChart: () => chartInstanceRefInternal.current,
    getChartImage: (): Promise<string | undefined> => {
      return new Promise((resolve) => {
        // Delay before capturing
        setTimeout(() => {
          const chartInstance = chartInstanceRefInternal.current;
          if (chartInstance) {
            console.log('Calling toBase64Image after delay...');
            try {
              const imageData = chartInstance.toBase64Image('image/png', 1);
              console.log('Image data obtained (length):', imageData?.length);
              resolve(imageData);
            } catch (e) {
              console.error("Error calling toBase64Image:", e);
              resolve(undefined);
            }
          } else {
            console.error('Chart instance not found in getChartImage after delay.');
            resolve(undefined);
          }
        }, 150); // 150ms delay
      });
    }
  }));

  // Function to format timestamps
  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Helper function to convert Celsius to Fahrenheit
  const celsiusToFahrenheit = (celsius: number): number => {
    return (celsius * 9/5) + 32;
  };
  
  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const fetchedEvents = await getEvents(patientId);
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadEvents();
  }, [patientId]);
  
  // Sort vital signs by timestamp
  const sortedVitalSigns = [...vitalSigns].sort((a, b) => {
    const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Extract timestamps and data for chart
  const timestamps = sortedVitalSigns.map((vs) => {
    const timestamp = vs.timestamp instanceof Date ? vs.timestamp : new Date(vs.timestamp);
    // Return only valid dates, filter out any invalid ones
    return isNaN(timestamp.getTime()) ? null : timestamp;
  }).filter((timestamp): timestamp is Date => timestamp !== null);

  // Make sure we have valid timestamps before proceeding
  if (timestamps.length === 0 && sortedVitalSigns.length > 0) {
    console.error("No valid timestamps found in vital signs data");
  }
  
  // Determine the min and max times for the chart x-axis
  const getTimeMinMax = () => {
    // Always prioritize the timeRange prop from parent for consistent view
    if (timeRange && timeRange.startTime && timeRange.endTime) {
      const startValid = timeRange.startTime instanceof Date && !isNaN(timeRange.startTime.getTime());
      const endValid = timeRange.endTime instanceof Date && !isNaN(timeRange.endTime.getTime());
      
      if (startValid && endValid) {
        return {
          minTime: timeRange.startTime,
          maxTime: timeRange.endTime
        };
      }
    }
    
    // Fallback to timestamps from data if available
    if (timestamps.length > 0) {
      return {
        minTime: timestamps[0],
        maxTime: timestamps[timestamps.length - 1]
      };
    }
    
    // Last resort fallback
    const now = new Date();
    return {
      minTime: new Date(now.getTime() - 3600000), // 1 hour ago
      maxTime: now
    };
  };
  
  const { minTime, maxTime } = getTimeMinMax();
  
  // Format timestamps for labels
  const labels = timestamps.map(formatTime);
  
  // Helper function to safely create data points
  const createDataPoints = (vitalSigns: VitalSign[], valueKey: string, subKey?: string) => {
    return vitalSigns
      .filter(vs => {
        const timestamp = vs.timestamp instanceof Date ? vs.timestamp : new Date(vs.timestamp);
        if (isNaN(timestamp.getTime())) return false;
        
        // Check if the value exists and is valid
        const value = subKey 
          ? (vs as any)[valueKey]?.[subKey] 
          : (vs as any)[valueKey];
        
        return value !== null && value !== undefined && !isNaN(Number(value));
      })
      .map(vs => {
        const timestamp = vs.timestamp instanceof Date ? vs.timestamp : new Date(vs.timestamp);
        let value = subKey 
          ? (vs as any)[valueKey]?.[subKey] 
          : (vs as any)[valueKey];
        
        // Convert temperature from Celsius to Fahrenheit
        if (valueKey === 'temperature' && value !== null && value !== undefined) {
          value = celsiusToFahrenheit(value);
        }
          
        return {
          x: timestamp.getTime(),
          y: Number(value)
        };
      });
  };

  // Create annotations for events
  const createEventAnnotations = () => {
    if (!events.length) return {};
    
    const annotations: any = {};
    
    events.forEach((event, index) => {
      const eventTime = event.timestamp instanceof Date ? 
        event.timestamp : new Date(event.timestamp);
        
      annotations[`event-${event.id}`] = {
        type: 'line',
        borderColor: event.color || '#000000',
        borderWidth: 2,
        label: {
          content: event.type,
          enabled: true,
          position: 'start',
          backgroundColor: event.color || '#000000',
          font: {
            size: 10
          }
        },
        scaleID: 'x',
        value: eventTime.getTime()
      };
    });
    
    return annotations;
  };

  // Effect to prepare chart data and options
  useEffect(() => {
    const newChartData: ChartData<'line'> = {
      labels,
      datasets: [
        {
          label: 'Temperature (°F)',
          data: createDataPoints(sortedVitalSigns, 'temperature'),
          borderColor: theme.palette.primary.main,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y',
          tension: 0.3,
        },
        {
          label: 'Heart Rate (bpm)',
          data: createDataPoints(sortedVitalSigns, 'heartRate'),
          borderColor: theme.palette.secondary.main,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          yAxisID: 'y',
          tension: 0.3,
        },
        {
          label: 'Respiratory Rate (bpm)',
          data: createDataPoints(sortedVitalSigns, 'respiratoryRate'),
          borderColor: theme.palette.success.main,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y',
          tension: 0.3,
        },
        {
          label: 'Systolic BP (mmHg)',
          data: createDataPoints(sortedVitalSigns, 'bloodPressure', 'systolic'),
          borderColor: theme.palette.error.main,
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          yAxisID: 'y',
          tension: 0.3,
        },
        {
          label: 'Diastolic BP (mmHg)',
          data: createDataPoints(sortedVitalSigns, 'bloodPressure', 'diastolic'),
          borderColor: theme.palette.warning.main,
          backgroundColor: 'rgba(255, 205, 86, 0.2)',
          yAxisID: 'y',
          tension: 0.3,
          borderDash: [5, 5],
        },
        {
          label: 'Mean BP (mmHg)',
          data: createDataPoints(sortedVitalSigns, 'bloodPressure', 'mean'),
          borderColor: '#FF6384',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y',
          tension: 0.3,
          borderDash: [10, 5],
        },
        {
          label: 'SpO2 (%)',
          data: createDataPoints(sortedVitalSigns, 'oxygenSaturation'),
          borderColor: '#4BC0C0',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y',
          tension: 0.3,
        },
        {
          label: 'ETCO2 (mmHg)',
          data: createDataPoints(sortedVitalSigns, 'etCO2'),
          borderColor: '#9966FF',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          yAxisID: 'y',
          tension: 0.3,
        },
      ],
    };
    const newChartOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0 // Disable animation for snapshots
      },
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
          enabled: true, // Keep tooltips enabled for interaction
          mode: 'index',
          intersect: false,
          callbacks: {
            afterBody: (tooltipItems) => {
              if (!events.length) return [];
              const tooltipTime = new Date(tooltipItems[0].parsed.x);
              const tooltipTimestamp = tooltipTime.getTime();
              const nearbyEvents = events.filter(event => {
                const eventTime = event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp);
                const diff = Math.abs(eventTime.getTime() - tooltipTimestamp);
                return diff < 300000; // 5 minutes
              });
              if (nearbyEvents.length === 0) return [];
              return [
                '',
                'Events:',
                ...nearbyEvents.map(event => {
                  const eventTime = event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp);
                  return `${event.type}: ${event.title} (${eventTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})})`;
                })
              ];
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'minute',
            displayFormats: { minute: 'h:mm a' },
            tooltipFormat: 'h:mm a'
          },
          min: minTime.getTime(),
          max: maxTime.getTime(),
          ticks: {
            source: 'auto',
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 10
          }
        },
        y: {
          type: 'linear',
          position: 'left',
          min: 0,
          max: 200,
          title: { display: false }
        },
      },
    };

    setChartData(newChartData);
    setChartOptions(newChartOptions);

  }, [vitalSigns, events, timeRange, theme]);

  // Handle event form
  const handleOpenEventForm = () => {
    setIsEventFormOpen(true);
  };
  
  const handleCloseEventForm = () => {
    setIsEventFormOpen(false);
  };
  
  const handleEventAdded = async () => {
    try {
      setLoading(true);
      const updatedEvents = await getEvents(patientId);
      setEvents(updatedEvents);
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Display event markers on the chart
  const renderEventMarkers = () => {
    if (!events.length || !chartContainer.current) return null;
    
    // Use the chart's width to calculate positions
    const chartWidth = chartContainer.current.clientWidth;
    const timeDuration = maxTime.getTime() - minTime.getTime();
    
    if (timeDuration <= 0) return null; // Avoid division by zero

    return events.map((event) => {
      const eventTime = event.timestamp instanceof Date ? 
        event.timestamp : new Date(event.timestamp);
      
      // Calculate position as percentage of chart width
      const timeDiff = eventTime.getTime() - minTime.getTime();
      const positionPercent = (timeDiff / timeDuration) * 100;
      
      // Only show markers within the visible range
      if (positionPercent < 0 || positionPercent > 100) return null;
      
      return (
        <MuiTooltip
          key={event.id}
          title={
            <Box sx={{ fontSize: '0.75rem' }}>
              <strong>{event.title}</strong>
              <div>Type: {event.type}</div>
              <div>Time: {eventTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
              {event.details && <div>Details: {event.details}</div>}
            </Box>
          }
          placement="top"
          arrow
        >
          <div
            style={{
              position: 'absolute',
              left: `${positionPercent}%`,
              bottom: 0,
              transform: 'translateX(-50%)',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <EventIcon
              sx={{
                color: event.color || theme.palette.grey[700],
                fontSize: 20,
                mb: 1
              }}
            />
          </div>
        </MuiTooltip>
      );
    });
  };
  
  // Resize handler for chart responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (chartInstanceRefInternal.current) {
        chartInstanceRefInternal.current.resize();
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
    <Box sx={{ position: 'relative' }} ref={chartContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <Typography variant="h6">
            Vital Signs Chart
          </Typography>
        </div>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenEventForm}
          size="small"
        >
          Log Event
        </Button>
      </div>

      {vitalSigns.length === 0 ? (
        <Typography style={{ textAlign: 'center', padding: '32px 0' }}>
          No vital signs data available yet.
        </Typography>
      ) : (
        <div 
          style={{
            width: '100%',
            height: '500px',
            padding: '16px',
            margin: '0',
          }}
        >
          <Line
            ref={chartInstanceRefInternal}
            data={chartData}
            options={chartOptions}
          />
          
          {/* Event markers */}
          <div style={{ position: 'absolute', bottom: 25, left: 0, right: 0, height: 30, pointerEvents: 'none' }}>
            {renderEventMarkers()}
          </div>
        </div>
      )}
      
      {/* Event Form */}
      <EventForm
        open={isEventFormOpen}
        onClose={handleCloseEventForm}
        patientId={patientId}
        onEventAdded={handleEventAdded}
        initialTimestamp={new Date()}
      />
    </Box>
  );
}); 