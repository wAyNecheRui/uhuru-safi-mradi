
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from './auth/LoginForm';
import RegistrationForm from './auth/RegistrationForm';

const AuthSystem = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, register } = useAuth();
  
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.email, formData.password, formData.type);
      
      toast({
        title: "Login Successful",
        description: `Welcome back! Redirecting to ${formData.type} dashboard.`,
      });

      setTimeout(() => {
        navigate(`/${formData.type}`);
      }, 1000);
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await register(formData);
      
      toast({
        title: "Registration Successful",
        description: `Welcome ${formData.name}! Your ${formData.type} account has been created.`,
      });

      setTimeout(() => {
        navigate(`/${formData.type}`);
      }, 1000);
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-md">
        <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-green-50 rounded-t-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Uhuru Safi Platform
          </CardTitle>
          <p className="text-gray-600 mt-2">Transparent Government Project Delivery</p>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-blue-100 to-green-100">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-green-600 data-[state=active]:text-white"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-green-600 data-[state=active]:text-white"
              >
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-6">
              <LoginForm
                formData={formData}
                isLoading={isLoading}
                onInputChange={handleInputChange}
                onSubmit={handleLogin}
              />
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-6">
              <RegistrationForm
                formData={formData}
                isLoading={isLoading}
                onInputChange={handleInputChange}
                onSubmit={handleRegister}
              />
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              disabled={isLoading}
              className="text-blue-600 hover:text-green-600 hover:bg-blue-50"
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
