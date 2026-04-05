import React, { useMemo } from 'react';
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
}

const ProjectMapModal = ({ isOpen, onClose, projects }: ProjectMapModalProps) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Project Locations Map
          </DialogTitle>
          <DialogDescription>
            View all active infrastructure projects in your area
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Interactive Leaflet Map */}
          <div className="lg:col-span-2">
            <InteractiveMap
              markers={markers}
              height="400px"
              zoom={markers.length > 0 ? 10 : 7}
            />
          </div>

          {/* Project List */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">
              {projects.length} Projects
            </h4>
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
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
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Wallet className="h-3 w-3" />
                    KES {(project.budget || 0).toLocaleString()}
                  </span>
                  {project.coordinates && (
                    <span className="flex items-center gap-1 text-green-600">
                      <MapPin className="h-3 w-3" />
                      GPS
                    </span>
                  )}
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No projects found</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectMapModal;
