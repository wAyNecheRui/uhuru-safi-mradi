
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Wrench, 
  Plus, 
  X, 
  Star, 
  MapPin, 
  Phone, 
  Mail,
  Building,
  Award
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const skillCategories = [
  {
    id: 'construction',
    name: 'Construction & Masonry',
    skills: ['Masonry', 'Concrete Work', 'Steel Construction', 'Roofing', 'Flooring', 'Painting']
  },
  {
    id: 'roads',
    name: 'Roads & Transportation',
    skills: ['Road Construction', 'Paving', 'Bridge Construction', 'Traffic Systems', 'Drainage']
  },
  {
    id: 'water',
    name: 'Water & Sanitation',
    skills: ['Plumbing', 'Water Systems', 'Sewage Systems', 'Borehole Drilling', 'Pipe Installation']
  },
  {
    id: 'electrical',
    name: 'Electrical & Power',
    skills: ['Electrical Wiring', 'Solar Installation', 'Power Systems', 'Street Lighting', 'Generators']
  },
  {
    id: 'healthcare',
    name: 'Healthcare Infrastructure',
    skills: ['Medical Equipment Installation', 'Hospital Construction', 'Laboratory Setup', 'HVAC Systems']
  },
  {
    id: 'education',
    name: 'Education Infrastructure',
    skills: ['School Construction', 'Laboratory Setup', 'ICT Installation', 'Furniture Installation']
  }
];

const SkillsRegistration = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    location: '',
    organization: '',
    yearsExperience: '',
    certifications: '',
    portfolio: '',
    availableForWork: true,
    selectedSkills: [] as string[],
    customSkills: [] as string[],
    newCustomSkill: ''
  });
  const [loading, setLoading] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadExistingRegistration();
    }
  }, [user]);

  const loadExistingRegistration = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data && !error) {
        setFormData({
          fullName: data.full_name || '',
          phoneNumber: data.phone_number || '',
          email: user?.email || '',
          location: data.location || '',
          // These fields don't exist in current schema, so we set defaults
          organization: '',
          yearsExperience: '',
          certifications: '',
          portfolio: '',
          availableForWork: true,
          selectedSkills: [],
          customSkills: [],
          newCustomSkill: ''
        });
        setExistingRegistration(data);
      }
    } catch (error) {
      console.error('Error loading registration:', error);
    }
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill)
        ? prev.selectedSkills.filter(s => s !== skill)
        : [...prev.selectedSkills, skill]
    }));
  };

  const addCustomSkill = () => {
    if (formData.newCustomSkill.trim() && !formData.customSkills.includes(formData.newCustomSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        customSkills: [...prev.customSkills, prev.newCustomSkill.trim()],
        selectedSkills: [...prev.selectedSkills, prev.newCustomSkill.trim()],
        newCustomSkill: ''
      }));
    }
  };

  const removeCustomSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      customSkills: prev.customSkills.filter(s => s !== skill),
      selectedSkills: prev.selectedSkills.filter(s => s !== skill)
    }));
  };

  const skillsValidationErrors = (): string[] => {
    const errors: string[] = [];
    if (!formData.fullName.trim()) errors.push('Full name is required');
    if (!formData.phoneNumber.trim()) errors.push('Phone number is required');
    if (!formData.location.trim()) errors.push('Location is required');
    if (formData.selectedSkills.length === 0) errors.push('Select at least one skill');
    return errors;
  };

  const isSkillsFormValid = skillsValidationErrors().length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to register your skills');
      return;
    }

    const errors = skillsValidationErrors();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setLoading(true);

    try {
      // For now, we'll just update the basic profile info that exists in the current schema
      const profileData = {
        user_id: user.id,
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        location: formData.location,
        user_type: 'skilled_worker',
        updated_at: new Date().toISOString()
      };

      let result;
      if (existingRegistration) {
        result = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', user.id);
      } else {
        result = await supabase
          .from('user_profiles')
          .insert(profileData);
      }

      if (result.error) throw result.error;

      toast.success(existingRegistration 
        ? 'Basic profile updated successfully! Extended skills features coming soon.' 
        : 'Basic profile registered successfully! Extended skills features coming soon.'
      );
      
      loadExistingRegistration();
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(`Failed to register profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-t-4 border-t-blue-600">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Wrench className="h-6 w-6 mr-3 text-blue-600" />
            Skills & Workforce Registration
          </CardTitle>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> Extended skills registration features are coming soon. 
              For now, you can update your basic profile information.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <Input
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <Input
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="0700 000 000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <Input
                  required
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="County, Ward/Constituency"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={loading}
            >
              {loading ? (
                'Saving...'
              ) : existingRegistration ? (
                'Update Basic Profile'
              ) : (
                'Register Basic Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SkillsRegistration;
