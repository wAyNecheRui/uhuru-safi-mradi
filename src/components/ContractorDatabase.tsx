
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
import { useContractorDatabase } from '@/hooks/useContractorDatabase';
import { CATEGORIES, LOCATIONS, SAMPLE_CONTRACTORS } from '@/constants/contractorDatabase';
import SearchFilters from '@/components/contractor-database/SearchFilters';
import ContractorCard from '@/components/contractor-database/ContractorCard';
import EmptyState from '@/components/contractor-database/EmptyState';

const ContractorDatabase = () => {
  const { filters, filteredContractors, updateFilters } = useContractorDatabase(SAMPLE_CONTRACTORS);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
          <CardTitle className="flex items-center text-2xl">
            <Building className="h-6 w-6 mr-3 text-blue-600" />
            Contractor Database & Verification System
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Search, verify, and connect with qualified contractors for your infrastructure projects.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <SearchFilters
            filters={filters}
            categories={CATEGORIES}
            locations={LOCATIONS}
            onFiltersChange={updateFilters}
          />

          {/* Results Summary */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredContractors.length} contractor{filteredContractors.length !== 1 ? 's' : ''}
              {filters.searchTerm && ` matching "${filters.searchTerm}"`}
            </p>
          </div>

          {/* Contractor Cards */}
          <div className="space-y-6">
            {filteredContractors.map((contractor) => (
              <ContractorCard key={contractor.id} contractor={contractor} />
            ))}
          </div>

          {filteredContractors.length === 0 && <EmptyState />}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractorDatabase;
