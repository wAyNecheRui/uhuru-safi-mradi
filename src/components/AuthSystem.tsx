
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from './auth/LoginForm';
import RegistrationForm from './auth/RegistrationForm';

const AuthSystem = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    location: '',
    type: 'citizen' as 'citizen' | 'contractor' | 'government',
    organization: '',
    skills: ''
  });

  // Redirect authenticated users
  useEffect(() => {
    if (user && !authLoading) {
      navigate(`/${user.user_type}`, { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const { user: loggedInUser, error } = await signIn(formData.email, formData.password);
      
      if (error) {
        toast.error(error.message || "Invalid credentials. Please try again.");
        return;
      }

      if (loggedInUser) {
        toast.success(`Welcome back, ${loggedInUser.name}!`);
      }
    } catch (error: any) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [formData.email, formData.password, signIn]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.name.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(formData.email, formData.password, formData);
      
      if (error) {
        if (error.message?.includes('already registered')) {
          toast.error("An account with this email already exists. Please try logging in instead.");
        } else {
          toast.error(error.message || "Registration failed. Please try again.");
        }
        return;
      }
      
      toast.success(
        "Registration successful! Please check your email to verify your account.",
        { duration: 6000 }
      );

      setActiveTab('login');
      setFormData(prev => ({ 
        ...prev, 
        password: '', 
        confirmPassword: '',
      }));
    } catch (error: any) {
      toast.error("An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  }, [formData, signUp]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-blue-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-md">
        <CardHeader className="text-center bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Uhuru Safi Platform
          </CardTitle>
          <p className="text-slate-600 mt-2">Transparent Government Project Delivery</p>
        </CardHeader>
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

            <TabsContent value="login" className="space-y-4 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Welcome back!</p>
                    <p>Sign in with your registered email and password.</p>
                  </div>
                </div>
              </div>
              <LoginForm
                formData={formData}
                isLoading={isLoading}
                onInputChange={handleInputChange}
                onSubmit={handleLogin}
              />
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">Create Your Account</p>
                    <p>Choose your role carefully - it determines your access level.</p>
                  </div>
                </div>
              </div>
              <RegistrationForm
                formData={formData}
                isLoading={isLoading}
                onInputChange={handleInputChange}
                onSubmit={handleRegister}
              />
            </TabsContent>
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
