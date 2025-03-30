import React from 'react';
import {
  Paper,
  Typography,
  Grid as MuiGrid,
  Box,
  Chip,
  CircularProgress,
  styled,
  useTheme,
  Card,
  CardHeader,
  CardContent,
  Divider,
  alpha
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { AnesthesiaPlan } from '../types';

// Extend the AnesthesiaPlan type to include Atipamezole properties
interface ExtendedAnesthesiaPlan extends AnesthesiaPlan {
  atipamezoleDose?: string;
  atipamezoleVolume?: string;
}

interface AnesthesiaPlanViewProps {
  plan: ExtendedAnesthesiaPlan | null;
  loading: boolean;
  patientWeight?: string;
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

const DataRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: alpha(theme.palette.background.paper, 0.5),
  borderRadius: theme.shape.borderRadius,
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
  }
}));

const DataLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  width: '40%',
  color: theme.palette.text.primary,
  fontSize: '0.875rem'
}));

const DataValue = styled(Typography)(({ theme }) => ({
  width: '60%',
  fontSize: '0.875rem'
}));

const SectionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  overflow: 'visible',
  height: '100%' // Make all cards the same height within their container
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
  height: 'calc(100% - 56px)', // Adjust for header height to maintain consistent content area
  display: 'flex',
  flexDirection: 'column'
}));

// Helper to calculate emergency drug doses and volumes based on patient weight
const calculateEmergencyDrug = (drug: { name: string; dosage: string; concentration: string }, weight: string) => {
  if (drug.name === 'Atipamezole') {
    return {
      name: drug.name,
      dosage: drug.dosage || '',
      dose: '-', // For Atipamezole, dose is handled specially
      volume: '-', // For Atipamezole, volume is handled specially
      concentration: drug.concentration
    };
  }
  
  try {
    if (drug.dosage && weight) {
      const dose = (parseFloat(drug.dosage) * parseFloat(weight)).toFixed(2);
      const volume = (parseFloat(dose) / parseFloat(drug.concentration)).toFixed(2);
      return {
        name: drug.name,
        dosage: drug.dosage,
        dose,
        volume,
        concentration: drug.concentration
      };
    }
  } catch (err) {
    console.error('Error calculating emergency drug values:', err);
  }
  
  return {
    name: drug.name,
    dosage: drug.dosage || '',
    dose: '-',
    volume: '-',
    concentration: drug.concentration
  };
};

// Static emergency drugs data with standard dosages and concentrations
const EMERGENCY_DRUGS = [
  {
    name: 'Epinephrine',
    dosage: '0.01',
    concentration: '1'
  },
  {
    name: 'Atropine',
    dosage: '0.04',
    concentration: '0.4'
  },
  {
    name: 'Glycopyrrolate',
    dosage: '0.01',
    concentration: '0.2'
  },
  {
    name: 'Lidocaine',
    dosage: '2',
    concentration: '20'
  },
  {
    name: 'Naloxone',
    dosage: '0.04',
    concentration: '0.4'
  },
  {
    name: 'Flumazenil',
    dosage: '0.01',
    concentration: '0.1'
  },
  {
    name: 'Atipamezole',
    dosage: '',
    concentration: '5'
  }
];

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
  const hasLocalRegional = plan.localRegional && plan.localRegional.length > 0;
  const hasEmergencyDrugs = plan.emergencyDrugs && plan.emergencyDrugs.length > 0;

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', p: 3, backgroundColor: alpha(theme.palette.background.paper, 0.7) }}>
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' }
      }}>
        <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
          Anesthetic & Pain Management Plan
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          Weight: <Box component="span" sx={{ fontWeight: 600 }}>{patientWeight || plan.patientId.split('-')[1] || '??'} kg</Box>
        </Typography>
      </Box>

      <MuiGrid container spacing={3}>
        {/* Left column */}
        <MuiGrid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* Premedications */}
          {hasPremedications && (
            <SectionCard>
              <CardHeaderStyled title="Premedications" />
              <CardContentStyled>
                {plan.premedications.map((med, index) => (
                  <Box key={`premed-${index}`} sx={{ mb: 2, pb: 2, borderBottom: index !== plan.premedications.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{med.name}</Typography>
                    <MuiGrid container spacing={1}>
                      <MuiGrid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Route:</Typography>
                          <Chip size="small" label={med.route} variant="outlined" />
                        </Box>
                      </MuiGrid>
                      <MuiGrid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Dosage:</Typography>
                          <Typography variant="body2">{med.dosageRange} mg/kg</Typography>
                        </Box>
                      </MuiGrid>
                      <MuiGrid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Dose:</Typography>
                          <Typography variant="body2">{med.anticipatedDose} mg</Typography>
                        </Box>
                      </MuiGrid>
                      <MuiGrid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Conc:</Typography>
                          <Typography variant="body2">{med.concentration} mg/ml</Typography>
                        </Box>
                      </MuiGrid>
                      <MuiGrid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Volume:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{med.volume} ml</Typography>
                        </Box>
                      </MuiGrid>
                    </MuiGrid>
                  </Box>
                ))}
              </CardContentStyled>
            </SectionCard>
          )}

          {/* Induction Agents */}
          {hasInduction && (
            <SectionCard>
              <CardHeaderStyled title="Induction Agents" />
              <CardContentStyled>
                {plan.inductionAgents.map((agent, index) => (
                  <Box key={`induction-${index}`} sx={{ mb: 2, pb: 2, borderBottom: index !== plan.inductionAgents.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{agent.name}</Typography>
                    <MuiGrid container spacing={1}>
                      <MuiGrid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Route:</Typography>
                          <Chip size="small" label={agent.route} variant="outlined" />
                        </Box>
                      </MuiGrid>
                      <MuiGrid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Dosage:</Typography>
                          <Typography variant="body2">{agent.dosageRange} mg/kg</Typography>
                        </Box>
                      </MuiGrid>
                      <MuiGrid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Dose:</Typography>
                          <Typography variant="body2">{agent.anticipatedDose} mg</Typography>
                        </Box>
                      </MuiGrid>
                      <MuiGrid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Conc:</Typography>
                          <Typography variant="body2">{agent.concentration || '-'} mg/ml</Typography>
                        </Box>
                      </MuiGrid>
                      <MuiGrid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Volume:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{agent.volume || '-'} ml</Typography>
                        </Box>
                      </MuiGrid>
                    </MuiGrid>
                  </Box>
                ))}
              </CardContentStyled>
            </SectionCard>
          )}

          {/* Maintenance */}
          <SectionCard>
            <CardHeaderStyled title="Maintenance" />
            <CardContentStyled>
              <Typography variant="body1">{plan.maintenance || 'Not specified'}</Typography>
            </CardContentStyled>
          </SectionCard>

          {/* Local Regional Anesthesia - Keep this on the left column near maintenance */}
          {hasLocalRegional && (
            <SectionCard>
              <CardHeaderStyled title="Local Regional Anesthesia" />
              <CardContentStyled>
                {plan.localRegional?.map((item, index) => (
                  <Box key={`local-regional-${index}`} sx={{ mb: 2, pb: 2, borderBottom: index !== (plan.localRegional?.length || 0) - 1 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{item.name}</Typography>
                    <MuiGrid container spacing={1}>
                      {item.technique && (
                        <MuiGrid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Technique:</Typography>
                            <Typography variant="body2">{item.technique}</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                      {item.drugs && item.drugs.length > 0 && (
                        <MuiGrid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Drugs:</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {item.drugs.map((drug, idx) => (
                                <Chip key={idx} size="small" label={drug} variant="outlined" />
                              ))}
                            </Box>
                          </Box>
                        </MuiGrid>
                      )}
                      {item.dosage && (
                        <MuiGrid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Dosage:</Typography>
                            <Typography variant="body2">{item.dosage} mg/kg</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                      {item.dosageRange && (
                        <MuiGrid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Dosage Range:</Typography>
                            <Typography variant="body2">{item.dosageRange} mg/kg</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                      {item.anticipatedDose && (
                        <MuiGrid item xs={6} md={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Dose:</Typography>
                            <Typography variant="body2">{item.anticipatedDose} mg</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                      {item.concentration && (
                        <MuiGrid item xs={6} md={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Conc:</Typography>
                            <Typography variant="body2">{item.concentration} mg/ml</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                      {item.volume && (
                        <MuiGrid item xs={6} md={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Volume:</Typography>
                            <Typography variant="body2">{item.volume} ml</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                      {item.additives && (
                        <MuiGrid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Additives:</Typography>
                            <Typography variant="body2">{item.additives}</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                    </MuiGrid>
                  </Box>
                ))}
              </CardContentStyled>
            </SectionCard>
          )}

          {/* Monitoring Plan - Moved up from the bottom */}
          <SectionCard>
            <CardHeaderStyled title="Monitoring Plan" />
            <CardContentStyled>
              <MuiGrid container spacing={3}>
                <MuiGrid item xs={12} sm={6}>
                  <SectionTitle>Monitoring Equipment</SectionTitle>
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
                    {/* Add NMB Monitoring if in plan */}
                    {plan.nmbMonitoring && (
                      <Chip 
                        icon={<CheckIcon fontSize="small" />}
                        label="NMB Monitoring" 
                        variant="filled"
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>
                </MuiGrid>
                  
                <MuiGrid item xs={12} sm={6}>
                  <SectionTitle>IV Catheters</SectionTitle>
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
                      label="Arterial Line" 
                      variant={plan.monitoringPlan.arterialLine ? "filled" : "outlined"}
                      color={plan.monitoringPlan.arterialLine ? "primary" : "default"}
                      size="small"
                    />
                    {/* IV Catheter Already In Place */}
                    {plan.ivCatheterInPlace && (
                      <Chip 
                        icon={<CheckIcon fontSize="small" />}
                        label="IV Catheter Already In Place" 
                        variant="filled"
                        color="success"
                        size="small"
                      />
                    )}
                  </Box>
                </MuiGrid>

                {/* Blood Volume and Ventilator information */}
                <MuiGrid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <SectionTitle>Additional Information</SectionTitle>
                    <MuiGrid container spacing={2}>
                      {plan.totalBloodVolume && (
                        <MuiGrid item xs={12} sm={6}>
                          <DataRow>
                            <DataLabel>Total Blood Volume:</DataLabel>
                            <DataValue>{plan.totalBloodVolume}</DataValue>
                          </DataRow>
                        </MuiGrid>
                      )}
                      
                      {plan.ventilator && (
                        <MuiGrid item xs={12} sm={6}>
                          <DataRow>
                            <DataLabel>Ventilator:</DataLabel>
                            <DataValue>YES</DataValue>
                          </DataRow>
                          {plan.tidalVolume && (
                            <DataRow>
                              <DataLabel>Tidal Volume:</DataLabel>
                              <DataValue>{plan.tidalVolume} ml</DataValue>
                            </DataRow>
                          )}
                          {plan.respRate && (
                            <DataRow>
                              <DataLabel>Resp. Rate:</DataLabel>
                              <DataValue>{plan.respRate} bpm</DataValue>
                            </DataRow>
                          )}
                          {plan.peep && (
                            <DataRow>
                              <DataLabel>PEEP:</DataLabel>
                              <DataValue>{plan.peep} cmH₂O</DataValue>
                            </DataRow>
                          )}
                        </MuiGrid>
                      )}
                    </MuiGrid>
                  </Box>
                </MuiGrid>
              </MuiGrid>
            </CardContentStyled>
          </SectionCard>

          {/* Emergency Drugs */}
          {hasEmergencyDrugs && (
            <SectionCard>
              <CardHeaderStyled title="Emergency Drugs" />
              <CardContentStyled>
                {plan.emergencyDrugs.map((drug, index) => (
                  <Box key={`emergency-${index}`} sx={{ mb: 2, pb: 2, borderBottom: index !== plan.emergencyDrugs.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{drug.name}</Typography>
                    <MuiGrid container spacing={1}>
                      <MuiGrid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Dose:</Typography>
                          <Typography variant="body2">{drug.dose} mg</Typography>
                        </Box>
                      </MuiGrid>
                      <MuiGrid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Volume:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{drug.volume || '-'} ml</Typography>
                        </Box>
                      </MuiGrid>
                    </MuiGrid>
                  </Box>
                ))}
              </CardContentStyled>
            </SectionCard>
          )}
        </MuiGrid>

        {/* Right column */}
        <MuiGrid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* IV Fluids */}
          {hasFluids && (
            <SectionCard>
              <CardHeaderStyled title="IV Fluids" />
              <CardContentStyled>
                {plan.ivFluids.map((fluid, index) => (
                  <Box key={`fluid-${index}`} sx={{ mb: 2, pb: 2, borderBottom: index !== plan.ivFluids.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{fluid.name}</Typography>
                    <MuiGrid container spacing={1}>
                      <MuiGrid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Rate:</Typography>
                          <Typography variant="body2">{fluid.rate} ml/kg/hr</Typography>
                        </Box>
                      </MuiGrid>
                      <MuiGrid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>ml/hr:</Typography>
                          <Typography variant="body2">{fluid.mlPerHr}</Typography>
                        </Box>
                      </MuiGrid>
                      {fluid.dropsPerSec && (
                        <MuiGrid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Drops/sec:</Typography>
                            <Typography variant="body2">{fluid.dropsPerSec}</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                      {fluid.bolusVolume && (
                        <MuiGrid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Bolus:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{fluid.bolusVolume} ml</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                    </MuiGrid>
                  </Box>
                ))}
              </CardContentStyled>
            </SectionCard>
          )}

          {/* Constant Rate Infusions */}
          {hasCRIs && (
            <SectionCard>
              <CardHeaderStyled title="Constant Rate Infusions" />
              <CardContentStyled>
                {plan.cris.map((cri, index) => (
                  <Box key={`cri-${index}`} sx={{ mb: 2, pb: 2, borderBottom: index !== plan.cris.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{cri.name}</Typography>
                    <MuiGrid container spacing={1}>
                      {cri.loadingDose && (
                        <MuiGrid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Loading Dose:</Typography>
                            <Typography variant="body2">{cri.loadingDose}</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                      <MuiGrid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Dosage Range:</Typography>
                          <Typography variant="body2">{cri.dosageRange}</Typography>
                        </Box>
                      </MuiGrid>
                      {cri.concentration && (
                        <MuiGrid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Concentration:</Typography>
                            <Typography variant="body2">{cri.concentration}</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                    </MuiGrid>
                  </Box>
                ))}
              </CardContentStyled>
            </SectionCard>
          )}

          {/* Other Techniques - renamed to Other Medications */}
          {hasOtherTechniques && (
            <SectionCard>
              <CardHeaderStyled title="Other Medications" />
              <CardContentStyled>
                {plan.otherTechniques.map((technique, index) => (
                  <Box key={`technique-${index}`} sx={{ mb: 2, pb: 2, borderBottom: index !== plan.otherTechniques.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{technique.name}</Typography>
                    <MuiGrid container spacing={1}>
                      {technique.drugs && technique.drugs.length > 0 && (
                        <MuiGrid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Drugs:</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {technique.drugs.map((drug, idx) => (
                                <Chip key={idx} size="small" label={drug} variant="outlined" />
                              ))}
                            </Box>
                          </Box>
                        </MuiGrid>
                      )}
                      {technique.dosageRange && (
                        <MuiGrid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Dosage:</Typography>
                            <Typography variant="body2">{technique.dosageRange} mg/kg</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                      {technique.anticipatedDose && (
                        <MuiGrid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Dose:</Typography>
                            <Typography variant="body2">{technique.anticipatedDose} mg</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                      {technique.concentration && (
                        <MuiGrid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Conc:</Typography>
                            <Typography variant="body2">{technique.concentration} mg/ml</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                      {technique.volume && (
                        <MuiGrid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>Volume:</Typography>
                            <Typography variant="body2">{technique.volume} ml</Typography>
                          </Box>
                        </MuiGrid>
                      )}
                    </MuiGrid>
                  </Box>
                ))}
              </CardContentStyled>
            </SectionCard>
          )}

          {/* Emergency Drugs and Reversals - More compact grid layout */}
          <SectionCard>
            <CardHeaderStyled title="Emergency Drugs and Reversals" />
            <CardContentStyled>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)'
                },
                gap: 1.5
              }}>
                {EMERGENCY_DRUGS.map((drugDef) => {
                  // For custom entered drugs from the plan
                  const savedDrug = plan.emergencyDrugs?.find(d => d.name === drugDef.name);
                  // For Atipamezole, use the saved drug data or plan-specific fields
                  const isAtipamezole = drugDef.name === 'Atipamezole';
                  
                  // Use saved data if available, otherwise calculate based on weight
                  const drug = savedDrug || (isAtipamezole && plan.atipamezoleDose 
                    ? { 
                        name: 'Atipamezole', 
                        dosage: '',
                        dose: plan.atipamezoleDose,
                        volume: plan.atipamezoleVolume || '-',
                        concentration: '5'
                      } 
                    : calculateEmergencyDrug(drugDef, patientWeight || ''));
                  
                  return (
                    <Paper
                      key={drugDef.name}
                      elevation={1}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        height: '100%'
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>{drugDef.name}</Typography>
                      {isAtipamezole ? (
                        <>
                          <Typography variant="caption" sx={{ display: 'block' }}>10x dex dose</Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Dose: {drug.dose || '-'} mg</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Vol: {drug.volume || '-'} mL</Typography>
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>{drug.concentration} mg/mL</Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="caption" sx={{ display: 'block' }}>{drugDef.dosage} mg/kg</Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Dose: {drug.dose || '-'} mg</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Vol: {drug.volume || '-'} mL</Typography>
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>{drug.concentration} mg/mL</Typography>
                        </>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            </CardContentStyled>
          </SectionCard>

          {/* Post-Operative Plan (added to match form) */}
          <SectionCard>
            <CardHeaderStyled title="Post-Operative Plan" />
            <CardContentStyled>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                {plan.postOpPlan || 'No post-operative plan specified.'}
              </Typography>
              
              <SectionTitle>Recovery Area</SectionTitle>
              <Typography variant="body1">
                {plan.recoveryArea}{plan.recoveryAreaOther ? `: ${plan.recoveryAreaOther}` : ''}
              </Typography>
            </CardContentStyled>
          </SectionCard>
        </MuiGrid>
      </MuiGrid>
      
      {/* Plan Approval */}
      {plan.planApproval && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            px: 2,
            py: 1,
            borderRadius: 1
          }}>
            <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mr: 1 }}>
              Plan Approval:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {plan.planApproval}
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default AnesthesiaPlanView; 