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