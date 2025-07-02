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
  const { user, supabase } = useAuth();
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
          organization: data.organization || '',
          yearsExperience: data.years_experience?.toString() || '',
          certifications: data.certifications || '',
          portfolio: data.portfolio || '',
          availableForWork: data.available_for_work !== false,
          selectedSkills: data.skills ? JSON.parse(data.skills) : [],
          customSkills: data.custom_skills ? JSON.parse(data.custom_skills) : [],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to register your skills');
      return;
    }

    if (formData.selectedSkills.length === 0) {
      toast.error('Please select at least one skill');
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        user_id: user.id,
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        location: formData.location,
        user_type: 'skilled_worker',
        years_experience: parseInt(formData.yearsExperience) || 0,
        certifications: formData.certifications,
        portfolio: formData.portfolio,
        available_for_work: formData.availableForWork,
        skills: JSON.stringify(formData.selectedSkills),
        custom_skills: JSON.stringify(formData.customSkills),
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
        ? 'Skills profile updated successfully!' 
        : 'Skills registered successfully!'
      );
      
      loadExistingRegistration();
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(`Failed to register skills: ${error.message}`);
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
          <p className="text-gray-600">
            Register your skills to be matched with community infrastructure projects. 
            Help build your community while earning income.
          </p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization/Company
                </label>
                <Input
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Experience & Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                  placeholder="Number of years"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="available"
                  checked={formData.availableForWork}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, availableForWork: checked as boolean }))
                  }
                />
                <label htmlFor="available" className="text-sm font-medium text-gray-700">
                  Available for new projects
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications & Qualifications
              </label>
              <Textarea
                value={formData.certifications}
                onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
                placeholder="List your relevant certifications, licenses, and qualifications"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Portfolio/Previous Work
              </label>
              <Textarea
                value={formData.portfolio}
                onChange={(e) => setFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                placeholder="Describe your previous projects and achievements"
                rows={3}
              />
            </div>

            {/* Skills Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select Your Skills *
              </label>
              <div className="space-y-6">
                {skillCategories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{category.name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {category.skills.map((skill) => (
                        <div key={skill} className="flex items-center space-x-2">
                          <Checkbox
                            id={skill}
                            checked={formData.selectedSkills.includes(skill)}
                            onCheckedChange={() => handleSkillToggle(skill)}
                          />
                          <label htmlFor={skill} className="text-sm text-gray-700">
                            {skill}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Skills
              </label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={formData.newCustomSkill}
                  onChange={(e) => setFormData(prev => ({ ...prev, newCustomSkill: e.target.value }))}
                  placeholder="Add a custom skill"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                />
                <Button type="button" onClick={addCustomSkill} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.customSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.customSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeCustomSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Skills Summary */}
            {formData.selectedSkills.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Selected Skills ({formData.selectedSkills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {formData.selectedSkills.map((skill) => (
                    <Badge key={skill} className="bg-blue-100 text-blue-800">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={loading}
            >
              {loading ? (
                'Saving...'
              ) : existingRegistration ? (
                'Update Skills Profile'
              ) : (
                'Register Skills Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SkillsRegistration;
