
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { VerificationData } from '@/types/contractorVerification';

interface ProjectsTabProps {
  verificationData: VerificationData;
  formatAmount: (amount: number) => string;
}

const ProjectsTab = ({ verificationData, formatAmount }: ProjectsTabProps) => {
  return (
    <div className="grid gap-6">
      {verificationData.recentProjects.map((project) => (
        <Card key={project.id} className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Project Value: </span>
                    <span className="font-semibold text-green-600">{formatAmount(project.value)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status: </span>
                    <Badge className={project.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  {project.status === 'completed' && (
                    <>
                      <div>
                        <span className="text-gray-600">Completion Date: </span>
                        <span className="font-medium">{project.completionDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Client Rating: </span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="font-semibold">{project.rating}/5.0</span>
                        </div>
                      </div>
                    </>
                  )}
                  {project.status === 'in_progress' && (
                    <>
                      <div>
                        <span className="text-gray-600">Progress: </span>
                        <span className="font-semibold">{project.progress}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Expected Completion: </span>
                        <span className="font-medium">{project.expectedCompletion}</span>
                      </div>
                    </>
                  )}
                </div>
                {project.clientFeedback && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 italic">"{project.clientFeedback}"</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectsTab;
