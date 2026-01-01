import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, User, Mail, Phone, MapPin, Building, Briefcase, FileText, CreditCard, Calendar, Shield, Users, Eye, EyeOff } from 'lucide-react';
import UserTypeSelector from './UserTypeSelector';
import { 
  KENYA_COUNTIES, 
  GOVERNMENT_DEPARTMENTS, 
  GOVERNMENT_POSITIONS, 
  NCA_CATEGORIES, 
  AGPO_CATEGORIES,
  CONTRACTOR_SPECIALIZATIONS,
  ID_TYPES,
  GENDER_OPTIONS,
  CLEARANCE_LEVELS
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
    <form onSubmit={onSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* User Type Selection */}
      <UserTypeSelector
        selectedType={formData.type}
        onTypeChange={(type) => onInputChange('type', type)}
        disabled={isLoading}
      />

      {/* Personal Information Section */}
      <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
        <h4 className="font-medium text-slate-900 flex items-center">
          <User className="h-4 w-4 mr-2" />
          Personal Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Full Name (As per ID) *</label>
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
            <label className="block text-sm font-medium text-slate-700">Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="e.g., 0712345678"
                value={formData.phone}
                onChange={(e) => onInputChange('phone', e.target.value)}
                disabled={isLoading}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Gender *</label>
            <Select value={formData.gender} onValueChange={(value) => onInputChange('gender', value)}>
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Date of Birth *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => onInputChange('date_of_birth', e.target.value)}
                disabled={isLoading}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">ID Type *</label>
            <Select value={formData.id_type} onValueChange={(value) => onInputChange('id_type', value)}>
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="Select ID type" />
              </SelectTrigger>
              <SelectContent>
                {ID_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              {formData.id_type === 'national_id' ? 'National ID Number' : 'ID/Passport Number'} *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={formData.id_type === 'national_id' ? 'e.g., 12345678' : 'Enter ID number'}
                value={formData.national_id}
                onChange={(e) => onInputChange('national_id', e.target.value)}
                disabled={isLoading}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-slate-500">This will be verified against government records</p>
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          Location (County of Residence)
        </h4>
        <p className="text-xs text-blue-700">
          {formData.type === 'citizen' && 'Your county determines which issues you can vote on and verify.'}
          {formData.type === 'contractor' && 'You can register for multiple counties after verification.'}
          {formData.type === 'government' && 'Your assigned counties will be set by administration after verification.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">County *</label>
            <Select value={formData.county} onValueChange={(value) => onInputChange('county', value)}>
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="Select county" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {KENYA_COUNTIES.map(county => (
                  <SelectItem key={county} value={county}>{county}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Sub-County</label>
            <Input
              placeholder="Enter sub-county"
              value={formData.sub_county}
              onChange={(e) => onInputChange('sub_county', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Ward</label>
            <Input
              placeholder="Enter ward"
              value={formData.ward}
              onChange={(e) => onInputChange('ward', e.target.value)}
              disabled={isLoading}
            />
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
      
      {/* Contractor-specific fields (AGPO & NCA aligned) */}
      {formData.type === 'contractor' && (
        <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="font-medium text-orange-900 flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Contractor Registration (NCA & AGPO Aligned)
          </h4>
          <p className="text-xs text-orange-700">
            Information aligned with NCA registration and AGPO requirements for government procurement.
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
              <label className="block text-sm font-medium text-slate-700">Company Registration Number</label>
              <Input
                placeholder="e.g., PVT-XXXXXXXX"
                value={formData.company_registration_number}
                onChange={(e) => onInputChange('company_registration_number', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">KRA PIN *</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="e.g., P000000000X"
                  value={formData.kra_pin}
                  onChange={(e) => onInputChange('kra_pin', e.target.value.toUpperCase())}
                  disabled={isLoading}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">NCA Category *</label>
              <Select value={formData.nca_category} onValueChange={(value) => onInputChange('nca_category', value)}>
                <SelectTrigger disabled={isLoading}>
                  <SelectValue placeholder="Select NCA category" />
                </SelectTrigger>
                <SelectContent>
                  {NCA_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Years in Business</label>
              <Input
                type="number"
                placeholder="e.g., 5"
                value={formData.years_in_business}
                onChange={(e) => onInputChange('years_in_business', e.target.value)}
                disabled={isLoading}
                min="0"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Primary Specialization *</label>
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
                  I am registered under AGPO (Access to Government Procurement Opportunities)
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
                  <p className="text-xs text-slate-500">30% of government tenders are reserved for AGPO registered suppliers.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Government-specific fields (GHRIS aligned) */}
      {formData.type === 'government' && (
        <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="font-medium text-purple-900 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Government Official Registration
          </h4>
          <p className="text-xs text-purple-700">
            Your account requires verification before activation. Provide your official details as per GHRIS records.
          </p>
          
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
              <label className="block text-sm font-medium text-slate-700">Employee/Staff Number *</label>
              <Input
                placeholder="e.g., EMP/12345"
                value={formData.employee_number}
                onChange={(e) => onInputChange('employee_number', e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Office Phone</label>
              <Input
                placeholder="e.g., 020-XXXXXXX"
                value={formData.office_phone}
                onChange={(e) => onInputChange('office_phone', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Supervisor Name</label>
              <Input
                placeholder="Name of immediate supervisor"
                value={formData.supervisor_name}
                onChange={(e) => onInputChange('supervisor_name', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
            <strong>Note:</strong> Government accounts require manual verification. Your account will be activated 
            after your credentials are verified against GHRIS records. Clearance level and county assignments 
            will be set by system administrators.
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

      {/* Important Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-2">
        <p><strong>Important:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Your National ID/Passport number will be verified against government records.</li>
          <li>County selection at registration is based on your residence and cannot be changed without verification.</li>
          <li>
            {formData.type === 'citizen' && 'You can vote and verify issues within your registered county.'}
            {formData.type === 'contractor' && 'After verification, you can register for additional counties.'}
            {formData.type === 'government' && 'County assignments are managed by system administrators.'}
          </li>
          <li>False information may result in account suspension and legal action.</li>
        </ul>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white py-2.5"
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
  );
};

export default RegistrationForm;
