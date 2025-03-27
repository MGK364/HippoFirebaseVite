import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import EditIcon from '@mui/icons-material/Edit';
import { Medication } from '../types';
import { updateMedication } from '../services/patients';

interface MedicationListProps {
  medications: Medication[];
  patientId: string;
}

export const MedicationList: React.FC<MedicationListProps> = ({ medications, patientId }) => {
  // Sort medications by timestamp (newest first)
  const sortedMedications = [...medications].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  // Format the timestamp for display
  const formatDateTime = (timestamp: Date): string => {
    return timestamp.toLocaleString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Handle marking a medication as administered
  const handleMarkAdministered = async (medicationId: string) => {
    try {
      await updateMedication(patientId, medicationId, {
        administered: true,
        administeredBy: 'Current User' // This would come from the auth context in a full implementation
      });
      
      // In a real application, you would refresh the medications list or update state
      // For now, we'll just alert for demo purposes
      alert('Medication marked as administered. Refresh to see changes.');
    } catch (error) {
      console.error('Error updating medication:', error);
      alert('Failed to update medication status.');
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Medication</TableCell>
            <TableCell>Dosage</TableCell>
            <TableCell>Route</TableCell>
            <TableCell>Frequency</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Administered By</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedMedications.map((medication) => (
            <TableRow key={medication.id} hover>
              <TableCell>{medication.name}</TableCell>
              <TableCell>{medication.dosage}</TableCell>
              <TableCell>{medication.route}</TableCell>
              <TableCell>{medication.frequency}</TableCell>
              <TableCell>{formatDateTime(medication.timestamp)}</TableCell>
              <TableCell>
                {medication.administered ? (
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label="Administered" 
                    color="success" 
                    size="small" 
                  />
                ) : (
                  <Chip 
                    icon={<PendingIcon />} 
                    label="Pending" 
                    color="warning" 
                    size="small" 
                  />
                )}
              </TableCell>
              <TableCell>{medication.administered ? medication.administeredBy : '—'}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex' }}>
                  {!medication.administered && (
                    <IconButton 
                      color="success" 
                      size="small"
                      onClick={() => handleMarkAdministered(medication.id)}
                      title="Mark as Administered"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  )}
                  <IconButton 
                    color="primary" 
                    size="small"
                    title="Edit Medication"
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {sortedMedications.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center">
                No medications found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}; 