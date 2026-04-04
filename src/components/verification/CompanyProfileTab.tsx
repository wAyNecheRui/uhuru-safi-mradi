
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Award, CheckCircle, Star, Clock, MapPin, Briefcase, Users } from 'lucide-react';
import { VerificationData } from '@/types/contractorVerification';

interface CompanyProfileTabProps {
  verificationData: VerificationData;
  getStatusColor: (status: string) => string;
}

const CompanyProfileTab = ({ verificationData, getStatusColor }: CompanyProfileTabProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Company Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Building className="h-5 w-5 mr-2 text-primary" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { label: 'Company Name', value: verificationData.companyName, icon: Building },
              { label: 'KRA PIN', value: verificationData.kraPin, icon: Briefcase, mono: true },
              { label: 'Registration No.', value: verificationData.registrationNumber, icon: Award, mono: true },
              { label: 'Physical Address', value: verificationData.physicalAddress, icon: MapPin },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <item.icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`text-sm font-medium text-foreground ${item.mono ? 'font-mono' : ''} break-words`}>
                    {item.value || 'Not specified'}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Years in Business</span>
              </div>
              <span className="font-semibold text-foreground">{verificationData.yearsInBusiness} years</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification & Rating */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Status</span>
            <Badge className={`${getStatusColor(verificationData.verificationStatus)} px-3 py-1`}>
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              {verificationData.verificationStatus.toUpperCase()}
            </Badge>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="text-3xl font-bold text-primary">{verificationData.totalProjects}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Projects</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="text-3xl font-bold text-green-700">{verificationData.completedProjects}</div>
              <div className="text-xs text-muted-foreground mt-1">Completed</div>
            </div>
          </div>

          {/* Rating */}
          <div className="p-4 rounded-xl bg-yellow-50/50 border border-yellow-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Overall Rating</span>
              <div className="flex items-center gap-1.5">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-400" />
                <span className="text-xl font-bold text-foreground">
                  {(verificationData.overallRating || 0).toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">/5.0</span>
              </div>
            </div>
            {(verificationData.totalRatings ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground mt-1 text-right">
                Based on {verificationData.totalRatings} citizen verifications
              </p>
            )}
          </div>

          {/* Specializations */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Specializations</h4>
            <div className="flex flex-wrap gap-2">
              {verificationData.specializations.length > 0 ? verificationData.specializations.map((spec, index) => (
                <Badge key={index} variant="outline" className="bg-background">
                  {spec}
                </Badge>
              )) : (
                <span className="text-sm text-muted-foreground italic">No specializations listed</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyProfileTab;
