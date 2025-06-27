
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { VerificationData } from '@/types/contractorVerification';

interface CertificationsTabProps {
  verificationData: VerificationData;
  getStatusColor: (status: string) => string;
  handleDocumentUpload: (docType: string) => void;
}

const CertificationsTab = ({ verificationData, getStatusColor, handleDocumentUpload }: CertificationsTabProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Professional Certifications
        </CardTitle>
        <p className="text-sm text-gray-600">
          Maintain up-to-date certifications to remain eligible for government contracts.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {verificationData.certifications.map((cert, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{cert.name}</h4>
                  <p className="text-sm text-gray-600">Expires: {cert.expiryDate}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(cert.status)}>
                    {cert.status === 'verified' ? (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-1" />
                    )}
                    {cert.status.toUpperCase()}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDocumentUpload(cert.name)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Update
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Upload New Certification</h4>
          <div className="flex items-center space-x-3">
            <Input placeholder="Certification name" className="flex-1" />
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificationsTab;
