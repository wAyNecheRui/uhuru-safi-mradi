
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Star, MapPin, Phone, Mail, Award, CheckCircle, AlertTriangle } from 'lucide-react';
import { Contractor } from '@/types/contractorDatabase';

interface ContractorCardProps {
  contractor: Contractor;
}

const ContractorCard = ({ contractor }: ContractorCardProps) => {
  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-900">{contractor.name}</h3>
              <Badge className={getVerificationColor(contractor.verificationStatus)}>
                {contractor.verificationStatus === 'verified' ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-1" />
                )}
                {contractor.verificationStatus.toUpperCase()}
              </Badge>
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
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {contractor.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {contractor.email}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-semibold">{contractor.rating}/5.0</span>
                  <span className="text-sm text-gray-600 ml-2">({contractor.projects} projects)</span>
                </div>
                <div className="text-sm text-gray-600">
                  <Award className="h-4 w-4 inline mr-1" />
                  {contractor.yearsExperience} years experience
                </div>
              </div>
            </div>

            {/* Specializations */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Specializations:</h4>
              <div className="flex flex-wrap gap-2">
                {contractor.specializations.map((spec, index) => (
                  <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Certifications:</h4>
              <div className="flex flex-wrap gap-2">
                {contractor.certifications.map((cert, index) => (
                  <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recent Projects */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recent Projects:</h4>
              <div className="space-y-2">
                {contractor.recentProjects.map((project, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{project.name}</span>
                      <Badge className={project.status === 'completed' ? 'bg-green-100 text-green-800 ml-2' : 'bg-blue-100 text-blue-800 ml-2'}>
                        {project.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <span className="font-semibold text-green-600">{formatAmount(project.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              View Full Profile
            </Button>
            <Button variant="outline">
              Request Quote
            </Button>
            <Button variant="outline">
              Contact Contractor
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractorCard;
