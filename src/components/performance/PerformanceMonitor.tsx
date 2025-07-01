
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePerformance } from '@/hooks/usePerformance';
import { Activity, Clock, Cpu, Zap } from 'lucide-react';

interface PerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
}

export const PerformanceMonitor = ({ 
  className, 
  showDetails = false 
}: PerformanceMonitorProps) => {
  const metrics = usePerformance();
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development or when explicitly requested
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development' || showDetails);
  }, [showDetails]);

  if (!isVisible) return null;

  const getPerformanceLevel = (fps: number) => {
    if (fps >= 55) return { level: 'Excellent', color: 'bg-green-500' };
    if (fps >= 45) return { level: 'Good', color: 'bg-blue-500' };
    if (fps >= 30) return { level: 'Fair', color: 'bg-yellow-500' };
    return { level: 'Poor', color: 'bg-red-500' };
  };

  const performance = getPerformanceLevel(metrics.fps);

  return (
    <Card className={`fixed bottom-4 right-4 w-80 z-50 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Activity className="h-4 w-4" />
          <span>Performance Monitor</span>
          <Badge variant="outline" className={performance.color}>
            {performance.level}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-3 w-3" />
            <span className="text-xs">FPS</span>
          </div>
          <span className="text-sm font-mono">{metrics.fps}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3" />
            <span className="text-xs">Load Time</span>
          </div>
          <span className="text-sm font-mono">{metrics.loadTime.toFixed(2)}ms</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="h-3 w-3" />
            <span className="text-xs">Memory</span>
          </div>
          <span className="text-sm font-mono">{metrics.memoryUsage.toFixed(1)}MB</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Frame Rate</span>
            <span>{metrics.fps}/60 FPS</span>
          </div>
          <Progress value={(metrics.fps / 60) * 100} className="h-1" />
        </div>

        {showDetails && (
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <p>• Green: 55+ FPS (Excellent)</p>
            <p>• Blue: 45-54 FPS (Good)</p>
            <p>• Yellow: 30-44 FPS (Fair)</p>
            <p>• Red: Below 30 FPS (Poor)</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
