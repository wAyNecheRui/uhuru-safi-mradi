import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Star, MapPin, Award, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface ContractorCardProps {
  contractor: {
    id: string;
    name: string;
    category: string;
    location: string;
    rating: number;
    reviewCount?: number;
    specializations: string[];
    experience?: string;
    isVerified?: boolean;
    eaccStatus?: string;
    kraStatus?: string;
    ncaStatus?: string;
    portfolio?: string | null;
    certifications?: string | null;
  };
}

const ContractorCard = ({ contractor }: ContractorCardProps) => {
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'verified':
      case 'cleared':
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 text-xs">{status}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">N/A</Badge>;
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-900">{contractor.name}</h3>
              {contractor.isVerified ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  VERIFIED
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Clock className="h-4 w-4 mr-1" />
                  PENDING
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="h-4 w-4 mr-2" />
                  {contractor.category}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {contractor.location}
                </div>
                {contractor.experience && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-2" />
                    {contractor.experience}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-semibold">
                    {contractor.rating > 0 ? `${contractor.rating.toFixed(1)}/5.0` : 'No ratings yet'}
                  </span>
                  {contractor.reviewCount !== undefined && contractor.reviewCount > 0 && (
                    <span className="text-sm text-gray-600 ml-2">({contractor.reviewCount} reviews)</span>
                  )}
                </div>
                
                {/* Verification Status */}
                <div className="flex flex-wrap gap-2">
                  {contractor.eaccStatus && (
                    <div className="text-xs">
                      EACC: {getStatusBadge(contractor.eaccStatus)}
                    </div>
                  )}
                  {contractor.kraStatus && (
                    <div className="text-xs">
                      KRA: {getStatusBadge(contractor.kraStatus)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Specializations */}
            {contractor.specializations.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Specializations:</h4>
                <div className="flex flex-wrap gap-2">
                  {contractor.specializations.slice(0, 5).map((spec, index) => (
                    <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                      {spec}
                    </Badge>
                  ))}
                  {contractor.specializations.length > 5 && (
                    <Badge variant="outline" className="text-gray-600">
                      +{contractor.specializations.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Portfolio link */}
            {contractor.portfolio && (
              <div className="text-sm text-blue-600 hover:underline cursor-pointer">
                View Portfolio
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              View Profile
            </Button>
            <Button variant="outline">
              Contact
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractorCard;