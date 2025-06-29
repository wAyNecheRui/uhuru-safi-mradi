import React from 'react';
import { MapPin, Wrench, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectMapProps {
  selectedCounty: string;
}

const ProjectMap = ({ selectedCounty }: ProjectMapProps) => {
  console.log('ProjectMap rendering for county:', selectedCounty);
  
  // Mock project data for map visualization - now using the selected county
  const projects = [
    {
      id: 1,
      name: `${selectedCounty} Road Repair`,
      status: 'In Progress',
      lat: -1.3167,
      lng: 36.8833,
      progress: 65,
      budget: 'KES 2.5M',
      contractor: 'ABC Construction Ltd'
    },
    {
      id: 2,
      name: `${selectedCounty} Street Lights`,
      status: 'Planning',
      lat: -1.2167,
      lng: 36.9000,
      progress: 15,
      budget: 'KES 800K',
      contractor: 'Pending'
    },
    {
      id: 3,
      name: `${selectedCounty} Water Pipeline`,
      status: 'Completed',
      lat: -1.3167,
      lng: 36.7833,
      progress: 100,
      budget: 'KES 3.2M',
      contractor: 'Kenya Water Works'
    },
    {
      id: 4,
      name: `${selectedCounty} Drainage System`,
      status: 'Under Review',
      lat: -1.2921,
      lng: 36.8219,
      progress: 0,
      budget: 'KES 1.8M',
      contractor: 'Pending Approval'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'In Progress': return <Wrench className="h-4 w-4 text-blue-600" />;
      case 'Planning': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Under Review': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <MapPin className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Planning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Under Review': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="h-80 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg relative overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-200 via-blue-200 to-green-300 opacity-30"></div>
      
      {/* Map Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZGRkIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      
      {/* County Label */}
      <div className="absolute top-4 left-4 z-10">
        <Badge className="bg-white/90 text-gray-700 shadow-lg">
          <MapPin className="h-3 w-3 mr-1" />
          {selectedCounty} County
        </Badge>
      </div>

      {/* Project Markers */}
      <div className="absolute inset-0 p-4">
        {projects.map((project, index) => (
          <div
            key={`${selectedCounty}-${project.id}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{
              left: `${20 + (index * 15)}%`,
              top: `${30 + (index * 10)}%`
            }}
          >
            {/* Marker */}
            <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-green-500 hover:scale-110 transition-transform">
              {getStatusIcon(project.status)}
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-xl border p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <h4 className="font-semibold text-gray-900 mb-1">{project.name}</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">{project.budget}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contractor:</span>
                  <span className="font-medium">{project.contractor}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Progress:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">{project.progress}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg p-3 shadow-lg">
        <h5 className="text-xs font-semibold text-gray-700 mb-2">Legend</h5>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wrench className="h-3 w-3 text-blue-600" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3 text-yellow-600" />
            <span>Planning</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-3 w-3 text-orange-600" />
            <span>Under Review</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMap;
