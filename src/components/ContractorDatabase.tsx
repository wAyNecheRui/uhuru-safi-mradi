import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SearchFilters from '@/components/contractor-database/SearchFilters';
import ContractorCard from '@/components/contractor-database/ContractorCard';
import EmptyState from '@/components/contractor-database/EmptyState';
import { CATEGORIES, LOCATIONS } from '@/constants/contractorDatabase';

const ContractorDatabase = () => {
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchTerm: '',
    selectedCategory: 'all',
    selectedLocation: 'all'
  });

  // Fetch contractors using contractor_profiles for accurate data
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        setLoading(true);
        
        // Fetch verified contractor profiles
        const { data: contractorData, error: contractorError } = await supabase
          .from('contractor_profiles')
          .select('*')
          .eq('verified', true);
        
        if (contractorError) {
          console.error('Error fetching contractors:', contractorError);
          toast.error('Failed to load contractors');
          return;
        }

        // Fetch real project counts per contractor
        const { data: projectsData } = await supabase
          .from('projects')
          .select('contractor_id, status, budget')
          .not('contractor_id', 'is', null)
          .is('deleted_at', null);

        // Fetch ratings
        const { data: ratingsData } = await supabase
          .from('contractor_ratings')
          .select('contractor_id, rating');

        // Build stats maps
        const projectStats: Record<string, { count: number; completed: number; totalValue: number }> = {};
        (projectsData || []).forEach(p => {
          if (!projectStats[p.contractor_id]) {
            projectStats[p.contractor_id] = { count: 0, completed: 0, totalValue: 0 };
          }
          projectStats[p.contractor_id].count += 1;
          projectStats[p.contractor_id].totalValue += Number(p.budget) || 0;
          if (p.status === 'completed') {
            projectStats[p.contractor_id].completed += 1;
          }
        });

        const ratingStats: Record<string, { total: number; count: number }> = {};
        (ratingsData || []).forEach(r => {
          if (!ratingStats[r.contractor_id]) {
            ratingStats[r.contractor_id] = { total: 0, count: 0 };
          }
          ratingStats[r.contractor_id].total += r.rating || 0;
          ratingStats[r.contractor_id].count += 1;
        });

        // Transform data with real stats
        const transformedData = (contractorData || []).map((profile: any) => {
          const projectStat = projectStats[profile.user_id] || { count: 0, completed: 0, totalValue: 0 };
          const ratingStat = ratingStats[profile.user_id] || { total: 0, count: 0 };
          const avgRating = ratingStat.count > 0 ? ratingStat.total / ratingStat.count : 0;

          return {
            id: profile.id,
            name: profile.company_name || 'Contractor',
            category: profile.specialization?.[0] || 'General Construction',
            location: profile.registered_counties?.[0] || 'Kenya',
            rating: avgRating,
            reviewCount: ratingStat.count,
            specializations: profile.specialization || [],
            experience: profile.years_in_business ? `${profile.years_in_business} years` : 'New',
            isVerified: profile.verified,
            projectCount: projectStat.count,
            completedProjects: projectStat.completed,
            totalContractValue: projectStat.totalValue,
            eaccStatus: 'pending' as const,
            kraStatus: profile.kra_pin ? 'valid' as const : 'pending' as const,
            ncaStatus: 'pending' as const,
            isAgpo: profile.is_agpo,
            agpoCategory: profile.agpo_category
          };
        });

        setContractors(transformedData);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load contractors');
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
  }, []);

  // Filter contractors based on search and filters
  const filteredContractors = contractors.filter(contractor => {
    const matchesSearch = contractor.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         contractor.specializations.some((spec: string) => spec.toLowerCase().includes(filters.searchTerm.toLowerCase()));
    const matchesCategory = filters.selectedCategory === 'all' || contractor.category === filters.selectedCategory;
    const matchesLocation = filters.selectedLocation === 'all' || contractor.location === filters.selectedLocation;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const updateFilters = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Verified Contractor Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Loading contractors...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Verified Contractor Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Browse verified contractors with government authentication. All contractors listed have been verified for credentials and compliance.
            <span className="block mt-2 text-sm text-muted-foreground">
              Note: Only non-sensitive profile information is displayed for privacy protection.
            </span>
          </p>
        </CardContent>
      </Card>

      <SearchFilters 
        filters={filters}
        onFiltersChange={updateFilters}
        categories={CATEGORIES}
        locations={LOCATIONS}
      />

      {filteredContractors.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {filteredContractors.map((contractor) => (
            <ContractorCard key={contractor.id} contractor={contractor} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractorDatabase;