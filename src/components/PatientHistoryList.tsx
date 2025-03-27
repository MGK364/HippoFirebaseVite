import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Divider,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PatientHistory } from '../types';

interface PatientHistoryListProps {
  history: PatientHistory[];
}

export const PatientHistoryList: React.FC<PatientHistoryListProps> = ({ history }) => {
  // Sort history by date (newest first)
  const sortedHistory = [...history].sort((a, b) => 
    b.date.getTime() - a.date.getTime()
  );

  // Format the date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <Box>
      {sortedHistory.length > 0 ? (
        <List disablePadding>
          {sortedHistory.map((entry, index) => (
            <React.Fragment key={entry.id}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {formatDate(entry.date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {entry.reason}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Diagnosis:</strong> {entry.diagnosis}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Treatment:</strong> {entry.treatment}
                    </Typography>
                    {entry.notes && (
                      <Typography variant="body1" sx={{ mt: 2 }}>
                        <strong>Notes:</strong> {entry.notes}
                      </Typography>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
              {index < sortedHistory.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography align="center">No history records available</Typography>
        </Paper>
      )}
    </Box>
  );
}; 