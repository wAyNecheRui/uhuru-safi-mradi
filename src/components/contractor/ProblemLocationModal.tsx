import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Users, Navigation, ExternalLink } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  description: string;
  location: string | null;
  coordinates?: string | null;
  estimated_cost: number | null;
  priority: string | null;
  vote_count?: number;
}

interface ProblemLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem | null;
}

const ProblemLocationModal = ({ isOpen, onClose, problem }: ProblemLocationModalProps) => {
  if (!problem) return null;

  // Parse coordinates if available
  const getCoordinates = () => {
    if (problem.coordinates) {
      const [lat, lng] = problem.coordinates.split(',').map(s => parseFloat(s.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  };

  const coords = getCoordinates();

  // Create map URL
  const getMapUrl = () => {
    if (coords) {
      const bbox = `${coords.lng - 0.01}%2C${coords.lat - 0.01}%2C${coords.lng + 0.01}%2C${coords.lat + 0.01}`;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`;
    }
    // Default to Nairobi if no coords
    return `https://www.openstreetmap.org/export/embed.html?bbox=36.7%2C-1.35%2C36.9%2C-1.2&layer=mapnik`;
  };

  // Get Google Maps directions URL
  const getDirectionsUrl = () => {
    if (coords) {
      return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
    }
    return null;
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-w-2xl max-h-[85dvh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 pr-8">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="truncate">Problem Location</span>
          </DialogTitle>
          <DialogDescription className="pr-8">
            View the exact location of this reported problem
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
          {/* Problem Details */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg">{problem.title}</h3>
              <Badge className={getPriorityColor(problem.priority)}>
                {problem.priority || 'Medium'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{problem.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{problem.location || 'Location not specified'}</span>
              </div>
              {problem.estimated_cost && (
                <div className="flex items-center gap-1 text-green-600">
                  <DollarSign className="h-4 w-4" />
                  <span>KES {problem.estimated_cost.toLocaleString()}</span>
                </div>
              )}
              {problem.vote_count !== undefined && (
                <div className="flex items-center gap-1 text-blue-600">
                  <Users className="h-4 w-4" />
                  <span>{problem.vote_count} votes</span>
                </div>
              )}
            </div>
            {coords && (
              <p className="text-xs text-muted-foreground font-mono">
                GPS: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            )}
          </div>

          {/* Map View */}
          <div className="rounded-lg overflow-hidden border bg-muted">
            {coords ? (
              <iframe
                src={getMapUrl()}
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
                title="Problem Location Map"
                className="rounded-lg"
              />
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                <MapPin className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">No GPS coordinates available</p>
                <p className="text-xs mt-1">Location: {problem.location || 'Not specified'}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {coords && (
            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={() => window.open(getDirectionsUrl()!, '_blank')}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=17/${coords.lat}/${coords.lng}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Maps
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProblemLocationModal;
