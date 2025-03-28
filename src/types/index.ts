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