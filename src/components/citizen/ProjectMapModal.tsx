import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wallet } from 'lucide-react';

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
  // Get projects with coordinates
  const projectsWithCoords = projects.filter(p => p.coordinates);
  
  // Calculate center from first project or default to Nairobi
  const getMapCenter = () => {
    if (projectsWithCoords.length > 0 && projectsWithCoords[0].coordinates) {
      const [lat, lng] = projectsWithCoords[0].coordinates.split(',').map(s => parseFloat(s.trim()));
      return { lat, lng };
    }
    return { lat: -1.2921, lng: 36.8219 }; // Nairobi default
  };

  const center = getMapCenter();
  
  // Create multi-marker map URL
  const getMapUrl = () => {
    const baseUrl = 'https://www.openstreetmap.org/export/embed.html';
    const zoom = 11;
    const bbox = `${center.lng - 0.1}%2C${center.lat - 0.1}%2C${center.lng + 0.1}%2C${center.lat + 0.1}`;
    return `${baseUrl}?bbox=${bbox}&layer=mapnik`;
  };

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
          {/* Map View */}
          <div className="lg:col-span-2 rounded-lg overflow-hidden border bg-muted">
            <iframe
              src={getMapUrl()}
              width="100%"
              height="400"
              style={{ border: 0 }}
              loading="lazy"
              title="Projects Map"
              className="rounded-lg"
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