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
  TableRow
} from '@mui/material';
import { MedicalSummary } from '../types';

interface MedicalSummaryViewProps {
  summary: MedicalSummary | null;
  loading: boolean;
}

const MedicalSummaryView: React.FC<MedicalSummaryViewProps> = ({ summary, loading }) => {
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
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>PCV:</TableCell>
              <TableCell>{labData.pcv}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>TP:</TableCell>
              <TableCell>{labData.tp}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>BUN:</TableCell>
              <TableCell>{labData.bun}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>Na:</TableCell>
              <TableCell>{labData.sodium}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>K:</TableCell>
              <TableCell>{labData.potassium}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>Cl:</TableCell>
              <TableCell>{labData.chloride}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>Ca:</TableCell>
              <TableCell>{labData.calcium}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>Glu:</TableCell>
              <TableCell>{labData.glucose}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>Creat:</TableCell>
              <TableCell>{labData.creatinine}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>Alb:</TableCell>
              <TableCell>{labData.albumin}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>ALKP:</TableCell>
              <TableCell>{labData.alkp}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>AST:</TableCell>
              <TableCell>{labData.ast}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>ALT:</TableCell>
              <TableCell>{labData.alt}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>TBil:</TableCell>
              <TableCell>{labData.tbil}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>Plt:</TableCell>
              <TableCell>{labData.platelets}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>WBC:</TableCell>
              <TableCell>{labData.wbc}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>PT/PTT:</TableCell>
              <TableCell>{labData.pt_ptt}</TableCell>
              <TableCell component="th" sx={{ fontWeight: 'bold' }}>Crossmatch:</TableCell>
              <TableCell>{labData.crossmatch}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
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
    <Paper sx={{ p: 3, mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Medical Summary</Typography>
        <Typography variant="caption" color="text.secondary">
          Last updated: {summary.lastUpdated.toLocaleString()} by {summary.updatedBy}
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Temperament & BCS Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={9}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">ATTITUDE/TEMPERAMENT:</Typography>
            <Typography>{summary.temperament}</Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">BCS:</Typography>
            <Typography>{summary.bcs}</Typography>
          </Box>
        </Grid>
      </Grid>
      
      {/* Medical History Section */}
      <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">HISTORY:</Typography>
        <Typography sx={{ whiteSpace: 'pre-line' }}>{summary.historyText}</Typography>
      </Box>
      
      {/* Anesthesia & IV Status */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={9}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">PREVIOUS ANESTHESIA/SEDATION?</Typography>
            <Typography>
              {summary.previousAnesthesia ? 'Yes' : 'No'}
              {summary.anesthesiaDetails && (
                <>
                  <br />
                  <Typography variant="subtitle2" component="span">DRUGS USED & RESPONSE:</Typography>
                  <br />
                  {summary.anesthesiaDetails}
                </>
              )}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" color="text.secondary">ETT SIZE:</Typography>
            <Typography>{summary.ettSize || 'N/A'}</Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">IVC IN PLACE?</Typography>
              <Typography sx={{ fontWeight: 'bold' }}>{summary.ivInPlace ? 'YES' : 'NO'}</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
      
      {/* Physical Exam Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={5}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Typography variant="subtitle2" color="text.secondary">TEMP:</Typography>
                <Typography>{summary.physicalExam.temp}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="subtitle2" color="text.secondary">HR:</Typography>
                <Typography>{summary.physicalExam.heartRate}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="subtitle2" color="text.secondary">RR:</Typography>
                <Typography>{summary.physicalExam.respRate}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="subtitle2" color="text.secondary">AGE:</Typography>
                <Typography>{summary.physicalExam.age}</Typography>
              </Grid>
            </Grid>
          </Box>
        </Grid>
        <Grid item xs={12} md={3}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">MM:</Typography>
                <Typography>{summary.physicalExam.mucousMembranes}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">CRT:</Typography>
                <Typography>{summary.physicalExam.crt}</Typography>
              </Grid>
            </Grid>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={7}>
                <Typography variant="subtitle2" color="text.secondary">Pulse Quality:</Typography>
                <Typography>{summary.physicalExam.pulseQuality}</Typography>
              </Grid>
              <Grid item xs={5}>
                <Typography variant="subtitle2" color="text.secondary">Auscultation:</Typography>
                <Typography>{summary.physicalExam.auscultation}</Typography>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
      
      {/* Lab Values */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>LAB VALUES:</Typography>
        {renderLabValues()}
      </Box>
      
      {/* Status Reports */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary">CARDIO STATUS:</Typography>
            <Typography sx={{ whiteSpace: 'pre-line' }}>{summary.cardioStatus}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary">RESPIRATORY STATUS:</Typography>
            <Typography sx={{ whiteSpace: 'pre-line' }}>{summary.respiratoryStatus}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary">NEURO, MUSCULOSKELETAL, GI, UG, ABDOMINAL EXAM & DIAGNOSTICS:</Typography>
            <Typography sx={{ whiteSpace: 'pre-line' }}>{summary.neuroMuscStatus}</Typography>
          </Box>
        </Grid>
      </Grid>
      
      {/* Current Meds */}
      <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">CURRENT MEDS:</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {summary.currentMeds.length === 0 ? (
            <Typography>N/A</Typography>
          ) : (
            summary.currentMeds.map((med, index) => (
              <Chip key={index} label={med} size="small" />
            ))
          )}
        </Box>
      </Box>
      
      {/* Problem List & ASA Status */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={9}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">MEDICAL/SURGICAL PROBLEM LIST OR DDX:</Typography>
            <Box sx={{ mt: 1 }}>
              {summary.problemList.map((problem, index) => (
                <Typography key={index}>
                  {index + 1}. {problem}
                </Typography>
              ))}
            </Box>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">ASA Status</Typography>
              <Chip 
                label={`ASA ${summary.asaStatus}`} 
                color={getAsaStatusColor() as any}
                sx={{ mt: 1 }}
              />
            </Box>
            {summary.painScore && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">PAIN SCORE:</Typography>
                <Typography>{summary.painScore}</Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
      
      {/* Anesthetic Complications & Emergency Preferences */}
      <Grid container spacing={2}>
        <Grid item xs={9}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">POSSIBLE ANESTHETIC COMPLICATIONS:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {summary.anestheticComplications.map((complication, index) => (
                <Chip 
                  key={index} 
                  label={complication} 
                  variant="outlined" 
                  color="error"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">CPR</Typography>
            <Box sx={{ display: 'flex', mt: 1 }}>
              <Chip 
                label={summary.cpr ? "Yes" : "DNR"} 
                color={summary.cpr ? "primary" : "error"}
                variant="outlined"
                sx={{ borderRadius: '50%', height: '40px', width: '40px' }}
              />
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">Client Auth</Typography>
            <Typography>{summary.clientAuth ? "Yes" : "No"}</Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default MedicalSummaryView; 