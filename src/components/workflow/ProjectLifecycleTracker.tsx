import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Wallet,
  HardHat,
  Camera,
  Users,
  DollarSign,
  Award,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { ProjectLifecycleService, ProjectLifecycleState, LifecycleStep } from '@/services/ProjectLifecycleService';

interface ProjectLifecycleTrackerProps {
  projectId: string;
  onAction?: (step: LifecycleStep) => void;
  compact?: boolean;
}

const stepIcons: Record<number, React.ReactNode> = {
  1: <CheckCircle className="h-5 w-5" />,
  2: <Wallet className="h-5 w-5" />,
  3: <HardHat className="h-5 w-5" />,
  4: <Camera className="h-5 w-5" />,
  5: <Users className="h-5 w-5" />,
  6: <DollarSign className="h-5 w-5" />,
  7: <Award className="h-5 w-5" />
};

const ProjectLifecycleTracker: React.FC<ProjectLifecycleTrackerProps> = ({
  projectId,
  onAction,
  compact = false
}) => {
  const [lifecycle, setLifecycle] = useState<ProjectLifecycleState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset state when projectId changes
    setLifecycle(null);
    setLoading(true);
    
    fetchLifecycleState();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`lifecycle-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'escrow_accounts', filter: `project_id=eq.${projectId}` },
        () => {
          console.log('[ProjectLifecycleTracker] Escrow updated, refreshing...');
          fetchLifecycleState();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_milestones', filter: `project_id=eq.${projectId}` },
        () => {
          console.log('[ProjectLifecycleTracker] Milestone updated, refreshing...');
          fetchLifecycleState();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_transactions' },
        () => {
          console.log('[ProjectLifecycleTracker] Payment updated, refreshing...');
          fetchLifecycleState();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'milestone_verifications' },
        () => {
          console.log('[ProjectLifecycleTracker] Verification updated, refreshing...');
          fetchLifecycleState();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const fetchLifecycleState = async () => {
    try {
      setLoading(true);
      const state = await ProjectLifecycleService.getProjectLifecycleState(projectId);
      setLifecycle(state);
    } catch (error) {
      console.error('Error fetching lifecycle state:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'current': return 'bg-blue-500 text-white animate-pulse';
      case 'pending': return 'bg-gray-200 text-gray-500';
      default: return 'bg-gray-200 text-gray-500';
    }
  };

  const getStepBorderColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500';
      case 'current': return 'border-blue-500';
      case 'pending': return 'border-gray-200';
      default: return 'border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!lifecycle) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Unable to load project lifecycle data
        </CardContent>
      </Card>
    );
  }

  const completedSteps = lifecycle.steps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedSteps / lifecycle.steps.length) * 100;

  if (compact) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Project Lifecycle</span>
            <Badge variant="outline">{completedSteps}/{lifecycle.steps.length} Complete</Badge>
          </div>
          <Progress value={progressPercentage} className="h-2 mb-3" />
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {lifecycle.steps.map((step, index) => (
              <div
                key={step.step}
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getStepStatusColor(step.status)}`}
                title={step.name}
              >
                {step.status === 'completed' ? '✓' : step.step}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <CardTitle className="flex items-center justify-between">
          <span>Project Lifecycle Tracker</span>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {completedSteps}/{lifecycle.steps.length} Steps Complete
          </Badge>
        </CardTitle>
        <Progress value={progressPercentage} className="h-2 bg-white/30" />
      </CardHeader>

      <CardContent className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Wallet className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-bold">{lifecycle.escrowFunded ? '100%' : `${((lifecycle.fundedAmount / lifecycle.escrowAmount) * 100).toFixed(0)}%`}</p>
            <p className="text-xs text-muted-foreground">Escrow Funded</p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold">{lifecycle.milestonesVerified}/{lifecycle.milestonesTotal}</p>
            <p className="text-xs text-muted-foreground">Milestones Verified</p>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Users className="h-5 w-5 mx-auto text-purple-600 mb-1" />
            <p className="text-lg font-bold">{lifecycle.citizenVerificationsReceived}</p>
            <p className="text-xs text-muted-foreground">Citizen Verifications</p>
          </div>
          <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <DollarSign className="h-5 w-5 mx-auto text-amber-600 mb-1" />
            <p className="text-lg font-bold">{lifecycle.milestonesPaid}/{lifecycle.milestonesTotal}</p>
            <p className="text-xs text-muted-foreground">Payments Released</p>
          </div>
        </div>

        {/* Lifecycle Steps */}
        <div className="space-y-4">
          {lifecycle.steps.map((step, index) => (
            <div 
              key={step.step}
              className={`relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${getStepBorderColor(step.status)} ${step.status === 'current' ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
            >
              {/* Step Number Circle */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStepStatusColor(step.status)}`}>
                {step.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  stepIcons[step.step] || step.step
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{step.name}</h4>
                  {step.actionBy && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {step.actionBy}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                
                {step.actionRequired && step.status === 'current' && (
                  <div className="mt-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-600 font-medium">{step.actionRequired}</span>
                    {onAction && (
                      <Button size="sm" onClick={() => onAction(step)} className="ml-auto">
                        Take Action
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Connection Line */}
              {index < lifecycle.steps.length - 1 && (
                <div className={`absolute left-9 top-14 w-0.5 h-8 ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Contractor Rating Section (if completed) */}
        {lifecycle.contractorRating !== null && (
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-amber-600" />
              <div>
                <p className="font-semibold">Contractor Performance Rating</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      className={`text-xl ${star <= lifecycle.contractorRating! ? 'text-amber-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-2 font-bold">{lifecycle.contractorRating.toFixed(1)}/5</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectLifecycleTracker;
