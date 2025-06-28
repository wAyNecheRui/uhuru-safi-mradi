
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  formData: {
    email: string;
    password: string;
    type: 'citizen' | 'contractor' | 'government';
  };
  isLoading: boolean;
  onInputChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const userTypes = [
  { value: 'citizen', label: 'Citizen/Verifier' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'government', label: 'Government Official' }
];

const LoginForm: React.FC<LoginFormProps> = ({
  formData,
  isLoading,
  onInputChange,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <Input
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => onInputChange('email', e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <Input
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => onInputChange('password', e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md"
          value={formData.type}
          onChange={(e) => onInputChange('type', e.target.value)}
          disabled={isLoading}
        >
          {userTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>
      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing In...
          </>
        ) : (
          'Login'
        )}
      </Button>
    </form>
  );
};

export default LoginForm;
