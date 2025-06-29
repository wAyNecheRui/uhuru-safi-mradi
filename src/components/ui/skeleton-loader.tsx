
import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-gray-200 dark:bg-gray-700",
        className
      )}
    />
  );
};

export const CardSkeleton = () => (
  <div className="p-6 space-y-4 bg-white rounded-lg shadow border">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    <div className="flex space-x-4">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton = () => (
  <div className="h-64 bg-white rounded-lg border p-4">
    <Skeleton className="h-4 w-1/3 mb-4" />
    <div className="h-48 flex items-end space-x-2">
      <Skeleton className="flex-1 h-8" />
      <Skeleton className="flex-1 h-12" />
      <Skeleton className="flex-1 h-16" />
      <Skeleton className="flex-1 h-10" />
      <Skeleton className="flex-1 h-20" />
      <Skeleton className="flex-1 h-14" />
      <Skeleton className="flex-1 h-18" />
      <Skeleton className="flex-1 h-6" />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <TableSkeleton />
    </div>
  </div>
);
