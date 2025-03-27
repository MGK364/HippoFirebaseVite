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
  temperature: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  bloodPressure: {
    systolic: number | null;
    diastolic: number | null;
    mean: number | null;  // Mean Arterial Pressure (MAP)
  };
  oxygenSaturation: number | null;
  etCO2: number | null;   // End-tidal CO2
  painScore: number | null; // Pain score on scale 0-10
  anestheticDepth: number | null; // Anesthetic depth score
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