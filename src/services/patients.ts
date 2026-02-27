import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  arrayUnion,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Patient, VitalSign, VitalSignEdit, Medication, PatientHistory, AnesthesiaBolus, AnesthesiaCRI, MedicalSummary, AnesthesiaPlan, Event } from '../types';

// Collection references
const patientsCollection = 'patients';
const getVitalSignsCollection = (patientId: string) => `patients/${patientId}/vitalSigns`;
const getMedicationsCollection = (patientId: string) => `patients/${patientId}/medications`;
const getHistoryCollection = (patientId: string) => `patients/${patientId}/history`;
const getEventsCollection = (patientId: string) => `patients/${patientId}/events`;

// Anesthesia medications collection paths
const getAnesthesiaBolusesRef = (patientId: string) => {
  // Create reference to the boluses subcollection directly
  // This fixes the "odd number of segments" error by using the correct path structure
  return collection(db, `patients/${patientId}/anesthesiaBoluses`);
};
const getAnesthesiaCRIsRef = (patientId: string) => {
  // Create reference to the CRIs subcollection directly
  // This fixes the "odd number of segments" error by using the correct path structure
  return collection(db, `patients/${patientId}/anesthesiaCRIs`);
};

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
// When true, all patient-/vitals-/anesthesia-related calls use mock data
// and never touch Firestore. This lets the frontend run without a backend.
const DEVELOPMENT_MODE = true;

// ─── Dev-mode in-memory cache ──────────────────────────────────────────────
// Stores user-added records so they survive re-fetches within the same session.
// Keyed by patientId. Each array accumulates items added via add*() calls.
// The corresponding get*() merges these with the freshly-generated mock data.
const devCache = {
  vitalSigns:  new Map<string, VitalSign[]>(),
  medications: new Map<string, Medication[]>(),
  boluses:     new Map<string, AnesthesiaBolus[]>(),
  cris:        new Map<string, AnesthesiaCRI[]>(),
  events:      new Map<string, Event[]>(),
  // Track deleted event IDs so we don't re-surface mock ones
  deletedEvents: new Map<string, Set<string>>(),
};

/** Append an item to a dev-cache list, creating the array if needed. */
function cacheAppend<T>(map: Map<string, T[]>, patientId: string, item: T): void {
  const list = map.get(patientId);
  if (list) { list.push(item); } else { map.set(patientId, [item]); }
}

/** Get cached items for a patient (or empty array). */
function cacheGet<T>(map: Map<string, T[]>, patientId: string): T[] {
  return map.get(patientId) ?? [];
}

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
// Generates a realistic 2-hour anesthesia procedure at 5-minute intervals.
// Temperature is recorded every 15 min (0 = sentinel for "not recorded this interval").
// SpO₂ dips briefly to 94% around T-65 to simulate a clinically relevant desaturation event.
const createMockVitalSigns = (patientId: string): VitalSign[] => {
  const now = new Date();

  // Each row: [minOffset, hr, rr, sysBP, diaBP, spo2, etco2, tempC, o2Flow, vapPct]
  // tempC = 0 → not recorded this interval (filtered in chart)
  // Readings span T-120 min (induction) → T-0 min (current)
  const DATA: [number, number, number, number, number, number, number, number, number, number][] = [
    // min   HR   RR  SBP  DBP  SpO2 ETCO2 Temp   O2    Vap
    [ 120,   85,  16, 128,  78,  100,  40, 38.4,  1.5,  2.0 ], // induction
    [ 115,   80,  14, 122,  75,  100,  41,    0,  1.5,  2.0 ],
    [ 110,   76,  13, 118,  72,  100,  42,    0,  1.5,  2.0 ],
    [ 105,   78,  14, 120,  74,  100,  41, 38.3,  1.5,  2.0 ], // 15-min temp
    [ 100,   75,  13, 116,  70,  100,  40,    0,  1.5,  2.0 ],
    [  95,   77,  14, 118,  72,  100,  41,    0,  1.5,  2.0 ],
    [  90,   79,  15, 120,  74,  100,  42, 38.2,  1.5,  2.0 ], // 15-min temp
    [  85,   76,  13, 115,  70,  100,  40,    0,  1.5,  1.8 ],
    [  80,   74,  13, 113,  68,  100,  40,    0,  1.5,  1.8 ],
    [  75,   78,  14, 116,  72,  100,  41, 38.2,  1.5,  1.8 ], // 15-min temp
    [  70,   79,  14, 116,  72,  100,  42,    0,  1.5,  1.8 ],
    [  65,   78,  14, 115,  70,  100,  41,    0,  1.5,  1.8 ],
    [  60,   77,  14, 116,  70,  100,  41, 38.1,  1.5,  2.0 ], // 15-min temp
    [  55,   78,  14, 116,  70,  100,  41,    0,  2.0,  2.0 ],
    [  50,   80,  14, 115,  70,  100,  40,    0,  2.0,  1.8 ],
    [  45,   78,  13, 114,  68,  100,  40, 38.1,  2.0,  1.8 ], // 15-min temp
    [  40,   76,  13, 113,  68,  100,  40,    0,  2.0,  1.8 ],
    [  35,   75,  14, 114,  70,  100,  39,    0,  2.0,  1.8 ],
    [  30,   77,  14, 116,  70,  100,  40, 38.0,  2.0,  1.5 ], // 15-min temp; vapor ↓
    [  25,   79,  15, 118,  72,  100,  41,    0,  2.0,  1.5 ],
    [  20,   80,  15, 120,  74,  100,  40,    0,  1.5,  1.5 ], // surgery closing
    [  15,   82,  16, 122,  76,  100,  39, 38.0,  1.5,  1.2 ], // 15-min temp; vapor ↓
    [  10,   85,  17, 124,  78,  100,  38,    0,  1.5,  1.0 ], // lightening plane
    [   5,   88,  18, 126,  80,  100,  37,    0,  1.5,  0.5 ], // near extubation
    [   0,   92,  20, 130,  82,  100,  36, 38.1,  1.0,  0.0 ], // last reading / wake-up
  ];

  return DATA.map(([minOffset, hr, rr, sbp, dbp, spo2, etco2, tempC, o2Flow, vapPct], i) => {
    const timestamp = new Date(now.getTime() - minOffset * 60000);
    const map = Math.round((sbp + 2 * dbp) / 3);
    return {
      id: `vs-${patientId}-${i + 1}`,
      timestamp,
      temperature: tempC,           // 0 = not recorded this interval
      heartRate: hr,
      respiratoryRate: rr,
      bloodPressure: { systolic: sbp, diastolic: dbp, mean: map },
      oxygenSaturation: spo2,
      etCO2: etco2,
      notes: i === 0 ? 'Induction complete, intubated uneventfully.' : '',
      o2FlowRate: o2Flow,
      vaporizerAgent: 'Iso' as const,
      vaporizerPercent: vapPct,
      createdAt: timestamp,          // all mock records pre-date edit window → locked
      createdBy: 'Mock System',
    };
  });
};

// Get vital signs for a patient
export const getVitalSigns = async (patientId: string): Promise<VitalSign[]> => {
  if (DEVELOPMENT_MODE) {
    const mock = createMockVitalSigns(patientId);
    const cached = cacheGet(devCache.vitalSigns, patientId);
    // Cached entries override mock entries with same ID (for edit/void persistence)
    const cachedIds = new Set(cached.map(v => v.id));
    const mergedMock = mock.filter(m => !cachedIds.has(m.id));
    return [...mergedMock, ...cached].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
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
    const newId = `vs-${patientId}-user-${Date.now()}`;
    const newVitalSign: VitalSign = {
      ...vitalSign,
      id: newId,
      createdAt: new Date(),
      createdBy: vitalSign.createdBy || 'unknown',
    };
    cacheAppend(devCache.vitalSigns, patientId, newVitalSign);
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

const EDIT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// Update an existing vital sign (only within 30-minute edit window)
export const updateVitalSign = async (
  patientId: string,
  vitalSignId: string,
  updates: Partial<VitalSign>,
  editMeta: { editedBy: string; editReason: string }
): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    // Find in cache — may need to materialize from mock
    let cached = cacheGet(devCache.vitalSigns, patientId);
    let vs = cached.find(v => v.id === vitalSignId);

    if (!vs) {
      // Materialize mock entry into cache
      const allMock = createMockVitalSigns(patientId);
      const mockVs = allMock.find(v => v.id === vitalSignId);
      if (!mockVs) throw new Error(`Vital sign ${vitalSignId} not found`);
      cacheAppend(devCache.vitalSigns, patientId, { ...mockVs });
      cached = cacheGet(devCache.vitalSigns, patientId);
      vs = cached.find(v => v.id === vitalSignId)!;
    }

    // Enforce 30-minute window
    const createdAt = vs.createdAt instanceof Date ? vs.createdAt : new Date(vs.createdAt ?? 0);
    if (Date.now() - createdAt.getTime() > EDIT_WINDOW_MS) {
      throw new Error('Cannot edit: record is older than 30 minutes. Use void instead.');
    }

    // Build previous-values snapshot (only fields that actually changed)
    const previousValues: Record<string, any> = {};
    const skipKeys = new Set(['id', 'createdAt', 'createdBy', 'editHistory', 'voidedAt', 'voidedBy', 'voidReason']);
    for (const key of Object.keys(updates)) {
      if (skipKeys.has(key)) continue;
      if (JSON.stringify((vs as any)[key]) !== JSON.stringify((updates as any)[key])) {
        previousValues[key] = (vs as any)[key];
      }
    }

    const editEntry: VitalSignEdit = {
      editedAt: new Date(),
      editedBy: editMeta.editedBy,
      editReason: editMeta.editReason,
      previousValues,
    };

    // Apply updates + append edit history
    Object.assign(vs, updates);
    vs.editHistory = [...(vs.editHistory || []), editEntry];
    return;
  }

  // Firestore path
  try {
    const docRef = doc(db, getVitalSignsCollection(patientId), vitalSignId);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error('Error updating vital sign:', error);
    throw error;
  }
};

// Hard-delete a vital sign (only within 30-minute window)
export const deleteVitalSign = async (
  patientId: string,
  vitalSignId: string,
  deleteMeta: { deletedBy: string; deleteReason: string }
): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    const cached = devCache.vitalSigns.get(patientId);
    if (!cached) return;
    const idx = cached.findIndex(v => v.id === vitalSignId);
    if (idx === -1) return;
    const vs = cached[idx];

    // Enforce 30-minute window
    const createdAt = vs.createdAt instanceof Date ? vs.createdAt : new Date(vs.createdAt ?? 0);
    if (Date.now() - createdAt.getTime() > EDIT_WINDOW_MS) {
      throw new Error('Cannot delete: record is older than 30 minutes. Use void instead.');
    }

    cached.splice(idx, 1);
    console.log(`[AUDIT] Hard-deleted vital sign ${vitalSignId} by ${deleteMeta.deletedBy}: ${deleteMeta.deleteReason}`);
    return;
  }

  // Firestore path
  try {
    await deleteDoc(doc(db, getVitalSignsCollection(patientId), vitalSignId));
  } catch (error) {
    console.error('Error deleting vital sign:', error);
    throw error;
  }
};

// Void (soft-delete) a vital sign — available at any age
export const voidVitalSign = async (
  patientId: string,
  vitalSignId: string,
  voidMeta: { voidedBy: string; voidReason: string }
): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    let cached = cacheGet(devCache.vitalSigns, patientId);
    let vs = cached.find(v => v.id === vitalSignId);

    if (!vs) {
      // Materialize mock entry into cache so the void persists
      const allMock = createMockVitalSigns(patientId);
      const mockVs = allMock.find(v => v.id === vitalSignId);
      if (!mockVs) throw new Error(`Vital sign ${vitalSignId} not found`);
      cacheAppend(devCache.vitalSigns, patientId, { ...mockVs });
      cached = cacheGet(devCache.vitalSigns, patientId);
      vs = cached.find(v => v.id === vitalSignId)!;
    }

    vs.voidedAt = new Date();
    vs.voidedBy = voidMeta.voidedBy;
    vs.voidReason = voidMeta.voidReason;
    return;
  }

  // Firestore path
  try {
    const docRef = doc(db, getVitalSignsCollection(patientId), vitalSignId);
    await updateDoc(docRef, {
      voidedAt: serverTimestamp(),
      voidedBy: voidMeta.voidedBy,
      voidReason: voidMeta.voidReason,
    });
  } catch (error) {
    console.error('Error voiding vital sign:', error);
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
      administeredBy: ''
    },
    {
      id: `med-${patientId}-2`,
      name: 'Isoflurane',
      dosage: '2%',
      route: 'Inhalation',
      frequency: 'Continuous',
      timestamp: new Date(now.getTime() - 55 * 60000), // 55 minutes ago
      administered: true,
      administeredBy: ''
    },
    {
      id: `med-${patientId}-3`,
      name: 'Ketamine',
      dosage: '2 mg/kg',
      route: 'IV',
      frequency: 'PRN',
      timestamp: new Date(now.getTime() - 30 * 60000), // 30 minutes ago
      administered: true,
      administeredBy: ''
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
    const mock = createMockMedications(patientId);
    const cached = cacheGet(devCache.medications, patientId);
    return [...mock, ...cached].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
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
    const newId = `med-${patientId}-user-${Date.now()}`;
    const newMedication: Medication = { ...medication, id: newId };
    cacheAppend(devCache.medications, patientId, newMedication);
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
    // Update cached medication if it exists
    const cached = cacheGet(devCache.medications, patientId);
    const med = cached.find(m => m.id === medicationId);
    if (med) { Object.assign(med, data); }
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
    const mock = createMockAnesthesiaBoluses(patientId);
    const cached = cacheGet(devCache.boluses, patientId);
    return [...mock, ...cached].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
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
    const mock = createMockAnesthesiaCRIs(patientId);
    const cached = cacheGet(devCache.cris, patientId);
    return [...mock, ...cached].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
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

  // Procedure spans 120 minutes — boluses distributed across the full window

  // T-120: Propofol induction bolus
  boluses.push({
    id: `bolus-${patientId}-1`,
    name: 'Propofol',
    dose: 4.0,
    unit: 'mg/kg',
    timestamp: new Date(now.getTime() - 120 * 60000),
    administeredBy: ''
  });

  // T-119: Ketamine co-induction bolus
  boluses.push({
    id: `bolus-${patientId}-2`,
    name: 'Ketamine',
    dose: 2.0,
    unit: 'mg/kg',
    timestamp: new Date(now.getTime() - 119 * 60000),
    administeredBy: ''
  });

  // T-118: Hydromorphone pre-op opioid
  boluses.push({
    id: `bolus-${patientId}-3`,
    name: 'Hydromorphone',
    dose: 0.1,
    unit: 'mg/kg',
    timestamp: new Date(now.getTime() - 118 * 60000),
    administeredBy: ''
  });

  // T-75: Atropine for intra-op bradycardia
  boluses.push({
    id: `bolus-${patientId}-4`,
    name: 'Atropine',
    dose: 0.02,
    unit: 'mg/kg',
    timestamp: new Date(now.getTime() - 75 * 60000),
    administeredBy: ''
  });

  // T-50: Hydromorphone rescue dose
  boluses.push({
    id: `bolus-${patientId}-5`,
    name: 'Hydromorphone',
    dose: 0.05,
    unit: 'mg/kg',
    timestamp: new Date(now.getTime() - 50 * 60000),
    administeredBy: ''
  });

  // T-15: Atropine — second dose at end of procedure
  boluses.push({
    id: `bolus-${patientId}-6`,
    name: 'Atropine',
    dose: 0.02,
    unit: 'mg/kg',
    timestamp: new Date(now.getTime() - 15 * 60000),
    administeredBy: ''
  });

  // Sort by timestamp
  return boluses.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

// Create mock anesthesia CRIs for development
const createMockAnesthesiaCRIs = (patientId: string): AnesthesiaCRI[] => {
  const now = new Date();
  const cris: AnesthesiaCRI[] = [];

  // Procedure spans 120 minutes — CRIs distributed across the full window

  // Ketamine CRI — started at induction (T-120), still running
  // Rate: 10 → 15 at T-60 → 10 at T-30
  const ketamineCRI: AnesthesiaCRI = {
    id: `cri-${patientId}-1`,
    name: 'Ketamine',
    rate: 10,
    unit: 'mcg/kg/min',
    startTime: new Date(now.getTime() - 120 * 60000),
    administeredBy: '',
    rateHistory: [
      { timestamp: new Date(now.getTime() - 120 * 60000), rate: 10 },
      { timestamp: new Date(now.getTime() -  60 * 60000), rate: 15 },
      { timestamp: new Date(now.getTime() -  30 * 60000), rate: 10 },
    ]
  };
  cris.push(ketamineCRI);

  // Lidocaine CRI — started shortly after induction (T-118), still running
  const lidocaineCRI: AnesthesiaCRI = {
    id: `cri-${patientId}-2`,
    name: 'Lidocaine',
    rate: 50,
    unit: 'mcg/kg/min',
    startTime: new Date(now.getTime() - 118 * 60000),
    administeredBy: '',
    rateHistory: [
      { timestamp: new Date(now.getTime() - 118 * 60000), rate: 50 },
      { timestamp: new Date(now.getTime() -  70 * 60000), rate: 30 },
    ]
  };
  cris.push(lidocaineCRI);

  // Propofol CRI — started at induction (T-118), stopped at T-60 (switched to inhalant)
  const propofolCRI: AnesthesiaCRI = {
    id: `cri-${patientId}-3`,
    name: 'Propofol',
    rate: 0.2,
    unit: 'mg/kg/hr',
    startTime: new Date(now.getTime() - 118 * 60000),
    endTime:   new Date(now.getTime() -  60 * 60000),
    administeredBy: '',
    rateHistory: [
      { timestamp: new Date(now.getTime() - 118 * 60000), rate: 0.3 },
      { timestamp: new Date(now.getTime() -  95 * 60000), rate: 0.4 },
      { timestamp: new Date(now.getTime() -  80 * 60000), rate: 0.2 },
    ]
  };
  cris.push(propofolCRI);

  // Lactated Ringers — started at induction (T-120), still running; rate cut at T-70
  const fluidsCRI: AnesthesiaCRI = {
    id: `cri-${patientId}-4`,
    name: 'Lactated Ringers',
    rate: 5,
    unit: 'mL/kg/hr',
    startTime: new Date(now.getTime() - 120 * 60000),
    administeredBy: '',
    rateHistory: [
      { timestamp: new Date(now.getTime() - 120 * 60000), rate: 10 },
      { timestamp: new Date(now.getTime() -  70 * 60000), rate: 5  },
    ]
  };
  cris.push(fluidsCRI);

  // Fentanyl CRI — added at T-60 when Propofol CRI was stopped, still running
  const fentanylCRI: AnesthesiaCRI = {
    id: `cri-${patientId}-5`,
    name: 'Fentanyl',
    rate: 7,
    unit: 'mcg/kg/hr',
    startTime: new Date(now.getTime() - 60 * 60000),
    administeredBy: '',
    rateHistory: [
      { timestamp: new Date(now.getTime() - 60 * 60000), rate: 5 },
      { timestamp: new Date(now.getTime() - 25 * 60000), rate: 7 },
    ]
  };
  cris.push(fentanylCRI);

  return cris;
};

// Add a new anesthesia bolus medication
export const addAnesthesiaBolus = async (patientId: string, bolus: Omit<AnesthesiaBolus, 'id'>): Promise<string> => {
  if (DEVELOPMENT_MODE) {
    const newId = `bolus-${patientId}-user-${Date.now()}`;
    const newBolus: AnesthesiaBolus = { ...bolus, id: newId };
    cacheAppend(devCache.boluses, patientId, newBolus);
    return newId;
  }
  
  try {
    console.log(`Adding bolus for patient ${patientId}:`, bolus);
    const bolusesRef = getAnesthesiaBolusesRef(patientId);
    
    // Log collection path for debugging
    console.log('Boluses collection path:', bolusesRef.path);
    
    const docRef = await addDoc(bolusesRef, {
      ...bolus,
      createdAt: serverTimestamp()
    });
    
    console.log('Successfully added bolus with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding anesthesia bolus:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.stack);
    }
    throw error;
  }
};

// Add a new anesthesia CRI medication
export const addAnesthesiaCRI = async (patientId: string, cri: Omit<AnesthesiaCRI, 'id'>): Promise<string> => {
  if (DEVELOPMENT_MODE) {
    const newId = `cri-${patientId}-user-${Date.now()}`;
    const newCRI: AnesthesiaCRI = {
      ...cri,
      id: newId,
      rateHistory: [{ timestamp: cri.startTime, rate: cri.rate }],
    };
    cacheAppend(devCache.cris, patientId, newCRI);
    return newId;
  }
  
  try {
    console.log(`Adding CRI for patient ${patientId}:`, cri);
    const crisRef = getAnesthesiaCRIsRef(patientId);
    
    // Log collection path for debugging
    console.log('CRIs collection path:', crisRef.path);
    
    // Create a new object without undefined values
    const criData: any = {
      name: cri.name,
      rate: cri.rate,
      unit: cri.unit,
      startTime: cri.startTime,
      rateHistory: [{
        timestamp: cri.startTime,
        rate: cri.rate
      }],
      administeredBy: cri.administeredBy,
      createdAt: serverTimestamp()
    };
    
    // Only add endTime if it's defined
    if (cri.endTime) {
      criData.endTime = cri.endTime;
    }
    
    const docRef = await addDoc(crisRef, criData);
    
    console.log('Successfully added CRI with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding anesthesia CRI:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.stack);
    }
    throw error;
  }
};

// Update the rate of a CRI
export const updateCRIRate = async (patientId: string, criId: string, newRate: number): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    // Update cached CRI if it exists
    const cached = cacheGet(devCache.cris, patientId);
    const cri = cached.find(c => c.id === criId);
    if (cri) {
      cri.rate = newRate;
      cri.rateHistory = [...(cri.rateHistory || []), { timestamp: new Date(), rate: newRate }];
    }
    console.log(`Development mode: Updated CRI rate for ${criId} to ${newRate}`);
    return;
  }
  
  try {
    console.log(`Updating rate for CRI ${criId} to ${newRate}`);
    const criRef = doc(getAnesthesiaCRIsRef(patientId), criId);
    
    // Log doc path for debugging
    console.log('CRI document path:', criRef.path);
    
    const criDoc = await getDoc(criRef);
    
    if (!criDoc.exists()) {
      const error = new Error(`CRI not found with ID: ${criId}`);
      console.error(error);
      throw error;
    }
    
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
    
    console.log('Successfully updated CRI rate');
  } catch (error) {
    console.error('Error updating CRI rate:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.stack);
    }
    throw error;
  }
};

// Stop a CRI (set end time)
export const stopCRI = async (patientId: string, criId: string): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    // Update cached CRI if it exists
    const cached = cacheGet(devCache.cris, patientId);
    const cri = cached.find(c => c.id === criId);
    if (cri) {
      cri.endTime = new Date();
    }
    console.log(`Development mode: Stopped CRI ${criId}`);
    return;
  }
  
  try {
    console.log(`Stopping CRI ${criId}`);
    const criRef = doc(getAnesthesiaCRIsRef(patientId), criId);
    
    // Log doc path for debugging
    console.log('CRI document path:', criRef.path);
    
    const criDoc = await getDoc(criRef);
    
    if (!criDoc.exists()) {
      const error = new Error(`CRI not found with ID: ${criId}`);
      console.error(error);
      throw error;
    }
    
    await updateDoc(criRef, {
      endTime: new Date()
    });
    
    console.log('Successfully stopped CRI');
  } catch (error) {
    console.error('Error stopping CRI:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.stack);
    }
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
    updatedBy: ''
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
    
    // Check if the plan document exists first
    const planDoc = await getDoc(anesthesiaPlanRef);
    
    if (!planDoc.exists()) {
      // If the plan doesn't exist, create it with createdAt
      await setDoc(anesthesiaPlanRef, {
        ...plan,
        patientId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // If the plan already exists, just update it
      await updateDoc(anesthesiaPlanRef, {
        ...plan,
        updatedAt: serverTimestamp()
      });
    }
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

// Mock procedure events aligned with the 2-hour mock vital signs timeline.
// These are shown as reference lines on the chart.  Users can delete them;
// deletion is honoured via devCache.deletedEvents.
const createMockEvents = (patientId: string): Event[] => {
  const now = new Date();
  return [
    {
      id: `ev-${patientId}-mock-1`,
      timestamp: new Date(now.getTime() - 118 * 60000), // T-118 min
      type: 'Checkpoint',
      title: 'Induction',
      details: 'Propofol 4 mg/kg IV. ET tube 10 mm. Intubated uneventfully.',
      color: '#7B1FA2',
      createdBy: '',
    },
    {
      id: `ev-${patientId}-mock-2`,
      timestamp: new Date(now.getTime() - 100 * 60000), // T-100 min
      type: 'Checkpoint',
      title: 'Surgery Start',
      details: 'Exploratory laparotomy commenced.',
      color: '#1565C0',
      createdBy: '',
    },
    {
      id: `ev-${patientId}-mock-3`,
      timestamp: new Date(now.getTime() - 20 * 60000), // T-20 min
      type: 'Checkpoint',
      title: 'Surgery End',
      details: 'Closure complete. Vaporizer being tapered.',
      color: '#1565C0',
      createdBy: '',
    },
  ];
};

// Get events for a patient
export const getEvents = async (patientId: string): Promise<Event[]> => {
  if (DEVELOPMENT_MODE) {
    const mockEvents = createMockEvents(patientId);
    const cached = cacheGet(devCache.events, patientId);
    const deleted = devCache.deletedEvents.get(patientId) ?? new Set();
    // Merge mock events with user-added cached events; respect deletions
    const all = [...mockEvents, ...cached].filter(e => !deleted.has(e.id));
    return all.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  try {
    const snapshot = await getDocs(collection(db, getEventsCollection(patientId)));
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp?.toDate() || new Date(data.timestamp),
        type: data.type,
        title: data.title,
        details: data.details,
        color: data.color,
        createdBy: data.createdBy
      } as Event;
    });
  } catch (error) {
    console.error('Error getting events:', error);
    throw error;
  }
};

// Add an event for a patient
export const addEvent = async (patientId: string, event: Omit<Event, 'id'>): Promise<Event> => {
  if (DEVELOPMENT_MODE) {
    const mockId = `event-${patientId}-${Date.now()}`;
    const newEvent: Event = { ...event, id: mockId };
    cacheAppend(devCache.events, patientId, newEvent);
    return newEvent;
  }
  
  try {
    const docRef = await addDoc(collection(db, getEventsCollection(patientId)), {
      ...event,
      createdAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...event };
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (patientId: string, eventId: string): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    // Track deletion so the event doesn't reappear on next fetch
    if (!devCache.deletedEvents.has(patientId)) {
      devCache.deletedEvents.set(patientId, new Set());
    }
    devCache.deletedEvents.get(patientId)!.add(eventId);
    // Also remove from cached events array
    const cached = devCache.events.get(patientId);
    if (cached) {
      devCache.events.set(patientId, cached.filter(e => e.id !== eventId));
    }
    return;
  }
  
  try {
    await deleteDoc(doc(db, getEventsCollection(patientId), eventId));
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}; 