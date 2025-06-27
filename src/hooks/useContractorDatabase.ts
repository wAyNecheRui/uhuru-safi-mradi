
import { useState, useMemo } from 'react';
import { Contractor, ContractorFilters } from '@/types/contractorDatabase';

export const useContractorDatabase = (contractors: Contractor[]) => {
  const [filters, setFilters] = useState<ContractorFilters>({
    searchTerm: '',
    selectedCategory: 'all',
    selectedLocation: 'all'
  });

  const filteredContractors = useMemo(() => {
    return contractors.filter(contractor => {
      const matchesSearch = contractor.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           contractor.specializations.some(spec => spec.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      const matchesCategory = filters.selectedCategory === 'all' || contractor.category === filters.selectedCategory;
      const matchesLocation = filters.selectedLocation === 'all' || contractor.location === filters.selectedLocation;
      
      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [contractors, filters]);

  const updateFilters = (newFilters: Partial<ContractorFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    filters,
    filteredContractors,
    updateFilters
  };
};
