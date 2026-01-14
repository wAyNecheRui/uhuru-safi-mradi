import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Building2, 
  Users, 
  DollarSign,
  TrendingUp,
  CheckCircle,
  Briefcase,
  BarChart3
} from 'lucide-react';
import { AccountabilityTransparencyCycle, RegionalDevelopmentStats as RegionalStats } from '@/services/FullCycleService';

const KENYAN_COUNTIES = [
  'All Counties', 'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii',
  'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
  'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi',
  'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

const RegionalDevelopmentStatsComponent = () => {
  const [stats, setStats] = useState<RegionalStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCounty, setSelectedCounty] = useState('All Counties');

  useEffect(() => {
    fetchStats();
  }, [selectedCounty]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const county = selectedCounty === 'All Counties' ? undefined : selectedCounty;
      const data = await AccountabilityTransparencyCycle.getRegionalDevelopmentStats(county);
      setStats(data);
    } catch (error) {
      console.error('Error fetching regional stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `KES ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `KES ${(amount / 1000).toFixed(1)}K`;
    return `KES ${amount.toLocaleString()}`;
  };

  const getTotalStats = () => {
    return {
      totalProjects: stats.reduce((acc, s) => acc + s.totalProjects, 0),
      completedProjects: stats.reduce((acc, s) => acc + s.completedProjects, 0),
      totalBudget: stats.reduce((acc, s) => acc + s.totalBudget, 0),
      fundsReleased: stats.reduce((acc, s) => acc + s.fundsReleased, 0),
      localWorkersEmployed: stats.reduce((acc, s) => acc + s.localWorkersEmployed, 0),
      citizensImpacted: stats.reduce((acc, s) => acc + s.citizensImpacted, 0)
    };
  };

  const totals = getTotalStats();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading regional development statistics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center text-2xl">
                <BarChart3 className="h-6 w-6 mr-3 text-primary" />
                Regional Development Statistics
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Community impact measurements and regional development outcomes
              </p>
            </div>
            <Select value={selectedCounty} onValueChange={setSelectedCounty}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select County" />
              </SelectTrigger>
              <SelectContent>
                {KENYAN_COUNTIES.map(county => (
                  <SelectItem key={county} value={county}>{county}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{totals.totalProjects}</p>
            <p className="text-xs text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{totals.completedProjects}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(totals.totalBudget)}</p>
            <p className="text-xs text-muted-foreground">Total Budget</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(totals.fundsReleased)}</p>
            <p className="text-xs text-muted-foreground">Funds Released</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Briefcase className="h-6 w-6 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{totals.localWorkersEmployed}</p>
            <p className="text-xs text-muted-foreground">Workers Employed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{totals.citizensImpacted.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Citizens Impacted</p>
          </CardContent>
        </Card>
      </div>

      {/* Regional Breakdown */}
      <div className="grid gap-4">
        {stats.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No regional data available for the selected filter.
            </CardContent>
          </Card>
        ) : (
          stats.map((region) => (
            <Card key={region.county} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-semibold">{region.county}</h3>
                      <Badge variant="outline">
                        {region.completedProjects}/{region.totalProjects} completed
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Budget Allocated</p>
                        <p className="font-semibold">{formatCurrency(region.totalBudget)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Funds Released</p>
                        <p className="font-semibold text-green-600">{formatCurrency(region.fundsReleased)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Local Workers</p>
                        <p className="font-semibold">{region.localWorkersEmployed}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Citizens Impacted</p>
                        <p className="font-semibold">{region.citizensImpacted.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Completion Rate</span>
                        <span>
                          {region.totalProjects > 0 
                            ? Math.round((region.completedProjects / region.totalProjects) * 100)
                            : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={region.totalProjects > 0 
                          ? (region.completedProjects / region.totalProjects) * 100 
                          : 0} 
                        className="h-2"
                      />
                    </div>
                  </div>

                  <div className="lg:w-48 flex flex-col justify-center items-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Fund Utilization</p>
                    <p className="text-3xl font-bold text-primary">
                      {region.totalBudget > 0 
                        ? Math.round((region.fundsReleased / region.totalBudget) * 100)
                        : 0}%
                    </p>
                    <Progress 
                      value={region.totalBudget > 0 
                        ? (region.fundsReleased / region.totalBudget) * 100 
                        : 0} 
                      className="h-2 w-full mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RegionalDevelopmentStatsComponent;
