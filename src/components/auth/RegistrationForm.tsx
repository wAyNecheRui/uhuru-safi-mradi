import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, User, Mail, Phone, Building, FileText, Shield, Users, Eye, EyeOff } from 'lucide-react';
import UserTypeSelector from './UserTypeSelector';
import SocialAuthButtons from './SocialAuthButtons';
import AuthDivider from './AuthDivider';
import { 
  KENYA_COUNTIES, 
  GOVERNMENT_DEPARTMENTS, 
  GOVERNMENT_POSITIONS, 
  AGPO_CATEGORIES,
  CONTRACTOR_SPECIALIZATIONS,
} from '@/constants/kenyaAdministrativeUnits';

interface RegistrationFormProps {
  formData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone: string;
    type: 'citizen' | 'contractor' | 'government';
    national_id: string;
    id_type: string;
    gender: string;
    date_of_birth: string;
    county: string;
    sub_county: string;
    ward: string;
    skills: string;
    organization: string;
    kra_pin: string;
    company_registration_number: string;
    specialization: string;
    years_in_business: string;
    nca_category: string;
    is_agpo: boolean;
    agpo_category: string;
    department: string;
    position: string;
    employee_number: string;
    office_phone: string;
    supervisor_name: string;
    clearance_level: string;
  };
  isLoading: boolean;
  onInputChange: (field: string, value: string | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  formData,
  isLoading,
  onInputChange,
  onSubmit
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-6">
      {/* Social Auth for Citizens */}
      {formData.type === 'citizen' && (
        <>
          <SocialAuthButtons disabled={isLoading} />
          <AuthDivider text="or register with email" />
        </>
      )}

      <form onSubmit={onSubmit} className="space-y-5 max-h-[55vh] overflow-y-auto pr-2">
        {/* User Type Selection */}
        <UserTypeSelector
          selectedType={formData.type}
          onTypeChange={(type) => onInputChange('type', type)}
          disabled={isLoading}
        />

      {/* Essential Information Section */}
      <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
        <h4 className="font-medium text-slate-900 flex items-center">
          <User className="h-4 w-4 mr-2" />
          Basic Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => onInputChange('name', e.target.value)}
                disabled={isLoading}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => onInputChange('email', e.target.value)}
                disabled={isLoading}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="e.g., 0712345678"
                value={formData.phone}
                onChange={(e) => onInputChange('phone', e.target.value)}
                disabled={isLoading}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {formData.type === 'contractor' ? 'HQ County (optional)' : 'County *'}
            </label>
            <Select value={formData.county} onValueChange={(value) => onInputChange('county', value)}>
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder={formData.type === 'contractor' ? 'Select HQ county' : 'Select your county'} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {KENYA_COUNTIES.map(county => (
                  <SelectItem key={county} value={county}>{county}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.type !== 'contractor' && (
              <p className="text-[11px] text-slate-500">
                This will be locked to your account once saved.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Citizen-specific fields */}
      {formData.type === 'citizen' && (
        <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-900 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Skills (For Workforce Opportunities)
          </h4>
          <p className="text-xs text-green-700">Register your skills to be considered for project workforce opportunities in your area.</p>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Your Skills (Optional)</label>
            <Input
              placeholder="e.g., Construction, Plumbing, Electrical, Masonry"
              value={formData.skills}
              onChange={(e) => onInputChange('skills', e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
      )}
      
      {/* Contractor-specific fields (Simplified) */}
      {formData.type === 'contractor' && (
        <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="font-medium text-orange-900 flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Contractor Registration
          </h4>
          <p className="text-xs text-orange-700">
            Basic information to get started. Your credentials will be reviewed for verification.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Company/Business Name *</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Registered business name"
                  value={formData.organization}
                  onChange={(e) => onInputChange('organization', e.target.value)}
                  disabled={isLoading}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">KRA PIN</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="e.g., P000000000X"
                  value={formData.kra_pin}
                  onChange={(e) => onInputChange('kra_pin', e.target.value.toUpperCase())}
                  disabled={isLoading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Primary Specialization</label>
              <Select value={formData.specialization} onValueChange={(value) => onInputChange('specialization', value)}>
                <SelectTrigger disabled={isLoading}>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACTOR_SPECIALIZATIONS.map(spec => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 md:col-span-2 p-3 bg-white rounded border">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_agpo"
                  checked={formData.is_agpo}
                  onCheckedChange={(checked) => onInputChange('is_agpo', checked === true)}
                  disabled={isLoading}
                />
                <label htmlFor="is_agpo" className="text-sm font-medium text-slate-700">
                  AGPO registered (Women/Youth/PWD)
                </label>
              </div>
              
              {formData.is_agpo && (
                <div className="space-y-2 mt-2">
                  <label className="block text-sm font-medium text-slate-700">AGPO Category *</label>
                  <Select value={formData.agpo_category} onValueChange={(value) => onInputChange('agpo_category', value)}>
                    <SelectTrigger disabled={isLoading}>
                      <SelectValue placeholder="Select AGPO category" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGPO_CATEGORIES.filter(cat => cat.value !== 'not_applicable').map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Government-specific fields (Simplified) */}
      {formData.type === 'government' && (
        <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="font-medium text-purple-900 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Government Official Registration
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Ministry/Department *</label>
              <Select value={formData.department} onValueChange={(value) => onInputChange('department', value)}>
                <SelectTrigger disabled={isLoading}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {GOVERNMENT_DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Position/Designation *</label>
              <Select value={formData.position} onValueChange={(value) => onInputChange('position', value)}>
                <SelectTrigger disabled={isLoading}>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {GOVERNMENT_POSITIONS.map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Employee/Staff Number</label>
              <Input
                placeholder="e.g., EMP/12345"
                value={formData.employee_number}
                onChange={(e) => onInputChange('employee_number', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

        </div>
      )}

      {/* Password Section */}
      <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
        <h4 className="font-medium text-slate-900">Account Security</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Password *</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={(e) => onInputChange('password', e.target.value)}
                disabled={isLoading}
                required
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Confirm Password *</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => onInputChange('confirmPassword', e.target.value)}
                disabled={isLoading}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes - Simplified for citizens */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-2">
        <p><strong>Important:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          {formData.type === 'citizen' ? (
            <>
              <li>You can report issues and vote on problems in your registered county.</li>
              <li>Complete your profile later to access more features.</li>
            </>
          ) : (
            <>
              <li>Your National ID/Passport number will be verified against government records.</li>
              <li>County selection at registration is based on your residence and is permanent.</li>
              <li>
                {formData.type === 'contractor' && 'Contractors can bid on projects nationwide regardless of HQ county.'}
                {formData.type === 'government' && 'County assignments are managed by system administrators.'}
              </li>
              <li>False information may result in account suspension and legal action.</li>
            </>
          )}
        </ul>
      </div>

      <Button 
        type="submit" 
        className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white font-medium transition-all"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>
      </form>
    </div>
  );
};

export default RegistrationForm;
