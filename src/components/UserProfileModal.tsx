import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, Shield, Award, Building, Briefcase, Camera, 
  MapPin, Phone, Mail, CheckCircle, AlertCircle, Edit3, Image, Trash2, Upload
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { RoleRequestModal } from '@/components/RoleRequestModal';
import { VerificationStatusBadge } from '@/components/VerificationStatusBadge';
import { RoleService } from '@/services/RoleService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const counties = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu',
  'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa',
  "Murang'a", 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const { user, roles } = useAuth();
  const { userProfile, contractorProfile, governmentProfile, loading: profileLoading, updateProfile, updateContractorProfile, updateGovernmentProfile, refreshProfiles } = useProfile();
  const [isRoleRequestOpen, setIsRoleRequestOpen] = useState(false);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [photoMenu, setPhotoMenu] = useState<'avatar' | 'cover' | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    location: ''
  });

  const [contractorFormData, setContractorFormData] = useState({
    company_name: '',
    kra_pin: '',
    specialization: '',
    years_in_business: ''
  });

  const [governmentFormData, setGovernmentFormData] = useState({
    department: '',
    position: ''
  });

  React.useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        phone_number: userProfile.phone_number || '',
        location: userProfile.location || userProfile.county || ''
      });
    }
  }, [userProfile]);

  React.useEffect(() => {
    if (contractorProfile) {
      setContractorFormData({
        company_name: contractorProfile.company_name || '',
        kra_pin: contractorProfile.kra_pin || '',
        specialization: contractorProfile.specialization?.join(', ') || '',
        years_in_business: contractorProfile.years_in_business?.toString() || ''
      });
    }
  }, [contractorProfile]);

  React.useEffect(() => {
    if (governmentProfile) {
      setGovernmentFormData({
        department: governmentProfile.department || '',
        position: governmentProfile.position || ''
      });
    }
  }, [governmentProfile]);

  React.useEffect(() => {
    if (isOpen) {
      loadVerificationRequests();
    }
  }, [isOpen]);

  const loadVerificationRequests = async () => {
    const requests = await RoleService.getMyVerificationRequests();
    setVerificationRequests(requests);
  };

  // Image upload handler
  const handleImageUpload = useCallback(async (file: File, type: 'avatar' | 'cover') => {
    if (!user) return;
    
    const isAvatar = type === 'avatar';
    isAvatar ? setUploadingAvatar(true) : setUploadingCover(true);

    try {
      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}/${type}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update profile
      const updateField = isAvatar ? 'avatar_url' : 'cover_url';
      const success = await updateProfile({ [updateField]: publicUrl } as any);
      
      if (success) {
        toast.success(`${isAvatar ? 'Profile' : 'Cover'} photo updated!`);
        refreshProfiles();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type} image`);
    } finally {
      isAvatar ? setUploadingAvatar(false) : setUploadingCover(false);
    }
  }, [user, updateProfile, refreshProfiles]);

  const handleRemoveImage = useCallback(async (type: 'avatar' | 'cover') => {
    if (!user) return;
    const isAvatar = type === 'avatar';
    isAvatar ? setUploadingAvatar(true) : setUploadingCover(true);

    try {
      const currentUrl = isAvatar ? userProfile?.avatar_url : (userProfile as any)?.cover_url;
      
      // Try to delete from storage
      if (currentUrl) {
        const bucketPath = currentUrl.split('/profile-images/')[1];
        if (bucketPath) {
          await supabase.storage.from('profile-images').remove([decodeURIComponent(bucketPath)]);
        }
      }

      const updateField = isAvatar ? 'avatar_url' : 'cover_url';
      const success = await updateProfile({ [updateField]: null } as any);
      if (success) {
        toast.success(`${isAvatar ? 'Profile' : 'Cover'} photo removed`);
        refreshProfiles();
      }
    } catch (error) {
      console.error('Remove error:', error);
      toast.error(`Failed to remove ${type} image`);
    } finally {
      isAvatar ? setUploadingAvatar(false) : setUploadingCover(false);
    }
  }, [user, userProfile, updateProfile, refreshProfiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile({
      full_name: formData.full_name,
      phone_number: formData.phone_number,
      location: formData.location,
      county: formData.location
    });
    if (success) onClose();
  };

  const handleContractorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const specializations = contractorFormData.specialization
      .split(',').map(s => s.trim()).filter(Boolean);
    
    const success = await updateContractorProfile({
      company_name: contractorFormData.company_name,
      kra_pin: contractorFormData.kra_pin || undefined,
      specialization: specializations.length > 0 ? specializations : undefined,
      years_in_business: contractorFormData.years_in_business ? parseInt(contractorFormData.years_in_business) : undefined
    });
    if (success) onClose();
  };

  const handleGovernmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateGovernmentProfile({
      department: governmentFormData.department,
      position: governmentFormData.position
    });
    if (success) onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Profile completion calculation
  const getProfileCompletion = () => {
    let total = 4; // name, phone, location, avatar
    let completed = 0;
    if (userProfile?.full_name) completed++;
    if (userProfile?.phone_number) completed++;
    if (userProfile?.location || userProfile?.county) completed++;
    if (userProfile?.avatar_url) completed++;

    if (user?.user_type === 'contractor') {
      total += 3; // company, specialization, years
      if (contractorProfile?.company_name) completed++;
      if (contractorProfile?.specialization?.length) completed++;
      if (contractorProfile?.years_in_business) completed++;
    }
    if (user?.user_type === 'government') {
      total += 2;
      if (governmentProfile?.department) completed++;
      if (governmentProfile?.position) completed++;
    }
    return Math.round((completed / total) * 100);
  };

  const isContractor = user?.user_type === 'contractor';
  const isGovernment = user?.user_type === 'government';
  const completionPercent = getProfileCompletion();
  const displayName = userProfile?.full_name || user?.name || 'User';
  const subtitle = isContractor 
    ? contractorProfile?.company_name 
    : isGovernment 
      ? `${governmentProfile?.position || ''} · ${governmentProfile?.department || ''}`.replace(/^ · | · $/g, '')
      : 'Citizen';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {/* Cover + Avatar Header */}
          <div className="relative">
            {/* Cover Photo */}
            <div 
              className="h-44 sm:h-52 bg-gradient-to-br from-primary/80 via-primary/60 to-accent/40 relative overflow-hidden cursor-pointer group"
              onClick={() => setPhotoMenu('cover')}
            >
              {(userProfile as any)?.cover_url ? (
                <img src={(userProfile as any).cover_url} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20">
                  <div className="text-center text-primary-foreground/60">
                    <Image className="h-8 w-8 mx-auto mb-1" />
                    <span className="text-xs font-medium">Add Cover Photo</span>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
                  <Camera className="h-4 w-4 text-foreground" />
                  <span className="text-xs font-medium text-foreground">Change Cover</span>
                </div>
              </div>
              {uploadingCover && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary-foreground border-t-transparent rounded-full" />
                </div>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" 
              onChange={(e) => { e.target.files?.[0] && handleImageUpload(e.target.files[0], 'cover'); setPhotoMenu(null); }} />

            {/* Avatar */}
            <div className="absolute -bottom-16 left-6 sm:left-8">
              <div 
                className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-background shadow-lg bg-muted cursor-pointer group overflow-hidden"
                onClick={() => setPhotoMenu('avatar')}
              >
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt={displayName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-3xl sm:text-4xl font-bold rounded-full">
                    {displayName.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full">
                  <div className="bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-sm">
                    <Camera className="h-4 w-4 text-foreground" />
                  </div>
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <div className="animate-spin h-6 w-6 border-3 border-primary-foreground border-t-transparent rounded-full" />
                  </div>
                )}
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" 
                onChange={(e) => { e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar'); setPhotoMenu(null); }} />
            </div>
          </div>

          {/* Photo Action Menu (Instagram/WhatsApp style) */}
          {photoMenu && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setPhotoMenu(null)}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div 
                className="relative bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm mx-0 sm:mx-4 shadow-xl animate-in slide-in-from-bottom-4 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3 sm:hidden" />
                <div className="px-4 pt-4 pb-2">
                  <p className="text-sm font-semibold text-foreground">
                    {photoMenu === 'avatar' ? 'Profile Photo' : 'Cover Photo'}
                  </p>
                </div>
                <div className="px-2 pb-2">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                    onClick={() => { 
                      photoMenu === 'avatar' ? avatarInputRef.current?.click() : coverInputRef.current?.click();
                    }}
                  >
                    <Upload className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Upload Photo</p>
                      <p className="text-xs text-muted-foreground">Choose from your device</p>
                    </div>
                  </button>
                  {((photoMenu === 'avatar' && userProfile?.avatar_url) || (photoMenu === 'cover' && (userProfile as any)?.cover_url)) && (
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 transition-colors text-left"
                      onClick={() => { handleRemoveImage(photoMenu); setPhotoMenu(null); }}
                    >
                      <Trash2 className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Remove Photo</p>
                        <p className="text-xs text-muted-foreground">Delete current photo</p>
                      </div>
                    </button>
                  )}
                </div>
                <div className="px-2 pb-3">
                  <button
                    className="w-full py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                    onClick={() => setPhotoMenu(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Info Section */}
          <div className="pt-20 px-6 sm:px-8 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">{displayName}</h2>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {userProfile?.location && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {userProfile.location}
                    </span>
                  )}
                  {user?.email && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {user.email}
                    </span>
                  )}
                  {roles.map(role => (
                    <Badge key={role} variant="secondary" className="capitalize text-xs py-0">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              {isContractor && contractorProfile?.verified && (
                <Badge className="bg-green-100 text-green-800 border-green-200 self-start sm:self-auto">
                  <CheckCircle className="h-3 w-3 mr-1" /> Verified
                </Badge>
              )}
            </div>

            {/* Profile Completion Bar */}
            {completionPercent < 100 && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Complete your profile
                  </span>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-200">{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} className="h-1.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  A complete profile builds trust and unlocks all platform features.
                </p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="px-6 sm:px-8 pb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`grid w-full ${isContractor || isGovernment ? 'grid-cols-3' : 'grid-cols-2'} mb-4`}>
                <TabsTrigger value="profile">
                  <User className="h-4 w-4 mr-1.5" />
                  Profile
                </TabsTrigger>
                {isContractor && (
                  <TabsTrigger value="contractor">
                    <Building className="h-4 w-4 mr-1.5" />
                    Company
                  </TabsTrigger>
                )}
                {isGovernment && (
                  <TabsTrigger value="government">
                    <Briefcase className="h-4 w-4 mr-1.5" />
                    Department
                  </TabsTrigger>
                )}
                <TabsTrigger value="roles">
                  <Shield className="h-4 w-4 mr-1.5" />
                  Roles
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 mt-0">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name" className="text-xs font-medium">Full Name *</Label>
                      <Input
                        id="full_name"
                        required
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="Your full name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone_number" className="text-xs font-medium">Phone Number *</Label>
                      <Input
                        id="phone_number"
                        type="tel"
                        required
                        value={formData.phone_number}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        placeholder="+254 700 000 000"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location" className="text-xs font-medium">Location/County *</Label>
                      <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select your county" />
                        </SelectTrigger>
                        <SelectContent>
                          {counties.map((county) => (
                            <SelectItem key={county} value={county}>{county}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Email</Label>
                      <Input value={user?.email || ''} disabled className="bg-muted mt-1" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t">
                    <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                    <Button type="submit" size="sm" disabled={profileLoading}>
                      {profileLoading ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Contractor Tab */}
              {isContractor && (
                <TabsContent value="contractor" className="space-y-4 mt-0">
                  <form onSubmit={handleContractorSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label htmlFor="company_name" className="text-xs font-medium">Company/Organization Name *</Label>
                        <Input
                          id="company_name"
                          required
                          value={contractorFormData.company_name}
                          onChange={(e) => setContractorFormData(prev => ({ ...prev, company_name: e.target.value }))}
                          placeholder="Your company name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="kra_pin" className="text-xs font-medium">KRA PIN</Label>
                        <Input
                          id="kra_pin"
                          value={contractorFormData.kra_pin}
                          onChange={(e) => setContractorFormData(prev => ({ ...prev, kra_pin: e.target.value }))}
                          placeholder="P000000000X"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="years_in_business" className="text-xs font-medium">Years in Business</Label>
                        <Input
                          id="years_in_business"
                          type="number"
                          value={contractorFormData.years_in_business}
                          onChange={(e) => setContractorFormData(prev => ({ ...prev, years_in_business: e.target.value }))}
                          placeholder="5"
                          min="0"
                          className="mt-1"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="specialization" className="text-xs font-medium">Specialization</Label>
                        <Input
                          id="specialization"
                          value={contractorFormData.specialization}
                          onChange={(e) => setContractorFormData(prev => ({ ...prev, specialization: e.target.value }))}
                          placeholder="e.g., Road construction, Building, Plumbing"
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Separate multiple with commas</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t">
                      <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                      <Button type="submit" size="sm" disabled={profileLoading}>
                        {profileLoading ? 'Saving...' : 'Save Company Info'}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              )}

              {/* Government Tab */}
              {isGovernment && (
                <TabsContent value="government" className="space-y-4 mt-0">
                  <form onSubmit={handleGovernmentSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="department" className="text-xs font-medium">Department *</Label>
                        <Input
                          id="department"
                          required
                          value={governmentFormData.department}
                          onChange={(e) => setGovernmentFormData(prev => ({ ...prev, department: e.target.value }))}
                          placeholder="e.g., Ministry of Transport"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="position" className="text-xs font-medium">Position *</Label>
                        <Input
                          id="position"
                          required
                          value={governmentFormData.position}
                          onChange={(e) => setGovernmentFormData(prev => ({ ...prev, position: e.target.value }))}
                          placeholder="e.g., Project Manager"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t">
                      <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                      <Button type="submit" size="sm" disabled={profileLoading}>
                        {profileLoading ? 'Saving...' : 'Save Department Info'}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              )}

              {/* Roles Tab */}
              <TabsContent value="roles" className="space-y-4 mt-0">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Your Roles</h3>
                    <div className="flex flex-wrap gap-2">
                      {roles.length > 0 ? (
                        roles.map(role => (
                          <Badge key={role} className="capitalize px-3 py-1">{role}</Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No roles assigned yet</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Verification Requests</h3>
                    {verificationRequests.length > 0 ? (
                      <div className="space-y-2">
                        {verificationRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                              <span className="font-medium capitalize text-sm">{request.requested_role}</span>
                              <p className="text-xs text-muted-foreground">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <VerificationStatusBadge status={request.status} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No verification requests</p>
                    )}
                  </div>

                  <Button onClick={() => setIsRoleRequestOpen(true)} variant="outline" size="sm">
                    <Award className="h-4 w-4 mr-2" />
                    Request Role Upgrade
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <RoleRequestModal 
        isOpen={isRoleRequestOpen}
        onClose={() => {
          setIsRoleRequestOpen(false);
          loadVerificationRequests();
        }}
      />
    </>
  );
};

export default UserProfileModal;
