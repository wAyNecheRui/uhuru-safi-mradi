import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, User, AlertTriangle, FileText, X } from 'lucide-react';

interface ReportDetailsProps {
  report: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    location: string;
    created_at: string;
    photo_urls?: string[];
    category?: string;
    estimated_cost?: number;
    affected_population?: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

const ReportDetailsModal = ({ report, isOpen, onClose }: ReportDetailsProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold">{report.title}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusColor(report.status)}>
              {report.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={getPriorityColor(report.priority)}>
              {report.priority.toUpperCase()} PRIORITY
            </Badge>
            {report.category && (
              <Badge variant="outline">
                {report.category.toUpperCase()}
              </Badge>
            )}
            <Badge variant="outline" className="font-mono text-xs">
              ID: {report.id.substring(0, 8)}
            </Badge>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-blue-600" />
              <span><strong>Location:</strong> {report.location}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 text-green-600" />
              <span><strong>Reported:</strong> {formatDate(report.created_at)}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Description
            </h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
              {report.description}
            </p>
          </div>

          {/* Additional Details */}
          {(report.estimated_cost || report.affected_population) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.estimated_cost && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-1">Estimated Cost</h4>
                  <p className="text-blue-700 text-lg font-bold">
                    {formatCurrency(report.estimated_cost)}
                  </p>
                </div>
              )}
              {report.affected_population && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-1">Affected Population</h4>
                  <p className="text-orange-700 text-lg font-bold">
                    {report.affected_population.toLocaleString()} people
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Photos */}
          {report.photo_urls && report.photo_urls.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Evidence Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {report.photo_urls.map((url, index) => (
                  <div key={index} className="aspect-square">
                    <img
                      src={url}
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(url, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Report Status</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-600">Report submitted on {formatDate(report.created_at)}</span>
              </div>
              <div className="flex items-center text-sm">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  ['under_review', 'in_progress', 'completed'].includes(report.status.toLowerCase()) 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300'
                }`}></div>
                <span className="text-gray-600">
                  {['under_review', 'in_progress', 'completed'].includes(report.status.toLowerCase())
                    ? 'Report is being reviewed'
                    : 'Awaiting review'
                  }
                </span>
              </div>
              <div className="flex items-center text-sm">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  report.status.toLowerCase() === 'completed' 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                }`}></div>
                <span className="text-gray-600">
                  {report.status.toLowerCase() === 'completed'
                    ? 'Report resolved'
                    : 'Resolution pending'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDetailsModal;