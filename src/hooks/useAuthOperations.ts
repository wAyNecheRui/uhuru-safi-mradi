
import { useState } from 'react';
import { signInUser, signUpUser, signOutUser } from '@/services/authService';
import type { AuthUser, SignUpData } from '@/types/auth';

export const useAuthOperations = () => {
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string): Promise<{ user: AuthUser | null; error: any }> => {
    setLoading(true);
    try {
      const result = await signInUser(email, password);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: SignUpData): Promise<{ error: any }> => {
    setLoading(true);
    try {
      const result = await signUpUser(email, password, userData);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOutUser();
    } finally {
      setLoading(false);
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    loading
  };
};
