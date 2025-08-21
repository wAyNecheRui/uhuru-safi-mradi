
import React from 'react';
import { Input } from '@/components/ui/input';
import { CATEGORIES } from '@/constants/problemReporting';
import { ReportData } from '@/types/problemReporting';
import DescriptionTemplateSection from './DescriptionTemplateSection';

interface BasicInfoSectionProps {
  reportData: ReportData;
  onInputChange: (field: keyof ReportData, value: string) => void;
}

const BasicInfoSection = ({ reportData, onInputChange }: BasicInfoSectionProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Problem Title *</label>
          <Input
            placeholder="Brief description of the problem"
            value={reportData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={reportData.category}
            onChange={(e) => onInputChange('category', e.target.value)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DescriptionTemplateSection
        reportData={reportData}
        onInputChange={onInputChange}
      />
    </>
  );
};

export default BasicInfoSection;
