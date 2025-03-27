import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Slider, Button, ButtonGroup, IconButton, Stack } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';

// Mock interface for the actual chart library implementation
interface VitalSignsChartProps {
  timeData: Date[];
  heartRateData: number[];
  respRateData: number[];
  spo2Data: number[];
  tempData: number[];
  height?: number;
  onVisibleRangeChange?: (startIndex: number, endIndex: number) => void;
}

const VitalSignsChart: React.FC<VitalSignsChartProps> = ({
  timeData,
  heartRateData,
  respRateData,
  spo2Data,
  tempData,
  height = 400,
  onVisibleRangeChange
}) => {
  // State for zoom and pan
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const [visibleEndIndex, setVisibleEndIndex] = useState(timeData.length - 1);
  const [zoomLevel, setZoomLevel] = useState(100); // Percentage of data shown
  
  // Notify parent component when visible range changes
  useEffect(() => {
    if (onVisibleRangeChange) {
      onVisibleRangeChange(visibleStartIndex, visibleEndIndex);
    }
  }, [visibleStartIndex, visibleEndIndex, onVisibleRangeChange]);
  
  // Calculate visible data based on current zoom and pan settings
  const getVisibleData = () => {
    const visibleTimeData = timeData.slice(visibleStartIndex, visibleEndIndex + 1);
    const visibleHeartRateData = heartRateData.slice(visibleStartIndex, visibleEndIndex + 1);
    const visibleRespRateData = respRateData.slice(visibleStartIndex, visibleEndIndex + 1);
    const visibleSpO2Data = spo2Data.slice(visibleStartIndex, visibleEndIndex + 1);
    const visibleTempData = tempData.slice(visibleStartIndex, visibleEndIndex + 1);
    
    return {
      visibleTimeData,
      visibleHeartRateData,
      visibleRespRateData,
      visibleSpO2Data,
      visibleTempData
    };
  };
  
  // Current visible data
  const { 
    visibleTimeData, 
    visibleHeartRateData, 
    visibleRespRateData, 
    visibleSpO2Data, 
    visibleTempData 
  } = getVisibleData();
  
  // Zoom in function
  const handleZoomIn = () => {
    if (zoomLevel <= 10) return; // Prevent zooming in too far
    
    // Calculate new zoom level
    const newZoomLevel = Math.max(10, zoomLevel - 10);
    setZoomLevel(newZoomLevel);
    
    // Calculate new visible range
    const totalPoints = timeData.length;
    const visiblePoints = Math.round((totalPoints * newZoomLevel) / 100);
    const middlePoint = Math.round((visibleStartIndex + visibleEndIndex) / 2);
    const halfVisiblePoints = Math.floor(visiblePoints / 2);
    
    let newStartIndex = Math.max(0, middlePoint - halfVisiblePoints);
    let newEndIndex = Math.min(totalPoints - 1, newStartIndex + visiblePoints - 1);
    
    // Adjust if we hit the right boundary
    if (newEndIndex >= totalPoints) {
      newEndIndex = totalPoints - 1;
      newStartIndex = Math.max(0, newEndIndex - visiblePoints + 1);
    }
    
    setVisibleStartIndex(newStartIndex);
    setVisibleEndIndex(newEndIndex);
  };
  
  // Zoom out function
  const handleZoomOut = () => {
    if (zoomLevel >= 100) {
      // Reset to full view
      handleResetZoom();
      return;
    }
    
    // Calculate new zoom level
    const newZoomLevel = Math.min(100, zoomLevel + 10);
    setZoomLevel(newZoomLevel);
    
    // Calculate new visible range
    const totalPoints = timeData.length;
    const visiblePoints = Math.round((totalPoints * newZoomLevel) / 100);
    const middlePoint = Math.round((visibleStartIndex + visibleEndIndex) / 2);
    const halfVisiblePoints = Math.floor(visiblePoints / 2);
    
    let newStartIndex = Math.max(0, middlePoint - halfVisiblePoints);
    let newEndIndex = Math.min(totalPoints - 1, newStartIndex + visiblePoints - 1);
    
    // Adjust if we hit the right boundary
    if (newEndIndex >= totalPoints) {
      newEndIndex = totalPoints - 1;
      newStartIndex = Math.max(0, newEndIndex - visiblePoints + 1);
    }
    
    setVisibleStartIndex(newStartIndex);
    setVisibleEndIndex(newEndIndex);
  };
  
  // Pan left function
  const handlePanLeft = () => {
    if (visibleStartIndex <= 0) return; // Can't pan left anymore
    
    const visiblePoints = visibleEndIndex - visibleStartIndex + 1;
    const panAmount = Math.max(1, Math.floor(visiblePoints * 0.25)); // Pan by 25% of visible width
    
    setVisibleStartIndex(Math.max(0, visibleStartIndex - panAmount));
    setVisibleEndIndex(Math.max(visiblePoints - 1, visibleEndIndex - panAmount));
  };
  
  // Pan right function
  const handlePanRight = () => {
    if (visibleEndIndex >= timeData.length - 1) return; // Can't pan right anymore
    
    const visiblePoints = visibleEndIndex - visibleStartIndex + 1;
    const panAmount = Math.max(1, Math.floor(visiblePoints * 0.25)); // Pan by 25% of visible width
    
    setVisibleStartIndex(Math.min(timeData.length - visiblePoints, visibleStartIndex + panAmount));
    setVisibleEndIndex(Math.min(timeData.length - 1, visibleEndIndex + panAmount));
  };
  
  // Reset zoom/pan to show all data
  const handleResetZoom = () => {
    setVisibleStartIndex(0);
    setVisibleEndIndex(timeData.length - 1);
    setZoomLevel(100);
  };
  
  // Handle slider changes
  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) return;
    
    const totalPoints = timeData.length;
    const visiblePoints = Math.round((totalPoints * zoomLevel) / 100);
    
    // Calculate max start index to ensure we don't go past the end
    const maxStartIndex = totalPoints - visiblePoints;
    
    // Calculate new start position (0-100%)
    const newStartIndex = Math.min(maxStartIndex, Math.round((newValue / 100) * maxStartIndex));
    
    setVisibleStartIndex(newStartIndex);
    setVisibleEndIndex(Math.min(totalPoints - 1, newStartIndex + visiblePoints - 1));
  };
  
  // Calculate slider position based on current view
  const getSliderPosition = () => {
    const totalPoints = timeData.length;
    const visiblePoints = visibleEndIndex - visibleStartIndex + 1;
    const maxStartIndex = totalPoints - visiblePoints;
    
    if (maxStartIndex <= 0) return 0;
    return (visibleStartIndex / maxStartIndex) * 100;
  };

  // This is a placeholder for a real chart implementation
  // In a production app, this would use a charting library like Chart.js, Recharts, or Nivo
  
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Vital Signs
        </Typography>
        
        <Stack direction="row" spacing={1}>
          <ButtonGroup size="small">
            <IconButton onClick={handlePanLeft} disabled={visibleStartIndex <= 0}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={handleZoomIn} disabled={zoomLevel <= 10}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={handleZoomOut} disabled={zoomLevel >= 100}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={handlePanRight} disabled={visibleEndIndex >= timeData.length - 1}>
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </ButtonGroup>
          <IconButton onClick={handleResetZoom} disabled={zoomLevel === 100}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
      
      <Box 
        sx={{ 
          height, 
          width: '100%', 
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 2,
          position: 'relative'
        }}
      >
        {/* Heart Rate Line */}
        <Box sx={{ position: 'absolute', top: 20, left: 0, right: 0, height: '20%' }}>
          <Typography variant="caption" sx={{ position: 'absolute', left: 8, top: 0 }}>
            HR (bpm)
          </Typography>
          <LineChart 
            data={visibleHeartRateData} 
            timeData={visibleTimeData} 
            color="#F44336" 
            min={60} 
            max={140} 
          />
        </Box>
        
        {/* Respiratory Rate Line */}
        <Box sx={{ position: 'absolute', top: '25%', left: 0, right: 0, height: '20%' }}>
          <Typography variant="caption" sx={{ position: 'absolute', left: 8, top: 0 }}>
            RR (bpm)
          </Typography>
          <LineChart 
            data={visibleRespRateData} 
            timeData={visibleTimeData} 
            color="#2196F3" 
            min={10} 
            max={30} 
          />
        </Box>
        
        {/* SpO2 Line */}
        <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '20%' }}>
          <Typography variant="caption" sx={{ position: 'absolute', left: 8, top: 0 }}>
            SpO2 (%)
          </Typography>
          <LineChart 
            data={visibleSpO2Data} 
            timeData={visibleTimeData} 
            color="#4CAF50" 
            min={90} 
            max={100} 
          />
        </Box>
        
        {/* Temperature Line */}
        <Box sx={{ position: 'absolute', top: '75%', left: 0, right: 0, height: '20%' }}>
          <Typography variant="caption" sx={{ position: 'absolute', left: 8, top: 0 }}>
            Temp (°C)
          </Typography>
          <LineChart 
            data={visibleTempData} 
            timeData={visibleTimeData} 
            color="#FF9800" 
            min={37} 
            max={40} 
          />
        </Box>
        
        {/* Time Axis */}
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 10, 
            left: 60, 
            right: 10, 
            height: 20,
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          {visibleTimeData.filter((_, i, arr) => {
            // Dynamically adjust time ticks based on zoom level
            const skipFactor = Math.max(1, Math.floor(arr.length / 6));
            return i % skipFactor === 0;
          }).map((time, index) => (
            <Typography key={index} variant="caption" sx={{ transform: 'rotate(-45deg)', transformOrigin: 'top left' }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          ))}
        </Box>
      </Box>
      
      {/* Timeline slider for panning */}
      <Box sx={{ mt: 2, px: 1 }}>
        <Slider
          value={getSliderPosition()}
          onChange={handleSliderChange}
          disabled={zoomLevel >= 100}
          aria-label="Time Range"
          size="small"
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption">
            {timeData[0].toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
          <Typography variant="caption">
            Zoom: {zoomLevel}%
          </Typography>
          <Typography variant="caption">
            {timeData[timeData.length - 1].toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

// Simple line chart implementation
interface LineChartProps {
  data: number[];
  timeData: Date[];
  color: string;
  min: number;
  max: number;
}

const LineChart: React.FC<LineChartProps> = ({ data, timeData, color, min, max }) => {
  // Scale data points for display
  const scaledData = data.map(value => {
    const range = max - min;
    const scaledValue = ((value - min) / range) * 100;
    return Math.max(0, Math.min(100, scaledValue)); // Ensure within 0-100%
  });
  
  // Generate SVG path
  const pathData = scaledData.map((value, index) => {
    const x = (index / (data.length - 1)) * 100; // Scale to 0-100%
    const y = 100 - value; // Invert Y axis
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  return (
    <Box 
      sx={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <svg 
        width="100%" 
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {/* Reference lines */}
        <line x1="0" y1="0" x2="100" y2="0" stroke="#e0e0e0" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#e0e0e0" strokeWidth="0.5" />
        <line x1="0" y1="100" x2="100" y2="100" stroke="#e0e0e0" strokeWidth="0.5" />
        
        {/* Data line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      </svg>
      
      {/* Y-axis labels */}
      <Typography 
        variant="caption" 
        sx={{ position: 'absolute', left: 0, top: 0, color: 'text.secondary' }}
      >
        {max}
      </Typography>
      <Typography 
        variant="caption" 
        sx={{ position: 'absolute', left: 0, bottom: 0, color: 'text.secondary' }}
      >
        {min}
      </Typography>
    </Box>
  );
};

export default VitalSignsChart; 