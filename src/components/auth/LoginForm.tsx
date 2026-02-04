import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import SocialAuthButtons from './SocialAuthButtons';
import AuthDivider from './AuthDivider';
import ForgotPasswordModal from './ForgotPasswordModal';

interface LoginFormProps {
  formData: {
    email: string;
    password: string;
  };
  isLoading: boolean;
  onInputChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  formData,
  isLoading,
  onInputChange,
  onSubmit
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <div className="space-y-6">
      {/* Social Auth */}
      <SocialAuthButtons disabled={isLoading} />

      <AuthDivider text="or continue with email" />

      {/* Email/Password Form */}
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-sm font-medium text-slate-700">
            Email address
          </Label>
          <Input
            id="login-email"
            type="email"
            placeholder="name@example.com"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            disabled={isLoading}
            className="h-11 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-sm font-medium text-slate-700">
              Password
            </Label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => onInputChange('password', e.target.value)}
              disabled={isLoading}
              className="h-11 pr-10 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white font-medium transition-all"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <ForgotPasswordModal 
        open={showForgotPassword} 
        onOpenChange={setShowForgotPassword} 
      />
    </div>
  );
};

export default LoginForm;
