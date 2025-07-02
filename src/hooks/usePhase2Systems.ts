
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Simple types to avoid import issues
interface EscrowAccount {
  id: string;
  project_id: string;
  total_amount: number;
  held_amount: number;
  status: string;
}

interface VerificationResult {
  id: string;
  user_id: string;
  verification_type: string;
  status: string;
  verified_at?: string;
}

export const usePhase2Systems = () => {
  const { user, supabase } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Escrow Operations
  const createEscrowAccount = useMutation({
    mutationFn: async (projectData: {
      project_id: string;
      total_amount: number;
      milestones: any[];
    }) => {
      const { data, error } = await supabase.functions.invoke('create-escrow-account', {
        body: projectData
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Escrow account created successfully');
      queryClient.invalidateQueries({ queryKey: ['escrowAccounts'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to create escrow account: ${error.message}`);
    }
  });

  // Payment Operations
  const initiatePayment = useMutation({
    mutationFn: async (paymentData: {
      escrow_account_id: string;
      amount: number;
      phone_number: string;
      payment_method: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('initiate-payment', {
        body: paymentData
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Payment initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: any) => {
      toast.error(`Payment failed: ${error.message}`);
    }
  });

  // Verification Operations
  const verifyKRAPin = useMutation({
    mutationFn: async (pinData: { pin: string; user_id: string }) => {
      const { data, error } = await supabase.functions.invoke('verify-kra-pin', {
        body: pinData
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('KRA PIN verified successfully');
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
    onError: (error: any) => {
      toast.error(`KRA verification failed: ${error.message}`);
    }
  });

  // Get user verifications - Updated to work with current types
  const { data: verifications = [] } = useQuery({
    queryKey: ['verifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        // Use the supabase client directly with proper typing
        const { data, error } = await supabase
          .schema('public')
          .from('user_verifications' as any)
          .select('*')
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error fetching verifications:', error);
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error('Error in verifications query:', error);
        return [];
      }
    },
    enabled: !!user?.id
  });

  return {
    // Escrow
    createEscrowAccount: createEscrowAccount.mutate,
    isCreatingEscrow: createEscrowAccount.isPending,
    
    // Payments
    initiatePayment: initiatePayment.mutate,
    isInitiatingPayment: initiatePayment.isPending,
    
    // Verification
    verifyKRAPin: verifyKRAPin.mutate,
    isVerifyingKRA: verifyKRAPin.isPending,
    verifications,
    
    // General
    loading
  };
};
