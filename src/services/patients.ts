import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Patient, VitalSign, Medication, PatientHistory } from '../types';

// Collection references
const patientsCollection = 'patients';
const getVitalSignsCollection = (patientId: string) => `patients/${patientId}/vitalSigns`;
const getMedicationsCollection = (patientId: string) => `patients/${patientId}/medications`;
const getHistoryCollection = (patientId: string) => `patients/${patientId}/history`;

// For development, we'll have some mock data
const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    name: 'Rocky',
    clientId: 'C1001',
    species: 'Canine',
    breed: 'Golden Retriever',
    age: '5 years',
    weight: '32.5 kg',
    status: 'Active'
  },
  {
    id: 'p2',
    name: 'Luna',
    clientId: 'C1002',
    species: 'Feline',
    breed: 'Maine Coon',
    age: '3 years',
    weight: '5.2 kg',
    status: 'Active'
  },
  {
    id: 'p3',
    name: 'Max',
    clientId: 'C1003',
    species: 'Canine',
    breed: 'German Shepherd',
    age: '8 years',
    weight: '38.1 kg',
    status: 'Inactive'
  },
  {
    id: 'p4',
    name: 'Bella',
    clientId: 'C1004',
    species: 'Feline',
    breed: 'Siamese',
    age: '1 year',
    weight: '3.8 kg',
    status: 'Active'
  },
  {
    id: 'p5',
    name: 'Cooper',
    clientId: 'C1005',
    species: 'Canine',
    breed: 'Beagle',
    age: '4 years',
    weight: '12.3 kg',
    status: 'Active'
  }
];

// Development mode flag
const DEVELOPMENT_MODE = true;

// Get all patients
export const getPatients = async (): Promise<Patient[]> => {
  if (DEVELOPMENT_MODE) {
    return MOCK_PATIENTS;
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, patientsCollection));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Patient[];
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
};

// Get a specific patient
export const getPatient = async (patientId: string): Promise<Patient | null> => {
  if (DEVELOPMENT_MODE) {
    const patient = MOCK_PATIENTS.find(p => p.id === patientId);
    return patient || null;
  }
  
  try {
    const docRef = doc(db, patientsCollection, patientId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Patient;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching patient:', error);
    throw error;
  }
};

// Add a new patient
export const addPatient = async (patient: Omit<Patient, 'id'>): Promise<Patient> => {
  if (DEVELOPMENT_MODE) {
    const newId = `p${MOCK_PATIENTS.length + 1}`;
    const newPatient = { ...patient, id: newId };
    MOCK_PATIENTS.push(newPatient);
    return newPatient;
  }
  
  try {
    const docRef = await addDoc(collection(db, patientsCollection), {
      ...patient,
      createdAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...patient };
  } catch (error) {
    console.error('Error adding patient:', error);
    throw error;
  }
};

// Update a patient
export const updatePatient = async (patientId: string, data: Partial<Patient>): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    const index = MOCK_PATIENTS.findIndex(p => p.id === patientId);
    if (index !== -1) {
      MOCK_PATIENTS[index] = { ...MOCK_PATIENTS[index], ...data };
    }
    return;
  }
  
  try {
    const docRef = doc(db, patientsCollection, patientId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

// Delete a patient
export const deletePatient = async (patientId: string): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    const index = MOCK_PATIENTS.findIndex(p => p.id === patientId);
    if (index !== -1) {
      MOCK_PATIENTS.splice(index, 1);
    }
    return;
  }
  
  try {
    await deleteDoc(doc(db, patientsCollection, patientId));
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};

// Mock vital signs for development
const createMockVitalSigns = (patientId: string): VitalSign[] => {
  const now = new Date();
  return Array(10).fill(null).map((_, index) => {
    const timestamp = new Date(now);
    timestamp.setMinutes(now.getMinutes() - index * 15); // Each entry 15 minutes apart
    
    const systolic = 110 + Math.floor(Math.random() * 30); // 110-140 mmHg
    const diastolic = 70 + Math.floor(Math.random() * 20); // 70-90 mmHg
    const mean = Math.round(diastolic + (1/3) * (systolic - diastolic)); // Calculate mean arterial pressure
    
    return {
      id: `vs-${patientId}-${index}`,
      timestamp,
      temperature: 38 + Math.random() * 1.5, // 38-39.5°C
      heartRate: 70 + Math.floor(Math.random() * 30), // 70-100 bpm
      respiratoryRate: 15 + Math.floor(Math.random() * 10), // 15-25 bpm
      bloodPressure: {
        systolic: systolic,
        diastolic: diastolic,
        mean: mean
      },
      oxygenSaturation: 95 + Math.floor(Math.random() * 5), // 95-100%
      etCO2: 35 + Math.floor(Math.random() * 10), // 35-45 mmHg
      painScore: Math.floor(Math.random() * 5), // 0-4
      anestheticDepth: Math.floor(Math.random() * 3) + 2, // 2-4 (light to deep)
      notes: index % 3 === 0 ? 'Patient stable' : ''
    };
  });
};

// Get vital signs for a patient
export const getVitalSigns = async (patientId: string): Promise<VitalSign[]> => {
  if (DEVELOPMENT_MODE) {
    return createMockVitalSigns(patientId);
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, getVitalSignsCollection(patientId)));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: (doc.data().timestamp as Timestamp).toDate()
    })) as VitalSign[];
  } catch (error) {
    console.error('Error fetching vital signs:', error);
    throw error;
  }
};

// Add a vital sign record
export const addVitalSign = async (patientId: string, vitalSign: Omit<VitalSign, 'id'>): Promise<VitalSign> => {
  if (DEVELOPMENT_MODE) {
    const mockVitalSigns = createMockVitalSigns(patientId);
    const newId = `vs-${patientId}-${mockVitalSigns.length}`;
    const newVitalSign = { ...vitalSign, id: newId };
    return newVitalSign;
  }
  
  try {
    const docRef = await addDoc(collection(db, getVitalSignsCollection(patientId)), {
      ...vitalSign,
      createdAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...vitalSign };
  } catch (error) {
    console.error('Error adding vital sign:', error);
    throw error;
  }
};

// Mock medications for development
const createMockMedications = (patientId: string): Medication[] => {
  const now = new Date();
  
  const medications = [
    {
      id: `med-${patientId}-1`,
      name: 'Propofol',
      dosage: '4 mg/kg',
      route: 'IV',
      frequency: 'Once',
      timestamp: new Date(now.getTime() - 60 * 60000), // 1 hour ago
      administered: true,
      administeredBy: 'Dr. Smith'
    },
    {
      id: `med-${patientId}-2`,
      name: 'Isoflurane',
      dosage: '2%',
      route: 'Inhalation',
      frequency: 'Continuous',
      timestamp: new Date(now.getTime() - 55 * 60000), // 55 minutes ago
      administered: true,
      administeredBy: 'Dr. Smith'
    },
    {
      id: `med-${patientId}-3`,
      name: 'Ketamine',
      dosage: '2 mg/kg',
      route: 'IV',
      frequency: 'PRN',
      timestamp: new Date(now.getTime() - 30 * 60000), // 30 minutes ago
      administered: true,
      administeredBy: 'Dr. Johnson'
    },
    {
      id: `med-${patientId}-4`,
      name: 'Carprofen',
      dosage: '2 mg/kg',
      route: 'SC',
      frequency: 'q12h',
      timestamp: new Date(now.getTime() + 2 * 60 * 60000), // 2 hours from now
      administered: false,
      administeredBy: ''
    }
  ];
  
  return medications;
};

// Get medications for a patient
export const getMedications = async (patientId: string): Promise<Medication[]> => {
  if (DEVELOPMENT_MODE) {
    return createMockMedications(patientId);
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, getMedicationsCollection(patientId)));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: (doc.data().timestamp as Timestamp).toDate()
    })) as Medication[];
  } catch (error) {
    console.error('Error fetching medications:', error);
    throw error;
  }
};

// Add a medication
export const addMedication = async (patientId: string, medication: Omit<Medication, 'id'>): Promise<Medication> => {
  if (DEVELOPMENT_MODE) {
    const mockMedications = createMockMedications(patientId);
    const newId = `med-${patientId}-${mockMedications.length + 1}`;
    const newMedication = { ...medication, id: newId };
    return newMedication;
  }
  
  try {
    const docRef = await addDoc(collection(db, getMedicationsCollection(patientId)), {
      ...medication,
      createdAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...medication };
  } catch (error) {
    console.error('Error adding medication:', error);
    throw error;
  }
};

// Update a medication
export const updateMedication = async (patientId: string, medicationId: string, data: Partial<Medication>): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    return;
  }
  
  try {
    const docRef = doc(db, getMedicationsCollection(patientId), medicationId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

// Mock patient history for development
const createMockHistory = (patientId: string): PatientHistory[] => {
  const now = new Date();
  
  const history = [
    {
      id: `hist-${patientId}-1`,
      date: new Date(now.getTime() - 90 * 24 * 60 * 60000), // 90 days ago
      reason: 'Annual checkup',
      diagnosis: 'Healthy',
      treatment: 'None',
      notes: 'All vitals normal. Weight stable.'
    },
    {
      id: `hist-${patientId}-2`,
      date: new Date(now.getTime() - 45 * 24 * 60 * 60000), // 45 days ago
      reason: 'Limping',
      diagnosis: 'Mild sprain',
      treatment: 'Rest, NSAIDs for 5 days',
      notes: 'Follow up in 2 weeks if not improving'
    },
    {
      id: `hist-${patientId}-3`,
      date: new Date(now.getTime() - 10 * 24 * 60 * 60000), // 10 days ago
      reason: 'Pre-surgical exam',
      diagnosis: 'Dental disease',
      treatment: 'Scheduled dental cleaning with extractions',
      notes: 'Blood work normal, cleared for anesthesia'
    }
  ];
  
  return history;
};

// Get patient history
export const getPatientHistory = async (patientId: string): Promise<PatientHistory[]> => {
  if (DEVELOPMENT_MODE) {
    return createMockHistory(patientId);
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, getHistoryCollection(patientId)));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp).toDate()
    })) as PatientHistory[];
  } catch (error) {
    console.error('Error fetching patient history:', error);
    throw error;
  }
};

// Add patient history entry
export const addHistoryEntry = async (patientId: string, history: Omit<PatientHistory, 'id'>): Promise<PatientHistory> => {
  if (DEVELOPMENT_MODE) {
    const mockHistory = createMockHistory(patientId);
    const newId = `hist-${patientId}-${mockHistory.length + 1}`;
    const newHistory = { ...history, id: newId };
    return newHistory;
  }
  
  try {
    const docRef = await addDoc(collection(db, getHistoryCollection(patientId)), {
      ...history,
      createdAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...history };
  } catch (error) {
    console.error('Error adding history entry:', error);
    throw error;
  }
}; 