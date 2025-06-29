
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Settings, Eye, Type, Zap } from 'lucide-react';
import { useAccessibility } from '@/hooks/useAccessibility';

export const AccessibilityPanel = () => {
  const { accessibility, toggleHighContrast, setFontSize, toggleReduceMotion } = useAccessibility();

  return (
    <Card className="p-6 w-full max-w-md">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Accessibility Settings</h2>
      </div>
      
      <div className="space-y-4">
        {/* High Contrast */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">High Contrast</span>
          </div>
          <Switch
            checked={accessibility.highContrast}
            onCheckedChange={toggleHighContrast}
            aria-label="Toggle high contrast mode"
          />
        </div>

        <Separator />

        {/* Font Size */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Type className="h-4 w-4" />
            <span className="text-sm font-medium">Font Size</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
              <Button
                key={size}
                variant={accessibility.fontSize === size ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFontSize(size)}
                aria-pressed={accessibility.fontSize === size}
              >
                {size.charAt(0).toUpperCase() + size.slice(1).replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Reduce Motion */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Reduce Motion</span>
          </div>
          <Switch
            checked={accessibility.reduceMotion}
            onCheckedChange={toggleReduceMotion}
            aria-label="Toggle reduced motion"
          />
        </div>
      </div>
    </Card>
  );
};
