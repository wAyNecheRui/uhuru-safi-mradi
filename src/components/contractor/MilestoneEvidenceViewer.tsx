import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, X, ChevronLeft, ChevronRight, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description: string;
  milestone_number: number;
  status: string;
  payment_percentage: number;
  evidence_urls: string[] | null;
  submitted_at: string | null;
}

interface MilestoneEvidenceViewerProps {
  milestones: Milestone[];
  projectTitle: string;
  open: boolean;
  onClose: () => void;
}

const MilestoneEvidenceViewer: React.FC<MilestoneEvidenceViewerProps> = ({
  milestones,
  projectTitle,
  open,
  onClose
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'verified': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'submitted': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <DollarSign className="h-3 w-3" />;
      case 'verified': 
      case 'submitted':
        return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const handlePrevImage = () => {
    if (selectedMilestone?.evidence_urls) {
      setSelectedImageIndex(prev => 
        prev > 0 ? prev - 1 : selectedMilestone.evidence_urls!.length - 1
      );
    }
  };

  const handleNextImage = () => {
    if (selectedMilestone?.evidence_urls) {
      setSelectedImageIndex(prev => 
        prev < selectedMilestone.evidence_urls!.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handleMilestoneClick = (milestone: Milestone) => {
    if (milestone.evidence_urls && milestone.evidence_urls.length > 0) {
      setSelectedMilestone(milestone);
      setSelectedImageIndex(0);
    }
  };

  const handleBackToList = () => {
    setSelectedMilestone(null);
    setSelectedImageIndex(0);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-4xl max-h-[90dvh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedMilestone && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToList}
                  className="mr-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Camera className="h-5 w-5 text-primary" />
              <DialogTitle className="text-base sm:text-lg">
                {selectedMilestone 
                  ? `${selectedMilestone.title} - Evidence`
                  : `Milestone Evidence - ${projectTitle}`
                }
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Milestone List View */}
        {!selectedMilestone && (
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`p-4 border rounded-lg transition-all ${
                    milestone.evidence_urls && milestone.evidence_urls.length > 0
                      ? 'cursor-pointer hover:border-primary hover:bg-muted/50'
                      : 'opacity-60'
                  }`}
                  onClick={() => handleMilestoneClick(milestone)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStatusColor(milestone.status)}`}>
                        {milestone.milestone_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{milestone.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{milestone.description}</p>
                        {milestone.submitted_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted: {new Date(milestone.submitted_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(milestone.status)}>
                        {getStatusIcon(milestone.status)}
                        <span className="ml-1 capitalize">{milestone.status}</span>
                      </Badge>
                      {milestone.evidence_urls && milestone.evidence_urls.length > 0 ? (
                        <Badge variant="outline" className="text-xs">
                          <Camera className="h-3 w-3 mr-1" />
                          {milestone.evidence_urls.length} photo{milestone.evidence_urls.length > 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No evidence</span>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Preview */}
                  {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      {milestone.evidence_urls.slice(0, 4).map((url, index) => (
                        <div
                          key={index}
                          className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border"
                        >
                          <img
                            src={url}
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {milestone.evidence_urls.length > 4 && (
                        <div className="w-16 h-16 flex-shrink-0 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          +{milestone.evidence_urls.length - 4} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {milestones.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No milestones configured yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Full Image View */}
        {selectedMilestone && selectedMilestone.evidence_urls && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Main Image */}
            <div className="flex-1 relative bg-black/5 flex items-center justify-center p-4 min-h-0">
              <img
                src={selectedMilestone.evidence_urls[selectedImageIndex]}
                alt={`Evidence ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              {/* Navigation Arrows */}
              {selectedMilestone.evidence_urls.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {selectedImageIndex + 1} / {selectedMilestone.evidence_urls.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {selectedMilestone.evidence_urls.length > 1 && (
              <div className="flex-shrink-0 p-3 border-t bg-muted/30">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedMilestone.evidence_urls.map((url, index) => (
                    <div
                      key={index}
                      className={`w-14 h-14 flex-shrink-0 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                        index === selectedImageIndex 
                          ? 'border-primary ring-2 ring-primary/30' 
                          : 'border-transparent hover:border-muted-foreground'
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img
                        src={url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MilestoneEvidenceViewer;
