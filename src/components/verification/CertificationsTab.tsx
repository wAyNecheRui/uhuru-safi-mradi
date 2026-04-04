import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, CheckCircle, AlertTriangle, Clock, Loader2, Plus, ExternalLink, X, Shield } from 'lucide-react';
import { VerificationData } from '@/types/contractorVerification';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CertificationsTabProps {
  verificationData: VerificationData;
  getStatusColor: (status: string) => string;
  handleDocumentUpload: (docType: string) => void;
  onUploadComplete?: () => void;
}

const CREDENTIAL_TYPES = [
  { value: 'nca_license', label: 'NCA License', authority: 'National Construction Authority' },
  { value: 'kra_compliance', label: 'KRA Tax Compliance', authority: 'Kenya Revenue Authority' },
  { value: 'eacc_clearance', label: 'EACC Clearance', authority: 'Ethics & Anti-Corruption Commission' },
  { value: 'business_permit', label: 'Business Permit', authority: 'County Government' },
  { value: 'insurance', label: 'Insurance Certificate', authority: 'Insurance Provider' },
  { value: 'professional_registration', label: 'Professional Body Registration', authority: 'Professional Body' },
  { value: 'other', label: 'Other Certificate', authority: 'Issuing Authority' },
];

const CertificationsTab = ({ verificationData, getStatusColor, handleDocumentUpload, onUploadComplete }: CertificationsTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newCredential, setNewCredential] = useState({
    name: '',
    type: '',
    number: '',
    expiryDate: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Maximum file size is 10MB', variant: 'destructive' });
        return;
      }
      // Validate file type
      const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        toast({ title: 'Invalid file type', description: 'Please upload PDF, JPEG, PNG, or WebP files', variant: 'destructive' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadCredential = async () => {
    if (!user?.id || !newCredential.name || !newCredential.type) {
      toast({ title: 'Missing information', description: 'Please fill in credential name and type', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      let documentUrl: string | null = null;

      // Upload file to Supabase Storage if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${newCredential.type}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('contractor-documents')
          .upload(fileName, selectedFile, { upsert: true });

        if (uploadError) {
          // If bucket doesn't exist, still save the credential record
          console.warn('Storage upload failed (bucket may not exist):', uploadError.message);
          toast({
            title: 'Document saved without file',
            description: 'Credential record created. File upload will be available once storage is configured.',
          });
        } else {
          const { data: urlData } = supabase.storage
            .from('contractor-documents')
            .getPublicUrl(fileName);
          documentUrl = urlData.publicUrl;
        }
      }

      // Find the authority for this type
      const credType = CREDENTIAL_TYPES.find(t => t.value === newCredential.type);

      // Insert credential record
      const { error: insertError } = await supabase
        .from('contractor_credentials')
        .insert({
          contractor_id: user.id,
          credential_name: newCredential.name,
          credential_type: newCredential.type,
          credential_number: newCredential.number || null,
          issuing_authority: credType?.authority || 'Issuing Authority',
          expiry_date: newCredential.expiryDate || null,
          document_url: documentUrl,
          verification_status: 'pending',
        });

      if (insertError) throw insertError;

      toast({
        title: 'Credential submitted',
        description: `${newCredential.name} has been submitted for government verification.`,
      });

      // Reset form
      setNewCredential({ name: '', type: '', number: '', expiryDate: '' });
      setSelectedFile(null);
      setShowUploadForm(false);
      onUploadComplete?.();
    } catch (error: any) {
      console.error('Error uploading credential:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload credential',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Credentials */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Professional Credentials
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Upload and manage your professional documents. Government officials will verify each credential.
              </p>
            </div>
            <Button 
              onClick={() => setShowUploadForm(!showUploadForm)}
              variant={showUploadForm ? 'outline' : 'default'}
              size="sm"
            >
              {showUploadForm ? (
                <>
                  <X className="h-4 w-4 mr-1.5" /> Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" /> Add Credential
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Form */}
          {showUploadForm && (
            <div className="border-2 border-dashed border-primary/20 rounded-xl p-5 bg-primary/[0.02] space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Upload New Credential
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Credential Type *</label>
                  <Select value={newCredential.type} onValueChange={v => setNewCredential(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CREDENTIAL_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Credential Name *</label>
                  <Input
                    placeholder="e.g., NCA Category 4 License"
                    value={newCredential.name}
                    onChange={e => setNewCredential(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Certificate / License Number</label>
                  <Input
                    placeholder="e.g., NCA/2024/12345"
                    value={newCredential.number}
                    onChange={e => setNewCredential(prev => ({ ...prev, number: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Expiry Date</label>
                  <Input
                    type="date"
                    value={newCredential.expiryDate}
                    onChange={e => setNewCredential(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Upload Document (PDF, JPEG, PNG — max 10MB)</label>
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors bg-background"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="font-medium">{selectedFile.name}</span>
                      <span className="text-muted-foreground">({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setSelectedFile(null); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to select document or drag and drop</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleUploadCredential}
                  disabled={uploading || !newCredential.name || !newCredential.type}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Submit for Verification
                </Button>
              </div>
            </div>
          )}

          {/* Credentials List */}
          {verificationData.certifications.length === 0 && !showUploadForm ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h4 className="font-medium text-foreground mb-1">No credentials uploaded yet</h4>
              <p className="text-sm text-muted-foreground mb-4">Upload your professional documents to get verified.</p>
              <Button onClick={() => setShowUploadForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-1.5" /> Add Your First Credential
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {verificationData.certifications.map((cert: any, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${
                      cert.status === 'verified' ? 'bg-primary/10' : 
                      cert.status === 'pending' ? 'bg-yellow-50' : 'bg-destructive/10'
                    }`}>
                      <FileText className={`h-5 w-5 ${
                        cert.status === 'verified' ? 'text-primary' : 
                        cert.status === 'pending' ? 'text-yellow-600' : 'text-destructive'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-foreground truncate">{cert.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {cert.expiryDate && cert.expiryDate !== 'N/A' ? `Expires: ${cert.expiryDate}` : 'No expiry set'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`${getStatusColor(cert.status)} text-xs`}>
                      {getStatusIcon(cert.status)}
                      <span className="ml-1">{cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Process Info */}
      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="p-5">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            How Verification Works
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
              <div>
                <p className="text-sm font-medium text-foreground">Upload Documents</p>
                <p className="text-xs text-muted-foreground">Submit your credentials with supporting files</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
              <div>
                <p className="text-sm font-medium text-foreground">Government Review</p>
                <p className="text-xs text-muted-foreground">Officials verify each credential independently</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
              <div>
                <p className="text-sm font-medium text-foreground">Get Verified</p>
                <p className="text-xs text-muted-foreground">Access bidding once key credentials are approved</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificationsTab;
