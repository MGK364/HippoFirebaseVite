import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid as MuiGrid,
  Box,
  Divider,
  Chip,
  CircularProgress,
  styled,
  useTheme
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { AnesthesiaPlan } from '../types';

interface AnesthesiaPlanViewProps {
  plan: AnesthesiaPlan | null;
  loading: boolean;
  patientWeight?: string;
}

// Styled components for better table formatting
const HeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));

const SubheaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.grey[200],
}));

const AnesthesiaPlanView: React.FC<AnesthesiaPlanViewProps> = ({ plan, loading, patientWeight }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!plan) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="subtitle1" color="text.secondary" align="center">
          No anesthesia plan has been created for this patient yet.
        </Typography>
      </Box>
    );
  }

  // Determine if a section is empty
  const hasPremedications = plan.premedications && plan.premedications.length > 0;
  const hasInduction = plan.inductionAgents && plan.inductionAgents.length > 0;
  const hasFluids = plan.ivFluids && plan.ivFluids.length > 0;
  const hasCRIs = plan.cris && plan.cris.length > 0;
  const hasOtherTechniques = plan.otherTechniques && plan.otherTechniques.length > 0;
  const hasEmergencyDrugs = plan.emergencyDrugs && plan.emergencyDrugs.length > 0;

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', p: 0 }}>
      <Box sx={{ p: 2, backgroundColor: theme.palette.grey[100] }}>
        <Typography variant="h6" align="center" gutterBottom>
          Your Anesthetic and Pain Management Plan
        </Typography>
        <Typography variant="body2" align="right">
          Weight (kg): {patientWeight || plan.patientId.split('-')[1] || '??'} 
        </Typography>
      </Box>

      {/* Premedications */}
      {hasPremedications && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <HeaderCell>Premedications</HeaderCell>
                <HeaderCell width="15%">Route: IV / IM / SQ</HeaderCell>
                <HeaderCell width="15%">Dosage Range (mg/kg)</HeaderCell>
                <HeaderCell width="15%">Anticipated Dose (mg)</HeaderCell>
                <HeaderCell width="15%">Drug Concentration (mg/ml)</HeaderCell>
                <HeaderCell width="15%">Drug Volume (mls)</HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plan.premedications.map((med, index) => (
                <TableRow key={`premed-${index}`}>
                  <TableCell>{med.name}</TableCell>
                  <TableCell>{med.route}</TableCell>
                  <TableCell>{med.dosageRange}</TableCell>
                  <TableCell>{med.anticipatedDose}</TableCell>
                  <TableCell>{med.concentration}</TableCell>
                  <TableCell>{med.volume}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Induction Agents */}
      {hasInduction && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <HeaderCell>Induction Agent</HeaderCell>
                <HeaderCell width="15%">Route</HeaderCell>
                <HeaderCell width="15%">Dosage Range (mg/kg)</HeaderCell>
                <HeaderCell width="15%">Anticipated Dose (mg)</HeaderCell>
                <HeaderCell width="15%">Drug Concentration (mg/ml)</HeaderCell>
                <HeaderCell width="15%">Drug Volume (mls)</HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plan.inductionAgents.map((agent, index) => (
                <TableRow key={`induction-${index}`}>
                  <TableCell>{agent.name}</TableCell>
                  <TableCell>{agent.route}</TableCell>
                  <TableCell>{agent.dosageRange}</TableCell>
                  <TableCell>{agent.anticipatedDose}</TableCell>
                  <TableCell>{agent.concentration || '-'}</TableCell>
                  <TableCell>{agent.volume || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Maintenance */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <SubheaderCell colSpan={6}>Maintenance</SubheaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6}>{plan.maintenance || 'Not specified'}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* IV Fluids */}
      {hasFluids && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <SubheaderCell>IV Fluids</SubheaderCell>
                <SubheaderCell width="15%">Fluid Rate (ml/kg/hr)</SubheaderCell>
                <SubheaderCell width="15%">ml/hr</SubheaderCell>
                <SubheaderCell width="15%">Drops/sec</SubheaderCell>
                <SubheaderCell width="30%">Fluid Bolus Volume</SubheaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plan.ivFluids.map((fluid, index) => (
                <TableRow key={`fluid-${index}`}>
                  <TableCell>{fluid.name}</TableCell>
                  <TableCell>{fluid.rate}</TableCell>
                  <TableCell>{fluid.mlPerHr}</TableCell>
                  <TableCell>{fluid.dropsPerSec || '-'}</TableCell>
                  <TableCell>{fluid.bolusVolume || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Constant Rate Infusions */}
      {hasCRIs && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <SubheaderCell>Constant Rate Infusions</SubheaderCell>
                <SubheaderCell width="30%">Loading Dose (mg & ml)</SubheaderCell>
                <SubheaderCell width="30%">Dosage Range</SubheaderCell>
                <SubheaderCell width="20%">CRI Concentration (mg/ml or mcg/ml)</SubheaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plan.cris.map((cri, index) => (
                <TableRow key={`cri-${index}`}>
                  <TableCell>{cri.name}</TableCell>
                  <TableCell>{cri.loadingDose || '-'}</TableCell>
                  <TableCell>{cri.dosageRange}</TableCell>
                  <TableCell>{cri.concentration || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Other Techniques */}
      {hasOtherTechniques && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <SubheaderCell>Other Techniques</SubheaderCell>
                <SubheaderCell width="30%">Drugs</SubheaderCell>
                <SubheaderCell width="20%">Dosage</SubheaderCell>
                <SubheaderCell width="15%">Drug Concentration (mg/ml)</SubheaderCell>
                <SubheaderCell width="15%">Drug Volume (mls)</SubheaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plan.otherTechniques.map((technique, index) => (
                <TableRow key={`technique-${index}`}>
                  <TableCell>{technique.name}</TableCell>
                  <TableCell>{technique.drugs.join(', ')}</TableCell>
                  <TableCell>{technique.dosage}</TableCell>
                  <TableCell>{technique.concentration || '-'}</TableCell>
                  <TableCell>{technique.volume || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Additional Info */}
      <MuiGrid container>
        <MuiGrid item xs={6}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <SubheaderCell colSpan={2}>Total Blood Volume</SubheaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={2}>{plan.totalBloodVolume || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </MuiGrid>
        <MuiGrid item xs={6}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <SubheaderCell colSpan={2}>Ventilator: {plan.ventilator ? 'YES' : 'NO'}</SubheaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Tidal Volume:</TableCell>
                  <TableCell>{plan.tidalVolume || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Resp. Rate:</TableCell>
                  <TableCell>{plan.respRate || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>PEEP:</TableCell>
                  <TableCell>{plan.peep || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </MuiGrid>
      </MuiGrid>

      {/* Emergency Drugs */}
      {hasEmergencyDrugs && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <SubheaderCell>Emergency Drugs</SubheaderCell>
                <SubheaderCell width="40%">Dose (mg)</SubheaderCell>
                <SubheaderCell width="40%">Drug Volume (ml)</SubheaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plan.emergencyDrugs.map((drug, index) => (
                <TableRow key={`emergency-${index}`}>
                  <TableCell>{drug.name}</TableCell>
                  <TableCell>{drug.dose}</TableCell>
                  <TableCell>{drug.volume || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Recovery Area */}
      <MuiGrid container>
        <MuiGrid item xs={12}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <SubheaderCell colSpan={4}>Recovery Area: {plan.recoveryArea} {plan.recoveryAreaOther}</SubheaderCell>
                </TableRow>
              </TableHead>
            </Table>
          </TableContainer>
        </MuiGrid>
      </MuiGrid>

      {/* Monitoring Plan */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Monitoring Plan:</Typography>
        <MuiGrid container spacing={1}>
          <MuiGrid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                icon={plan.monitoringPlan.spo2 ? <CheckIcon fontSize="small" /> : undefined}
                label="SPO2" 
                variant={plan.monitoringPlan.spo2 ? "filled" : "outlined"}
                color={plan.monitoringPlan.spo2 ? "primary" : "default"}
                size="small"
              />
              <Chip 
                icon={plan.monitoringPlan.temp ? <CheckIcon fontSize="small" /> : undefined}
                label="TEMP" 
                variant={plan.monitoringPlan.temp ? "filled" : "outlined"}
                color={plan.monitoringPlan.temp ? "primary" : "default"}
                size="small"
              />
              <Chip 
                icon={plan.monitoringPlan.ecg ? <CheckIcon fontSize="small" /> : undefined}
                label="ECG" 
                variant={plan.monitoringPlan.ecg ? "filled" : "outlined"}
                color={plan.monitoringPlan.ecg ? "primary" : "default"}
                size="small"
              />
              <Chip 
                icon={plan.monitoringPlan.etco2 ? <CheckIcon fontSize="small" /> : undefined}
                label="ETCO2" 
                variant={plan.monitoringPlan.etco2 ? "filled" : "outlined"}
                color={plan.monitoringPlan.etco2 ? "primary" : "default"}
                size="small"
              />
              <Chip 
                icon={plan.monitoringPlan.ibp ? <CheckIcon fontSize="small" /> : undefined}
                label="IBP" 
                variant={plan.monitoringPlan.ibp ? "filled" : "outlined"}
                color={plan.monitoringPlan.ibp ? "primary" : "default"}
                size="small"
              />
              <Chip 
                icon={plan.monitoringPlan.nibp ? <CheckIcon fontSize="small" /> : undefined}
                label="NIBP-Oscillometric" 
                variant={plan.monitoringPlan.nibp ? "filled" : "outlined"}
                color={plan.monitoringPlan.nibp ? "primary" : "default"}
                size="small"
              />
              <Chip 
                icon={plan.monitoringPlan.doppler ? <CheckIcon fontSize="small" /> : undefined}
                label="Doppler" 
                variant={plan.monitoringPlan.doppler ? "filled" : "outlined"}
                color={plan.monitoringPlan.doppler ? "primary" : "default"}
                size="small"
              />
            </Box>
          </MuiGrid>
          <MuiGrid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                icon={plan.monitoringPlan.ivcs.longTerm ? <CheckIcon fontSize="small" /> : undefined}
                label="Long Term IVC" 
                variant={plan.monitoringPlan.ivcs.longTerm ? "filled" : "outlined"}
                color={plan.monitoringPlan.ivcs.longTerm ? "primary" : "default"}
                size="small"
              />
              <Chip 
                icon={plan.monitoringPlan.ivcs.shortTerm ? <CheckIcon fontSize="small" /> : undefined}
                label="Short Term IVC" 
                variant={plan.monitoringPlan.ivcs.shortTerm ? "filled" : "outlined"}
                color={plan.monitoringPlan.ivcs.shortTerm ? "primary" : "default"}
                size="small"
              />
              <Chip 
                icon={plan.monitoringPlan.ivcs.secondIV ? <CheckIcon fontSize="small" /> : undefined}
                label="2nd IVC" 
                variant={plan.monitoringPlan.ivcs.secondIV ? "filled" : "outlined"}
                color={plan.monitoringPlan.ivcs.secondIV ? "primary" : "default"}
                size="small"
              />
              <Chip 
                icon={plan.monitoringPlan.centralLine ? <CheckIcon fontSize="small" /> : undefined}
                label="Central Line" 
                variant={plan.monitoringPlan.centralLine ? "filled" : "outlined"}
                color={plan.monitoringPlan.centralLine ? "primary" : "default"}
                size="small"
              />
              <Chip 
                icon={plan.monitoringPlan.arterialLine ? <CheckIcon fontSize="small" /> : undefined}
                label="Arterial" 
                variant={plan.monitoringPlan.arterialLine ? "filled" : "outlined"}
                color={plan.monitoringPlan.arterialLine ? "primary" : "default"}
                size="small"
              />
            </Box>
          </MuiGrid>
        </MuiGrid>
      </Box>
      
      {/* Post-Op Plan */}
      {plan.postOpPlan && (
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1">Post-op Plan (pain management, sedation if needed):</Typography>
          <Typography variant="body2">{plan.postOpPlan}</Typography>
        </Box>
      )}
      
      {/* Plan Approval */}
      {plan.planApproval && (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2">Plan Approval:</Typography>
          <Typography variant="body2" sx={{ ml: 1 }}>{plan.planApproval}</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default AnesthesiaPlanView; 