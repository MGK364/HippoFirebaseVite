import React from 'react';
import { 
  Box, 
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import { Medication } from '../types';

interface MedicationListProps {
  medications: Medication[];
}

export const MedicationList: React.FC<MedicationListProps> = ({ medications }) => {
  return (
    <Paper>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Medications
        </Typography>
        
        {medications.length === 0 ? (
          <Typography color="text.secondary">No medications have been prescribed.</Typography>
        ) : (
          <List>
            {medications.map((medication, index) => (
              <React.Fragment key={medication.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1">
                          {medication.name}
                        </Typography>
                        <Chip 
                          label={medication.status} 
                          color={medication.status === 'Active' ? 'success' : 'default'}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" component="span">
                          Dosage: {medication.dosage} • Route: {medication.route}
                        </Typography>
                        <br />
                        <Typography variant="body2" color="text.secondary" component="span">
                          Schedule: {medication.schedule} • Added: {new Date(medication.dateAdded).toLocaleDateString()}
                        </Typography>
                        {medication.notes && (
                          <>
                            <br />
                            <Typography variant="body2" color="text.secondary" component="span">
                              Notes: {medication.notes}
                            </Typography>
                          </>
                        )}
                      </>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
}; 