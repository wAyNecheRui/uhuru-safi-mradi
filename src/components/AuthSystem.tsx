
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';
import AuthHeader from './auth/AuthHeader';
import AuthLoading from './auth/AuthLoading';
import LoginTabContent from './auth/LoginTabContent';
import RegistrationTabContent from './auth/RegistrationTabContent';

const AuthSystem = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  
  const { formData, handleInputChange, resetForm } = useAuthForm();
  const { handleLogin, handleRegister, isLoading } = useAuthHandlers(
    formData,
    resetForm,
    setActiveTab
  );

  // Show loading state during auth operations
  if (authLoading || isLoading) {
    return <AuthLoading isLoading={true} />;
  }

  // If user is authenticated, redirect them to their dashboard
  if (user) {
    console.log('User authenticated, redirecting to dashboard:', user.user_type);
    navigate(`/${user.user_type}`, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-md">
        <AuthHeader />
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-slate-100 to-blue-100">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
              >
                Register
              </TabsTrigger>
            </TabsList>

            <LoginTabContent
              formData={formData}
              isLoading={isLoading}
              onInputChange={handleInputChange}
              onSubmit={handleLogin}
            />

            <RegistrationTabContent
              formData={formData}
              isLoading={isLoading}
              onInputChange={handleInputChange}
              onSubmit={handleRegister}
            />
          </Tabs>
          
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              disabled={isLoading}
              className="text-slate-600 hover:text-blue-600 hover:bg-slate-50"
            >
              ← Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthSystem;
