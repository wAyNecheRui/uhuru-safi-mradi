import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Award, CheckCircle, Star, Clock, MapPin, Briefcase, Users, Hash } from 'lucide-react';
import { VerificationData } from '@/types/contractorVerification';

interface CompanyProfileTabProps {
  verificationData: VerificationData;
  getStatusColor: (status: string) => string;
}

const CompanyProfileTab = ({ verificationData, getStatusColor }: CompanyProfileTabProps) => {
  const companyFields = [
    { label: 'Company Name', value: verificationData.companyName, icon: Building },
    { label: 'KRA PIN', value: verificationData.kraPin, icon: Hash, mono: true },
    { label: 'Registration No.', value: verificationData.registrationNumber, icon: Award, mono: true },
    { label: 'Physical Address', value: verificationData.physicalAddress, icon: MapPin },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Company Information */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <div className="p-1.5 bg-blue-50 rounded-lg border border-blue-100">
              <Building className="h-4 w-4 text-blue-600" />
            </div>
            Company Information
            <Badge className="ml-auto text-xs font-normal bg-slate-100 text-slate-600 border-slate-200 border">
              Official Record
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-1">
          {companyFields.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="group flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="p-1.5 bg-slate-100 rounded-md flex-shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {item.label}
                  </p>
                  <p className={`text-sm font-medium text-slate-800 mt-0.5 break-words ${item.mono ? 'font-mono tracking-wide' : ''}`}>
                    {item.value || (
                      <span className="text-slate-400 italic font-normal">Not specified</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-slate-100 rounded-md">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Years in Business</p>
              </div>
            </div>
            <span className="font-bold text-slate-800 text-sm">
              {verificationData.yearsInBusiness}
              <span className="font-normal text-slate-500 ml-1">yrs</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Verification Status & Performance */}
      <div className="space-y-4">
        {/* Status Card */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                <Award className="h-4 w-4 text-emerald-600" />
              </div>
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-sm text-slate-600 font-medium">Overall Standing</span>
              <Badge className={`${getStatusColor(verificationData.verificationStatus)} px-3 py-1 text-xs font-bold border`}>
                {verificationData.verificationStatus === 'verified' && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                {verificationData.verificationStatus === 'pending' && <Clock className="h-3.5 w-3.5 mr-1.5" />}
                {verificationData.verificationStatus.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="text-3xl font-bold text-blue-700">{verificationData.totalProjects ?? 0}</div>
                <div className="text-xs text-blue-600 font-medium mt-1">Total Tenders</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="text-3xl font-bold text-emerald-700">{verificationData.completedProjects}</div>
                <div className="text-xs text-emerald-600 font-medium mt-1">Completed</div>
              </div>
            </div>

            {/* Rating */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Accountability Rating</span>
                <div className="flex items-center gap-1.5">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  <span className="text-xl font-bold text-slate-800">
                    {(verificationData.overallRating || 0).toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ 5.0</span>
                </div>
              </div>
              {(verificationData.totalRatings ?? 0) > 0 ? (
                <p className="text-xs text-amber-700 mt-1.5 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Based on {verificationData.totalRatings} verified citizen reports
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-1.5 italic">
                  Rating builds as you complete projects
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Specializations */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <div className="p-1.5 bg-purple-50 rounded-lg border border-purple-100">
                <Briefcase className="h-4 w-4 text-purple-600" />
              </div>
              Areas of Specialization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {verificationData.specializations.length > 0
                ? verificationData.specializations.map((spec: string, i: number) => (
                  <Badge
                    key={i}
                    className="bg-purple-50 text-purple-700 border-purple-200 border text-xs font-medium px-2.5 py-1"
                  >
                    {spec}
                  </Badge>
                ))
                : (
                  <span className="text-sm text-slate-400 italic">No specializations configured</span>
                )
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyProfileTab;
