import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Wallet, Users, Loader2, Save, Award, Building, Briefcase, Heart, Edit, CheckCircle, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AGPOCategory = 'women' | 'youth' | 'pwd' | null;

const ContractorLocationSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasExistingSettings, setHasExistingSettings] = useState(false);
  const [settings, setSettings] = useState({
    max_project_capacity: 5000000,
    is_agpo: false,
    agpo_category: null as AGPOCategory,
    specialization: [] as string[],
    years_in_business: 0,
    number_of_employees: 0,
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('contractor_profiles')
        .select('max_project_capacity, is_agpo, agpo_category, specialization, years_in_business, number_of_employees')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          max_project_capacity: data.max_project_capacity || 5000000,
          is_agpo: data.is_agpo || false,
          agpo_category: (data.agpo_category as AGPOCategory) || null,
          specialization: data.specialization || [],
          years_in_business: data.years_in_business || 0,
          number_of_employees: data.number_of_employees || 0,
        });
        const hasSavedData = data.is_agpo ||
          (data.specialization && data.specialization.length > 0) ||
          data.years_in_business > 0 ||
          data.number_of_employees > 0;
        setHasExistingSettings(hasSavedData);
        setIsEditMode(!hasSavedData);
      } else {
        setIsEditMode(true);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (settings.is_agpo && !settings.agpo_category) {
      toast.error('Please select an AGPO category');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('contractor_profiles')
        .update({
          max_project_capacity: settings.max_project_capacity,
          is_agpo: settings.is_agpo,
          agpo_category: settings.is_agpo ? settings.agpo_category : null,
          specialization: settings.specialization,
          years_in_business: settings.years_in_business,
          number_of_employees: settings.number_of_employees,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Settings saved successfully - Your profile will be visible to government officials during bid evaluation');
      setHasExistingSettings(true);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getCapacityLabel = (capacity: number): string => {
    if (capacity <= 5000000) return 'Small (≤ KES 5M)';
    if (capacity <= 50000000) return 'Medium (KES 5M-50M)';
    if (capacity <= 500000000) return 'Large (KES 50M-500M)';
    return 'Enterprise (≥ KES 500M)';
  };

  const SPECIALIZATIONS = [
    'Road Construction',
    'Building Construction',
    'Water & Sanitation',
    'Electrical Works',
    'Plumbing',
    'Drainage Systems',
    'Bridge Construction',
    'Landscaping',
    'General Contracting',
    'Renovation & Repairs',
  ];

  const toggleSpecialization = (spec: string) => {
    setSettings(prev => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter(s => s !== spec)
        : [...prev.specialization, spec],
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-xl">
              <Building className="h-5 w-5 mr-2 text-primary" />
              Capacity & Specialization Settings
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your company capacity and areas of expertise for government bid evaluation.
            </p>
          </div>
          {hasExistingSettings && !isEditMode && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Settings Saved
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nationwide bidding notice */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <Globe className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">You can bid on projects nationwide</p>
            <p className="text-xs text-muted-foreground mt-1">
              Contractors are eligible to bid on any open project across all 47 counties. Your HQ county is informational only.
            </p>
          </div>
        </div>

        {/* Company Info Section */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Building className="h-5 w-5 text-primary" />
            <Label className="font-semibold text-lg">Company Information</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Years in Business</Label>
              {isEditMode ? (
                <Input
                  type="number"
                  min="0"
                  value={settings.years_in_business}
                  onChange={(e) =>
                    setSettings(prev => ({
                      ...prev,
                      years_in_business: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="e.g., 5"
                />
              ) : (
                <p className="text-lg font-medium">{settings.years_in_business} years</p>
              )}
              <p className="text-xs text-muted-foreground">
                More experience = higher score in bid evaluation (+10% max)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Number of Employees</Label>
              {isEditMode ? (
                <Input
                  type="number"
                  min="0"
                  value={settings.number_of_employees}
                  onChange={(e) =>
                    setSettings(prev => ({
                      ...prev,
                      number_of_employees: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="e.g., 25"
                />
              ) : (
                <p className="text-lg font-medium">{settings.number_of_employees} employees</p>
              )}
              <p className="text-xs text-muted-foreground">
                Indicates capacity to handle larger projects
              </p>
            </div>
          </div>
        </div>

        {/* Specialization Section */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <Label className="font-semibold text-lg">Areas of Specialization</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            {isEditMode ? 'Select all categories of work you can perform. This helps match you with relevant projects.' : 'Your selected categories of work:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {settings.specialization.map(spec => (
              <Badge key={spec} className="bg-primary/10 text-primary">
                {spec}
                {isEditMode && (
                  <button
                    onClick={() => toggleSpecialization(spec)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                )}
              </Badge>
            ))}
            {settings.specialization.length === 0 && (
              <span className="text-sm text-muted-foreground italic">No specializations selected</span>
            )}
          </div>
          {isEditMode && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-background">
              {SPECIALIZATIONS.map(spec => (
                <div key={spec} className="flex items-center space-x-2">
                  <Checkbox
                    id={`spec-${spec}`}
                    checked={settings.specialization.includes(spec)}
                    onCheckedChange={() => toggleSpecialization(spec)}
                  />
                  <label
                    htmlFor={`spec-${spec}`}
                    className="text-sm cursor-pointer"
                  >
                    {spec}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AGPO Status */}
        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-primary" />
              <div>
                <Label className="font-semibold text-lg">AGPO Contractor</Label>
                <p className="text-xs text-muted-foreground">
                  Access to Government Procurement Opportunities (+5 bonus points in bid evaluation)
                </p>
              </div>
            </div>
            {isEditMode ? (
              <Switch
                checked={settings.is_agpo}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    is_agpo: checked,
                    agpo_category: checked ? prev.agpo_category : null
                  }))
                }
              />
            ) : (
              <Badge variant={settings.is_agpo ? 'default' : 'secondary'}>
                {settings.is_agpo ? 'Yes' : 'No'}
              </Badge>
            )}
          </div>

          {settings.is_agpo && (
            <div className="space-y-3 mt-4 p-3 bg-background rounded-lg border">
              <Label className="font-medium">AGPO Category {isEditMode && '*'}</Label>
              {isEditMode ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Government officials will verify this during contractor evaluation
                  </p>
                  <RadioGroup
                    value={settings.agpo_category || ''}
                    onValueChange={(value) =>
                      setSettings(prev => ({ ...prev, agpo_category: value as AGPOCategory }))
                    }
                    className="grid grid-cols-1 md:grid-cols-3 gap-3"
                  >
                    <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${settings.agpo_category === 'women' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}>
                      <RadioGroupItem value="women" id="women" />
                      <label htmlFor="women" className="flex items-center gap-2 cursor-pointer">
                        <Heart className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">Women-Owned</p>
                          <p className="text-xs text-muted-foreground">30%+ ownership by women</p>
                        </div>
                      </label>
                    </div>
                    <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${settings.agpo_category === 'youth' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}>
                      <RadioGroupItem value="youth" id="youth" />
                      <label htmlFor="youth" className="flex items-center gap-2 cursor-pointer">
                        <Users className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">Youth-Owned</p>
                          <p className="text-xs text-muted-foreground">Owners aged 18-35 years</p>
                        </div>
                      </label>
                    </div>
                    <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${settings.agpo_category === 'pwd' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}>
                      <RadioGroupItem value="pwd" id="pwd" />
                      <label htmlFor="pwd" className="flex items-center gap-2 cursor-pointer">
                        <Heart className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">PWD-Owned</p>
                          <p className="text-xs text-muted-foreground">Persons with disabilities</p>
                        </div>
                      </label>
                    </div>
                  </RadioGroup>
                </>
              ) : (
                <Badge className="capitalize">
                  {settings.agpo_category === 'pwd' ? 'PWD-Owned' : `${settings.agpo_category}-Owned`}
                </Badge>
              )}

              <div className="bg-accent/30 border rounded-lg p-3 mt-3">
                <p className="text-sm">
                  <strong>✓ AGPO Benefits:</strong> +5 bonus points in bid scoring, priority access to reserved contracts, and eligibility for 30% government procurement quota.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Project Capacity */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <Label className="font-medium">Maximum Project Capacity</Label>
          </div>
          {isEditMode ? (
            <Input
              type="number"
              value={settings.max_project_capacity}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  max_project_capacity: parseInt(e.target.value) || 0,
                }))
              }
              className="max-w-xs"
            />
          ) : (
            <p className="text-lg font-medium">KES {settings.max_project_capacity.toLocaleString()}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Category: <Badge variant="outline">{getCapacityLabel(settings.max_project_capacity)}</Badge>
          </p>
        </div>

        {/* Action Buttons */}
        {isEditMode ? (
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
            {hasExistingSettings && (
              <Button
                variant="outline"
                onClick={() => {
                  fetchSettings();
                  setIsEditMode(false);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        ) : (
          <Button
            onClick={() => setIsEditMode(true)}
            variant="outline"
            className="w-full"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Settings
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractorLocationSettings;
