// User type definition
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Patient type definition
export interface Patient {
  id: string;
  name: string;
  clientId: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  status: 'Active' | 'Inactive';
}

// Vital sign record type
export interface VitalSign {
  id: string;
  timestamp: Date;
  temperature: number;
  heartRate: number;
  respiratoryRate: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
    mean: number | null;
  };
  oxygenSaturation: number;
  etCO2: number | null;
  painScore: number | null;
  notes: string;
}

// Medication type
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  timestamp: Date;
  administered: boolean;
  administeredBy: string;
}

// Patient history type
export interface PatientHistory {
  id: string;
  date: Date;
  reason: string;
  diagnosis: string;
  treatment: string;
  notes: string;
}

// Extended Medical History
export interface MedicalSummary {
  id: string;
  // General info
  temperament: string;
  bcs: string; // Body Condition Score
  
  // History
  historyText: string; // For detailed condition description
  previousDiagnoses: string[];
  
  // Anesthesia history
  previousAnesthesia: boolean;
  anesthesiaDetails?: string; // Drugs used and response
  
  // IV status
  ivInPlace: boolean;
  ettSize?: string; // Endotracheal tube size
  
  // Most recent physical exam
  physicalExam: {
    temp: number;
    heartRate: number;
    respRate: number;
    age: string;
    weight: string;
    mucousMembranes: string; // e.g., "pink"
    crt: string; // Capillary Refill Time
    pulseQuality: string;
    auscultation: string; // e.g., "WNL" (within normal limits)
  };
  
  // Lab values
  labValues?: {
    pcv: string; // Packed Cell Volume
    tp: string; // Total Protein
    bun: string; // Blood Urea Nitrogen
    creatinine: string;
    sodium: string;
    potassium: string;
    chloride: string;
    calcium: string;
    glucose: string;
    alt: string; // Alanine Aminotransferase
    tbil: string; // Total Bilirubin
    platelets: string;
    albumin: string;
    alkp: string; // Alkaline Phosphatase
    ast: string; // Aspartate Aminotransferase
    wbc: string; // White Blood Cell count
    pt_ptt: string; // Prothrombin Time/Partial Thromboplastin Time
    crossmatch: string;
  };
  
  // Status reports
  cardioStatus: string;
  respiratoryStatus: string;
  neuroMuscStatus: string;
  
  // Current medications
  currentMeds: string[];
  
  // Problem list and ASA status
  asaStatus: string; // I-V
  problemList: string[];
  painScore?: string;
  
  // Possible complications
  anestheticComplications: string[];
  
  // Emergency preferences
  cpr: boolean; // true = Yes, false = DNR
  clientAuth: boolean; // consent given
  
  lastUpdated: Date;
  updatedBy: string;
}

// Anesthesia Medication types
export interface AnesthesiaBolus {
  id: string;
  name: string;
  dose: number;
  unit: string;
  timestamp: Date;
  administeredBy: string;
}

export interface AnesthesiaCRI {
  id: string;
  name: string;
  rate: number;
  unit: string;
  startTime: Date;
  endTime?: Date;
  rateHistory?: {
    timestamp: Date;
    rate: number;
  }[];
  administeredBy: string;
}

export interface AnesthesiaPlan {
  id: string;
  patientId: string;
  // Premedications
  premedications: {
    name: string;
    route: 'IV' | 'IM' | 'SQ' | string;
    dosageRange: string; // mg/kg
    anticipatedDose: string; // mg
    concentration: string; // mg/ml
    volume: string; // mls
  }[];
  
  // Induction
  inductionAgents: {
    name: string;
    route: string;
    dosageRange: string; // mg/kg
    anticipatedDose: string; // mg
    concentration?: string; // mg/ml
    volume?: string; // mls
  }[];
  
  // Maintenance
  maintenance: string;
  
  // IV Fluids
  ivFluids: {
    name: string;
    rate: string; // ml/kg/hr
    mlPerHr: string;
    dropsPerSec?: string;
    bolusVolume?: string;
  }[];
  
  // Constant Rate Infusions
  cris: {
    name: string;
    loadingDose?: string; // mg & ml
    dosageRange: string; // mg/kg/hr or mcg/ml/hr
    concentration?: string; // mg/ml
  }[];
  
  // Other techniques
  otherTechniques: {
    name: string;
    drugs: string[];
    dosage: string;
    concentration?: string;
    volume?: string;
  }[];
  
  // Additional info
  totalBloodVolume: string;
  ventilator: boolean;
  
  // Emergency drugs
  emergencyDrugs: {
    name: string;
    dose: string; // mg
    volume?: string; // ml
  }[];
  
  // Vital parameters
  tidalVolume?: string;
  respRate?: string;
  peep?: string;
  
  // Recovery info
  recoveryArea: 'Anesthesia' | 'CCU' | 'Back Run' | 'Other';
  recoveryAreaOther?: string;
  
  // Monitoring plan
  monitoringPlan: {
    spo2: boolean;
    temp: boolean;
    ecg: boolean;
    etco2: boolean;
    ibp: boolean;
    nibp: boolean;
    doppler: boolean;
    arterialLine: boolean;
    centralLine: boolean;
    ivcs: {
      longTerm: boolean;
      shortTerm: boolean;
      secondIV: boolean;
    };
  };
  
  postOpPlan?: string;
  planApproval?: string;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
} 