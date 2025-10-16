import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Award, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { RoleRequestModal } from '@/components/RoleRequestModal';
import { VerificationStatusBadge } from '@/components/VerificationStatusBadge';
import { RoleService } from '@/services/RoleService';
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
  'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const { user, roles } = useAuth();
  const { userProfile, loading: profileLoading, updateProfile } = useProfile();
  const [isRoleRequestOpen, setIsRoleRequestOpen] = useState(false);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    location: '',
    county: '',
    sub_county: '',
    ward: '',
    national_id: '',
    date_of_birth: '',
    gender: ''
  });

  React.useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        phone_number: userProfile.phone_number || '',
        location: userProfile.location || '',
        county: userProfile.county || '',
        sub_county: userProfile.sub_county || '',
        ward: userProfile.ward || '',
        national_id: userProfile.national_id || '',
        date_of_birth: userProfile.date_of_birth || '',
        gender: userProfile.gender || ''
      });
    }
  }, [userProfile]);

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
    const success = await updateProfile(formData);
    if (success) {
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="roles">
                <Shield className="h-4 w-4 mr-2" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="verification">
                <Award className="h-4 w-4 mr-2" />
                Verification
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="0700 000 000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="national_id">National ID</Label>
                      <Input
                        id="national_id"
                        value={formData.national_id}
                        onChange={(e) => handleInputChange('national_id', e.target.value)}
                        placeholder="ID Number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Location Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="county">County *</Label>
                      <Select value={formData.county} onValueChange={(value) => handleInputChange('county', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select county" />
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
                      <Label htmlFor="sub_county">Sub-County</Label>
                      <Input
                        id="sub_county"
                        value={formData.sub_county}
                        onChange={(e) => handleInputChange('sub_county', e.target.value)}
                        placeholder="Sub-county"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="ward">Ward</Label>
                      <Input
                        id="ward"
                        value={formData.ward}
                        onChange={(e) => handleInputChange('ward', e.target.value)}
                        placeholder="Ward"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Detailed Address</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Street address, landmarks, etc."
                    />
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

            {/* Roles Tab */}
            <TabsContent value="roles" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Your Roles</h3>
                  <Button onClick={() => setIsRoleRequestOpen(true)} size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Request Role
                  </Button>
                </div>

                <div className="grid gap-3">
                  {roles.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No roles assigned yet</p>
                  ) : (
                    roles.map(role => (
                      <div key={role} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium capitalize">{role}</p>
                            <p className="text-sm text-muted-foreground">Active role</p>
                          </div>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Verification Tab */}
            <TabsContent value="verification" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Verification Requests</h3>

                {verificationRequests.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No verification requests</p>
                    <Button 
                      onClick={() => setIsRoleRequestOpen(true)} 
                      className="mt-4"
                      variant="outline"
                    >
                      Request Role Verification
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {verificationRequests.map(request => (
                      <div key={request.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium capitalize">
                              {request.requested_role} Role
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Requested {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <VerificationStatusBadge status={request.status} />
                        </div>
                        
                        {request.justification && (
                          <p className="text-sm text-muted-foreground border-t pt-2">
                            {request.justification}
                          </p>
                        )}
                        
                        {request.review_notes && (
                          <div className="bg-muted p-3 rounded text-sm">
                            <p className="font-medium mb-1">Review Notes:</p>
                            <p>{request.review_notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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