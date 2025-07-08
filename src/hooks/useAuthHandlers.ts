
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthValidation } from './useAuthValidation';
import type { AuthFormData } from './useAuthForm';

export const useAuthHandlers = (
  formData: AuthFormData,
  resetForm: () => void,
  setActiveTab: (tab: string) => void
) => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { validateForm } = useAuthValidation();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData, true)) return;

    console.log('Login attempt for:', formData.email);
    setIsLoading(true);
    
    try {
      const { user, error } = await signIn(formData.email, formData.password);
      
      if (error) {
        console.error('Login failed:', error);
        
        if (error.message?.includes('Invalid login credentials')) {
          toast.error("Invalid email or password. Please check your credentials and try again.");
        } else if (error.message?.includes('Email not confirmed')) {
          toast.error("Please check your email and click the confirmation link before logging in.");
        } else {
          toast.error(error.message || "Login failed. Please try again.");
        }
        return;
      }

      if (user) {
        console.log('Login successful for:', user.email);
        toast.success(`Welcome back, ${user.name}!`);
        navigate(`/${user.user_type}`, { replace: true });
      } else {
        toast.error("Login failed. Please try again.");
      }
      
    } catch (error: any) {
      console.error('Login exception:', error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [formData.email, formData.password, signIn, navigate, validateForm]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) return;

    console.log('Registration attempt for:', formData.email);
    setIsLoading(true);
    
    try {
      const { error } = await signUp(formData.email, formData.password, formData);
      
      if (error) {
        console.error('Registration failed:', error);
        
        if (error.message?.includes('already registered') || error.message?.includes('already been registered')) {
          toast.error("An account with this email already exists. Please try logging in instead.");
          setActiveTab('login');
        } else {
          toast.error(error.message || "Registration failed. Please try again.");
        }
        return;
      }
      
      console.log('Registration successful');
      toast.success(
        "Registration successful! Please check your email to verify your account before logging in.",
        { duration: 6000 }
      );

      resetForm();
      setActiveTab('login');
      
    } catch (error: any) {
      console.error('Registration exception:', error);
      toast.error("An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  }, [formData, signUp, validateForm, resetForm, setActiveTab]);

  return {
    handleLogin,
    handleRegister,
    isLoading
  };
};
