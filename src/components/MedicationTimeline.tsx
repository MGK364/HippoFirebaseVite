import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Chip } from '@mui/material';

// Types for medication data
export interface CRIMedication {
  id: string;
  name: string;
  rate: number;
  unit: string;
  startTime: Date;
  endTime?: Date;
  color: string;
}

export interface BolusMedication {
  id: string;
  name: string;
  dose: number;
  unit: string;
  time: Date;
  color: string;
}

interface MedicationTimelineProps {
  startTime: Date;
  endTime: Date;
  cris: CRIMedication[];
  boluses: BolusMedication[];
  onEditRate?: (medicationId: string) => void;
  onStopMedication?: (medicationId: string) => void;
  // New props for zoom/pan sync
  visibleStartTime?: Date;
  visibleEndTime?: Date;
}

const MedicationTimeline: React.FC<MedicationTimelineProps> = ({
  startTime,
  endTime,
  cris,
  boluses,
  onEditRate,
  onStopMedication,
  visibleStartTime,
  visibleEndTime
}) => {
  // Use provided visible range or default to full range
  const effectiveStartTime = visibleStartTime || startTime;
  const effectiveEndTime = visibleEndTime || endTime;
  
  // Calculate the total duration in milliseconds for the visible range
  const totalDuration = effectiveEndTime.getTime() - effectiveStartTime.getTime();
  
  // Function to check if a time is within the visible range
  const isTimeVisible = (time: Date) => {
    return time >= effectiveStartTime && time <= effectiveEndTime;
  };
  
  // Function to check if a CRI is visible in the current range
  const isCRIVisible = (cri: CRIMedication) => {
    const criEndTime = cri.endTime || new Date();
    // CRI is visible if any part of it overlaps with the visible range
    return (
      (cri.startTime <= effectiveEndTime && criEndTime >= effectiveStartTime)
    );
  };
  
  // Function to calculate position percentage on the timeline
  const calculateTimePosition = (time: Date) => {
    // Clamp time to visible range
    const clampedTime = new Date(Math.max(
      effectiveStartTime.getTime(),
      Math.min(effectiveEndTime.getTime(), time.getTime())
    ));
    
    const timePosition = clampedTime.getTime() - effectiveStartTime.getTime();
    return (timePosition / totalDuration) * 100;
  };

  // Function to calculate width percentage on the timeline for CRIs
  const calculateCRIWidth = (start: Date, end: Date | undefined) => {
    // Clamp dates to visible range
    const clampedStart = new Date(Math.max(
      effectiveStartTime.getTime(),
      start.getTime()
    ));
    
    if (!end) {
      // If no end time, extend to current time or endTime, whichever is earlier
      const now = new Date();
      end = now < effectiveEndTime ? now : effectiveEndTime;
    }
    
    const clampedEnd = new Date(Math.min(
      effectiveEndTime.getTime(),
      end.getTime()
    ));
    
    const duration = clampedEnd.getTime() - clampedStart.getTime();
    return (duration / totalDuration) * 100;
  };

  // Filter visible medications
  const visibleCRIs = cris.filter(isCRIVisible);
  const visibleBoluses = boluses.filter(bolus => isTimeVisible(bolus.time));

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Constant Rate Infusions
      </Typography>
      
      {/* Timeline for CRIs */}
      <Box sx={{ position: 'relative', height: visibleCRIs.length * 60 + 20, mb: 4, minHeight: '100px' }}>
        {/* Time axis */}
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            height: '2px', 
            bgcolor: 'grey.300'
          }}
        />
        
        {/* Time indicators */}
        {Array.from({ length: 5 }).map((_, i) => {
          const tickTime = new Date(
            effectiveStartTime.getTime() + (totalDuration * i) / 4
          );
          return (
            <Box 
              key={i}
              sx={{
                position: 'absolute',
                bottom: 0,
                left: `${(i * 25)}%`,
                transform: 'translateX(-50%)',
                height: '8px',
                width: '1px',
                bgcolor: 'grey.400'
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  position: 'absolute', 
                  bottom: 10, 
                  left: 0, 
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap'
                }}
              >
                {tickTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          );
        })}
        
        {/* CRI bars */}
        {visibleCRIs.map((cri, index) => (
          <Box 
            key={cri.id}
            sx={{ 
              position: 'absolute',
              top: index * 60 + 10,
              left: `${calculateTimePosition(cri.startTime)}%`,
              width: `${calculateCRIWidth(cri.startTime, cri.endTime)}%`,
              height: 40,
              bgcolor: cri.color,
              display: 'flex',
              alignItems: 'center',
              px: 1,
              borderRadius: '4px',
              opacity: 0.8,
              minWidth: '80px' // Ensure label visibility for very short durations
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" noWrap sx={{ color: '#fff', fontWeight: 'bold' }}>
                {cri.name}
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: '#fff' }}>
                {cri.rate} {cri.unit}
              </Typography>
            </Box>
          </Box>
        ))}
        
        {/* CRI labels */}
        {visibleCRIs.map((cri, index) => (
          <Box
            key={`label-${cri.id}`}
            sx={{
              position: 'absolute',
              top: index * 60 + 20,
              left: 0,
              transform: 'translateX(-110%)',
            }}
          >
            <Typography variant="body2">{cri.name}</Typography>
          </Box>
        ))}
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Medications
      </Typography>
      
      {/* Timeline for bolus medications */}
      <Box sx={{ position: 'relative', height: 80, mb: 2 }}>
        {/* Time axis */}
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            height: '2px', 
            bgcolor: 'grey.300'
          }}
        />
        
        {/* Time indicators */}
        {Array.from({ length: 5 }).map((_, i) => {
          const tickTime = new Date(
            effectiveStartTime.getTime() + (totalDuration * i) / 4
          );
          return (
            <Box 
              key={i}
              sx={{
                position: 'absolute',
                bottom: 0,
                left: `${(i * 25)}%`,
                transform: 'translateX(-50%)',
                height: '8px',
                width: '1px',
                bgcolor: 'grey.400'
              }}
            />
          );
        })}
        
        {/* Bolus markers */}
        {visibleBoluses.map((bolus) => (
          <Box 
            key={bolus.id}
            sx={{ 
              position: 'absolute',
              bottom: 0,
              left: `${calculateTimePosition(bolus.time)}%`,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: bolus.color,
                mb: 1
              }}
            />
            <Typography variant="caption" sx={{ transform: 'rotate(-45deg)', transformOrigin: 'top left', whiteSpace: 'nowrap' }}>
              {bolus.name} {bolus.dose} {bolus.unit}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default MedicationTimeline; 