import React, { useMemo, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wallet } from 'lucide-react';
import InteractiveMap, { MapMarker } from '@/components/maps/InteractiveMap';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  budget: number;
  location?: string;
  coordinates?: string;
}

interface ProjectMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSelectProject?: (projectId: string) => void;
}

const ProjectMapModal = ({ isOpen, onClose, projects, onSelectProject }: ProjectMapModalProps) => {
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const markers: MapMarker[] = useMemo(() => {
    return projects
      .filter(p => p.coordinates)
      .map(p => {
        const [lat, lng] = (p.coordinates || '0,0').split(',').map(s => parseFloat(s.trim()));
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          status: p.status,
          budget: p.budget,
          lat: isNaN(lat) ? -1.2921 : lat,
          lng: isNaN(lng) ? 36.8219 : lng,
        };
      });
  }, [projects]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Auto-scroll to selected project when a map marker is clicked
  useEffect(() => {
    if (selectedMarkerId) {
      const el = document.getElementById(`project-list-card-${selectedMarkerId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedMarkerId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Project Locations Map
          </DialogTitle>
          <DialogDescription>
            Click a map pin to find the project, or click the project card to view details.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow min-h-0 overflow-hidden mt-4">
          {/* Interactive Leaflet Map */}
          <div className="lg:col-span-2 h-full min-h-[300px]">
            <InteractiveMap
              markers={markers}
              height="100%"
              zoom={markers.length > 0 ? 10 : 7}
              onMarkerClick={(marker) => setSelectedMarkerId(marker.id)}
            />
          </div>

          {/* Project List */}
          <div className="space-y-3 overflow-y-auto pr-2 pb-2 h-full">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase sticky top-0 bg-background pt-1 pb-2 z-10">
              {projects.filter(p => p.coordinates).length} Mapped Projects
            </h4>
            {projects.filter(p => p.coordinates).map((project) => (
              <div
                key={project.id}
                id={`project-list-card-${project.id}`}
                onClick={() => {
                  if (onSelectProject) {
                    onClose();
                    onSelectProject(project.id);
                  }
                }}
                className={`p-3 bg-card border rounded-lg transition-all cursor-pointer shadow-sm
                  ${selectedMarkerId === project.id
                    ? 'border-primary ring-1 ring-primary/50 relative z-10'
                    : 'hover:border-primary/50 hover:shadow-md opacity-90 hover:opacity-100'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h5 className="font-medium text-sm line-clamp-1">{project.title}</h5>
                  <Badge className={`text-xs shrink-0 ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {project.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <Wallet className="h-3 w-3" />
                    KES {(project.budget || 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    <MapPin className="h-3 w-3" />
                    MAPPED
                  </span>
                </div>
              </div>
            ))}
            {projects.filter(p => p.coordinates).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No mapped projects found.<br />GPS coordinates are required.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectMapModal;
