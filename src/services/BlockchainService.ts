
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface BlockchainTransaction {
  id: string;
  project_id: string;
  transaction_hash: string;
  block_number: number;
  transaction_type: 'project_creation' | 'milestone_completion' | 'payment_release' | 'dispute_resolution';
  data_hash: string;
  smart_contract_address: string;
  gas_used: number;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  confirmed_at?: string;
}

export interface SmartContract {
  id: string;
  project_id: string;
  contract_address: string;
  contract_type: 'escrow' | 'milestone' | 'verification';
  abi: string;
  deployment_hash: string;
  status: 'deployed' | 'verified' | 'terminated';
  created_at: string;
}

export interface ProjectRecord {
  id: string;
  project_id: string;
  record_type: 'creation' | 'milestone' | 'completion' | 'payment' | 'dispute';
  data_hash: string;
  ipfs_hash?: string;
  blockchain_hash: string;
  timestamp: string;
  verified: boolean;
}

export class BlockchainService {
  // Create project record on blockchain
  static async createProjectRecord(projectData: {
    project_id: string;
    record_type: string;
    data: any;
  }): Promise<BlockchainTransaction> {
    const { data, error } = await supabase.functions.invoke('create-blockchain-record', {
      body: projectData
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.transaction;
  }

  // Deploy smart contract for project
  static async deploySmartContract(contractData: {
    project_id: string;
    contract_type: string;
    parameters: any;
  }): Promise<SmartContract> {
    const { data, error } = await supabase.functions.invoke('deploy-smart-contract', {
      body: contractData
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.contract;
  }

  // Record milestone completion on blockchain
  static async recordMilestoneCompletion(milestoneData: {
    project_id: string;
    milestone_id: string;
    completion_proof: any;
  }): Promise<BlockchainTransaction> {
    const { data, error } = await supabase.functions.invoke('record-milestone-blockchain', {
      body: milestoneData
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.transaction;
  }

  // Verify transaction on blockchain
  static async verifyTransaction(transactionHash: string): Promise<boolean> {
    const { data, error } = await supabase.functions.invoke('verify-blockchain-transaction', {
      body: { transactionHash }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.verified;
  }

  // Get project blockchain records
  static async getProjectRecords(projectId: string): Promise<ProjectRecord[]> {
    const { data, error } = await supabase
      .from('project_blockchain_records')
      .select('*')
      .eq('project_id', projectId)
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  // Get smart contracts for project
  static async getProjectContracts(projectId: string): Promise<SmartContract[]> {
    const { data, error } = await supabase
      .from('smart_contracts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }
}
