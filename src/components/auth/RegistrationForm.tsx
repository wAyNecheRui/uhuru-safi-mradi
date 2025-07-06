
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User, Mail, Phone, MapPin, Building, Wrench } from 'lucide-react';
import UserTypeSelector from './UserTypeSelector';

interface RegistrationFormProps {
  formData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone: string;
    location: string;
    type: 'citizen' | 'contractor' | 'government';
    organization: string;
    skills: string;
  };
  isLoading: boolean;
  onInputChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  formData,
  isLoading,
  onInputChange,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Full Name *</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            disabled={isLoading}
            className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            placeholder="Enter your email address"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            disabled={isLoading}
            className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Phone Number</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="e.g., +254 700 000 000"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            disabled={isLoading}
            className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Location/County</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="e.g., Nairobi County"
            value={formData.location}
            onChange={(e) => onInputChange('location', e.target.value)}
            disabled={isLoading}
            className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <UserTypeSelector
        selectedType={formData.type}
        onTypeChange={(type) => onInputChange('type', type)}
        disabled={isLoading}
      />
      
      {formData.type === 'contractor' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Organization/Company</label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Company or organization name"
              value={formData.organization}
              onChange={(e) => onInputChange('organization', e.target.value)}
              disabled={isLoading}
              className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {formData.type === 'citizen' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Skills (Optional)</label>
          <div className="relative">
            <Wrench className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="e.g., Construction, plumbing, electrical"
              value={formData.skills}
              onChange={(e) => onInputChange('skills', e.target.value)}
              disabled={isLoading}
              className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Password *</label>
        <Input
          type="password"
          placeholder="Create a strong password (min. 6 characters)"
          value={formData.password}
          onChange={(e) => onInputChange('password', e.target.value)}
          disabled={isLoading}
          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
          minLength={6}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Confirm Password *</label>
        <Input
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => onInputChange('confirmPassword', e.target.value)}
          disabled={isLoading}
          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
        <p><strong>Note:</strong> Your role selection determines your dashboard access and cannot be changed after registration. Please choose carefully.</p>
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
