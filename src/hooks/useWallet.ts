import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface Wallet {
  id: string;
  user_id: string | null;
  wallet_type: 'citizen' | 'contractor' | 'government' | 'treasury' | 'escrow';
  balance: number;
  total_received: number;
  total_sent: number;
  total_withdrawn: number;
  status: 'active' | 'frozen' | 'closed';
  escrow_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  from_wallet_id: string | null;
  to_wallet_id: string | null;
  amount: number;
  transaction_type:
    | 'mint'
    | 'fund_escrow'
    | 'worker_payment'
    | 'contractor_payment'
    | 'peer_transfer'
    | 'withdrawal'
    | 'refund';
  reference: string | null;
  description: string | null;
  metadata: Record<string, any>;
  initiated_by: string | null;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  created_at: string;
}

/**
 * useWallet — fetches the current user's wallet + transaction history
 * and subscribes to live updates.
 */
export const useWallet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const walletQuery = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async (): Promise<Wallet | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('wallets' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Wallet | null;
    },
    enabled: !!user?.id,
  });

  const transactionsQuery = useQuery({
    queryKey: ['wallet-transactions', walletQuery.data?.id],
    queryFn: async (): Promise<WalletTransaction[]> => {
      if (!walletQuery.data?.id) return [];
      const { data, error } = await supabase
        .from('wallet_transactions' as any)
        .select('*')
        .or(`from_wallet_id.eq.${walletQuery.data.id},to_wallet_id.eq.${walletQuery.data.id}`)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as WalletTransaction[];
    },
    enabled: !!walletQuery.data?.id,
  });

  // Real-time updates on the wallet row + ledger
  useEffect(() => {
    if (!walletQuery.data?.id) return;
    const channel = supabase
      .channel(`wallet-${walletQuery.data.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallets', filter: `id=eq.${walletQuery.data.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['wallet', user?.id] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_transactions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['wallet-transactions', walletQuery.data?.id] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [walletQuery.data?.id, queryClient, user?.id]);

  return {
    wallet: walletQuery.data,
    transactions: transactionsQuery.data ?? [],
    isLoading: walletQuery.isLoading || transactionsQuery.isLoading,
    error: walletQuery.error || transactionsQuery.error,
    refetch: () => {
      walletQuery.refetch();
      transactionsQuery.refetch();
    },
  };
};
