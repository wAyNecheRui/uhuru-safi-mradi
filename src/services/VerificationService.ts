
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface VerificationRecord {
  id: string;
  user_id: string;
  verification_type: 'kra_pin' | 'eacc_clearance' | 'professional_credentials' | 'company_registration';
  reference_number: string;
  status: 'pending' | 'verified' | 'failed' | 'expired';
  verification_data: any;
  verified_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface KRAVerification {
  pin_number: string;
  taxpayer_name: string;
  registration_date: string;
  status: 'active' | 'inactive' | 'blocked';
  compliance_status: 'compliant' | 'non_compliant';
  last_return_date?: string;
}

export interface EACCClearance {
  clearance_number: string;
  applicant_name: string;
  id_number: string;
  clearance_type: 'individual' | 'company';
  status: 'cleared' | 'pending' | 'rejected';
  issue_date: string;
  expiry_date: string;
  verification_code: string;
}

export interface ProfessionalCredentials {
  credential_type: 'engineering' | 'architecture' | 'construction' | 'surveying';
  registration_number: string;
  professional_body: string;
  holder_name: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'suspended' | 'expired';
}

export class VerificationService {
  // Verify KRA PIN
  static async verifyKRAPin(pinData: {
    pin_number: string;
    taxpayer_name: string;
  }): Promise<VerificationRecord> {
    const { data, error } = await supabase.functions.invoke('verify-kra-pin', {
      body: pinData
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.verification;
  }

  // Verify EACC clearance
  static async verifyEACCClearance(clearanceData: {
    clearance_number: string;
    id_number: string;
    verification_code: string;
  }): Promise<VerificationRecord> {
    const { data, error } = await supabase.functions.invoke('verify-eacc-clearance', {
      body: clearanceData
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.verification;
  }

  // Verify professional credentials
  static async verifyProfessionalCredentials(credentialData: {
    credential_type: string;
    registration_number: string;
    professional_body: string;
  }): Promise<VerificationRecord> {
    const { data, error } = await supabase.functions.invoke('verify-professional-credentials', {
      body: credentialData
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.verification;
  }

  // Get user verifications
  static async getUserVerifications(userId: string): Promise<VerificationRecord[]> {
    const { data, error } = await supabase
      .from('verification_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  // Bulk verify contractor
  static async bulkVerifyContractor(contractorData: {
    user_id: string;
    kra_pin: string;
    eacc_clearance: string;
    professional_credentials: any[];
  }): Promise<VerificationRecord[]> {
    const { data, error } = await supabase.functions.invoke('bulk-verify-contractor', {
      body: contractorData
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.verifications;
  }

  // Check verification status
  static async checkVerificationStatus(verificationId: string): Promise<VerificationRecord> {
    const { data, error } = await supabase
      .from('verification_records')
      .select('*')
      .eq('id', verificationId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Refresh expired verifications
  static async refreshVerification(verificationId: string): Promise<VerificationRecord> {
    const { data, error } = await supabase.functions.invoke('refresh-verification', {
      body: { verificationId }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.verification;
  }
}
