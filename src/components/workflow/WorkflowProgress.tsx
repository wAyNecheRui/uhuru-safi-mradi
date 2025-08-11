import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import { WorkflowState, WorkflowStep } from '@/types/workflow';

interface WorkflowProgressProps {
  workflowState: WorkflowState;
}

const WORKFLOW_STEPS: { 
  key: WorkflowStep; 
  title: string; 
  description: string;
}[] = [
  {
    key: 'problem_identification',
    title: 'Problem Reported',
    description: 'Citizen submits infrastructure problem with evidence'
  },
  {
    key: 'community_validation',
    title: 'Community Validation',
    description: 'Citizens vote and validate the reported problem'
  },
  {
    key: 'government_approval',
    title: 'Government Approval',
    description: 'Officials review and approve budget allocation'
  },
  {
    key: 'contractor_bidding',
    title: 'Contractor Bidding',
    description: 'Verified contractors submit technical and financial bids'
  },
  {
    key: 'project_execution',
    title: 'Project Execution',
    description: 'Selected contractor executes project with milestone tracking'
  },
  {
    key: 'final_verification',
    title: 'Final Verification',
    description: 'Citizens verify completion and trigger final payment'
  }
];

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ workflowState }) => {
  const getStepStatus = (step: WorkflowStep) => {
    if (workflowState.completedSteps.includes(step)) {
      return 'completed';
    } else if (workflowState.currentStep === step) {
      return workflowState.canProceed ? 'active' : 'blocked';
    } else {
      return 'pending';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'active':
        return <Clock className="h-6 w-6 text-blue-600" />;
      case 'blocked':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      default:
        return <Circle className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'blocked':
        return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">Blocked</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Workflow Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {WORKFLOW_STEPS.map((step, index) => {
            const status = getStepStatus(step.key);
            const isActive = workflowState.currentStep === step.key;
            
            return (
              <div key={step.key} className="flex items-start space-x-4">
                <div className="flex flex-col items-center">
                  {getStepIcon(status)}
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div className={`w-0.5 h-12 mt-2 ${
                      status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${isActive ? 'text-blue-600' : ''}`}>
                      {step.title}
                    </h4>
                    {getStatusBadge(status)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </p>
                  
                  {isActive && workflowState.requirements.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-yellow-700">Requirements:</p>
                      <ul className="text-sm text-yellow-600 list-disc list-inside">
                        {workflowState.requirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkflowProgress;