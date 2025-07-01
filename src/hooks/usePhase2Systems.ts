
import { useState, useEffect } from 'react';
import { EscrowService, EscrowAccount, ProjectMilestone, PaymentTransaction } from '@/services/EscrowService';
import { BlockchainService, BlockchainTransaction, SmartContract } from '@/services/BlockchainService';
import { VerificationService, VerificationRecord } from '@/services/VerificationService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const usePhase2Systems = () => {
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([]);
  const [verificationRecords, setVerificationRecords] = useState<VerificationRecord[]>([]);
  const [blockchainTransactions, setBlockchainTransactions] = useState<BlockchainTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Escrow System Functions
  const createEscrowAccount = async (projectData: {
    project_id: string;
    total_amount: number;
    milestones: Omit<ProjectMilestone, 'id' | 'escrow_account_id'>[];
  }) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create an escrow account.",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const escrowAccount = await EscrowService.createEscrowAccount(projectData);
      toast({
        title: "Success",
        description: "Escrow account created successfully!",
      });
      return escrowAccount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create escrow account';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (paymentData: {
    escrow_account_id: string;
    amount: number;
    phone_number: string;
    payment_method: 'mpesa' | 'bank_transfer';
  }) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to initiate payment.",
        variant: "destructive"
      });
      return null;
    }

    try {
      const transaction = await EscrowService.initiatePayment(paymentData);
      toast({
        title: "Payment Initiated",
        description: `Payment of KES ${paymentData.amount.toLocaleString()} initiated successfully!`,
      });
      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate payment';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    }
  };

  // Blockchain System Functions
  const createBlockchainRecord = async (projectData: {
    project_id: string;
    record_type: string;
    data: any;
  }) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create blockchain records.",
        variant: "destructive"
      });
      return null;
    }

    try {
      const transaction = await BlockchainService.createProjectRecord(projectData);
      toast({
        title: "Blockchain Record Created",
        description: "Project record successfully stored on blockchain!",
      });
      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create blockchain record';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    }
  };

  // Verification System Functions
  const verifyKRAPin = async (pinData: {
    pin_number: string;
    taxpayer_name: string;
  }) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to verify KRA PIN.",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const verification = await VerificationService.verifyKRAPin(pinData);
      toast({
        title: "KRA PIN Verification",
        description: verification.status === 'verified' 
          ? "KRA PIN verified successfully!"
          : "KRA PIN verification failed.",
        variant: verification.status === 'verified' ? "default" : "destructive"
      });
      
      if (user) {
        await fetchUserVerifications(user.id);
      }
      
      return verification;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify KRA PIN';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyEACCClearance = async (clearanceData: {
    clearance_number: string;
    id_number: string;
    verification_code: string;
  }) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to verify EACC clearance.",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const verification = await VerificationService.verifyEACCClearance(clearanceData);
      toast({
        title: "EACC Clearance Verification",
        description: verification.status === 'verified' 
          ? "EACC clearance verified successfully!"
          : "EACC clearance verification failed.",
        variant: verification.status === 'verified' ? "default" : "destructive"
      });
      
      if (user) {
        await fetchUserVerifications(user.id);
      }
      
      return verification;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify EACC clearance';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user verifications
  const fetchUserVerifications = async (userId: string) => {
    try {
      const verifications = await VerificationService.getUserVerifications(userId);
      setVerificationRecords(verifications);
    } catch (err) {
      console.error('Error fetching verifications:', err);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    if (user) {
      fetchUserVerifications(user.id);
    }
  }, [user]);

  return {
    // State
    escrowAccounts,
    verificationRecords,
    blockchainTransactions,
    loading,
    error,
    
    // Escrow functions
    createEscrowAccount,
    initiatePayment,
    
    // Blockchain functions
    createBlockchainRecord,
    
    // Verification functions
    verifyKRAPin,
    verifyEACCClearance,
    fetchUserVerifications
  };
};
