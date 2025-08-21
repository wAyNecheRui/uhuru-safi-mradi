import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { ReportData } from '@/types/problemReporting';

interface ImpactAssessmentSectionProps {
  reportData: ReportData;
  onInputChange: (field: keyof ReportData, value: string) => void;
}

const ImpactAssessmentSection = ({ reportData, onInputChange }: ImpactAssessmentSectionProps) => {
  const getEstimatedCostRange = (cost: string) => {
    const numCost = parseFloat(cost);
    if (isNaN(numCost)) return null;
    
    if (numCost < 100000) return { label: 'Low Cost', color: 'bg-green-100 text-green-800', icon: DollarSign };
    if (numCost < 500000) return { label: 'Medium Cost', color: 'bg-yellow-100 text-yellow-800', icon: DollarSign };
    if (numCost < 2000000) return { label: 'High Cost', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle };
    return { label: 'Very High Cost', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
  };

  const getPopulationImpact = (population: string) => {
    const numPop = parseInt(population);
    if (isNaN(numPop)) return null;
    
    if (numPop < 100) return { label: 'Small Impact', color: 'bg-blue-100 text-blue-800', icon: Users };
    if (numPop < 1000) return { label: 'Medium Impact', color: 'bg-purple-100 text-purple-800', icon: Users };
    if (numPop < 10000) return { label: 'Large Impact', color: 'bg-orange-100 text-orange-800', icon: Users };
    return { label: 'Very Large Impact', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
  };

  const costRange = getEstimatedCostRange(reportData.estimatedCost);
  const populationImpact = getPopulationImpact(reportData.affectedPopulation);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Cost (KES)
          </label>
          <div className="space-y-2">
            <Input
              placeholder="e.g., 500000"
              type="number"
              value={reportData.estimatedCost}
              onChange={(e) => onInputChange('estimatedCost', e.target.value)}
            />
            {costRange && (
              <Badge className={costRange.color}>
                <costRange.icon className="h-3 w-3 mr-1" />
                {costRange.label}
              </Badge>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Affected Population
          </label>
          <div className="space-y-2">
            <Input
              placeholder="e.g., 1000"
              type="number"
              value={reportData.affectedPopulation}
              onChange={(e) => onInputChange('affectedPopulation', e.target.value)}
            />
            {populationImpact && (
              <Badge className={populationImpact.color}>
                <populationImpact.icon className="h-3 w-3 mr-1" />
                {populationImpact.label}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {(costRange || populationImpact) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mr-2" />
              <h4 className="text-sm font-semibold text-blue-900">Impact Assessment</h4>
            </div>
            <div className="space-y-2 text-sm text-blue-800">
              {costRange && (
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-2" />
                  <span>Project classified as: {costRange.label}</span>
                </div>
              )}
              {populationImpact && (
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-2" />
                  <span>Community impact level: {populationImpact.label}</span>
                </div>
              )}
              <p className="mt-2 text-xs">
                This assessment helps prioritize resource allocation and community response urgency.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImpactAssessmentSection;