import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  TrendingUp, 
  Wallet, 
  Briefcase,
  Star,
  CheckCircle,
  AlertTriangle,
  Shield
} from 'lucide-react';

interface ContractorCapacityProps {
  contractorId: string;
  companyName: string;
  financialCapacity: number;
  currentActiveProjects: number;
  maxConcurrentProjects: number;
  availableCapacity: number;
  qualifiedForProjectSize: 'small' | 'medium' | 'large' | 'mega';
  verificationStatus: string;
  rating: number;
  completedProjects: number;
  totalRatings?: number;
}

const ContractorCapacityCard = ({
  companyName,
  financialCapacity,
  currentActiveProjects,
  maxConcurrentProjects,
  availableCapacity,
  qualifiedForProjectSize,
  verificationStatus,
  rating,
  completedProjects,
  totalRatings = 0
}: ContractorCapacityProps) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `KES ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `KES ${(amount / 1000).toFixed(1)}K`;
    return `KES ${amount}`;
  };

  const capacityUsage = maxConcurrentProjects > 0 
    ? (currentActiveProjects / maxConcurrentProjects) * 100 
    : 0;

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'mega': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'large': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'medium': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'mega': return 'Mega Projects (1B+)';
      case 'large': return 'Large Projects (100M+)';
      case 'medium': return 'Medium Projects (10M+)';
      default: return 'Small Projects (<10M)';
    }
  };

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              {companyName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg">{companyName}</CardTitle>
              <div className="flex items-center mt-1">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="font-medium">
                  {rating > 0 ? rating.toFixed(1) : 'N/A'}
                </span>
                <span className="text-muted-foreground text-sm ml-2">
                  {totalRatings > 0 
                    ? `(${totalRatings} citizen verifications)`
                    : `(${completedProjects} projects)`
                  }
                </span>
              </div>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={verificationStatus === 'verified' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-yellow-50 text-yellow-700 border-yellow-300'}
          >
            {verificationStatus === 'verified' ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                Pending
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Financial Capacity */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center">
            <Wallet className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium">Financial Capacity</span>
          </div>
          <span className="font-bold text-green-600">{formatCurrency(financialCapacity)}</span>
        </div>

        {/* Project Size Qualification */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium">Qualified For</span>
          </div>
          <Badge className={getSizeColor(qualifiedForProjectSize)}>
            {getSizeLabel(qualifiedForProjectSize)}
          </Badge>
        </div>

        {/* Current Capacity Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 text-primary mr-2" />
              <span>Active Projects</span>
            </div>
            <span className="font-medium">{currentActiveProjects} / {maxConcurrentProjects}</span>
          </div>
          <Progress value={capacityUsage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {capacityUsage >= 80 ? (
              <span className="text-amber-600">Near capacity - limited availability</span>
            ) : capacityUsage >= 50 ? (
              <span className="text-blue-600">Moderate capacity available</span>
            ) : (
              <span className="text-green-600">High capacity available</span>
            )}
          </p>
        </div>

        {/* Available Capacity */}
        <div className="flex items-center justify-between p-3 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm font-medium">Available Capacity</span>
          </div>
          <span className="font-bold text-primary">{formatCurrency(availableCapacity)}</span>
        </div>

        {/* Verification Badge */}
        <div className="flex items-center justify-center pt-2">
          <Shield className="h-4 w-4 text-muted-foreground mr-2" />
          <span className="text-xs text-muted-foreground">
            Capacity verified through financial assessment
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractorCapacityCard;
