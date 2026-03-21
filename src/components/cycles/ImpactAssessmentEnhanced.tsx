import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  GraduationCap, 
  Wallet, 
  ShieldAlert, 
  Leaf,
  Users,
  AlertTriangle,
  Clock
} from 'lucide-react';

export interface ImpactAssessmentData {
  healthcare_access: boolean;
  education_access: boolean;
  economic_impact: boolean;
  safety_concern: boolean;
  environmental_impact: boolean;
  daily_activities_affected: string;
  urgency_level: 'immediate' | 'short_term' | 'long_term';
  estimated_affected_households: number;
}

interface ImpactAssessmentEnhancedProps {
  data: ImpactAssessmentData;
  onChange: (data: ImpactAssessmentData) => void;
}

const ImpactAssessmentEnhanced = ({ data, onChange }: ImpactAssessmentEnhancedProps) => {
  const handleCheckChange = (field: keyof ImpactAssessmentData, checked: boolean) => {
    onChange({ ...data, [field]: checked });
  };

  const handleInputChange = (field: keyof ImpactAssessmentData, value: string | number) => {
    onChange({ ...data, [field]: value });
  };

  const getImpactScore = () => {
    let score = 0;
    if (data.healthcare_access) score += 25;
    if (data.education_access) score += 20;
    if (data.economic_impact) score += 20;
    if (data.safety_concern) score += 25;
    if (data.environmental_impact) score += 10;
    
    if (data.urgency_level === 'immediate') score += 30;
    else if (data.urgency_level === 'short_term') score += 15;
    
    if (data.estimated_affected_households > 100) score += 20;
    else if (data.estimated_affected_households > 50) score += 10;
    
    return Math.min(score, 100);
  };

  const impactScore = getImpactScore();
  const impactLevel = impactScore >= 70 ? 'High' : impactScore >= 40 ? 'Medium' : 'Low';
  const impactColor = impactScore >= 70 ? 'bg-red-100 text-red-800' : impactScore >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';

  const impactItems = [
    { key: 'healthcare_access', label: 'Healthcare Access Impact', icon: Heart, description: 'This issue affects access to hospitals, clinics, or emergency services' },
    { key: 'education_access', label: 'Education Access Impact', icon: GraduationCap, description: 'This issue affects access to schools, colleges, or learning facilities' },
    { key: 'economic_impact', label: 'Economic Impact', icon: Wallet, description: 'This issue affects businesses, employment, or economic activities' },
    { key: 'safety_concern', label: 'Safety Concern', icon: ShieldAlert, description: 'This issue poses safety risks to residents or commuters' },
    { key: 'environmental_impact', label: 'Environmental Impact', icon: Leaf, description: 'This issue has environmental consequences (pollution, flooding, etc.)' }
  ];

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-blue-600" />
            Community Impact Assessment
          </div>
          <Badge className={impactColor}>
            {impactLevel} Impact ({impactScore}/100)
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Help us understand how this problem affects your daily life and community
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Impact Checkboxes */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">How does this issue affect the community?</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {impactItems.map((item) => (
              <div key={item.key} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Checkbox
                  id={item.key}
                  checked={data[item.key as keyof ImpactAssessmentData] as boolean}
                  onCheckedChange={(checked) => handleCheckChange(item.key as keyof ImpactAssessmentData, checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor={item.key} className="flex items-center cursor-pointer">
                    <item.icon className="h-4 w-4 mr-2 text-primary" />
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Activities Description */}
        <div className="space-y-2">
          <Label htmlFor="daily_activities" className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-primary" />
            How does this affect daily activities?
          </Label>
          <Textarea
            id="daily_activities"
            placeholder="Describe how this issue affects your daily life, commute, work, or community activities..."
            value={data.daily_activities_affected}
            onChange={(e) => handleInputChange('daily_activities_affected', e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        {/* Urgency Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="urgency" className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-primary" />
              Urgency Level
            </Label>
            <Select
              value={data.urgency_level}
              onValueChange={(value) => handleInputChange('urgency_level', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                    Immediate - Needs urgent attention
                  </span>
                </SelectItem>
                <SelectItem value="short_term">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                    Short Term - Within 1-3 months
                  </span>
                </SelectItem>
                <SelectItem value="long_term">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    Long Term - Can wait 3+ months
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Affected Households */}
          <div className="space-y-2">
            <Label htmlFor="households" className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-primary" />
              Estimated Affected Households
            </Label>
            <Input
              id="households"
              type="number"
              placeholder="e.g., 50"
              value={data.estimated_affected_households || ''}
              onChange={(e) => handleInputChange('estimated_affected_households', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Impact Summary */}
        {impactScore > 0 && (
          <div className={`p-4 rounded-lg ${impactScore >= 70 ? 'bg-red-50 border border-red-200' : impactScore >= 40 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
            <h4 className="font-medium mb-2">Impact Summary</h4>
            <div className="flex flex-wrap gap-2">
              {data.healthcare_access && <Badge variant="outline">Healthcare</Badge>}
              {data.education_access && <Badge variant="outline">Education</Badge>}
              {data.economic_impact && <Badge variant="outline">Economic</Badge>}
              {data.safety_concern && <Badge variant="outline">Safety</Badge>}
              {data.environmental_impact && <Badge variant="outline">Environment</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              This assessment helps prioritize resource allocation. Higher impact problems receive faster attention.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImpactAssessmentEnhanced;
