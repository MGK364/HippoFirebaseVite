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
  serverTimestamp,
  arrayUnion,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Patient, VitalSign, Medication, PatientHistory, AnesthesiaBolus, AnesthesiaCRI, MedicalSummary, AnesthesiaPlan } from '../types';

// Collection references
const patientsCollection = 'patients';
const getVitalSignsCollection = (patientId: string) => `patients/${patientId}/vitalSigns`;
const getMedicationsCollection = (patientId: string) => `patients/${patientId}/medications`;
const getHistoryCollection = (patientId: string) => `patients/${patientId}/history`;

// Anesthesia medications collection paths
const getAnesthesiaMedicationsPath = (patientId: string) => `patients/${patientId}/anesthesiaMedications`;
const getAnesthesiaBolusesRef = (patientId: string) => collection(db, getAnesthesiaMedicationsPath(patientId), 'boluses');
const getAnesthesiaCRIsRef = (patientId: string) => collection(db, getAnesthesiaMedicationsPath(patientId), 'cris');

// Path for anesthesia plan
const getAnesthesiaPlanPath = (patientId: string) => `patients/${patientId}/anesthesiaPlan`;
const getAnesthesiaPlanRef = (patientId: string) => doc(db, getAnesthesiaPlanPath(patientId), 'current');

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
  // Generate mock data points every 15 minutes for the past hour
  const now = new Date();
  const vitalSigns: VitalSign[] = [];
  
  for (let i = 0; i < 5; i++) {
    // Time: 60 minutes ago to now, in 15-minute increments
    const timestamp = new Date(now.getTime() - (60 - i * 15) * 60000);
    
    // Generate vital sign values with some random fluctuation
    const baseHR = 80 + Math.floor(Math.random() * 20); // Heart rate around 80-100
    const baseRR = 15 + Math.floor(Math.random() * 10); // Respiratory rate around 15-25
    const baseSP = 120 + Math.floor(Math.random() * 20); // Systolic around 120-140
    const baseDP = 70 + Math.floor(Math.random() * 15); // Diastolic around 70-85
    const baseTemp = 38 + (Math.random() * 0.5); // Temp around 38-38.5
    const baseO2 = 95 + Math.floor(Math.random() * 5); // O2 sat around 95-100
    const baseEtCO2 = 35 + Math.floor(Math.random() * 10); // ETCO2 around 35-45
    const basePain = 1 + Math.floor(Math.random() * 4); // Pain score 1-5
    
    vitalSigns.push({
      id: `vs-${patientId}-${i+1}`,
      timestamp,
      temperature: parseFloat(baseTemp.toFixed(1)),
      heartRate: baseHR,
      respiratoryRate: baseRR,
      bloodPressure: {
        systolic: baseSP,
        diastolic: baseDP,
        mean: Math.round((baseSP + 2 * baseDP) / 3) // Calculate MAP
      },
      oxygenSaturation: baseO2,
      etCO2: baseEtCO2,
      painScore: basePain,
      notes: i === 0 ? 'Initial assessment' : ''
    });
  }
  
  return vitalSigns;
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

// Get all anesthesia boluses for a patient
export const getAnesthesiaBoluses = async (patientId: string): Promise<AnesthesiaBolus[]> => {
  if (DEVELOPMENT_MODE) {
    return createMockAnesthesiaBoluses(patientId);
  }
  
  try {
    const bolusesRef = getAnesthesiaBolusesRef(patientId);
    const bolusesSnapshot = await getDocs(bolusesRef);
    
    return bolusesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate(),
      } as AnesthesiaBolus;
    });
  } catch (error) {
    console.error('Error fetching anesthesia bolus medications:', error);
    return [];
  }
};

// Get all anesthesia CRIs for a patient
export const getAnesthesiaCRIs = async (patientId: string): Promise<AnesthesiaCRI[]> => {
  if (DEVELOPMENT_MODE) {
    return createMockAnesthesiaCRIs(patientId);
  }
  
  try {
    const crisRef = getAnesthesiaCRIsRef(patientId);
    const crisSnapshot = await getDocs(crisRef);
    
    return crisSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startTime: data.startTime?.toDate(),
        endTime: data.endTime?.toDate(),
        rateHistory: data.rateHistory?.map((rh: any) => ({
          ...rh,
          timestamp: rh.timestamp?.toDate()
        })),
      } as AnesthesiaCRI;
    });
  } catch (error) {
    console.error('Error fetching anesthesia CRI medications:', error);
    return [];
  }
};

// Create mock anesthesia boluses for development
const createMockAnesthesiaBoluses = (patientId: string): AnesthesiaBolus[] => {
  const now = new Date();
  const boluses: AnesthesiaBolus[] = [];
  
  // Create boluses starting from 60 minutes ago
  // Match with the timeframe of vital signs (createMockVitalSigns creates data every 15 minutes)
  const bolusNames = ['Propofol', 'Ketamine', 'Hydromorphone', 'Midazolam', 'Atropine'];
  const adminNames = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams'];
  
  // Induction dose at beginning
  boluses.push({
    id: `bolus-${patientId}-1`,
    name: 'Propofol',
    dose: 4.0,
    unit: 'mg/kg',
    timestamp: new Date(now.getTime() - 60 * 60000), // 60 minutes ago
    administeredBy: adminNames[0]
  });
  
  // Ketamine for initial analgesia
  boluses.push({
    id: `bolus-${patientId}-2`,
    name: 'Ketamine',
    dose: 2.0,
    unit: 'mg/kg',
    timestamp: new Date(now.getTime() - 59 * 60000), // 59 minutes ago
    administeredBy: adminNames[0]
  });
  
  // Hydromorphone for analgesia
  boluses.push({
    id: `bolus-${patientId}-3`,
    name: 'Hydromorphone',
    dose: 0.1,
    unit: 'mg/kg',
    timestamp: new Date(now.getTime() - 58 * 60000), // 58 minutes ago
    administeredBy: adminNames[0]
  });
  
  // Add some additional boluses during the procedure
  for (let i = 4; i <= 8; i++) {
    const timeOffset = Math.floor(Math.random() * 50) + 5; // Random time between 5-55 minutes ago
    const nameIndex = Math.floor(Math.random() * bolusNames.length);
    const adminIndex = Math.floor(Math.random() * adminNames.length);
    
    boluses.push({
      id: `bolus-${patientId}-${i}`,
      name: bolusNames[nameIndex],
      dose: Math.round((Math.random() * 2 + 0.5) * 10) / 10, // Random dose between 0.5-2.5
      unit: nameIndex === 0 ? 'mg/kg' : nameIndex === 4 ? 'mg' : 'mg/kg',
      timestamp: new Date(now.getTime() - timeOffset * 60000),
      administeredBy: adminNames[adminIndex]
    });
  }
  
  // Sort by timestamp
  return boluses.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

// Create mock anesthesia CRIs for development
const createMockAnesthesiaCRIs = (patientId: string): AnesthesiaCRI[] => {
  const now = new Date();
  const cris: AnesthesiaCRI[] = [];
  const adminNames = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams'];
  
  // Ketamine CRI - started at beginning and still running
  const ketamineCRI: AnesthesiaCRI = {
    id: `cri-${patientId}-1`,
    name: 'Ketamine',
    rate: 10,
    unit: 'mcg/kg/min',
    startTime: new Date(now.getTime() - 60 * 60000), // Started 60 minutes ago
    administeredBy: adminNames[0],
    rateHistory: [
      {
        timestamp: new Date(now.getTime() - 60 * 60000),
        rate: 10
      },
      {
        timestamp: new Date(now.getTime() - 30 * 60000),
        rate: 15
      },
      {
        timestamp: new Date(now.getTime() - 15 * 60000),
        rate: 10
      }
    ]
  };
  cris.push(ketamineCRI);
  
  // Lidocaine CRI - started at beginning and still running
  const lidocaineCRI: AnesthesiaCRI = {
    id: `cri-${patientId}-2`,
    name: 'Lidocaine',
    rate: 50,
    unit: 'mcg/kg/min',
    startTime: new Date(now.getTime() - 55 * 60000), // Started 55 minutes ago
    administeredBy: adminNames[1],
    rateHistory: [
      {
        timestamp: new Date(now.getTime() - 55 * 60000),
        rate: 50
      }
    ]
  };
  cris.push(lidocaineCRI);
  
  // Propofol CRI - started and then stopped
  const propofolCRI: AnesthesiaCRI = {
    id: `cri-${patientId}-3`,
    name: 'Propofol',
    rate: 0.3,
    unit: 'mg/kg/hr',
    startTime: new Date(now.getTime() - 50 * 60000), // Started 50 minutes ago
    endTime: new Date(now.getTime() - 20 * 60000), // Ended 20 minutes ago
    administeredBy: adminNames[0],
    rateHistory: [
      {
        timestamp: new Date(now.getTime() - 50 * 60000),
        rate: 0.3
      },
      {
        timestamp: new Date(now.getTime() - 40 * 60000),
        rate: 0.4
      },
      {
        timestamp: new Date(now.getTime() - 30 * 60000),
        rate: 0.2
      }
    ]
  };
  cris.push(propofolCRI);
  
  // Lactated Ringers - started at beginning and still running
  const fluidsCRI: AnesthesiaCRI = {
    id: `cri-${patientId}-4`,
    name: 'Lactated Ringers',
    rate: 10,
    unit: 'mL/kg/hr',
    startTime: new Date(now.getTime() - 58 * 60000), // Started 58 minutes ago
    administeredBy: adminNames[2],
    rateHistory: [
      {
        timestamp: new Date(now.getTime() - 58 * 60000),
        rate: 10
      },
      {
        timestamp: new Date(now.getTime() - 35 * 60000),
        rate: 5
      }
    ]
  };
  cris.push(fluidsCRI);
  
  // Fentanyl CRI - started 25 minutes ago and still running
  const fentanylCRI: AnesthesiaCRI = {
    id: `cri-${patientId}-5`,
    name: 'Fentanyl',
    rate: 5,
    unit: 'mcg/kg/hr',
    startTime: new Date(now.getTime() - 25 * 60000), // Started 25 minutes ago
    administeredBy: adminNames[0],
    rateHistory: [
      {
        timestamp: new Date(now.getTime() - 25 * 60000),
        rate: 5
      },
      {
        timestamp: new Date(now.getTime() - 10 * 60000),
        rate: 7
      }
    ]
  };
  cris.push(fentanylCRI);
  
  return cris;
};

// Add a new anesthesia bolus medication
export const addAnesthesiaBolus = async (patientId: string, bolus: Omit<AnesthesiaBolus, 'id'>): Promise<string> => {
  try {
    const bolusesRef = getAnesthesiaBolusesRef(patientId);
    const docRef = await addDoc(bolusesRef, bolus);
    return docRef.id;
  } catch (error) {
    console.error('Error adding anesthesia bolus:', error);
    throw error;
  }
};

// Add a new anesthesia CRI medication
export const addAnesthesiaCRI = async (patientId: string, cri: Omit<AnesthesiaCRI, 'id'>): Promise<string> => {
  try {
    const crisRef = getAnesthesiaCRIsRef(patientId);
    const docRef = await addDoc(crisRef, {
      ...cri,
      rateHistory: [{
        timestamp: cri.startTime,
        rate: cri.rate
      }]
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding anesthesia CRI:', error);
    throw error;
  }
};

// Update the rate of a CRI
export const updateCRIRate = async (patientId: string, criId: string, newRate: number): Promise<void> => {
  try {
    const criRef = doc(getAnesthesiaCRIsRef(patientId), criId);
    const criDoc = await getDoc(criRef);
    
    if (!criDoc.exists()) {
      throw new Error('CRI not found');
    }
    
    const criData = criDoc.data();
    const timestamp = new Date();
    
    // Update the current rate
    await updateDoc(criRef, {
      rate: newRate,
      // Add the new rate to history
      rateHistory: arrayUnion({
        timestamp,
        rate: newRate
      })
    });
  } catch (error) {
    console.error('Error updating CRI rate:', error);
    throw error;
  }
};

// Stop a CRI (set end time)
export const stopCRI = async (patientId: string, criId: string): Promise<void> => {
  try {
    const criRef = doc(getAnesthesiaCRIsRef(patientId), criId);
    await updateDoc(criRef, {
      endTime: new Date()
    });
  } catch (error) {
    console.error('Error stopping CRI:', error);
    throw error;
  }
};

// Get patient's medical summary
export const getMedicalSummary = async (patientId: string): Promise<MedicalSummary | null> => {
  if (DEVELOPMENT_MODE) {
    return createMockMedicalSummary(patientId);
  }
  
  try {
    const medicalSummaryRef = doc(db, `patients/${patientId}/medicalSummary/current`);
    const medicalSummaryDoc = await getDoc(medicalSummaryRef);
    
    if (!medicalSummaryDoc.exists()) {
      return null;
    }
    
    const data = medicalSummaryDoc.data();
    return {
      id: medicalSummaryDoc.id,
      ...data,
      lastUpdated: data.lastUpdated?.toDate(),
    } as MedicalSummary;
  } catch (error) {
    console.error('Error fetching medical summary:', error);
    return null;
  }
};

// Update or create a patient's medical summary
export const updateMedicalSummary = async (patientId: string, medicalSummary: Omit<MedicalSummary, 'id'>): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    console.log('Updating medical summary in development mode:', medicalSummary);
    return;
  }
  
  try {
    const medicalSummaryRef = doc(db, `patients/${patientId}/medicalSummary/current`);
    await setDoc(medicalSummaryRef, {
      ...medicalSummary,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating medical summary:', error);
    throw error;
  }
};

// Create a mock medical summary for development
const createMockMedicalSummary = (patientId: string): MedicalSummary => {
  return {
    id: `ms-${patientId}`,
    temperament: 'Calm but anxious in clinical settings',
    bcs: '4/9',
    historyText: 'Left hindlimb lameness noticed in April -> progressed, osteosarcoma diagnosed -> staging (x-ray/CT/AUS) showed no obvious metastasis',
    previousDiagnoses: ['Osteosarcoma - left hindlimb'],
    previousAnesthesia: true,
    anesthesiaDetails: 'Previously anesthetized for diagnostic imaging with no complications',
    ivInPlace: false,
    ettSize: '14',
    physicalExam: {
      temp: 103.1,
      heartRate: 128,
      respRate: 24,
      age: '4y',
      weight: '47 kgs',
      mucousMembranes: 'pink',
      crt: '< 2 sec',
      pulseQuality: 'strong',
      auscultation: 'WNL'
    },
    labValues: {
      pcv: '46%',
      tp: '8.2',
      bun: '10',
      sodium: '147',
      potassium: '3.5',
      chloride: '115',
      calcium: '10.2',
      glucose: '112',
      creatinine: '0.8',
      albumin: '3.4',
      alkp: '176',
      ast: '44',
      alt: '11',
      tbil: '0.3',
      platelets: '353',
      wbc: '9.2',
      pt_ptt: 'N/A',
      crossmatch: 'N/A'
    },
    cardioStatus: 'WNL',
    respiratoryStatus: 'WNL',
    neuroMuscStatus: 'S/S lame left hind',
    currentMeds: [],
    asaStatus: 'II',
    problemList: ['Hind limb osteosarcoma'],
    anestheticComplications: ['Hypotension', 'Blood loss', 'Bradycardia', 'Pain', 'Hypoventilation', 'Regurgitation'],
    cpr: true,
    clientAuth: true,
    lastUpdated: new Date(),
    updatedBy: 'Dr. Smith'
  };
};

// Get anesthesia plan for a patient
export const getAnesthesiaPlan = async (patientId: string): Promise<AnesthesiaPlan | null> => {
  if (DEVELOPMENT_MODE) {
    return createMockAnesthesiaPlan(patientId);
  }
  
  try {
    const anesthesiaPlanRef = getAnesthesiaPlanRef(patientId);
    const anesthesiaPlanDoc = await getDoc(anesthesiaPlanRef);
    
    if (!anesthesiaPlanDoc.exists()) {
      return null;
    }
    
    const data = anesthesiaPlanDoc.data();
    return {
      id: anesthesiaPlanDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as AnesthesiaPlan;
  } catch (error) {
    console.error('Error fetching anesthesia plan:', error);
    return null;
  }
};

// Create or update anesthesia plan
export const updateAnesthesiaPlan = async (patientId: string, plan: Omit<AnesthesiaPlan, 'id'>): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    console.log('Updating anesthesia plan in development mode:', plan);
    return;
  }
  
  try {
    const anesthesiaPlanRef = getAnesthesiaPlanRef(patientId);
    await setDoc(anesthesiaPlanRef, {
      ...plan,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating anesthesia plan:', error);
    throw error;
  }
};

// Create a mock anesthesia plan for development
const createMockAnesthesiaPlan = (patientId: string): AnesthesiaPlan => {
  return {
    id: `ap-${patientId}`,
    patientId,
    premedications: [
      {
        name: 'Hydromorphone',
        route: 'IM',
        dosageRange: '0.05-0.1',
        anticipatedDose: '4',
        concentration: '',
        volume: '',
      },
      {
        name: 'Dexmedetomidine',
        route: 'IM',
        dosageRange: '2-10',
        anticipatedDose: '0.125',
        concentration: '',
        volume: '',
      }
    ],
    inductionAgents: [
      {
        name: 'Propofol',
        route: 'IV',
        dosageRange: '1-8',
        anticipatedDose: '50-250',
        concentration: '',
        volume: '',
      }
    ],
    maintenance: '',
    ivFluids: [
      {
        name: 'Plasmalyte',
        rate: '5',
        mlPerHr: '235',
        dropsPerSec: '',
        bolusVolume: '',
      }
    ],
    cris: [
      {
        name: 'Fentanyl',
        dosageRange: '2-8.5',
        loadingDose: '0.8/kg',
      },
      {
        name: 'Ketamine',
        dosageRange: '2-10',
      }
    ],
    otherTechniques: [
      {
        name: 'Epidural',
        drugs: ['Bupivicaine', 'Morphine'],
        dosage: '1mL/5-7kg',
        concentration: '0.5%/0.2mL/kg',
        volume: '10mL=0.2mL/kg',
      },
      {
        name: 'Nocita',
        drugs: ['(PV-CRI-Max)'],
        dosage: '0.1mg/kg',
        volume: '0.05mL',
      }
    ],
    totalBloodVolume: '4,230',
    ventilator: false,
    emergencyDrugs: [
      {
        name: 'Glycopyrrolate',
        dose: '0.25-0.4',
      },
      {
        name: 'Atropine',
        dose: '0.04-1.88',
      },
      {
        name: 'Epinephrine',
        dose: '0.47',
      },
      {
        name: 'Lidocaine',
        dose: '94',
      }
    ],
    tidalVolume: '470-940',
    respRate: '10-20',
    recoveryArea: 'Anesthesia',
    monitoringPlan: {
      spo2: true,
      temp: true,
      ecg: true,
      etco2: true,
      ibp: true,
      nibp: false,
      doppler: true,
      arterialLine: true,
      centralLine: false,
      ivcs: {
        longTerm: true,
        shortTerm: false,
        secondIV: true,
      },
    },
    postOpPlan: '',
    planApproval: '',
    createdBy: 'Mock User',
    createdAt: new Date(),
  };
}; 