import { supabase } from '@/integrations/supabase/client';

export interface VerificationRecord {
  id: string;
  user_id: string;
  verification_type: string;
  reference_number: string;
  status: string;
  verification_data: any;
  verification_notes?: string;
  verified_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface KRAVerification {
  pin_number: string;
  taxpayer_name: string;
}

export interface NationalIdVerification {
  id_number: string;
  holder_name: string;
}

export class VerificationService {
  // Verify KRA PIN - submits for real verification (pending government review)
  static async verifyKRAPin(pinData: {
    pin_number: string;
    taxpayer_name: string;
  }): Promise<VerificationRecord> {
    const { data, error } = await supabase.functions.invoke('verify-kra-pin', {
      body: { ...pinData, verification_type: 'kra_pin' }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.verification;
  }

  // Verify National ID - submits for real verification (pending government review)
  static async verifyNationalId(idData: {
    id_number: string;
    holder_name: string;
  }): Promise<VerificationRecord> {
    const { data, error } = await supabase.functions.invoke('verify-kra-pin', {
      body: { ...idData, verification_type: 'national_id' }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.verification;
  }

  // Get user verifications
  static async getUserVerifications(userId: string): Promise<VerificationRecord[]> {
    const { data, error } = await supabase
      .from('user_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  // Check verification status
  static async checkVerificationStatus(verificationId: string): Promise<VerificationRecord> {
    const { data, error } = await supabase
      .from('user_verifications')
      .select('*')
      .eq('id', verificationId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Validate KRA PIN format client-side
  static isValidKRAPin(pin: string): boolean {
    return /^[PA]\d{9}[A-Z]$/.test(pin.trim().toUpperCase());
  }

  // Validate National ID format client-side (7-8 digits)
  static isValidNationalId(id: string): boolean {
    return /^\d{7,8}$/.test(id.trim());
  }
}