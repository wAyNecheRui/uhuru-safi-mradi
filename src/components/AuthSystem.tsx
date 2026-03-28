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
import RoleSelectionScreen from './auth/RoleSelectionScreen';
import RegistrationStep1 from './auth/RegistrationStep1';
import RegistrationStep2 from './auth/RegistrationStep2';
import RegistrationSuccess from './auth/RegistrationSuccess';

type RegistrationPhase = 'role-select' | 'step1' | 'step2' | 'success';

const AuthSystem = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [regPhase, setRegPhase] = useState<RegistrationPhase>('role-select');
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'contractor' | 'government'>('citizen');
  
  const { formData, handleInputChange, resetForm } = useAuthForm();
  const { handleLogin, handleRegister, isLoading } = useAuthHandlers(
    formData,
    resetForm,
    setActiveTab
  );

  // Redirect authenticated users
  useEffect(() => {
    if (user && !authLoading) {
      navigate(`/${user.user_type}`, { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading || user) {
    return <UnifiedLoader />;
  }

  // Handle role selection
  const handleRoleSelect = (role: 'citizen' | 'contractor' | 'government') => {
    setSelectedRole(role);
    handleInputChange('type', role);
    setRegPhase('step1');
  };

  // Handle step 1 submit — creates account then moves to step 2 or success
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Use the existing handleRegister which calls signUp
    await handleRegister(e);
    // After successful registration, move to step 2 or success
    if (selectedRole === 'citizen') {
      setRegPhase('success');
    } else {
      setRegPhase('step2');
    }
  };

  // Handle switching to register tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'register') {
      setRegPhase('role-select');
    }
  };

  const handleContinueAfterSuccess = () => {
    // Navigate to login or dashboard
    if (selectedRole === 'citizen') {
      setActiveTab('login');
      setRegPhase('role-select');
    } else {
      setActiveTab('login');
      setRegPhase('role-select');
    }
  };

  // Connect "Already have an account?" from RoleSelectionScreen
  const handleSignInLink = () => {
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">US</span>
          </div>
        </div>
        <h1 className="text-2xl font-display font-semibold text-foreground mb-1">Uhuru Safi</h1>
        <p className="text-sm text-muted-foreground">Kenya's Official Government Project Transparency Platform</p>
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-md shadow-card-hover border-border/50">
        <CardContent className="p-5 sm:p-7">
          {/* Show tabs only on login and role-select */}
          {(activeTab === 'login' || (activeTab === 'register' && regPhase === 'role-select')) ? (
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2 h-11 bg-muted p-1 rounded-xl mb-6">
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
                  Join now
                </TabsTrigger>
              </TabsList>

              {activeTab === 'login' && (
                <LoginTabContent
                  formData={formData}
                  isLoading={isLoading}
                  onInputChange={handleInputChange}
                  onSubmit={handleLogin}
                />
              )}

              {activeTab === 'register' && regPhase === 'role-select' && (
                <RoleSelectionScreen onSelectRole={handleRoleSelect} />
              )}
            </Tabs>
          ) : activeTab === 'register' && regPhase === 'step1' ? (
            <RegistrationStep1
              role={selectedRole}
              formData={formData}
              isLoading={isLoading}
              onInputChange={handleInputChange}
              onSubmit={handleStep1Submit}
              onBack={() => setRegPhase('role-select')}
            />
          ) : activeTab === 'register' && regPhase === 'step2' && selectedRole !== 'citizen' ? (
            <RegistrationStep2
              role={selectedRole}
              isKenya={formData.country === 'KE'}
              userName={formData.name.split(' ')[0] || 'there'}
              onSkip={handleContinueAfterSuccess}
              onComplete={() => setRegPhase('success')}
            />
          ) : activeTab === 'register' && regPhase === 'success' ? (
            <RegistrationSuccess
              role={selectedRole}
              userName={formData.name.split(' ')[0] || 'there'}
              onContinue={handleContinueAfterSuccess}
            />
          ) : null}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-5 text-center">
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
      <p className="mt-6 text-xs text-muted-foreground text-center max-w-sm">
        By continuing, you agree to the Terms of Service and Privacy Policy of the Government of Kenya.
      </p>
    </div>
  );
};

export default AuthSystem;
