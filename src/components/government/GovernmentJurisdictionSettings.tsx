import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Shield, MapPin, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KENYA_COUNTIES } from '@/hooks/useLocationFiltering';

const GovernmentJurisdictionSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignedCounties, setAssignedCounties] = useState<string[]>([]);

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

      if (data) {
        setAssignedCounties(data.assigned_counties || []);
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
        .from('government_profiles')
        .update({ assigned_counties: assignedCounties })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Jurisdiction settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleCounty = (county: string) => {
    setAssignedCounties(prev =>
      prev.includes(county)
        ? prev.filter(c => c !== county)
        : [...prev, county]
    );
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
          <Shield className="h-5 w-5 mr-2 text-purple-600" />
          Jurisdiction Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure which counties you have jurisdiction over to review and approve problems.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Assignments */}
        <div className="space-y-2">
          <Label className="font-medium">Your Assigned Counties</Label>
          <div className="flex flex-wrap gap-2">
            {assignedCounties.map(county => (
              <Badge key={county} className="bg-purple-100 text-purple-800">
                <MapPin className="h-3 w-3 mr-1" />
                {county}
                <button
                  onClick={() => toggleCounty(county)}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            ))}
            {assignedCounties.length === 0 && (
              <span className="text-sm text-muted-foreground italic">
                No counties assigned - you'll see problems from all counties
              </span>
            )}
          </div>
        </div>

        {/* County Selection */}
        <div className="space-y-3">
          <Label className="font-medium">Select Counties</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
            {KENYA_COUNTIES.map(county => (
              <div key={county} className="flex items-center space-x-2">
                <Checkbox
                  id={`gov-${county}`}
                  checked={assignedCounties.includes(county)}
                  onCheckedChange={() => toggleCounty(county)}
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

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            💡 You'll see all pending problems from your assigned counties in the approval queue,
            prioritized by community votes (50+ votes first).
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Jurisdiction Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GovernmentJurisdictionSettings;
