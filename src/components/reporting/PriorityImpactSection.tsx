
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
  const getImpactDescription = (priority: string) => {
    switch (priority) {
      case 'routine':
        return 'Regular maintenance required. Affects daily operations but not critical.';
      case 'standard':
        return 'Standard infrastructure issue requiring scheduled attention.';
      case 'elevated':
        return 'Elevated concern that may affect community services if not addressed.';
      case 'critical':
        return 'Critical infrastructure issue requiring immediate government attention.';
      default:
        return 'Select a priority level to see impact assessment.';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Priority & Impact Level</label>
        <div className="space-y-3">
          {PRIORITIES.map(priority => (
            <div
              key={priority.value}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                reportData.priority === priority.value
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onInputChange('priority', priority.value)}
            >
              <div className="flex items-center justify-between">
                <Badge className={priority.color}>
                  {priority.label}
                </Badge>
                {reportData.priority === priority.value && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                )}
              </div>
              {reportData.priority === priority.value && (
                <p className="text-sm text-gray-600 mt-2">
                  {getImpactDescription(priority.value)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PriorityImpactSection;
