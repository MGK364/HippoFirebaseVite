import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import StopIcon from '@mui/icons-material/Stop';
import { CRIMedication, BolusMedication } from './MedicationTimeline';

interface ActiveMedicationsProps {
  activeCRIs: CRIMedication[];
  recentBoluses: BolusMedication[];
  onEditRate: (medicationId: string) => void;
  onStopMedication: (medicationId: string) => void;
}

const ActiveMedications: React.FC<ActiveMedicationsProps> = ({
  activeCRIs,
  recentBoluses,
  onEditRate,
  onStopMedication
}) => {
  return (
    <Paper elevation={3} sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          Active Medications
        </Typography>
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 3, mb: 1 }}>
          Constant Rate Infusions
        </Typography>
        
        {activeCRIs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No active infusions</Typography>
        ) : (
          <List disablePadding>
            {activeCRIs.map((cri) => (
              <Card key={cri.id} variant="outlined" sx={{ mb: 1 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {cri.name}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Box>
                      <Typography variant="body2">
                        Rate: {cri.rate} {cri.unit}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Started: {cri.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Box>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => onEditRate(cri.id)}
                        sx={{ mr: 1 }}
                      >
                        Edit Rate
                      </Button>
                      <Button 
                        variant="contained" 
                        color="error"
                        size="small" 
                        onClick={() => onStopMedication(cri.id)}
                      >
                        Stop
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </List>
        )}
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 3, mb: 1 }}>
          Recent Medications
        </Typography>
        
        {recentBoluses.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No recent medications</Typography>
        ) : (
          <List disablePadding>
            {recentBoluses.map((bolus) => (
              <ListItem
                key={bolus.id}
                disableGutters
                sx={{ 
                  px: 2, 
                  py: 1, 
                  borderLeft: `4px solid ${bolus.color}`,
                  mb: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 1
                }}
              >
                <ListItemText
                  primary={<Typography variant="subtitle2">{bolus.name}</Typography>}
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        Dose: {bolus.dose} {bolus.unit} {bolus.unit === 'mg' ? '(IV)' : ''}
                      </Typography>
                      <br />
                      <Typography variant="body2" color="text.secondary" component="span">
                        Time: {bolus.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default ActiveMedications; 