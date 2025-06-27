
import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PRIORITIES } from '@/constants/problemReporting';
import { ReportData } from '@/types/problemReporting';

interface PriorityImpactSectionProps {
  reportData: ReportData;
  onInputChange: (field: keyof ReportData, value: string) => void;
}

const PriorityImpactSection = ({ reportData, onInputChange }: PriorityImpactSectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
        <div className="space-y-2">
          {PRIORITIES.map(priority => (
            <div
              key={priority.value}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                reportData.priority === priority.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onInputChange('priority', priority.value)}
            >
              <Badge className={priority.color}>
                {priority.label}
              </Badge>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost (KES)</label>
          <Input
            placeholder="e.g., 500000"
            type="number"
            value={reportData.estimatedCost}
            onChange={(e) => onInputChange('estimatedCost', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Affected Population</label>
          <Input
            placeholder="e.g., 1000 residents"
            value={reportData.affectedPopulation}
            onChange={(e) => onInputChange('affectedPopulation', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default PriorityImpactSection;
