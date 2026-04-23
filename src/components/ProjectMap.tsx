import React, { useMemo } from 'react';
import { MapPin, Wrench, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMapProjects } from '@/hooks/useMapProjects';
import InteractiveMap, { MapMarker } from '@/components/maps/InteractiveMapLazy';

interface ProjectMapProps {
  selectedCounty: string;
}

// Kenya county approximate centers for fallback positioning
const countyCoordinates: Record<string, [number, number]> = {
  'nairobi': [-1.2921, 36.8219],
  'mombasa': [-4.0435, 39.6682],
  'kisumu': [-0.1022, 34.7617],
  'nakuru': [-0.3031, 36.0800],
  'eldoret': [0.5143, 35.2698],
  'nyeri': [-0.4197, 36.9511],
  'machakos': [-1.5177, 37.2634],
  'kiambu': [-1.1714, 36.8356],
  'kakamega': [0.2827, 34.7519],
  'uasin gishu': [0.5143, 35.2698],
  'kilifi': [-3.6305, 39.8499],
  'kwale': [-4.1816, 39.4526],
  'garissa': [-0.4532, 39.6461],
  'wajir': [1.7471, 40.0573],
  'mandera': [3.9373, 41.8569],
  'marsabit': [2.3284, 37.9900],
  'isiolo': [0.3546, 37.5822],
  'meru': [0.0480, 37.6559],
  'tharaka-nithi': [-0.3064, 37.7846],
  'embu': [-0.5389, 37.4596],
  'kitui': [-1.3667, 38.0167],
  'makueni': [-1.8043, 37.6207],
  'nyandarua': [-0.1833, 36.5167],
  'kirinyaga': [-0.5000, 37.2833],
  'murang\'a': [-0.7833, 37.1500],
  'turkana': [3.3122, 35.5658],
  'west pokot': [1.6189, 35.1957],
  'samburu': [1.1147, 36.9544],
  'trans nzoia': [1.0167, 35.0167],
  'baringo': [0.4911, 35.7426],
  'elgeyo-marakwet': [0.6833, 35.5000],
  'nandi': [0.1833, 35.1500],
  'laikipia': [0.3606, 36.7819],
  'kajiado': [-2.0981, 36.7820],
  'kericho': [-0.3692, 35.2863],
  'bomet': [-0.7819, 35.3428],
  'narok': [-1.0833, 35.8667],
  'bungoma': [0.5636, 34.5583],
  'busia': [0.4608, 34.1108],
  'siaya': [-0.0617, 34.2422],
  'homa bay': [-0.5273, 34.4571],
  'migori': [-1.0634, 34.4731],
  'kisii': [-0.6817, 34.7667],
  'nyamira': [-0.5633, 34.9347],
  'vihiga': [0.0833, 34.7167],
  'lamu': [-2.2717, 40.9020],
  'taita-taveta': [-3.3961, 38.5566],
  'tana river': [-1.5000, 40.0333],
};

const ProjectMap = ({ selectedCounty }: ProjectMapProps) => {
  const { projects, loading, error } = useMapProjects(selectedCounty);

  const markers: MapMarker[] = useMemo(() => {
    const countyKey = selectedCounty.toLowerCase();
    const countyCenter = countyCoordinates[countyKey] || [-1.2921, 36.8219];
    
    return projects.map((project, index) => {
      // Try to parse coordinates from project data, fallback to county center with offset
      const offset = (index * 0.02) - (projects.length * 0.01);
      return {
        id: project.id,
        title: project.name,
        status: project.status.toLowerCase().replace(/\s+/g, '_'),
        budget: project.budget,
        contractor: project.contractor,
        progress: project.progress,
        lat: countyCenter[0] + offset + (Math.random() * 0.01),
        lng: countyCenter[1] + offset + (Math.random() * 0.01),
      };
    });
  }, [projects, selectedCounty]);

  const mapCenter: [number, number] = useMemo(() => {
    const countyKey = selectedCounty.toLowerCase();
    return countyCoordinates[countyKey] || [-1.2921, 36.8219];
  }, [selectedCounty]);

  if (loading) {
    return (
      <div className="h-80 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-80 bg-destructive/10 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive text-sm">Failed to load projects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <InteractiveMap
        markers={markers}
        center={mapCenter}
        zoom={10}
        height="480px"
      />
      {/* County label overlay */}
      <div className="absolute top-3 left-3 z-[1000]">
        <Badge className="bg-background/90 text-foreground shadow-lg backdrop-blur-sm">
          <MapPin className="h-3 w-3 mr-1" />
          {selectedCounty} County — {projects.length} project{projects.length !== 1 ? 's' : ''}
        </Badge>
      </div>
    </div>
  );
};

export default ProjectMap;
