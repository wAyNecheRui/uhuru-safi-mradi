import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Shield, MapPin, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KENYA_COUNTIES } from '@/hooks/useLocationFiltering';

const GovernmentJurisdictionSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignedCounties, setAssignedCounties] = useState<string[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('government_profiles')
        .select('assigned_counties')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data && data.assigned_counties && data.assigned_counties.length > 0) {
        setAssignedCounties(data.assigned_counties);
        setIsConfigured(true);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-save when counties change
  const saveSettings = useCallback(async (counties: string[]) => {
    if (!user || counties.length === 0) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('government_profiles')
        .update({ assigned_counties: counties })
        .eq('user_id', user.id);

      if (error) throw error;
      setIsConfigured(true);
      toast.success('Jurisdiction updated');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [user]);

  const toggleCounty = (county: string) => {
    const newCounties = assignedCounties.includes(county)
      ? assignedCounties.filter(c => c !== county)
      : [...assignedCounties, county];
    
    setAssignedCounties(newCounties);
    
    // Auto-save after a brief delay
    if (newCounties.length > 0) {
      saveSettings(newCounties);
    }
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

  // If already configured, show a compact view
  if (isConfigured && assignedCounties.length > 0) {
    return (
      <Card className="shadow-lg border-l-4 border-l-purple-600">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  Your Jurisdiction
                  <Badge className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                </h3>
                <p className="text-sm text-gray-600">
                  {assignedCounties.length} {assignedCounties.length === 1 ? 'county' : 'counties'} assigned
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {assignedCounties.slice(0, 5).map(county => (
                <Badge key={county} variant="outline" className="bg-purple-50">
                  <MapPin className="h-3 w-3 mr-1" />
                  {county}
                </Badge>
              ))}
              {assignedCounties.length > 5 && (
                <Badge variant="outline">+{assignedCounties.length - 5} more</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // First-time setup view
  return (
    <Card className="shadow-lg border-t-4 border-t-purple-600">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Shield className="h-5 w-5 mr-2 text-purple-600" />
          Set Up Your Jurisdiction
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select the counties you have jurisdiction over. This is a one-time setup.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* County Selection */}
        <div className="space-y-3">
          <Label className="font-medium">Select Your Counties</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-white">
            {KENYA_COUNTIES.map(county => (
              <div key={county} className="flex items-center space-x-2">
                <Checkbox
                  id={`gov-${county}`}
                  checked={assignedCounties.includes(county)}
                  onCheckedChange={() => toggleCounty(county)}
                  disabled={saving}
                />
                <label
                  htmlFor={`gov-${county}`}
                  className="text-sm cursor-pointer"
                >
                  {county}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Selected counties preview */}
        {assignedCounties.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {assignedCounties.map(county => (
              <Badge key={county} className="bg-purple-100 text-purple-800">
                <MapPin className="h-3 w-3 mr-1" />
                {county}
              </Badge>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            💡 Your selections are saved automatically. You'll see pending problems from your assigned counties.
          </p>
        </div>

        {saving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GovernmentJurisdictionSettings;
