
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
      case 'low':
        return 'Minor issue requiring routine maintenance. Does not affect daily operations.';
      case 'medium':
        return 'Standard infrastructure issue requiring scheduled attention within weeks.';
      case 'high':
        return 'Significant concern affecting community services. Requires prompt attention.';
      case 'urgent':
        return 'Critical infrastructure issue requiring immediate government attention.';
      default:
        return 'Select a priority level to see impact assessment.';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Priority & Impact Level <span className="text-destructive">*</span></label>
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
              <p className="text-sm text-muted-foreground mt-2">
                {getImpactDescription(priority.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PriorityImpactSection;
