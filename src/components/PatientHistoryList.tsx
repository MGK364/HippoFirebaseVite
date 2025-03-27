import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  Paper, 
  Typography, 
  Divider,
  Box,
  Chip
} from '@mui/material';
import { PatientHistory } from '../types';

interface PatientHistoryListProps {
  historyItems: PatientHistory[];
}

export const PatientHistoryList: React.FC<PatientHistoryListProps> = ({ historyItems }) => {
  // Sort history items by date (newest first)
  const sortedHistoryItems = [...historyItems].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Paper>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Patient History
        </Typography>
        
        {sortedHistoryItems.length === 0 ? (
          <Typography color="text.secondary">No history records found.</Typography>
        ) : (
          <List sx={{ width: '100%' }}>
            {sortedHistoryItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <Divider />}
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" component="span">
                          {item.type}
                        </Typography>
                        <Chip 
                          label={item.category} 
                          size="small" 
                          color="primary" 
                        />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(item.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {item.description}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ mt: 1, display: 'block' }}
                        >
                          By {item.recordedBy}
                        </Typography>
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