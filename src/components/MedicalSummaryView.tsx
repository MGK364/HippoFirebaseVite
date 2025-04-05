import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Grid,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Card,
  CardHeader,
  CardContent,
  styled,
  useTheme,
  alpha
} from '@mui/material';
import { MedicalSummary } from '../types';

interface MedicalSummaryViewProps {
  summary: MedicalSummary | null;
  loading: boolean;
}

// Styled components for better formatting
const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.9rem',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: theme.spacing(1)
}));

const SectionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  overflow: 'visible'
}));

const CardHeaderStyled = styled(CardHeader)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  padding: theme.spacing(1.5),
  '& .MuiCardHeader-title': {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: theme.palette.primary.main
  }
}));

const CardContentStyled = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const DataRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginBottom: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
  }
}));

const DataLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  minWidth: '120px',
  color: theme.palette.text.secondary,
  fontSize: '0.875rem'
}));

const DataValue = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 400,
  color: theme.palette.text.primary
}));

const LabChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: alpha(theme.palette.info.light, 0.1),
  color: theme.palette.info.dark,
  fontWeight: 500,
  '& .MuiChip-label': {
    padding: theme.spacing(0, 1)
  }
}));

const MedicalSummaryView: React.FC<MedicalSummaryViewProps> = ({ summary, loading }) => {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading medical summary...</Typography>
      </Box>
    );
  }

  if (!summary) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No medical summary available</Typography>
      </Box>
    );
  }

  // Helper for displaying lab values in a more compact format
  const renderLabValues = () => {
    if (!summary.labValues) return null;
    
    const labData = summary.labValues;
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        {labData.pcv && <LabChip label={`PCV: ${labData.pcv}`} size="small" />}
        {labData.tp && <LabChip label={`TP: ${labData.tp}`} size="small" />}
        {labData.bun && <LabChip label={`BUN: ${labData.bun}`} size="small" />}
        {labData.sodium && <LabChip label={`Na: ${labData.sodium}`} size="small" />}
        {labData.potassium && <LabChip label={`K: ${labData.potassium}`} size="small" />}
        {labData.chloride && <LabChip label={`Cl: ${labData.chloride}`} size="small" />}
        {labData.calcium && <LabChip label={`Ca: ${labData.calcium}`} size="small" />}
        {labData.glucose && <LabChip label={`Glu: ${labData.glucose}`} size="small" />}
        {labData.creatinine && <LabChip label={`Creat: ${labData.creatinine}`} size="small" />}
        {labData.albumin && <LabChip label={`Alb: ${labData.albumin}`} size="small" />}
        {labData.alkp && <LabChip label={`ALKP: ${labData.alkp}`} size="small" />}
        {labData.ast && <LabChip label={`AST: ${labData.ast}`} size="small" />}
        {labData.alt && <LabChip label={`ALT: ${labData.alt}`} size="small" />}
        {labData.tbil && <LabChip label={`TBil: ${labData.tbil}`} size="small" />}
        {labData.platelets && <LabChip label={`Plt: ${labData.platelets}`} size="small" />}
        {labData.wbc && <LabChip label={`WBC: ${labData.wbc}`} size="small" />}
        {labData.pt_ptt && <LabChip label={`PT/PTT: ${labData.pt_ptt}`} size="small" />}
        {labData.crossmatch && <LabChip label={`Crossmatch: ${labData.crossmatch}`} size="small" />}
      </Box>
    );
  };

  // Function to get the ASA status color
  const getAsaStatusColor = () => {
    switch (summary.asaStatus) {
      case 'I': return 'success';
      case 'II': return 'info';
      case 'III': return 'warning';
      case 'IV':
      case 'V':
      case 'E': return 'error';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 4, backgroundColor: alpha(theme.palette.background.paper, 0.7) }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
          Medical Summary
        </Typography>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
            Last updated: {summary.lastUpdated.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
            by {summary.updatedBy}
          </Typography>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Temperament & History Section */}
          <SectionCard>
            <CardHeaderStyled title="Patient Information" />
            <CardContentStyled>
              <SectionTitle>Attitude/Temperament</SectionTitle>
              <Typography sx={{ mb: 2 }}>{summary.temperament}</Typography>
              
              <SectionTitle>History</SectionTitle>
              <Typography sx={{ whiteSpace: 'pre-line' }}>{summary.historyText}</Typography>
            </CardContentStyled>
          </SectionCard>
          
          {/* Physical Exam Section */}
          <SectionCard>
            <CardHeaderStyled title="Physical Examination" />
            <CardContentStyled>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}>
                  <DataRow>
                    <DataLabel>Temperature:</DataLabel>
                    <DataValue>{summary.physicalExam.temp}</DataValue>
                  </DataRow>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <DataRow>
                    <DataLabel>Heart Rate:</DataLabel>
                    <DataValue>{summary.physicalExam.heartRate}</DataValue>
                  </DataRow>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <DataRow>
                    <DataLabel>Resp. Rate:</DataLabel>
                    <DataValue>{summary.physicalExam.respRate}</DataValue>
                  </DataRow>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <DataRow>
                    <DataLabel>Age:</DataLabel>
                    <DataValue>{summary.physicalExam.age}</DataValue>
                  </DataRow>
                </Grid>
              </Grid>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <DataRow>
                    <DataLabel>MM:</DataLabel>
                    <DataValue>{summary.physicalExam.mucousMembranes}</DataValue>
                  </DataRow>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DataRow>
                    <DataLabel>CRT:</DataLabel>
                    <DataValue>{summary.physicalExam.crt}</DataValue>
                  </DataRow>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DataRow>
                    <DataLabel>Pulse Quality:</DataLabel>
                    <DataValue>{summary.physicalExam.pulseQuality}</DataValue>
                  </DataRow>
                </Grid>
                <Grid item xs={12}>
                  <DataRow>
                    <DataLabel>Auscultation:</DataLabel>
                    <DataValue>{summary.physicalExam.auscultation}</DataValue>
                  </DataRow>
                </Grid>
              </Grid>
            </CardContentStyled>
          </SectionCard>
          
          {/* Status Sections */}
          <SectionCard>
            <CardHeaderStyled title="System Status" />
            <CardContentStyled>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ mb: 2 }}>
                    <SectionTitle>Cardiovascular</SectionTitle>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{summary.cardioStatus}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ mb: 2 }}>
                    <SectionTitle>Respiratory</SectionTitle>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{summary.respiratoryStatus}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <SectionTitle>Neuro/Musculoskeletal/GI/UG</SectionTitle>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{summary.neuroMuscStatus}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContentStyled>
          </SectionCard>
          
          {/* Lab Values */}
          <SectionCard>
            <CardHeaderStyled title="Laboratory Values" />
            <CardContentStyled>
              {renderLabValues()}
            </CardContentStyled>
          </SectionCard>
        </Grid>
        
        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Patient Stats Summary */}
          <SectionCard>
            <CardHeaderStyled title="Patient Stats" />
            <CardContentStyled>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <SectionTitle>BCS</SectionTitle>
                  <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>{summary.bcs}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <SectionTitle>Pain Score</SectionTitle>
                  <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>{summary.painScore || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ mt: 1 }}>
                    <SectionTitle>ASA Status</SectionTitle>
                    <Chip 
                      label={`ASA ${summary.asaStatus}`} 
                      color={getAsaStatusColor() as any}
                      sx={{ mt: 1, fontWeight: 600 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContentStyled>
          </SectionCard>
          
          {/* Anesthesia History Section */}
          <SectionCard>
            <CardHeaderStyled title="Anesthesia History" />
            <CardContentStyled>
              <DataRow>
                <DataLabel>Previous Anesthesia:</DataLabel>
                <DataValue sx={{ fontWeight: 500 }}>{summary.previousAnesthesia ? 'Yes' : 'No'}</DataValue>
              </DataRow>
              
              {summary.anesthesiaDetails && (
                <Box sx={{ mt: 1 }}>
                  <SectionTitle>Drugs Used & Response</SectionTitle>
                  <Typography variant="body2">{summary.anesthesiaDetails}</Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 2 }}>
                <DataRow>
                  <DataLabel>ETT Size:</DataLabel>
                  <DataValue>{summary.ettSize || 'N/A'}</DataValue>
                </DataRow>
                <DataRow>
                  <DataLabel>IVC in Place:</DataLabel>
                  <DataValue sx={{ fontWeight: 600 }}>{summary.ivInPlace ? 'YES' : 'NO'}</DataValue>
                </DataRow>
              </Box>
            </CardContentStyled>
          </SectionCard>
          
          {/* Current Medications */}
          <SectionCard>
            <CardHeaderStyled title="Current Medications" />
            <CardContentStyled>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {summary.currentMeds.length === 0 ? (
                  <Typography>None</Typography>
                ) : (
                  summary.currentMeds.map((med, index) => (
                    <Chip key={index} label={med} size="small" variant="outlined" sx={{ margin: '2px' }} />
                  ))
                )}
              </Box>
            </CardContentStyled>
          </SectionCard>
          
          {/* Problem List */}
          <SectionCard>
            <CardHeaderStyled title="Problem List / DDX" />
            <CardContentStyled>
              {summary.problemList.length === 0 ? (
                <Typography>No problems identified</Typography>
              ) : (
                summary.problemList.map((problem, index) => (
                  <Box key={index} sx={{ 
                    mb: 1, 
                    p: 1,
                    backgroundColor: alpha(theme.palette.primary.light, 0.05),
                    borderRadius: 1
                  }}>
                    <Typography variant="body2">
                      <Box component="span" sx={{ 
                        display: 'inline-block',
                        minWidth: '24px', 
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                        color: theme.palette.primary.main,
                        textAlign: 'center',
                        lineHeight: '24px',
                        fontWeight: 'bold',
                        mr: 1
                      }}>
                        {index + 1}
                      </Box>
                      {problem}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContentStyled>
          </SectionCard>
          
          {/* Anesthetic Complications & CPR */}
          <SectionCard>
            <CardHeaderStyled title="Emergency Information" />
            <CardContentStyled>
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <SectionTitle>Potential Anesthetic Complications</SectionTitle>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {summary.anestheticComplications.length === 0 ? (
                      <Typography variant="body2">None anticipated</Typography>
                    ) : (
                      summary.anestheticComplications.map((complication, index) => (
                        <Chip 
                          key={index} 
                          label={complication} 
                          variant="outlined" 
                          color="error"
                          size="small"
                          sx={{ margin: '2px' }}
                        />
                      ))
                    )}
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <SectionTitle>CPR Status</SectionTitle>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Chip 
                      label={summary.cpr ? "CPR" : "DNR"} 
                      color={summary.cpr ? "primary" : "error"}
                      sx={{ 
                        borderRadius: '50%', 
                        height: '50px', 
                        width: '50px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Typography variant="caption" sx={{ mt: 1, textAlign: 'center' }}>
                      Client Authorized: {summary.clientAuth ? "Yes" : "No"}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContentStyled>
          </SectionCard>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default MedicalSummaryView; 