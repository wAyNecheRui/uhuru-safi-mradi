import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Award, Building, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { RoleRequestModal } from '@/components/RoleRequestModal';
import { VerificationStatusBadge } from '@/components/VerificationStatusBadge';
import { RoleService } from '@/services/RoleService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const counties = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu',
  'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa',
  'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const { user, roles } = useAuth();
  const { userProfile, contractorProfile, governmentProfile, loading: profileLoading, updateProfile, updateContractorProfile, updateGovernmentProfile } = useProfile();
  const [isRoleRequestOpen, setIsRoleRequestOpen] = useState(false);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  
  // Basic profile fields - only what was collected during registration
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile({
      full_name: formData.full_name,
      phone_number: formData.phone_number,
      location: formData.location,
      county: formData.location // Also update county with location
    });
    if (success) {
      onClose();
    }
  };

  const handleContractorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const specializations = contractorFormData.specialization
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    
    const success = await updateContractorProfile({
      company_name: contractorFormData.company_name,
      kra_pin: contractorFormData.kra_pin || undefined,
      specialization: specializations.length > 0 ? specializations : undefined,
      years_in_business: contractorFormData.years_in_business ? parseInt(contractorFormData.years_in_business) : undefined
    });
    if (success) {
      onClose();
    }
  };

  const handleGovernmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateGovernmentProfile({
      department: governmentFormData.department,
      position: governmentFormData.position
    });
    if (success) {
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isContractor = user?.user_type === 'contractor';
  const isGovernment = user?.user_type === 'government';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5" />
                <span>My Profile</span>
                <div className="flex gap-2">
                  {roles.map(role => (
                    <Badge key={role} variant="secondary" className="capitalize">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className={`grid w-full ${isContractor || isGovernment ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              {isContractor && (
                <TabsTrigger value="contractor">
                  <Building className="h-4 w-4 mr-2" />
                  Company
                </TabsTrigger>
              )}
              {isGovernment && (
                <TabsTrigger value="government">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Department
                </TabsTrigger>
              )}
              <TabsTrigger value="roles">
                <Shield className="h-4 w-4 mr-2" />
                Roles
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab - Only registration fields */}
            <TabsContent value="profile" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        required
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone_number">Phone Number *</Label>
                      <Input
                        id="phone_number"
                        type="tel"
                        required
                        value={formData.phone_number}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        placeholder="+254 700 000 000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Location/County *</Label>
                      <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
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
                      <Label>Email</Label>
                      <Input
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <Label>Account Type</Label>
                      <Input
                        value={user?.user_type?.charAt(0).toUpperCase() + (user?.user_type?.slice(1) || '')}
                        disabled
                        className="bg-muted capitalize"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={profileLoading}>
                    {profileLoading ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Contractor Tab - Only fields from registration */}
            {isContractor && (
              <TabsContent value="contractor" className="space-y-4">
                <form onSubmit={handleContractorSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Company Information</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="company_name">Company/Organization Name *</Label>
                        <Input
                          id="company_name"
                          required
                          value={contractorFormData.company_name}
                          onChange={(e) => setContractorFormData(prev => ({ ...prev, company_name: e.target.value }))}
                          placeholder="Your company name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="kra_pin">KRA PIN</Label>
                        <Input
                          id="kra_pin"
                          value={contractorFormData.kra_pin}
                          onChange={(e) => setContractorFormData(prev => ({ ...prev, kra_pin: e.target.value }))}
                          placeholder="P000000000X"
                        />
                      </div>

                      <div>
                        <Label htmlFor="specialization">Specialization</Label>
                        <Input
                          id="specialization"
                          value={contractorFormData.specialization}
                          onChange={(e) => setContractorFormData(prev => ({ ...prev, specialization: e.target.value }))}
                          placeholder="e.g., Road construction, Building, Plumbing"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Separate multiple specializations with commas</p>
                      </div>

                      <div>
                        <Label htmlFor="years_in_business">Years in Business</Label>
                        <Input
                          id="years_in_business"
                          type="number"
                          value={contractorFormData.years_in_business}
                          onChange={(e) => setContractorFormData(prev => ({ ...prev, years_in_business: e.target.value }))}
                          placeholder="5"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={profileLoading}>
                      {profileLoading ? 'Saving...' : 'Save Company Info'}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            )}

            {/* Government Tab - Only fields from registration */}
            {isGovernment && (
              <TabsContent value="government" className="space-y-4">
                <form onSubmit={handleGovernmentSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Department Information</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="department">Department *</Label>
                        <Input
                          id="department"
                          required
                          value={governmentFormData.department}
                          onChange={(e) => setGovernmentFormData(prev => ({ ...prev, department: e.target.value }))}
                          placeholder="e.g., Ministry of Transport"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="position">Position *</Label>
                        <Input
                          id="position"
                          required
                          value={governmentFormData.position}
                          onChange={(e) => setGovernmentFormData(prev => ({ ...prev, position: e.target.value }))}
                          placeholder="e.g., Project Manager"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={profileLoading}>
                      {profileLoading ? 'Saving...' : 'Save Department Info'}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            )}

            {/* Roles Tab */}
            <TabsContent value="roles" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Your Roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {roles.length > 0 ? (
                      roles.map(role => (
                        <Badge key={role} className="capitalize px-3 py-1">
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No roles assigned yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Verification Requests</h3>
                  {verificationRequests.length > 0 ? (
                    <div className="space-y-3">
                      {verificationRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <span className="font-medium capitalize">{request.requested_role}</span>
                            <p className="text-sm text-muted-foreground">
                              Requested on {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <VerificationStatusBadge status={request.status} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No verification requests</p>
                  )}
                </div>

                <Button onClick={() => setIsRoleRequestOpen(true)} variant="outline">
                  <Award className="h-4 w-4 mr-2" />
                  Request Role Upgrade
                </Button>
              </div>
            </TabsContent>
          </Tabs>
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
