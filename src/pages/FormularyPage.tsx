import React, { useState, useEffect } from 'react';
import { 
  getAllFormularyDrugs, 
  getFormularyDrugsByCategory, 
  initializeFormulary 
} from '../services/formulary';
import { FormularyDrug } from '../types';
import { 
  Box, 
  Button, 
  Typography, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  CircularProgress, 
  Alert, 
  Card, 
  CardContent, 
  Chip, 
  Paper,
  Container,
  Link
} from '@mui/material';
import { 
  collection, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../services/firebase';

// Component for displaying drug details
const DrugCard: React.FC<{ drug: FormularyDrug }> = ({ drug }) => {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h6" component="h3" color="primary">
            {drug.name}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {drug.category}
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Dosage:
            </Typography>
            <Typography variant="body2">
              {drug.dosage}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Concentration:
            </Typography>
            <Typography variant="body2">
              {drug.concentration}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Route:
            </Typography>
            <Typography variant="body2">
              {drug.routes.join(', ')}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Duration:
            </Typography>
            <Typography variant="body2">
              {drug.duration}
            </Typography>
          </Box>
        </Box>
        
        {drug.majorSideEffects && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Side Effects:
            </Typography>
            <Typography variant="body2" color="error">
              {drug.majorSideEffects}
            </Typography>
          </Box>
        )}
        
        {drug.notes && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Notes:
            </Typography>
            <Typography variant="body2">
              {drug.notes}
            </Typography>
          </Box>
        )}
        
        {drug.reversal && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Reversal Agent:
            </Typography>
            <Typography variant="body2">
              {drug.reversal}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const FormularyPage: React.FC = () => {
  const [drugs, setDrugs] = useState<FormularyDrug[]>([]);
  const [filteredDrugs, setFilteredDrugs] = useState<FormularyDrug[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState<boolean>(false);
  const [indexLink, setIndexLink] = useState<string | null>(null);

  // Extract Firestore index link from error messages
  const extractFirestoreIndexLink = (error: any): string | null => {
    if (!error || typeof error.message !== 'string') return null;
    
    const message = error.message;
    const indexLinkMatch = message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
    
    return indexLinkMatch ? indexLinkMatch[0] : null;
  };

  // Function to fetch and load drugs
  const loadDrugs = async () => {
    try {
      setLoading(true);
      setError(null);
      setIndexLink(null);
      
      console.log('Starting to load drugs...');
      
      let drugsData: FormularyDrug[];
      
      try {
        if (selectedCategory) {
          console.log(`Loading drugs for category: ${selectedCategory}`);
          drugsData = await getFormularyDrugsByCategory(selectedCategory);
        } else {
          console.log('Loading all drugs');
          drugsData = await getAllFormularyDrugs();
        }
      } catch (queryError: any) {
        // Check for index error
        const indexUrl = extractFirestoreIndexLink(queryError);
        if (indexUrl) {
          setIndexLink(indexUrl);
          console.log('Index required, URL extracted:', indexUrl);
        }
        
        // Fallback method that doesn't require indexes
        console.log('Primary query failed. Using fallback method to load drugs:', queryError);
        
        // Direct Firestore access
        const formularyCollection = collection(db, 'formulary');
        const querySnapshot = await getDocs(formularyCollection);
        
        drugsData = [];
        querySnapshot.forEach((doc) => {
          const drugData = doc.data() as Omit<FormularyDrug, 'id'>;
          drugsData.push({
            id: doc.id,
            ...drugData
          });
        });
        
        // Filter by category if needed
        if (selectedCategory) {
          drugsData = drugsData.filter(drug => drug.category === selectedCategory);
        }
        
        // Sort manually
        drugsData.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return a.name.localeCompare(b.name);
        });
      }
      
      console.log(`Successfully loaded ${drugsData.length} drugs`);
      setDrugs(drugsData);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(drugsData.map(drug => drug.category))).sort();
      setCategories(uniqueCategories);
      
      // Apply search filter if any
      filterDrugs(drugsData, searchTerm);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading formulary data:', err);
      
      // Extract index link if present
      const indexUrl = extractFirestoreIndexLink(err);
      if (indexUrl) {
        setIndexLink(indexUrl);
      }
      
      setError('Failed to load formulary data. You may need to initialize the database first or check the console for detailed error messages.');
      setDrugs([]);
      setLoading(false);
    }
  };

  // Initialize formulary with default data if needed
  const handleInitializeFormulary = async () => {
    try {
      setInitializing(true);
      setError(null);
      console.log("Starting formulary initialization");
      
      await initializeFormulary();
      console.log("Formulary initialization complete, loading drugs");
      
      // Wait a moment to ensure Firestore has processed the writes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load drugs after initialization
      await loadDrugs();
      setInitializing(false);
    } catch (err) {
      console.error('Error initializing formulary:', err);
      setError('Failed to initialize formulary. Please check the console for detailed error messages.');
      setInitializing(false);
      setLoading(false);
    }
  };

  // Filter drugs based on search term
  const filterDrugs = (drugsToFilter: FormularyDrug[], term: string) => {
    if (!term.trim()) {
      setFilteredDrugs(drugsToFilter);
      return;
    }
    
    const lowerTerm = term.toLowerCase();
    const filtered = drugsToFilter.filter(drug => 
      drug.name.toLowerCase().includes(lowerTerm) ||
      drug.category.toLowerCase().includes(lowerTerm) ||
      drug.notes?.toLowerCase().includes(lowerTerm) ||
      drug.majorSideEffects?.toLowerCase().includes(lowerTerm)
    );
    
    setFilteredDrugs(filtered);
  };

  // Effect to load drugs on mount and when category changes
  useEffect(() => {
    loadDrugs();
  }, [selectedCategory]);

  // Effect to filter drugs when search term changes
  useEffect(() => {
    filterDrugs(drugs, searchTerm);
  }, [searchTerm, drugs]);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom>
        Veterinary Formulary
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1">{error}</Typography>
          
          {indexLink && (
            <Box mt={1}>
              <Typography variant="body2">
                Firestore requires an index for this query. You can create it here:
              </Typography>
              <Link href={indexLink} target="_blank" rel="noopener noreferrer">
                {indexLink}
              </Link>
            </Box>
          )}
          
          {error.includes('initialize') && (
            <Button 
              variant="contained" 
              color="primary" 
              size="small" 
              onClick={handleInitializeFormulary}
              disabled={initializing}
              sx={{ mt: 1 }}
            >
              {initializing ? 'Initializing...' : 'Initialize Formulary'}
            </Button>
          )}
        </Alert>
      )}
      
      {!loading && !initializing && drugs.length === 0 && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'warning.light' }}>
          <Typography variant="h6" gutterBottom>No formulary data found</Typography>
          <Typography variant="body1" paragraph>
            The formulary database needs to be initialized with drug data.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            onClick={handleInitializeFormulary}
            disabled={initializing}
            sx={{ mt: 1 }}
          >
            {initializing ? 'Initializing...' : 'Initialize Formulary'}
          </Button>
        </Paper>
      )}
      
      {/* Search and Filter Controls */}
      {(drugs.length > 0 || loading) && (
        <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search drugs by name, category, or properties..."
            sx={{ flexGrow: 2 }}
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="category-select-label">Category</InputLabel>
            <Select
              labelId="category-select-label"
              id="category-select"
              value={selectedCategory}
              label="Category"
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
      
      {/* Loading Indicator */}
      {(loading || initializing) && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 5 
        }}>
          <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />
          <Typography variant="h6">
            {initializing ? 'Initializing Formulary...' : 'Loading Drugs...'}
          </Typography>
        </Box>
      )}
      
      {/* Results Count */}
      {!loading && !initializing && drugs.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing {filteredDrugs.length} {filteredDrugs.length === 1 ? 'drug' : 'drugs'}
          {selectedCategory && ` in ${selectedCategory}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </Typography>
      )}
      
      {/* Drug Grid */}
      {!loading && !initializing && filteredDrugs.length > 0 && (
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 3
        }}>
          {filteredDrugs.map((drug) => (
            <DrugCard key={drug.id} drug={drug} />
          ))}
        </Box>
      )}
      
      {/* No Results */}
      {!loading && !initializing && !error && drugs.length > 0 && filteredDrugs.length === 0 && (
        <Alert severity="info">
          No drugs found matching your criteria.
        </Alert>
      )}
    </Container>
  );
};

export default FormularyPage; 