
import React from 'react';
import { Building } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="text-center py-12">
      <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No contractors found</h3>
      <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
    </div>
  );
};

export default EmptyState;
