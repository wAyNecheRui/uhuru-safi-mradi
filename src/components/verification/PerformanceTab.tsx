
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const PerformanceTab = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">98%</div>
          <div className="text-sm text-gray-600">On-Time Completion</div>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">4.6</div>
          <div className="text-sm text-gray-600">Average Rating</div>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">94%</div>
          <div className="text-sm text-gray-600">Quality Score</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceTab;
