import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Building, Star, CheckCircle, Clock, MapPin, 
  Award, TrendingUp, Briefcase, Loader2, XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContractorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractor: any;
  ratings: any[];
  onVerificationComplete?: () => void;
}

const ContractorProfileModal: React.FC<ContractorProfileModalProps> = ({
  isOpen,
  onClose,
  contractor,
  ratings,
  onVerificationComplete
}) => {
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

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

  const handleVerifyContractor = async (verified: boolean) => {
    setVerifying(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('contractor_profiles')
        .update({
          verified,
          verification_date: verified ? new Date().toISOString() : null
        })
        .eq('id', contractor.id);

      if (error) throw error;

      toast({
        title: verified ? "Contractor Verified" : "Verification Revoked",
        description: verified 
          ? `${contractor.company_name} has been verified successfully.`
          : `Verification for ${contractor.company_name} has been revoked.`
      });

      onVerificationComplete?.();
      onClose();
    } catch (error) {
      console.error('Error verifying contractor:', error);
      toast({
        title: "Error",
        description: "Failed to update contractor verification status",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  // Use real calculated values if available, fallback to profile fields
  const projectCount = contractor.actual_project_count ?? contractor.previous_projects_count ?? 0;
  const contractValue = contractor.actual_contract_value ?? contractor.total_contract_value ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-2xl max-h-[90dvh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg pr-8">
            <Building className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span className="truncate">{contractor.company_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 sm:space-y-6 py-2 pr-1">
          {/* Status & Quick Stats */}
          <div className="flex flex-wrap items-center gap-2">
            {contractor.verified ? (
              <Badge className="bg-primary/10 text-primary text-xs">
                <CheckCircle className="h-3 w-3 mr-1" /> Verified
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" /> Pending
              </Badge>
            )}
            {contractor.is_agpo && (
              <Badge variant="outline" className="text-xs">
                <Award className="h-3 w-3 mr-1" /> AGPO: {contractor.agpo_category}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Company Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                  <span className="text-muted-foreground">Coverage:</span>
                  <span className="font-medium">Nationwide</span>
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

          {/* Performance Metrics - Using real calculated data */}
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
                <p className="text-2xl font-bold text-green-700">{projectCount}</p>
                <p className="text-xs text-green-600">Projects</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-2xl font-bold text-blue-700">
                  {new Intl.NumberFormat('en-KE', { notation: 'compact' }).format(contractValue)}
                </p>
                <p className="text-xs text-blue-600">Contract Value</p>
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

        {/* Verification Actions for Government Officials */}
        <DialogFooter className="mt-6 flex gap-2">
          {!contractor.verified ? (
            <Button 
              onClick={() => handleVerifyContractor(true)}
              disabled={verifying}
              className="bg-green-600 hover:bg-green-700"
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Verify Contractor
            </Button>
          ) : (
            <Button 
              onClick={() => handleVerifyContractor(false)}
              disabled={verifying}
              variant="outline"
              className="border-red-500 text-red-700 hover:bg-red-50"
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Revoke Verification
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractorProfileModal;
