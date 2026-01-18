import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, 
  Plus, 
  X, 
  Award, 
  Building, 
  MapPin, 
  Phone, 
  User,
  Calendar,
  FileText,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const skillCategories = [
  {
    id: 'construction',
    name: 'Construction & Infrastructure',
    skills: [
      'Masonry & Stonework',
      'Concrete Work & Foundations', 
      'Steel Construction & Welding',
      'Roofing & Waterproofing',
      'Flooring & Tiling',
      'Painting & Finishing',
      'Carpentry & Joinery',
      'General Construction'
    ]
  },
  {
    id: 'roads',
    name: 'Roads & Transportation',
    skills: [
      'Road Construction & Maintenance',
      'Asphalt Paving & Surfacing',
      'Bridge Construction & Repair',
      'Traffic Systems Installation',
      'Drainage & Culvert Construction',
      'Road Marking & Signage',
      'Equipment Operation (Heavy Machinery)'
    ]
  },
  {
    id: 'water',
    name: 'Water & Sanitation Systems',
    skills: [
      'Plumbing & Pipe Installation',
      'Water Treatment Systems',
      'Sewage & Waste Management',
      'Borehole Drilling & Maintenance',
      'Irrigation Systems',
      'Septic Tank Installation',
      'Water Quality Testing'
    ]
  },
  {
    id: 'electrical',
    name: 'Electrical & Power Systems',
    skills: [
      'Electrical Installation & Wiring',
      'Solar Power Systems',
      'Power Distribution Systems',
      'Street Lighting Installation',
      'Generator Installation & Maintenance',
      'Electrical Safety & Testing',
      'Smart Grid Technology'
    ]
  },
  {
    id: 'healthcare',
    name: 'Healthcare Infrastructure',
    skills: [
      'Medical Equipment Installation',
      'Hospital & Clinic Construction',
      'Laboratory Setup & Maintenance',
      'HVAC Systems for Healthcare',
      'Medical Gas Systems',
      'Biomedical Equipment Maintenance',
      'Healthcare Facility Planning'
    ]
  },
  {
    id: 'education',
    name: 'Education Infrastructure',
    skills: [
      'School Building Construction',
      'Laboratory Design & Setup',
      'ICT Infrastructure Installation',
      'Educational Furniture Installation',
      'Playground & Sports Facilities',
      'Library Setup & Management',
      'Educational Technology Systems'
    ]
  },
  {
    id: 'environmental',
    name: 'Environmental & Green Infrastructure',
    skills: [
      'Waste Management Systems',
      'Renewable Energy Installation',
      'Environmental Assessment',
      'Green Building Techniques',
      'Landscaping & Urban Planning',
      'Air Quality Monitoring',
      'Sustainable Construction'
    ]
  }
];

const experienceLevels = [
  { value: '0-1', label: '0-1 years (Entry Level)' },
  { value: '2-5', label: '2-5 years (Intermediate)' },
  { value: '6-10', label: '6-10 years (Experienced)' },
  { value: '11-15', label: '11-15 years (Senior)' },
  { value: '15+', label: '15+ years (Expert)' }
];

const ProfessionalSkillsRegistration = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    county: '',
    subCounty: '',
    ward: '',
    organization: '',
    yearsExperience: '',
    certifications: '',
    portfolio: '',
    availableForWork: true,
    selectedSkills: [] as string[],
    customSkills: [] as string[],
    newCustomSkill: '',
    emergencyContact: '',
    nationalId: '',
    kraPin: '',
    hourlyRate: '',
    dailyRate: '',
    willingToTravel: false,
    maxTravelDistance: ''
  });
  const [loading, setLoading] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<any>(null);

  const counties = [
    'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
    'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
    'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu',
    'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa',
    'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
    'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
    'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
  ];

  useEffect(() => {
    if (user) {
      loadExistingRegistration();
    }
  }, [user]);

  const loadExistingRegistration = async () => {
    try {
      // Check if user already has a skills profile
      const { data: skillsData } = await supabase
        .from('skills_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      // Also get basic profile info
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (skillsData || profileData) {
        setFormData({
          fullName: skillsData?.full_name || profileData?.full_name || '',
          phoneNumber: skillsData?.phone_number || profileData?.phone_number || '',
          email: user?.email || '',
          county: (profileData as any)?.county || '',
          subCounty: (profileData as any)?.sub_county || '',
          ward: (profileData as any)?.ward || '',
          organization: skillsData?.organization || '',
          yearsExperience: skillsData?.years_experience?.toString() || '',
          certifications: skillsData?.certifications || '',
          portfolio: skillsData?.portfolio || '',
          availableForWork: skillsData?.available_for_work ?? true,
          selectedSkills: skillsData?.skills || [],
          customSkills: skillsData?.custom_skills || [],
          newCustomSkill: '',
          emergencyContact: '',
          nationalId: '',
          kraPin: '',
          hourlyRate: '',
          dailyRate: '',
          willingToTravel: false,
          maxTravelDistance: ''
        });
        setExistingRegistration(skillsData || profileData);
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

    if (!formData.fullName || !formData.phoneNumber || !formData.county) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // First update/create basic profile
      const profileData = {
        user_id: user.id,
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        location: `${formData.ward}, ${formData.subCounty}, ${formData.county}`,
        user_type: user.user_type || 'citizen',
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      // Then create/update skills profile
      const skillsProfileData = {
        user_id: user.id,
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        location: `${formData.ward}, ${formData.subCounty}, ${formData.county}`,
        organization: formData.organization,
        years_experience: parseInt(formData.yearsExperience) || 0,
        certifications: formData.certifications,
        portfolio: formData.portfolio,
        available_for_work: formData.availableForWork,
        skills: formData.selectedSkills,
        custom_skills: formData.customSkills,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('skills_profiles')
        .upsert(skillsProfileData, { onConflict: 'user_id' });

      if (error) throw error;

      // ALSO create/update citizen_workers record so worker appears in workforce system
      // This ensures workers who register skills can apply for jobs and be found by contractors
      const allSkills = [...formData.selectedSkills, ...formData.customSkills].filter(Boolean);
      
      // Check if citizen_workers record exists
      const { data: existingWorker } = await supabase
        .from('citizen_workers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const citizenWorkerData = {
        user_id: user.id,
        phone_number: formData.phoneNumber,
        county: formData.county,
        sub_county: formData.subCounty || null,
        ward: formData.ward || null,
        skills: allSkills,
        experience_years: parseInt(formData.yearsExperience) || 0,
        certifications: formData.certifications ? [formData.certifications] : null,
        availability_status: formData.availableForWork ? 'available' : 'unavailable',
        updated_at: new Date().toISOString()
      };

      if (existingWorker) {
        // Update existing citizen_workers record
        await supabase
          .from('citizen_workers')
          .update(citizenWorkerData)
          .eq('user_id', user.id);
      } else {
        // Create new citizen_workers record
        await supabase
          .from('citizen_workers')
          .insert({
            ...citizenWorkerData,
            created_at: new Date().toISOString()
          });
      }

      toast.success(existingRegistration 
        ? 'Professional skills profile updated successfully!' 
        : 'Professional skills profile registered successfully!'
      );
      
      loadExistingRegistration();
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(`Failed to register profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // If user already has a profile, show their current data
  if (existingRegistration && formData.selectedSkills.length > 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-t-4 border-t-green-600">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Award className="h-6 w-6 mr-3 text-green-600" />
              Your Professional Profile
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Your skills are registered and visible to contractors looking for workers.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Profile Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{formData.fullName || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{formData.phoneNumber || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{formData.county || 'Not set'}{formData.subCounty ? `, ${formData.subCounty}` : ''}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Organization</p>
                    <p className="font-medium">{formData.organization || 'Independent'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="font-medium">{formData.yearsExperience ? `${formData.yearsExperience} years` : 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={formData.availableForWork ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {formData.availableForWork ? '✓ Available for Work' : 'Not Available'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Wrench className="h-4 w-4 mr-2" />
                Your Registered Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {formData.selectedSkills.map((skill, idx) => (
                  <Badge key={idx} className="bg-blue-100 text-blue-800">{skill}</Badge>
                ))}
              </div>
            </div>

            {/* Certifications */}
            {formData.certifications && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Certifications</h4>
                <p className="text-gray-700">{formData.certifications}</p>
              </div>
            )}

            <Button 
              onClick={() => setExistingRegistration(null)} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="border-t-4 border-t-blue-600">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Shield className="h-6 w-6 mr-3 text-blue-600" />
            Professional Skills & Workforce Registration
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Register your professional skills and expertise to be considered for infrastructure 
            development projects in Kenya.
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Your full legal name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="0700 000 000"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@example.com"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Location Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="county">County *</Label>
                  <Select value={formData.county} onValueChange={(value) => setFormData(prev => ({ ...prev, county: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your county" />
                    </SelectTrigger>
                    <SelectContent>
                      {counties.map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="subCounty">Sub-County/Constituency</Label>
                  <Input
                    id="subCounty"
                    value={formData.subCounty}
                    onChange={(e) => setFormData(prev => ({ ...prev, subCounty: e.target.value }))}
                    placeholder="Your sub-county or constituency"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ward">Ward</Label>
                  <Input
                    id="ward"
                    value={formData.ward}
                    onChange={(e) => setFormData(prev => ({ ...prev, ward: e.target.value }))}
                    placeholder="Your ward"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Professional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="organization">Organization/Company</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                    placeholder="Current employer or business name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="yearsExperience">Years of Experience</Label>
                  <Select value={formData.yearsExperience} onValueChange={(value) => setFormData(prev => ({ ...prev, yearsExperience: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="certifications">Certifications & Licenses</Label>
                  <Textarea
                    id="certifications"
                    value={formData.certifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
                    placeholder="List your professional certifications, licenses, and qualifications..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="portfolio">Portfolio/Website</Label>
                  <Textarea
                    id="portfolio"
                    value={formData.portfolio}
                    onChange={(e) => setFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                    placeholder="Links to your work portfolio, website, or previous projects..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Skills Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Professional Skills *
              </h3>
              
              {skillCategories.map((category) => (
                <Card key={category.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {category.skills.map((skill) => (
                        <div key={skill} className="flex items-center space-x-2">
                          <Checkbox
                            id={skill}
                            checked={formData.selectedSkills.includes(skill)}
                            onCheckedChange={() => handleSkillToggle(skill)}
                          />
                          <Label htmlFor={skill} className="text-sm font-normal cursor-pointer">
                            {skill}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Custom Skills */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Additional Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={formData.newCustomSkill}
                      onChange={(e) => setFormData(prev => ({ ...prev, newCustomSkill: e.target.value }))}
                      placeholder="Add a custom skill..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                    />
                    <Button type="button" onClick={addCustomSkill} size="sm">
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
                </CardContent>
              </Card>
            </div>

            {/* Availability */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Work Availability
              </h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="availableForWork"
                  checked={formData.availableForWork}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, availableForWork: !!checked }))}
                />
                <Label htmlFor="availableForWork">
                  I am currently available for infrastructure projects
                </Label>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 px-8" 
                disabled={loading}
              >
                {loading ? (
                  'Registering...'
                ) : existingRegistration ? (
                  'Update Professional Profile'
                ) : (
                  'Register Professional Profile'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalSkillsRegistration;