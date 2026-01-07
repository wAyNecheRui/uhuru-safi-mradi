import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Building, Star, CheckCircle, Clock, MapPin, 
  Phone, Mail, Award, TrendingUp, Briefcase
} from 'lucide-react';

interface ContractorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractor: any;
  ratings: any[];
}

const ContractorProfileModal: React.FC<ContractorProfileModalProps> = ({
  isOpen,
  onClose,
  contractor,
  ratings
}) => {
  if (!contractor) return null;

  const getAverageRating = () => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / ratings.length).toFixed(1);
  };

  const getAverageMetric = (field: string) => {
    if (!ratings || ratings.length === 0) return 0;
    const validRatings = ratings.filter(r => r[field]);
    if (validRatings.length === 0) return 0;
    const sum = validRatings.reduce((acc, r) => acc + (r[field] || 0), 0);
    return (sum / validRatings.length).toFixed(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building className="h-6 w-6 text-primary" />
            {contractor.company_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status & Quick Stats */}
          <div className="flex flex-wrap items-center gap-3">
            {contractor.verified ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" /> Verified Contractor
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" /> Pending Verification
              </Badge>
            )}
            {contractor.is_agpo && (
              <Badge className="bg-purple-100 text-purple-800">
                <Award className="h-3 w-3 mr-1" /> AGPO: {contractor.agpo_category}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Company Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Company Information</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Years in Business:</span>
                  <span className="font-medium">{contractor.years_in_business || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Counties:</span>
                  <span className="font-medium">{contractor.registered_counties?.join(', ') || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">KRA PIN:</span>
                  <span className="font-mono font-medium">{contractor.kra_pin || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Registration No:</span>
                  <span className="font-mono font-medium">{contractor.company_registration_number || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Employees:</span>
                  <span className="font-medium">{contractor.number_of_employees || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Specializations</h4>
              <div className="flex flex-wrap gap-2">
                {contractor.specialization?.map((spec: string, i: number) => (
                  <Badge key={i} variant="outline" className="bg-background">
                    {spec}
                  </Badge>
                )) || <span className="text-sm text-muted-foreground">No specializations listed</span>}
              </div>

              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-4">Project Capacity</h4>
              <p className="text-lg font-semibold">
                KES {new Intl.NumberFormat('en-KE').format(contractor.max_project_capacity || 0)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Performance Metrics */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance Metrics
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-700">{getAverageRating()}</p>
                <p className="text-xs text-yellow-600">Overall Rating</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-700">{contractor.previous_projects_count || 0}</p>
                <p className="text-xs text-green-600">Projects Completed</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-2xl font-bold text-blue-700">
                  {new Intl.NumberFormat('en-KE', { notation: 'compact' }).format(contractor.total_contract_value || 0)}
                </p>
                <p className="text-xs text-blue-600">Total Contract Value</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-2xl font-bold text-purple-700">{ratings?.length || 0}</p>
                <p className="text-xs text-purple-600">Total Reviews</p>
              </div>
            </div>

            {/* Detailed Performance Breakdown */}
            {ratings && ratings.length > 0 && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h5 className="font-medium text-sm">Performance Breakdown</h5>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Work Quality</span>
                      <span className="font-medium">{getAverageMetric('work_quality')}/5</span>
                    </div>
                    <Progress value={(Number(getAverageMetric('work_quality')) / 5) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Timeliness</span>
                      <span className="font-medium">{getAverageMetric('completion_timeliness')}/5</span>
                    </div>
                    <Progress value={(Number(getAverageMetric('completion_timeliness')) / 5) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Communication</span>
                      <span className="font-medium">{getAverageMetric('communication')}/5</span>
                    </div>
                    <Progress value={(Number(getAverageMetric('communication')) / 5) * 100} className="h-2" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          {ratings && ratings.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Recent Reviews</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {ratings.slice(0, 5).map((rating, i) => (
                    <div key={i} className="p-3 bg-muted/20 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        {[...Array(5)].map((_, idx) => (
                          <Star 
                            key={idx} 
                            className={`h-3 w-3 ${idx < (rating.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {rating.review && (
                        <p className="text-sm text-muted-foreground">{rating.review}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractorProfileModal;
