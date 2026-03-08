import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ReportData } from '@/types/problemReporting';
import { getTemplateByCategory, DESCRIPTION_TEMPLATES, getCategoryGuidance } from '@/constants/descriptionTemplates';
import { AlertCircle, HelpCircle, FileText, Eye } from 'lucide-react';

interface DescriptionTemplateSectionProps {
  reportData: ReportData;
  onInputChange: (field: keyof ReportData, value: string) => void;
}

const DescriptionTemplateSection = ({ reportData, onInputChange }: DescriptionTemplateSectionProps) => {
  const template = getTemplateByCategory(reportData.category) || DESCRIPTION_TEMPLATES.find(t => t.category === 'other');
  const guidance = getCategoryGuidance(reportData.category);
  const [showExample, setShowExample] = React.useState(false);

  const applyTemplate = () => {
    if (template) {
      onInputChange('description', template.template);
    }
  };

  const getPlaceholder = () => {
    if (!template) return "Describe the problem in detail...";
    return template.template;
  };

  return (
    <div className="space-y-3">
      {/* Label with helper text */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label 
            htmlFor="problem-description" 
            className="text-sm font-medium text-foreground flex items-center gap-1.5"
          >
            Problem Description
            <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            {guidance.instruction}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={applyTemplate}
            className="flex items-center gap-1.5 text-xs"
          >
            <FileText className="h-3.5 w-3.5" />
            Use Template
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowExample(!showExample)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Eye className="h-3.5 w-3.5" />
            {showExample ? 'Hide' : 'Show'} Example
          </Button>
        </div>
      </div>

      {/* Guidance tips based on category */}
      {reportData.category && (
        <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">{guidance.title}</p>
            <p>{guidance.tips}</p>
          </div>
        </div>
      )}

      {/* Example section */}
      {showExample && template && (
        <div className="p-3 bg-muted/50 border border-border rounded-lg">
          <p className="text-xs font-medium text-muted-foreground mb-2">Example filled template:</p>
          <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-mono leading-relaxed">
            {template.example}
          </pre>
        </div>
      )}

      {/* Main textarea with dynamic placeholder */}
      <Textarea
        id="problem-description"
        placeholder={getPlaceholder()}
        rows={8}
        value={reportData.description}
        onChange={(e) => onInputChange('description', e.target.value)}
        className="min-h-[180px] resize-y placeholder:text-muted-foreground/60 placeholder:leading-relaxed"
        aria-describedby="description-help"
      />

      {/* Character/word count and validation */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div id="description-help" className="flex items-center gap-1">
          {reportData.description.length < 50 && reportData.description.length > 0 && (
            <>
              <AlertCircle className="h-3 w-3 text-warning" />
              <span className="text-warning">Minimum 50 characters recommended for clarity</span>
            </>
          )}
          {reportData.description.length >= 50 && (
            <span className="text-primary">✓ Good description length</span>
          )}
        </div>
        <div>
          {reportData.description.length} characters •
          {' '}{reportData.description.split(/\s+/).filter(word => word.length > 0).length} words
        </div>
      </div>
    </div>
  );
};

export default DescriptionTemplateSection;
