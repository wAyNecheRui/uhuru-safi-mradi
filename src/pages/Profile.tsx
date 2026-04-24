import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User, Shield, Building, Briefcase, Camera, MapPin, Phone, Mail,
  CheckCircle, AlertCircle, Edit3, Image, Trash2, Upload, FileText,
  Award, Clock, Lock, ChevronRight, ExternalLink, Star, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import { useNavigate } from 'react-router-dom';

const counties = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu',
  'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa',
  "Murang'a", 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

/** SVG-based progress ring */
const ProgressRing = ({ percent, size = 120, strokeWidth = 8 }: { percent: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = percent === 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{percent}%</span>
        <span className="text-[10px] text-muted-foreground font-medium">Complete</span>
      </div>
    </div>
  );
};

interface CompletionStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
  action?: () => void;
}

const Profile = () => {
  const { user, roles } = useAuth();
  const { userProfile, contractorProfile, governmentProfile, loading: profileLoading, updateProfile, updateContractorProfile, updateGovernmentProfile, refreshProfiles } = useProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
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

  // Sync form data with profile
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

  const isContractor = user?.user_type === 'contractor';
  const isGovernment = user?.user_type === 'government';

  // Role-specific completion steps
  const completionSteps = useMemo<CompletionStep[]>(() => {
    const steps: CompletionStep[] = [
      {
        id: 'name',
        label: 'Full Name',
        description: 'Add your full legal name',
        completed: !!userProfile?.full_name,
        icon: <User className="h-4 w-4" />,
      },
      {
        id: 'phone',
        label: 'Phone Number',
        description: 'Add a valid phone number',
        completed: !!userProfile?.phone_number,
        icon: <Phone className="h-4 w-4" />,
      },
      {
        id: 'location',
        label: 'County / Location',
        description: 'Select your county',
        completed: !!(userProfile?.location || userProfile?.county),
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        id: 'avatar',
        label: 'Profile Photo',
        description: 'Upload a profile photo',
        completed: !!userProfile?.avatar_url,
        icon: <Camera className="h-4 w-4" />,
      },
    ];

    if (isContractor) {
      steps.push(
        {
          id: 'company',
          label: 'Company Name',
          description: 'Add your registered company name',
          completed: !!contractorProfile?.company_name,
          icon: <Building className="h-4 w-4" />,
        },
        {
          id: 'kra',
          label: 'KRA PIN',
          description: 'Provide your Kenya Revenue Authority PIN',
          completed: !!contractorProfile?.kra_pin,
          icon: <FileText className="h-4 w-4" />,
        },
        {
          id: 'specialization',
          label: 'Specialization',
          description: 'List your areas of expertise',
          completed: !!(contractorProfile?.specialization?.length),
          icon: <Award className="h-4 w-4" />,
        },
        {
          id: 'years',
          label: 'Years in Business',
          description: 'How long you have been operating',
          completed: !!(contractorProfile?.years_in_business),
          icon: <Clock className="h-4 w-4" />,
        },
      );
    }

    if (isGovernment) {
      steps.push(
        {
          id: 'department',
          label: 'Department',
          description: 'Your ministry or department',
          completed: !!governmentProfile?.department,
          icon: <Briefcase className="h-4 w-4" />,
        },
        {
          id: 'position',
          label: 'Position',
          description: 'Your official designation',
          completed: !!governmentProfile?.position,
          icon: <Shield className="h-4 w-4" />,
        },
      );
    }

    return steps;
  }, [userProfile, contractorProfile, governmentProfile, isContractor, isGovernment]);

  const completedCount = completionSteps.filter(s => s.completed).length;
  const completionPercent = Math.round((completedCount / completionSteps.length) * 100);
  const incompleteSteps = completionSteps.filter(s => !s.completed);

  const displayName = userProfile?.full_name || user?.name || 'User';
  const subtitle = isContractor
    ? contractorProfile?.company_name
    : isGovernment
      ? `${governmentProfile?.position || ''} · ${governmentProfile?.department || ''}`.replace(/^ · | · $/g, '')
      : 'Citizen';

  // Image upload
  const handleImageUpload = useCallback(async (file: File, type: 'avatar' | 'cover') => {
    if (!user) return;
    const isAvatar = type === 'avatar';
    isAvatar ? setUploadingAvatar(true) : setUploadingCover(true);

    try {
      if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }
      if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }

      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}/${type}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('profile-images').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(filePath);
      const updateField = isAvatar ? 'avatar_url' : 'cover_url';
      const success = await updateProfile({ [updateField]: publicUrl } as any);
      if (success) {
        toast.success(`${isAvatar ? 'Profile' : 'Cover'} photo updated`);
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
      if (currentUrl) {
        const bucketPath = currentUrl.split('/profile-images/')[1];
        if (bucketPath) await supabase.storage.from('profile-images').remove([decodeURIComponent(bucketPath)]);
      }
      const updateField = isAvatar ? 'avatar_url' : 'cover_url';
      const success = await updateProfile({ [updateField]: null } as any);
      if (success) { toast.success(`${isAvatar ? 'Profile' : 'Cover'} photo removed`); refreshProfiles(); }
    } catch { toast.error(`Failed to remove ${type} image`); }
    finally { isAvatar ? setUploadingAvatar(false) : setUploadingCover(false); }
  }, [user, userProfile, updateProfile, refreshProfiles]);

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isCountyLocked = user?.user_type === 'citizen' || user?.user_type === 'government';
    const payload: any = {
      full_name: formData.full_name,
      phone_number: formData.phone_number,
    };
    // Only contractors can change county; for locked roles, never include it
    // in the update payload so the DB lock trigger is never tripped.
    if (!isCountyLocked) {
      payload.location = formData.location;
      payload.county = formData.location;
    } else {
      // Allow updating non-county location string only if county already set
      payload.location = formData.location;
    }
    const success = await updateProfile(payload);
    if (success) setEditing(false);
  };

  const handleContractorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const specializations = contractorFormData.specialization.split(',').map(s => s.trim()).filter(Boolean);
    const success = await updateContractorProfile({
      company_name: contractorFormData.company_name,
      kra_pin: contractorFormData.kra_pin || undefined,
      specialization: specializations.length > 0 ? specializations : undefined,
      years_in_business: contractorFormData.years_in_business ? parseInt(contractorFormData.years_in_business) : undefined
    });
    if (success) setEditing(false);
  };

  const handleGovernmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateGovernmentProfile({
      department: governmentFormData.department,
      position: governmentFormData.position
    });
    if (success) setEditing(false);
  };

  const breadcrumbItems = [
    { label: 'Home', href: `/${user?.user_type || ''}` },
    { label: 'Profile' },
  ];

  // Verification status for contractors
  const verificationStatus = isContractor
    ? contractorProfile?.verified ? 'verified' : 'pending'
    : isGovernment
      ? governmentProfile?.verified ? 'verified' : 'pending'
      : completionPercent === 100 ? 'complete' : 'incomplete';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <ResponsiveContainer className="py-6 sm:py-8 max-w-4xl">
          <BreadcrumbNav items={breadcrumbItems} />

          {/* Hero Section */}
          <Card className="overflow-hidden border-0 shadow-lg mb-6">
            {/* Cover */}
            <div
              className="relative h-40 sm:h-52 bg-gradient-to-br from-primary/80 via-primary/60 to-accent/40 cursor-pointer group"
              onClick={() => setPhotoMenu('cover')}
            >
              {(userProfile as any)?.cover_url ? (
                <img src={(userProfile as any).cover_url} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
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
                  <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
                </div>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { e.target.files?.[0] && handleImageUpload(e.target.files[0], 'cover'); setPhotoMenu(null); }} />

            {/* Avatar + Info */}
            <div className="relative px-6 sm:px-8 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                {/* Avatar */}
                <div className="-mt-16 sm:-mt-20 relative z-10">
                  <div
                    className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-background shadow-lg bg-muted cursor-pointer group overflow-hidden"
                    onClick={() => setPhotoMenu('avatar')}
                  >
                    {userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} alt={displayName} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-3xl font-bold rounded-full">
                        {displayName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar'); setPhotoMenu(null); }} />
                </div>

                {/* Name + Meta */}
                <div className="flex-1 min-w-0 pt-2 sm:pt-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground font-[var(--font-display)]">{displayName}</h1>
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
                    <Badge variant="outline" className="capitalize text-xs">{user?.user_type}</Badge>
                    {verificationStatus === 'verified' && (
                      <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                    {verificationStatus === 'pending' && (isContractor || isGovernment) && (
                      <Badge variant="outline" className="text-[hsl(var(--warning))] border-[hsl(var(--warning))] text-xs">
                        <Clock className="h-3 w-3 mr-1" /> Pending Verification
                      </Badge>
                    )}
                  </div>
                </div>

                <Button variant="outline" size="sm" onClick={() => setEditing(!editing)} className="self-start sm:self-auto">
                  <Edit3 className="h-4 w-4 mr-1.5" /> {editing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Photo Action Menu */}
          {photoMenu && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setPhotoMenu(null)}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="relative bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm mx-0 sm:mx-4 shadow-xl animate-in slide-in-from-bottom-4 duration-200"
                onClick={(e) => e.stopPropagation()}>
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3 sm:hidden" />
                <div className="px-4 pt-4 pb-2">
                  <p className="text-sm font-semibold text-foreground">{photoMenu === 'avatar' ? 'Profile Photo' : 'Cover Photo'}</p>
                </div>
                <div className="px-2 pb-2">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                    onClick={() => { photoMenu === 'avatar' ? avatarInputRef.current?.click() : coverInputRef.current?.click(); }}>
                    <Upload className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Upload Photo</p>
                      <p className="text-xs text-muted-foreground">Choose from your device</p>
                    </div>
                  </button>
                  {((photoMenu === 'avatar' && userProfile?.avatar_url) || (photoMenu === 'cover' && (userProfile as any)?.cover_url)) && (
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 transition-colors text-left"
                      onClick={() => { handleRemoveImage(photoMenu); setPhotoMenu(null); }}>
                      <Trash2 className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Remove Photo</p>
                        <p className="text-xs text-muted-foreground">Delete current photo</p>
                      </div>
                    </button>
                  )}
                </div>
                <div className="px-2 pb-3">
                  <button className="w-full py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                    onClick={() => setPhotoMenu(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column — Progress + Completion Steps */}
            <div className="space-y-6">
              {/* Progress Ring Card */}
              <Card>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <ProgressRing percent={completionPercent} />
                  <p className="mt-3 text-sm font-semibold text-foreground">Profile Completion</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {completionPercent === 100
                      ? 'All steps completed'
                      : `${incompleteSteps.length} step${incompleteSteps.length > 1 ? 's' : ''} remaining`}
                  </p>
                </CardContent>
              </Card>

              {/* Completion Steps */}
              {incompleteSteps.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-[hsl(var(--warning))]" />
                      Complete Your Profile
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Complete these steps to unlock all platform features
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 pt-0">
                    {completionSteps.map(step => (
                      <div key={step.id} className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                        step.completed ? 'bg-[hsl(var(--success))]/5' : 'hover:bg-muted/50'
                      )}>
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                          step.completed
                            ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {step.completed ? <CheckCircle className="h-4 w-4" /> : step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium', step.completed && 'line-through text-muted-foreground')}>
                            {step.label}
                          </p>
                          {!step.completed && (
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                          )}
                        </div>
                        {step.completed && <CheckCircle className="h-4 w-4 text-[hsl(var(--success))] flex-shrink-0" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* What Full Access Unlocks */}
              {completionPercent < 100 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      Unlock Full Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {user?.user_type === 'citizen' && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-primary" /> Report issues with photos
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-primary" /> Verify project milestones
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-primary" /> Apply for workforce jobs
                        </div>
                      </>
                    )}
                    {isContractor && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-primary" /> Bid on government projects
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-primary" /> Receive escrow payments
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-primary" /> Manage project milestones
                        </div>
                      </>
                    )}
                    {isGovernment && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-primary" /> Approve project milestones
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-primary" /> Release escrow payments
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-primary" /> Manage budgets and reports
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column — Tabs with Profile Details */}
            <div className="lg:col-span-2">
              <Card>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="px-6 pt-4">
                    <TabsList className={cn(
                      'grid w-full mb-0',
                      isContractor || isGovernment ? 'grid-cols-3' : 'grid-cols-2'
                    )}>
                      <TabsTrigger value="profile">
                        <User className="h-4 w-4 mr-1.5" /> Profile
                      </TabsTrigger>
                      {isContractor && (
                        <TabsTrigger value="credentials">
                          <Shield className="h-4 w-4 mr-1.5" /> Credentials
                        </TabsTrigger>
                      )}
                      {isGovernment && (
                        <TabsTrigger value="credentials">
                          <Briefcase className="h-4 w-4 mr-1.5" /> Department
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="activity">
                        <Star className="h-4 w-4 mr-1.5" /> Activity
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Profile Tab */}
                  <TabsContent value="profile" className="px-6 pb-6 pt-4">
                    {editing ? (
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium">Full Name *</Label>
                            <Input value={formData.full_name} onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                              placeholder="Your full name" className="mt-1" required />
                          </div>
                          <div>
                            <Label className="text-xs font-medium">Phone Number *</Label>
                            <Input value={formData.phone_number} onChange={(e) => setFormData(p => ({ ...p, phone_number: e.target.value }))}
                              placeholder="+254 700 000 000" className="mt-1" required type="tel" />
                          </div>
                          <div>
                            <Label className="text-xs font-medium flex items-center gap-1">
                              {user?.user_type === 'contractor' ? 'HQ County (optional)' : 'County'}
                              {(user?.user_type === 'citizen' || user?.user_type === 'government') && (
                                <Shield className="h-3 w-3 text-muted-foreground" aria-label="Locked" />
                              )}
                            </Label>
                            {(user?.user_type === 'citizen' || user?.user_type === 'government') ? (
                              <>
                                <Input
                                  value={userProfile?.county || userProfile?.location || ''}
                                  disabled
                                  className="mt-1 bg-muted"
                                />
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  Permanent — contact an administrator to change.
                                </p>
                              </>
                            ) : (
                              <Select value={formData.location} onValueChange={(v) => setFormData(p => ({ ...p, location: v }))}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Select HQ county" /></SelectTrigger>
                                <SelectContent>
                                  {counties.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs font-medium">Email</Label>
                            <Input value={user?.email || ''} disabled className="bg-muted mt-1" />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-3 border-t">
                          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                          <Button type="submit" size="sm" disabled={profileLoading}>
                            {profileLoading ? 'Saving...' : 'Save Profile'}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        {[
                          { label: 'Full Name', value: userProfile?.full_name, icon: <User className="h-4 w-4" /> },
                          { label: 'Email', value: user?.email, icon: <Mail className="h-4 w-4" /> },
                          { label: 'Phone', value: userProfile?.phone_number, icon: <Phone className="h-4 w-4" /> },
                          {
                            label: user?.user_type === 'contractor' ? 'HQ County' : 'County',
                            value: userProfile?.location || userProfile?.county,
                            icon: <MapPin className="h-4 w-4" />,
                            locked: user?.user_type === 'citizen' || user?.user_type === 'government',
                          },
                        ].map(({ label, value, icon, locked }: any) => (
                          <div key={label} className="flex items-center gap-3 py-2">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">{icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {label}
                                {locked && <Shield className="h-3 w-3" aria-label="Locked" />}
                              </p>
                              <p className="text-sm font-medium text-foreground">{value || 'Not set'}</p>
                            </div>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex items-center gap-3 py-2">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Account Type</p>
                            <p className="text-sm font-medium text-foreground capitalize">{user?.user_type}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Credentials / Department Tab */}
                  <TabsContent value="credentials" className="px-6 pb-6 pt-4">
                    {isContractor && (
                      editing ? (
                        <form onSubmit={handleContractorSubmit} className="space-y-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                              <Label className="text-xs font-medium">Company Name *</Label>
                              <Input value={contractorFormData.company_name}
                                onChange={(e) => setContractorFormData(p => ({ ...p, company_name: e.target.value }))}
                                placeholder="Your company name" className="mt-1" required />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">KRA PIN</Label>
                              <Input value={contractorFormData.kra_pin}
                                onChange={(e) => setContractorFormData(p => ({ ...p, kra_pin: e.target.value }))}
                                placeholder="P000000000X" className="mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Years in Business</Label>
                              <Input type="number" value={contractorFormData.years_in_business}
                                onChange={(e) => setContractorFormData(p => ({ ...p, years_in_business: e.target.value }))}
                                placeholder="5" min="0" className="mt-1" />
                            </div>
                            <div className="sm:col-span-2">
                              <Label className="text-xs font-medium">Specialization</Label>
                              <Input value={contractorFormData.specialization}
                                onChange={(e) => setContractorFormData(p => ({ ...p, specialization: e.target.value }))}
                                placeholder="e.g., Road construction, Building" className="mt-1" />
                              <p className="text-xs text-muted-foreground mt-1">Separate with commas</p>
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-3 border-t">
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                            <Button type="submit" size="sm" disabled={profileLoading}>
                              {profileLoading ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          {[
                            { label: 'Company Name', value: contractorProfile?.company_name, icon: <Building className="h-4 w-4" /> },
                            { label: 'KRA PIN', value: contractorProfile?.kra_pin, icon: <FileText className="h-4 w-4" /> },
                            { label: 'Years in Business', value: contractorProfile?.years_in_business?.toString(), icon: <Clock className="h-4 w-4" /> },
                            { label: 'Specialization', value: contractorProfile?.specialization?.join(', '), icon: <Award className="h-4 w-4" /> },
                          ].map(({ label, value, icon }) => (
                            <div key={label} className="flex items-center gap-3 py-2">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">{icon}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="text-sm font-medium text-foreground">{value || 'Not set'}</p>
                              </div>
                            </div>
                          ))}
                          <Separator />
                          <div className="flex items-center gap-3 py-2">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                              <Shield className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">Verification Status</p>
                              <div className="flex items-center gap-2">
                                {contractorProfile?.verified ? (
                                  <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[hsl(var(--warning))] border-[hsl(var(--warning))]">
                                    <Clock className="h-3 w-3 mr-1" /> Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {isContractor && (
                            <Button variant="outline" size="sm" onClick={() => navigate('/contractor/verification')} className="w-full mt-2">
                              <ExternalLink className="h-4 w-4 mr-1.5" /> View Full Verification System
                            </Button>
                          )}
                        </div>
                      )
                    )}

                    {isGovernment && (
                      editing ? (
                        <form onSubmit={handleGovernmentSubmit} className="space-y-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-medium">Department *</Label>
                              <Input value={governmentFormData.department}
                                onChange={(e) => setGovernmentFormData(p => ({ ...p, department: e.target.value }))}
                                placeholder="e.g., Ministry of Transport" className="mt-1" required />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Position *</Label>
                              <Input value={governmentFormData.position}
                                onChange={(e) => setGovernmentFormData(p => ({ ...p, position: e.target.value }))}
                                placeholder="e.g., Project Manager" className="mt-1" required />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-3 border-t">
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                            <Button type="submit" size="sm" disabled={profileLoading}>
                              {profileLoading ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          {[
                            { label: 'Department', value: governmentProfile?.department, icon: <Briefcase className="h-4 w-4" /> },
                            { label: 'Position', value: governmentProfile?.position, icon: <Shield className="h-4 w-4" /> },
                            { label: 'Employee Number', value: governmentProfile?.employee_number, icon: <FileText className="h-4 w-4" /> },
                          ].map(({ label, value, icon }) => (
                            <div key={label} className="flex items-center gap-3 py-2">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">{icon}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="text-sm font-medium text-foreground">{value || 'Not set'}</p>
                              </div>
                            </div>
                          ))}
                          <Separator />
                          <div className="flex items-center gap-3 py-2">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                              <Shield className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">Verification Status</p>
                              {governmentProfile?.verified ? (
                                <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[hsl(var(--warning))] border-[hsl(var(--warning))]">
                                  <Clock className="h-3 w-3 mr-1" /> Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </TabsContent>

                  {/* Activity Tab */}
                  <TabsContent value="activity" className="px-6 pb-6 pt-4">
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm font-medium">Activity Feed</p>
                      <p className="text-xs mt-1">Your recent reports, votes, and project activities will appear here.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default Profile;
