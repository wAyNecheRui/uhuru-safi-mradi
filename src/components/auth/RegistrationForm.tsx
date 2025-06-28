
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
        <Input
          placeholder="Enter your full name"
          value={formData.name}
          onChange={(e) => onInputChange('name', e.target.value)}
          disabled={isLoading}
          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <Input
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => onInputChange('email', e.target.value)}
          disabled={isLoading}
          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <Input
          placeholder="e.g., +254 700 000 000"
          value={formData.phone}
          onChange={(e) => onInputChange('phone', e.target.value)}
          disabled={isLoading}
          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location/County</label>
        <Input
          placeholder="e.g., Nairobi County"
          value={formData.location}
          onChange={(e) => onInputChange('location', e.target.value)}
          disabled={isLoading}
          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <UserTypeSelector
        selectedType={formData.type}
        onTypeChange={(type) => onInputChange('type', type)}
        disabled={isLoading}
      />
      
      {formData.type === 'contractor' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
          <Input
            placeholder="Company/Organization name"
            value={formData.organization}
            onChange={(e) => onInputChange('organization', e.target.value)}
            disabled={isLoading}
            className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {formData.type === 'citizen' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skills (Optional)</label>
          <Input
            placeholder="Construction, plumbing, electrical, etc."
            value={formData.skills}
            onChange={(e) => onInputChange('skills', e.target.value)}
            disabled={isLoading}
            className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
        <Input
          type="password"
          placeholder="Create a password"
          value={formData.password}
          onChange={(e) => onInputChange('password', e.target.value)}
          disabled={isLoading}
          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
        <Input
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => onInputChange('confirmPassword', e.target.value)}
          disabled={isLoading}
          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
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
