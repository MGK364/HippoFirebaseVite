import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { FormularyDrug } from '../types';
import { getAllFormularyDrugs, getFormularyDrugsByCategory } from '../services/formulary';

interface FormularySelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (drug: FormularyDrug) => void;
  title?: string;
  filterCategories?: string[];
}

const FormularySelector: React.FC<FormularySelectorProps> = ({
  open,
  onClose,
  onSelect,
  title = 'Select Drug',
  filterCategories
}) => {
  const [drugs, setDrugs] = useState<FormularyDrug[]>([]);
  const [filteredDrugs, setFilteredDrugs] = useState<FormularyDrug[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch and load drugs
  const loadDrugs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let drugsData: FormularyDrug[];
      
      if (selectedCategory) {
        drugsData = await getFormularyDrugsByCategory(selectedCategory);
      } else {
        drugsData = await getAllFormularyDrugs();
      }
      
      // Apply category filter if provided
      if (filterCategories && filterCategories.length > 0) {
        drugsData = drugsData.filter(drug => filterCategories.includes(drug.category));
      }
      
      setDrugs(drugsData);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(drugsData.map(drug => drug.category)));
      setCategories(uniqueCategories);
      
      // Apply search filter if any
      filterDrugs(drugsData, searchTerm);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading formulary data:', err);
      setError('Failed to load formulary data. Please try again.');
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

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value);
  };

  const handleDrugSelect = (drug: FormularyDrug) => {
    onSelect(drug);
    onClose();
  };

  // Effect to load drugs on mount and when category changes
  useEffect(() => {
    if (open) {
      loadDrugs();
    }
  }, [open, selectedCategory, filterCategories]);

  // Effect to filter drugs when search term changes
  useEffect(() => {
    filterDrugs(drugs, searchTerm);
  }, [searchTerm, drugs]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {title}
          <IconButton edge="end" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search drugs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth size="small">
            <InputLabel id="category-select-label">Category</InputLabel>
            <Select
              labelId="category-select-label"
              id="category-select"
              value={selectedCategory}
              label="Category"
              onChange={handleCategoryChange}
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
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, color: 'error.main' }}>
            <Typography>{error}</Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {filteredDrugs.length} drugs found
            </Typography>
            
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {filteredDrugs.map((drug, index) => (
                <React.Fragment key={drug.id}>
                  <ListItem alignItems="flex-start" sx={{ p: 0 }}>
                    <ListItemButton onClick={() => handleDrugSelect(drug)}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center">
                            <Typography variant="subtitle1" component="span">
                              {drug.name}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {drug.category}
                            </Typography>
                            <Typography component="div" variant="body2">
                              Dosage: {drug.dosage}
                            </Typography>
                            <Typography component="div" variant="body2">
                              Route: {drug.routes.join(', ')}
                            </Typography>
                          </>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < filteredDrugs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              
              {filteredDrugs.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="No drugs found" 
                    secondary="Try adjusting your search or category filter"
                  />
                </ListItem>
              )}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormularySelector; 