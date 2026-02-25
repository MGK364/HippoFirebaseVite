import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { FormularyDrug } from '../types';

// When true, all formulary calls use in-memory mock data
// and never touch Firestore. This keeps the UI working even
// if the backend / Firebase is unavailable.
const DEVELOPMENT_MODE = true;

// Simple in-memory mock formulary for prototyping the UI.
// This mirrors a few of the drugs we’d normally pull from Firestore.
const MOCK_FORMULARY_DRUGS: FormularyDrug[] = [
  {
    id: 'mock-acepromazine',
    name: 'Acepromazine',
    category: 'Sedatives',
    dosage: '0.01-0.1 mg/kg (3mg MAX dose)',
    concentration: '2mg/ml & 10mg/ml',
    routes: ['SQ', 'IM', 'IV'],
    duration: '6-12 hrs',
    notes: 'Caution in debilitated animals',
    majorSideEffects: 'Vasodilation'
  },
  {
    id: 'mock-dexmedetomidine',
    name: 'Dexmedetomidine',
    category: 'Sedatives',
    dosage: '2-10 mcg/kg',
    concentration: '500mcg/ml & 100mcg/ml',
    routes: ['SQ', 'IM', 'IV'],
    duration: '60-90 min',
    notes: '',
    majorSideEffects: 'Bradycardia, Peripheral Vasoconstriction'
  },
  {
    id: 'mock-hydromorphone',
    name: 'Hydromorphone',
    category: 'Opioids',
    dosage: '0.05-0.2 mg/kg',
    concentration: '1mg/ml, 2mg/ml, 4mg/ml, 10mg/ml',
    routes: ['SQ', 'IM', 'IV'],
    duration: '~4 hrs',
    notes: 'Moderate analgesia',
    majorSideEffects: 'Panting, Hyperthermia in Cats'
  },
  {
    id: 'mock-propofol',
    name: 'Propofol',
    category: 'IV Anesthetics',
    dosage: '1-5 mg/kg',
    concentration: '10mg/ml',
    routes: ['IV'],
    duration: '10-15 min',
    notes: '90 sec to peak effect',
    majorSideEffects: 'Apnea, Dose dependent CV Depression'
  }
];

/**
 * Fetch all drugs in the formulary
 */
export const getAllFormularyDrugs = async (): Promise<FormularyDrug[]> => {
  if (DEVELOPMENT_MODE) {
    // Return a sorted copy so callers can safely re-order/filter
    return [...MOCK_FORMULARY_DRUGS].sort((a, b) => {
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
  }

  try {
    console.log('Fetching all formulary drugs...');
    const formularyCollection = collection(db, 'formulary');
    
    // Using a simple query without composite ordering to avoid index requirements
    const querySnapshot = await getDocs(formularyCollection);
    
    const drugs: FormularyDrug[] = [];
    querySnapshot.forEach((doc) => {
      drugs.push({ id: doc.id, ...doc.data() } as FormularyDrug);
    });
    
    // Sort the results in memory instead of using Firestore's orderBy
    const sortedDrugs = drugs.sort((a, b) => {
      // First sort by category
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      
      // Then sort by name
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      
      return 0;
    });
    
    console.log(`Found ${sortedDrugs.length} drugs in the formulary`);
    return sortedDrugs;
  } catch (error) {
    console.error('Error fetching formulary drugs:', error);
    throw error;
  }
};

/**
 * Fetch drugs by category
 */
export const getFormularyDrugsByCategory = async (category: string): Promise<FormularyDrug[]> => {
  if (DEVELOPMENT_MODE) {
    const filtered = MOCK_FORMULARY_DRUGS.filter(
      (drug) => drug.category === category
    );

    return filtered.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
  }

  try {
    console.log(`Fetching drugs in category: ${category}`);
    const formularyCollection = collection(db, 'formulary');
    
    // Using where without orderBy to avoid composite index requirements
    const querySnapshot = await getDocs(
      query(formularyCollection, where('category', '==', category))
    );
    
    const drugs: FormularyDrug[] = [];
    querySnapshot.forEach((doc) => {
      drugs.push({ id: doc.id, ...doc.data() } as FormularyDrug);
    });
    
    // Sort in memory by name
    const sortedDrugs = drugs.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
    
    console.log(`Found ${sortedDrugs.length} drugs in category ${category}`);
    return sortedDrugs;
  } catch (error) {
    console.error(`Error fetching formulary drugs in category ${category}:`, error);
    throw error;
  }
};

/**
 * Get a single drug by ID
 */
export const getFormularyDrugById = async (id: string): Promise<FormularyDrug | null> => {
  if (DEVELOPMENT_MODE) {
    return MOCK_FORMULARY_DRUGS.find((drug) => drug.id === id) || null;
  }

  try {
    const drugRef = doc(db, 'formulary', id);
    const drugDoc = await getDoc(drugRef);
    
    if (drugDoc.exists()) {
      return { id: drugDoc.id, ...drugDoc.data() } as FormularyDrug;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching formulary drug with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Add a new drug to the formulary
 */
export const addFormularyDrug = async (drugData: Omit<FormularyDrug, 'id'>): Promise<string> => {
  if (DEVELOPMENT_MODE) {
    // Create a fake ID and push into our in-memory list.
    const newId = `mock-${Date.now()}`;
    const newDrug: FormularyDrug = { id: newId, ...drugData };
    MOCK_FORMULARY_DRUGS.push(newDrug);
    return newId;
  }

  try {
    const formularyCollection = collection(db, 'formulary');
    const newDrugRef = doc(formularyCollection);
    
    await setDoc(newDrugRef, {
      ...drugData,
      createdAt: new Date()
    });
    
    return newDrugRef.id;
  } catch (error) {
    console.error('Error adding new formulary drug:', error);
    throw error;
  }
};

/**
 * Update an existing drug in the formulary
 */
export const updateFormularyDrug = async (id: string, drugData: Partial<FormularyDrug>): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    const index = MOCK_FORMULARY_DRUGS.findIndex((drug) => drug.id === id);
    if (index !== -1) {
      MOCK_FORMULARY_DRUGS[index] = {
        ...MOCK_FORMULARY_DRUGS[index],
        ...drugData
      };
    }
    return;
  }

  try {
    const drugRef = doc(db, 'formulary', id);
    
    await updateDoc(drugRef, {
      ...drugData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error(`Error updating formulary drug with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a drug from the formulary
 */
export const deleteFormularyDrug = async (id: string): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    const index = MOCK_FORMULARY_DRUGS.findIndex((drug) => drug.id === id);
    if (index !== -1) {
      MOCK_FORMULARY_DRUGS.splice(index, 1);
    }
    return;
  }

  try {
    const drugRef = doc(db, 'formulary', id);
    await deleteDoc(drugRef);
  } catch (error) {
    console.error(`Error deleting formulary drug with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Initialize the formulary with default drug data
 */
export const initializeFormulary = async (): Promise<void> => {
  if (DEVELOPMENT_MODE) {
    // In pure-frontend prototype mode, the formulary is already "initialized"
    // from MOCK_FORMULARY_DRUGS above, so this is a no-op.
    console.log('Development mode: skipping Firestore formulary initialization.');
    return;
  }

  try {
    console.log('Starting formulary initialization...');
    
    // Check if formulary already has data
    const formularyCollection = collection(db, 'formulary');
    const querySnapshot = await getDocs(formularyCollection);
    
    if (!querySnapshot.empty) {
      console.log('Formulary already initialized, skipping setup');
      return;
    }
    
    console.log('No existing formulary data found, proceeding with initialization');
    
    // Create a batch to add all drugs at once
    const batch = writeBatch(db);
    
    // Add drugs from the UW VMTH Quick Reference Drug Sheet
    
    // Sedatives
    const sedatives = [
      {
        name: 'Acepromazine',
        category: 'Sedatives',
        dosage: '0.01-0.1 mg/kg (3mg MAX dose)',
        concentration: '2mg/ml & 10mg/ml',
        routes: ['SQ', 'IM', 'IV'],
        duration: '6-12 hrs',
        notes: 'Caution in debilitated animals',
        majorSideEffects: 'Vasodilation'
      },
      {
        name: 'Midazolam',
        category: 'Sedatives',
        dosage: '0.05-0.2 mg/kg',
        concentration: '1mg/ml & 5mg/ml',
        routes: ['SQ', 'IM', 'IV'],
        duration: '1-2 hrs',
        notes: 'Not a reliable sedative in young, healthy patient',
        majorSideEffects: 'Paradoxical excitement possible'
      },
      {
        name: 'Flumazenil',
        category: 'Sedatives',
        dosage: '0.01-0.02 mg/kg',
        concentration: '0.1mg/ml',
        routes: ['Slow IV', 'IM'],
        duration: '~1 hr',
        notes: 'Reversal Benzodiazepine',
        majorSideEffects: ''
      },
      {
        name: 'Dexmedetomidine',
        category: 'Sedatives',
        dosage: '2-10 mcg/kg',
        concentration: '500mcg/ml & 100mcg/ml',
        routes: ['SQ', 'IM', 'IV'],
        duration: '60-90 min',
        notes: '',
        majorSideEffects: 'Bradycardia, Peripheral Vasoconstriction'
      },
      {
        name: 'Atipamezole',
        category: 'Sedatives',
        dosage: 'Equal volume to Dexmedetomidine Volume (500mcg/ml)',
        concentration: '5mg/ml',
        routes: ['IM Only'],
        duration: '~1hr',
        notes: 'Reversal Agent for Dexmedetomidine',
        majorSideEffects: ''
      }
    ];
    
    // Opioids
    const opioids = [
      {
        name: 'Buprenorphine',
        category: 'Opioids',
        dosage: '20-40 mcg/kg',
        concentration: '300mcg/ml',
        routes: ['IM', 'IV', 'Buccal'],
        duration: '6-8 hrs',
        notes: 'Difficult to reverse. Buccal Absorption in cats & dogs',
        majorSideEffects: 'Not absorbed SQ'
      },
      {
        name: 'Buprenorphine-Simbadol',
        category: 'Opioids',
        dosage: '0.24 mg/kg',
        concentration: '1.8mg/ml',
        routes: ['SQ Only'],
        duration: '24 hr',
        notes: 'Only labeled for Cats',
        majorSideEffects: 'Possible Dysphoria, hyperthermia'
      },
      {
        name: 'Butorphanol',
        category: 'Opioids',
        dosage: '0.1-0.5 mg/kg',
        concentration: '2mg/ml & 10mg/ml',
        routes: ['SQ', 'IM', 'IV'],
        duration: '1hr',
        notes: 'Provides mild analgesia. Reverses mu opioids',
        majorSideEffects: ''
      },
      {
        name: 'Fentanyl CRI',
        category: 'Opioids',
        dosage: '2-25 mcg/kg/hr',
        concentration: '50mcg/ml',
        routes: ['IV'],
        duration: '20-30 mins',
        notes: 'Pure mu agonist',
        majorSideEffects: 'Respiratory depression, High doses can cause dysphoria'
      },
      {
        name: 'Fentanyl Transdermal Patch',
        category: 'Opioids',
        dosage: '2-5 mcg/kg',
        concentration: '',
        routes: ['Transdermal'],
        duration: '72 hrs',
        notes: 'Onset 12-24 hrs. Heat may increase absorption',
        majorSideEffects: ''
      },
      {
        name: 'Hydromorphone',
        category: 'Opioids',
        dosage: '0.05-0.2 mg/kg',
        concentration: '1mg/ml, 2mg/ml, 4mg/ml, 10mg/ml',
        routes: ['SQ', 'IM', 'IV'],
        duration: '~4 hrs',
        notes: 'Moderate analgesia',
        majorSideEffects: 'Panting, Hyperthermia in Cats'
      },
      {
        name: 'Morphine',
        category: 'Opioids',
        dosage: '0.2-0.5 mg/kg',
        concentration: '10mg/ml, 15mg/ml',
        routes: ['IM', 'IV Slow'],
        duration: '~4 hrs',
        notes: 'Moderate analgesia',
        majorSideEffects: 'Vomiting, Panting, Moderative sedation, Possible Histamine release'
      }
    ];
    
    // IV Anesthetics
    const ivAnesthetics = [
      {
        name: 'Propofol',
        category: 'IV Anesthetics',
        dosage: '1-5 mg/kg',
        concentration: '10mg/ml',
        routes: ['IV'],
        duration: '10-15 min',
        notes: '90 sec to peak effect',
        majorSideEffects: 'Apnea, Dose dependent CV Depression'
      },
      {
        name: 'Alfaxalone',
        category: 'IV Anesthetics',
        dosage: '0.5-2 mg/kg',
        concentration: '10mg/ml',
        routes: ['IV', 'IM'],
        duration: '10-15 min',
        notes: 'Neurosteroid',
        majorSideEffects: 'Apnea, Dose dependent CV Depression'
      },
      {
        name: 'Ketamine',
        category: 'IV Anesthetics',
        dosage: '2-10 mg/kg (Premed)',
        concentration: '100mg/ml',
        routes: ['SQ', 'IM'],
        duration: '~20 min',
        notes: 'NMDA antagonist',
        majorSideEffects: 'Painful injection, provides immobilization, possible dysphoria'
      }
    ];
    
    // Local Anesthetics
    const localAnesthetics = [
      {
        name: 'Lidocaine',
        category: 'Local Anesthetics',
        dosage: '6mg/kg (dogs); 4mg/kg (cats) MAX',
        concentration: '20mg/ml',
        routes: ['Infiltration', 'Nerve Block'],
        duration: '1-2 hrs',
        notes: '~10 min onset time',
        majorSideEffects: ''
      },
      {
        name: 'Bupivacaine',
        category: 'Local Anesthetics',
        dosage: '2mg/kg (dogs); 1.5mg/kg (cats) MAX',
        concentration: '5mg/ml',
        routes: ['Infiltration', 'Nerve Block'],
        duration: '4-6 hrs',
        notes: '20-30 min onset time',
        majorSideEffects: ''
      }
    ];
    
    // CRIs/Combos
    const crisAndCombos = [
      {
        name: 'MLK CRI',
        category: 'CRIs/Combos',
        dosage: '5ml/kg/hr',
        concentration: 'M:48mg/L L:600mg/L K:120mg/L',
        routes: ['IV CRI'],
        duration: '8-12 hrs',
        notes: 'Must use loading dose',
        majorSideEffects: 'Great Analgesia, some sedation'
      },
      {
        name: 'Fentanyl CRI',
        category: 'CRIs/Combos',
        dosage: '3-25 mcg/kg/hr',
        concentration: '50mcg/ml',
        routes: ['IV CRI'],
        duration: '20-30 min',
        notes: 'Intra/Post-op CRI for Analgesia',
        majorSideEffects: 'Dysphoria, CNS depression'
      }
    ];
    
    // Adjunctive Meds
    const adjunctiveMeds = [
      {
        name: 'Atropine',
        category: 'Adjunctive Meds',
        dosage: '0.02-0.04 mg/kg',
        concentration: '0.4mg/ml, 0.54 mg/ml',
        routes: ['IM', 'IV'],
        duration: '25 min',
        notes: 'Anticholinergic',
        majorSideEffects: 'Tachycardia'
      },
      {
        name: 'Glycopyrrolate',
        category: 'Adjunctive Meds',
        dosage: '0.005-0.01 mg/kg',
        concentration: '0.2mg/ml',
        routes: ['IM', 'IV'],
        duration: '40-50 min',
        notes: 'Anticholinergic',
        majorSideEffects: 'Tachycardia'
      }
    ];
    
    // Track total drugs added
    let totalDrugs = 0;
    
    // Combine all drug categories
    const allDrugs = [
      ...sedatives,
      ...opioids,
      ...ivAnesthetics,
      ...localAnesthetics,
      ...crisAndCombos,
      ...adjunctiveMeds
    ];
    
    console.log(`Adding ${allDrugs.length} total drugs to batch`);
    
    // Add all drugs to the batch
    allDrugs.forEach((drug) => {
      const drugRef = doc(collection(db, 'formulary'));
      batch.set(drugRef, {
        ...drug,
        createdAt: new Date()
      });
      totalDrugs++;
    });
    
    console.log(`Committing batch with ${totalDrugs} drugs to Firestore`);
    
    // Commit the batch
    await batch.commit();
    
    console.log('Formulary initialization completed successfully!');
    
  } catch (error) {
    console.error('Error initializing formulary:', error);
    throw error;
  }
}; 