
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building, Award, CheckCircle, Star } from 'lucide-react';
import { VerificationData } from '@/types/contractorVerification';

interface CompanyProfileTabProps {
  verificationData: VerificationData;
  getStatusColor: (status: string) => string;
}

const CompanyProfileTab = ({ verificationData, getStatusColor }: CompanyProfileTabProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2 text-blue-600" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <Input value={verificationData.companyName} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KRA PIN</label>
            <Input value={verificationData.kraPin} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
            <Input value={verificationData.registrationNumber} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
            <Textarea value={verificationData.physicalAddress} readOnly />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Years in Business:</span>
            <span className="font-semibold">{verificationData.yearsInBusiness} years</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-green-600" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Overall Status:</span>
            <Badge className={getStatusColor(verificationData.verificationStatus)}>
              <CheckCircle className="h-4 w-4 mr-1" />
              {verificationData.verificationStatus.toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{verificationData.totalProjects}</div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{verificationData.completedProjects}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overall Rating:</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="ml-1 font-semibold">
                  {(verificationData.overallRating || 0).toFixed(1)}/5.0
                </span>
                {(verificationData as any).totalRatings > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({(verificationData as any).totalRatings} citizen verifications)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Specializations:</h4>
            <div className="flex flex-wrap gap-2">
              {verificationData.specializations.map((spec, index) => (
                <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                  {spec}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyProfileTab;
