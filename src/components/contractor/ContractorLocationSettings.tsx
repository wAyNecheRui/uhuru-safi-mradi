import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MapPin, DollarSign, Users, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KENYA_COUNTIES } from '@/hooks/useLocationFiltering';

const ContractorLocationSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    registered_counties: [] as string[],
    max_project_capacity: 5000000,
    is_agpo: false,
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
        .select('registered_counties, max_project_capacity, is_agpo')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          registered_counties: data.registered_counties || [],
          max_project_capacity: data.max_project_capacity || 5000000,
          is_agpo: data.is_agpo || false,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('contractor_profiles')
        .update({
          registered_counties: settings.registered_counties,
          max_project_capacity: settings.max_project_capacity,
          is_agpo: settings.is_agpo,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleCounty = (county: string) => {
    setSettings(prev => ({
      ...prev,
      registered_counties: prev.registered_counties.includes(county)
        ? prev.registered_counties.filter(c => c !== county)
        : [...prev.registered_counties, county],
    }));
  };

  const getCapacityLabel = (capacity: number): string => {
    if (capacity <= 5000000) return 'Small (≤ KES 5M)';
    if (capacity <= 50000000) return 'Medium (KES 5M-50M)';
    return 'Large (≥ KES 50M)';
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
        <CardTitle className="flex items-center text-xl">
          <MapPin className="h-5 w-5 mr-2 text-blue-600" />
          Service Area & Capacity Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure which counties you can service and your project capacity to see relevant projects.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AGPO Status */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-purple-600" />
            <div>
              <Label className="font-medium">AGPO Contractor</Label>
              <p className="text-xs text-muted-foreground">
                Access Government Procurement Opportunities (Women/Youth/PWD)
              </p>
            </div>
          </div>
          <Switch
            checked={settings.is_agpo}
            onCheckedChange={(checked) =>
              setSettings(prev => ({ ...prev, is_agpo: checked }))
            }
          />
        </div>

        {settings.is_agpo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✓ As an AGPO contractor, you'll see all eligible projects across Kenya.
            </p>
          </div>
        )}

        {/* Project Capacity */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <Label className="font-medium">Maximum Project Capacity</Label>
          </div>
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
          <p className="text-xs text-muted-foreground">
            Category: <Badge variant="outline">{getCapacityLabel(settings.max_project_capacity)}</Badge>
          </p>
        </div>

        {/* County Selection */}
        {!settings.is_agpo && (
          <div className="space-y-3">
            <Label className="font-medium">Registered Service Counties</Label>
            <p className="text-xs text-muted-foreground">
              Select counties where you can provide services. You'll only see projects from these counties.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {settings.registered_counties.map(county => (
                <Badge key={county} className="bg-blue-100 text-blue-800">
                  {county}
                  <button
                    onClick={() => toggleCounty(county)}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {settings.registered_counties.length === 0 && (
                <span className="text-sm text-muted-foreground italic">
                  No counties selected - you'll see all projects
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
              {KENYA_COUNTIES.map(county => (
                <div key={county} className="flex items-center space-x-2">
                  <Checkbox
                    id={county}
                    checked={settings.registered_counties.includes(county)}
                    onCheckedChange={() => toggleCounty(county)}
                  />
                  <label
                    htmlFor={county}
                    className="text-sm cursor-pointer"
                  >
                    {county}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700"
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
      </CardContent>
    </Card>
  );
};

export default ContractorLocationSettings;
