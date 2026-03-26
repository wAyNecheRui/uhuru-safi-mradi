
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';
import UnifiedLoader from './ui/unified-loader';
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

  // If user is authenticated, redirect them to their dashboard
  useEffect(() => {
    if (user && !authLoading) {
      navigate(`/${user.user_type}`, { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Single unified loading screen for all auth states
  if (authLoading || isLoading || user) {
    return <UnifiedLoader />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">US</span>
          </div>
        </div>
        <h1 className="text-2xl font-display font-semibold text-foreground mb-2">Uhuru Safi</h1>
        <p className="text-sm text-muted-foreground">Kenya's Official Government Project Transparency Platform</p>
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-md shadow-card-hover border-border/50">
        <CardContent className="p-6 sm:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 h-11 bg-muted p-1 rounded-xl">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg font-medium"
              >
                Sign in
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg font-medium"
              >
                Create account
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
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-6 text-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          disabled={isLoading}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back to home
        </Button>
      </div>

      {/* Terms */}
      <p className="mt-8 text-xs text-muted-foreground text-center max-w-sm">
        By continuing, you agree to the Terms of Service and Privacy Policy of the Government of Kenya.
      </p>
    </div>
  );
};

export default AuthSystem;
