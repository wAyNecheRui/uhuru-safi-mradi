import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  Star, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CitizenWorker {
  id: string;
  user_id: string;
  national_id?: string;
  kra_pin?: string;
  phone_number: string;
  alternate_phone?: string;
  physical_address?: string;
  county: string;
  sub_county?: string;
  ward?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  bank_name?: string;
  bank_account?: string;
  skills: string[];
  experience_years: number;
  education_level?: string;
  certifications?: string[];
  languages: string[];
  availability_status: string;
  hourly_rate?: number;
  daily_rate?: number;
  transport_means?: string[];
  willing_to_travel: boolean;
  max_travel_distance?: number;
  verification_status: string;
  background_check_status: string;
  rating: number;
  total_jobs_completed: number;
  profile_photo_url?: string;
  cv_document_url?: string;
  created_at: string;
  updated_at: string;
}

const KENYAN_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii',
  'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
  'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi',
  'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

const AVAILABLE_SKILLS = [
  'Masonry', 'Carpentry', 'Plumbing', 'Electrical', 'Welding', 'Painting', 'Roofing',
  'Excavation', 'Heavy Equipment Operation', 'Surveying', 'Road Construction', 'Concrete Work',
  'Steel Fixing', 'Tiling', 'Landscaping', 'General Labor', 'Site Supervision', 'Quality Control',
  'Safety Management', 'Project Management', 'Data Collection', 'Community Mobilization'
];

const CitizenWorkerRegistry = () => {
  const { user } = useAuth();
  const [workerProfile, setWorkerProfile] = useState<CitizenWorker | null>(null);
  const [allWorkers, setAllWorkers] = useState<CitizenWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [searchFilter, setSearchFilter] = useState('');
  const [countyFilter, setCountyFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  const [formData, setFormData] = useState({
    phone_number: '',
    alternate_phone: '',
    physical_address: '',
    county: '',
    sub_county: '',
    ward: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    bank_name: '',
    bank_account: '',
    skills: [] as string[],
    experience_years: 0,
    education_level: '',
    certifications: [] as string[],
    languages: ['English', 'Swahili'],
    hourly_rate: 0,
    daily_rate: 0,
    transport_means: [] as string[],
    willing_to_travel: false,
    max_travel_distance: 0,
    national_id: '',
    kra_pin: ''
  });

  useEffect(() => {
    fetchWorkerData();
  }, [user]);

  const fetchWorkerData = async () => {
    try {
      setLoading(true);

      if (user) {
        // First, get user profile to check user type
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
        }

        // Fetch current user's worker profile (only for workers)
        if (userProfile?.user_type === 'citizen') {
          const { data: workerData, error: workerError } = await supabase
            .from('citizen_workers')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (workerError && workerError.code !== 'PGRST116') {
            throw workerError;
          }

          if (workerData) {
            // Get decrypted version for the user's own profile
            const { data: decryptedData, error: decryptError } = await supabase
              .rpc('get_citizen_worker_decrypted', { worker_id: workerData.id });
            
            if (!decryptError && decryptedData && decryptedData.length > 0) {
              setWorkerProfile(decryptedData[0]);
              
              // Use decrypted data for form initialization
              const decryptedWorker = decryptedData[0];
              setFormData({
                phone_number: decryptedWorker.phone_number || '',
                alternate_phone: decryptedWorker.alternate_phone || '',
                physical_address: decryptedWorker.physical_address || '',
                county: decryptedWorker.county || '',
                sub_county: decryptedWorker.sub_county || '',
                ward: decryptedWorker.ward || '',
                emergency_contact_name: decryptedWorker.emergency_contact_name || '',
                emergency_contact_phone: decryptedWorker.emergency_contact_phone || '',
                bank_name: decryptedWorker.bank_name || '',
                bank_account: decryptedWorker.bank_account || '',
                skills: decryptedWorker.skills || [],
                experience_years: decryptedWorker.experience_years || 0,
                education_level: decryptedWorker.education_level || '',
                certifications: decryptedWorker.certifications || [],
                languages: decryptedWorker.languages || ['English', 'Swahili'],
                hourly_rate: decryptedWorker.hourly_rate || 0,
                daily_rate: decryptedWorker.daily_rate || 0,
                transport_means: decryptedWorker.transport_means || [],
                willing_to_travel: decryptedWorker.willing_to_travel || false,
                max_travel_distance: decryptedWorker.max_travel_distance || 0,
                national_id: decryptedWorker.national_id || '',
                kra_pin: decryptedWorker.kra_pin || ''
              });
            } else {
              // Fallback to original data if decryption fails
              setWorkerProfile(workerData);
              setFormData({
                phone_number: workerData.phone_number || '',
                alternate_phone: workerData.alternate_phone || '',
                physical_address: workerData.physical_address || '',
                county: workerData.county || '',
                sub_county: workerData.sub_county || '',
                ward: workerData.ward || '',
                emergency_contact_name: workerData.emergency_contact_name || '',
                emergency_contact_phone: workerData.emergency_contact_phone || '',
                bank_name: workerData.bank_name || '',
                bank_account: workerData.bank_account || '',
                skills: workerData.skills || [],
                experience_years: workerData.experience_years || 0,
                education_level: workerData.education_level || '',
                certifications: workerData.certifications || [],
                languages: workerData.languages || ['English', 'Swahili'],
                hourly_rate: workerData.hourly_rate || 0,
                daily_rate: workerData.daily_rate || 0,
                transport_means: workerData.transport_means || [],
                willing_to_travel: workerData.willing_to_travel || false,
                max_travel_distance: workerData.max_travel_distance || 0,
                national_id: '', // Don't show encrypted data
                kra_pin: '' // Don't show encrypted data
              });
            }
          }
        }

        // Fetch all workers for directory based on user type
        let allWorkersData;
        let allWorkersError;

        if (userProfile?.user_type === 'contractor') {
          // Use secure function for contractors
          const { data, error } = await supabase.rpc('get_available_workers');
          allWorkersData = data;
          allWorkersError = error;
        } else {
          // Direct query for government users and citizens
          const { data, error } = await supabase
            .from('citizen_workers')
            .select('*')
            .eq('availability_status', 'available')
            .eq('verification_status', 'verified')
            .order('rating', { ascending: false })
            .limit(50);
          allWorkersData = data;
          allWorkersError = error;
        }

        if (allWorkersError) throw allWorkersError;
        setAllWorkers(allWorkersData || []);
      }

    } catch (error: any) {
      console.error('Error fetching worker data:', error);
      toast.error('Failed to load worker data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error('Please log in to save your profile');
      return;
    }

    if (!formData.phone_number || !formData.county || formData.skills.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      const profileData = {
        user_id: user.id,
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (workerProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('citizen_workers')
          .update(profileData)
          .eq('id', workerProfile.id);

        if (error) throw error;
        toast.success('Profile updated successfully');
      } else {
        // Create new profile
        const { error } = await supabase
          .from('citizen_workers')
          .insert(profileData);

        if (error) throw error;
        toast.success('Profile created successfully');
      }

      fetchWorkerData();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleTransportToggle = (transport: string) => {
    setFormData(prev => ({
      ...prev,
      transport_means: prev.transport_means.includes(transport)
        ? prev.transport_means.filter(t => t !== transport)
        : [...prev.transport_means, transport]
    }));
  };

  const filteredWorkers = allWorkers.filter(worker => {
    const matchesSearch = !searchFilter || 
      worker.skills.some(skill => skill.toLowerCase().includes(searchFilter.toLowerCase())) ||
      worker.county.toLowerCase().includes(searchFilter.toLowerCase());
    
    const matchesCounty = !countyFilter || worker.county === countyFilter;
    const matchesSkill = !skillFilter || worker.skills.includes(skillFilter);
    
    return matchesSearch && matchesCounty && matchesSkill;
  });

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-pulse">Loading worker registry...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="border-t-4 border-t-green-600">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <User className="h-6 w-6 mr-3 text-green-600" />
            Citizen Worker Registry
          </CardTitle>
          <p className="text-gray-600">
            Register your skills and connect with infrastructure projects in your community.
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
          <TabsTrigger value="profile">My Worker Profile</TabsTrigger>
          <TabsTrigger value="directory">Worker Directory</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {workerProfile ? 'Update Worker Profile' : 'Create Worker Profile'}
              </CardTitle>
              {workerProfile && (
                <div className="flex items-center space-x-4">
                  <Badge className={getVerificationColor(workerProfile.verification_status)}>
                    {workerProfile.verification_status.toUpperCase()}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">{workerProfile.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {workerProfile.total_jobs_completed} jobs completed
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({...prev, phone_number: e.target.value}))}
                    placeholder="+254 XXX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alternate_phone">Alternate Phone</Label>
                  <Input
                    id="alternate_phone"
                    value={formData.alternate_phone}
                    onChange={(e) => setFormData(prev => ({...prev, alternate_phone: e.target.value}))}
                    placeholder="+254 XXX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="national_id">National ID</Label>
                  <Input
                    id="national_id"
                    value={formData.national_id}
                    onChange={(e) => setFormData(prev => ({...prev, national_id: e.target.value}))}
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kra_pin">KRA PIN</Label>
                  <Input
                    id="kra_pin"
                    value={formData.kra_pin}
                    onChange={(e) => setFormData(prev => ({...prev, kra_pin: e.target.value}))}
                    placeholder="A123456789X"
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Location Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="county">County *</Label>
                    <Select value={formData.county} onValueChange={(value) => setFormData(prev => ({...prev, county: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select County" />
                      </SelectTrigger>
                      <SelectContent>
                        {KENYAN_COUNTIES.map(county => (
                          <SelectItem key={county} value={county}>{county}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sub_county">Sub County</Label>
                    <Input
                      id="sub_county"
                      value={formData.sub_county}
                      onChange={(e) => setFormData(prev => ({...prev, sub_county: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ward">Ward</Label>
                    <Input
                      id="ward"
                      value={formData.ward}
                      onChange={(e) => setFormData(prev => ({...prev, ward: e.target.value}))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="physical_address">Physical Address</Label>
                  <Textarea
                    id="physical_address"
                    value={formData.physical_address}
                    onChange={(e) => setFormData(prev => ({...prev, physical_address: e.target.value}))}
                    placeholder="Enter your physical address"
                  />
                </div>
              </div>

              {/* Skills and Experience */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Skills & Experience</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience_years">Years of Experience</Label>
                    <Input
                      id="experience_years"
                      type="number"
                      min="0"
                      value={formData.experience_years}
                      onChange={(e) => setFormData(prev => ({...prev, experience_years: parseInt(e.target.value) || 0}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="education_level">Education Level</Label>
                    <Select value={formData.education_level} onValueChange={(value) => setFormData(prev => ({...prev, education_level: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Education Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Primary">Primary</SelectItem>
                        <SelectItem value="Secondary">Secondary</SelectItem>
                        <SelectItem value="Certificate">Certificate</SelectItem>
                        <SelectItem value="Diploma">Diploma</SelectItem>
                        <SelectItem value="Degree">Degree</SelectItem>
                        <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Skills * (Select all that apply)</Label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {AVAILABLE_SKILLS.map(skill => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox
                          id={skill}
                          checked={formData.skills.includes(skill)}
                          onCheckedChange={() => handleSkillToggle(skill)}
                        />
                        <Label htmlFor={skill} className="text-sm">{skill}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rates and Availability */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Rates & Availability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate (KES)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      min="0"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData(prev => ({...prev, hourly_rate: parseFloat(e.target.value) || 0}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="daily_rate">Daily Rate (KES)</Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      min="0"
                      value={formData.daily_rate}
                      onChange={(e) => setFormData(prev => ({...prev, daily_rate: parseFloat(e.target.value) || 0}))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Transportation Available</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Walking', 'Bicycle', 'Motorcycle', 'Car', 'Public Transport'].map(transport => (
                      <div key={transport} className="flex items-center space-x-2">
                        <Checkbox
                          id={transport}
                          checked={formData.transport_means.includes(transport)}
                          onCheckedChange={() => handleTransportToggle(transport)}
                        />
                        <Label htmlFor={transport} className="text-sm">{transport}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="willing_to_travel"
                    checked={formData.willing_to_travel}
                    onCheckedChange={(checked) => setFormData(prev => ({...prev, willing_to_travel: checked as boolean}))}
                  />
                  <Label htmlFor="willing_to_travel">Willing to travel for work</Label>
                </div>

                {formData.willing_to_travel && (
                  <div className="space-y-2">
                    <Label htmlFor="max_travel_distance">Maximum Travel Distance (KM)</Label>
                    <Input
                      id="max_travel_distance"
                      type="number"
                      min="0"
                      value={formData.max_travel_distance}
                      onChange={(e) => setFormData(prev => ({...prev, max_travel_distance: parseInt(e.target.value) || 0}))}
                    />
                  </div>
                )}
              </div>

              {/* Emergency Contact & Banking */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Emergency Contact & Banking</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                    <Input
                      id="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData(prev => ({...prev, emergency_contact_name: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                    <Input
                      id="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData(prev => ({...prev, emergency_contact_phone: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={formData.bank_name}
                      onChange={(e) => setFormData(prev => ({...prev, bank_name: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_account">Bank Account Number</Label>
                    <Input
                      id="bank_account"
                      value={formData.bank_account}
                      onChange={(e) => setFormData(prev => ({...prev, bank_account: e.target.value}))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  <User className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : workerProfile ? 'Update Profile' : 'Create Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="directory" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Search by skills or location..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
                <Select value={countyFilter} onValueChange={setCountyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by County" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Counties</SelectItem>
                    {KENYAN_COUNTIES.map(county => (
                      <SelectItem key={county} value={county}>{county}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={skillFilter} onValueChange={setSkillFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Skill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Skills</SelectItem>
                    {AVAILABLE_SKILLS.map(skill => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-gray-600 flex items-center">
                  {filteredWorkers.length} verified worker{filteredWorkers.length !== 1 ? 's' : ''}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map((worker) => (
              <Card key={worker.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">{worker.rating.toFixed(1)}</span>
                          <span className="text-sm text-gray-600">
                            ({worker.total_jobs_completed} jobs)
                          </span>
                        </div>
                        <Badge className={getVerificationColor(worker.verification_status)}>
                          <Shield className="h-3 w-3 mr-1" />
                          {worker.verification_status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {worker.county}, Kenya
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Briefcase className="h-4 w-4 mr-1" />
                        {worker.experience_years} years experience
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Skills</div>
                      <div className="flex flex-wrap gap-1">
                        {worker.skills.slice(0, 4).map(skill => (
                          <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                        ))}
                        {worker.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{worker.skills.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {(worker.hourly_rate || worker.daily_rate) && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-700">Rates</div>
                        <div className="text-sm text-gray-600">
                          {worker.hourly_rate && `KES ${worker.hourly_rate}/hour`}
                          {worker.hourly_rate && worker.daily_rate && ' • '}
                          {worker.daily_rate && `KES ${worker.daily_rate}/day`}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Badge className={worker.availability_status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {worker.availability_status.toUpperCase()}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Contact Worker
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredWorkers.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Workers Found</h3>
                <p className="text-gray-600">
                  No verified workers match your current search criteria.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CitizenWorkerRegistry;