import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, FileText, X, CheckCircle, Clock, AlertCircle, 
  Eye, Trash2, Shield 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  status: 'pending' | 'verified' | 'rejected';
}

interface DocumentUploadSectionProps {
  userId: string;
  documents: UploadedDocument[];
  onDocumentsChange: (docs: UploadedDocument[]) => void;
}

const documentTypes = [
  { 
    id: 'national_id', 
    label: 'National ID / Passport', 
    description: 'Government-issued identification',
    required: true,
    accepts: '.jpg,.jpeg,.png,.pdf'
  },
  { 
    id: 'cv_resume', 
    label: 'CV / Resume', 
    description: 'Professional curriculum vitae',
    required: false,
    accepts: '.pdf,.doc,.docx'
  },
  { 
    id: 'trade_certificate', 
    label: 'Trade Certificate / License', 
    description: 'Professional trade certification',
    required: false,
    accepts: '.jpg,.jpeg,.png,.pdf'
  },
  { 
    id: 'safety_certificate', 
    label: 'Safety Training Certificate', 
    description: 'OSHA or equivalent safety training',
    required: false,
    accepts: '.jpg,.jpeg,.png,.pdf'
  },
  { 
    id: 'reference_letter', 
    label: 'Reference / Recommendation Letter', 
    description: 'From previous employer or client',
    required: false,
    accepts: '.jpg,.jpeg,.png,.pdf'
  }
];

const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({ 
  userId, documents, onDocumentsChange 
}) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleUpload = async (docTypeId: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(docTypeId);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const filePath = `${userId}/${docTypeId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('citizen-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('citizen-documents')
        .getPublicUrl(filePath);

      const newDoc: UploadedDocument = {
        id: `${docTypeId}_${Date.now()}`,
        name: file.name,
        type: docTypeId,
        url: urlData.publicUrl,
        uploadedAt: new Date().toISOString(),
        status: 'pending'
      };

      // Remove old doc of same type
      const updated = documents.filter(d => d.type !== docTypeId);
      updated.push(newDoc);
      onDocumentsChange(updated);

      toast.success(`${documentTypes.find(d => d.id === docTypeId)?.label} uploaded successfully`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleRemove = async (doc: UploadedDocument) => {
    try {
      // Extract path from URL
      const urlParts = doc.url.split('/citizen-documents/');
      if (urlParts[1]) {
        await supabase.storage.from('citizen-documents').remove([urlParts[1]]);
      }
      const updated = documents.filter(d => d.id !== doc.id);
      onDocumentsChange(updated);
      toast.success('Document removed');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove document');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
    }
  };

  const getExistingDoc = (typeId: string) => documents.find(d => d.type === typeId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Document Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload supporting documents to get verified status and access more opportunities.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {documentTypes.map((docType) => {
          const existingDoc = getExistingDoc(docType.id);
          const isUploading = uploading === docType.id;

          return (
            <div 
              key={docType.id} 
              className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium flex items-center gap-2">
                    {docType.label}
                    {docType.required && <span className="text-red-500 text-xs">Required</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{docType.description}</p>
                  {existingDoc && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground truncate">{existingDoc.name}</p>
                      {getStatusBadge(existingDoc.status)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {existingDoc && (
                  <>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => window.open(existingDoc.url, '_blank')}
                      aria-label="View document"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={() => handleRemove(existingDoc)}
                      aria-label="Remove document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <input
                  ref={el => { fileInputRefs.current[docType.id] = el; }}
                  type="file"
                  accept={docType.accepts}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(docType.id, file);
                    e.target.value = '';
                  }}
                />
                <Button
                  variant={existingDoc ? "outline" : "default"}
                  size="sm"
                  disabled={isUploading}
                  onClick={() => fileInputRefs.current[docType.id]?.click()}
                >
                  {isUploading ? (
                    <span className="flex items-center gap-1">
                      <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Upload className="h-3 w-3" />
                      {existingDoc ? 'Replace' : 'Upload'}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DocumentUploadSection;
