
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ContractorFilters } from '@/types/contractorDatabase';

interface SearchFiltersProps {
  filters: ContractorFilters;
  categories: string[];
  locations: string[];
  onFiltersChange: (filters: Partial<ContractorFilters>) => void;
}

const SearchFilters = ({ filters, categories, locations, onFiltersChange }: SearchFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search contractors or specializations..."
          value={filters.searchTerm}
          onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
          className="pl-10"
        />
      </div>
      <div>
        <select
          className="w-full p-2 border border-gray-300 rounded-md"
          value={filters.selectedCategory}
          onChange={(e) => onFiltersChange({ selectedCategory: e.target.value })}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          className="w-full p-2 border border-gray-300 rounded-md"
          value={filters.selectedLocation}
          onChange={(e) => onFiltersChange({ selectedLocation: e.target.value })}
        >
          {locations.map(loc => (
            <option key={loc} value={loc}>
              {loc === 'all' ? 'All Locations' : loc}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SearchFilters;
