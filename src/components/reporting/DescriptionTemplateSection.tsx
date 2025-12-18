import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, FileText, Copy } from 'lucide-react';
import { ReportData } from '@/types/problemReporting';
import { getTemplateByCategory, DESCRIPTION_TEMPLATES } from '@/constants/descriptionTemplates';
import { toast } from 'sonner';

interface DescriptionTemplateSectionProps {
  reportData: ReportData;
  onInputChange: (field: keyof ReportData, value: string) => void;
}

const DescriptionTemplateSection = ({ reportData, onInputChange }: DescriptionTemplateSectionProps) => {
  const [showTemplate, setShowTemplate] = useState(false);
  
  // Always show a template - use category-specific or fall back to 'other'
  const template = getTemplateByCategory(reportData.category) || DESCRIPTION_TEMPLATES.find(t => t.category === 'other');
  
  const useTemplate = () => {
    if (template) {
      onInputChange('description', template.template);
      setShowTemplate(false);
      toast.success('Template applied! Fill in the details.');
    }
  };

  const copyExample = () => {
    if (template) {
      navigator.clipboard.writeText(template.example);
      toast.success('Example copied to clipboard');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Problem Description *
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTemplate(!showTemplate)}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <Lightbulb className="h-4 w-4 mr-1" />
            {showTemplate ? 'Hide' : 'Show'} Template
          </Button>
        </div>
      </div>

      {showTemplate && template && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-blue-100 text-blue-800">
                <FileText className="h-3 w-3 mr-1" />
                {template.title}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Template (replace [bracketed text] with your details):</h4>
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-line text-gray-700">
                  {template.template}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useTemplate}
                  className="mt-2 text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  Use This Template
                </Button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-blue-900">Completed Example:</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyExample}
                    className="text-blue-600 hover:bg-blue-100"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="bg-white p-3 rounded border text-sm whitespace-pre-line text-gray-700">
                  {template.example}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Textarea
        placeholder={template ? template.placeholder : "Provide detailed description of the problem, its impact, and any relevant background information..."}
        rows={showTemplate ? 6 : 8}
        value={reportData.description}
        onChange={(e) => onInputChange('description', e.target.value)}
        className="min-h-[120px]"
      />
      
      {reportData.description.length > 0 && (
        <div className="text-xs text-gray-500">
          {reportData.description.length} characters • 
          {reportData.description.split(/\s+/).filter(word => word.length > 0).length} words
        </div>
      )}
    </div>
  );
};

export default DescriptionTemplateSection;