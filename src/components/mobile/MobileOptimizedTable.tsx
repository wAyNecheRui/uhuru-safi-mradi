
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { SwipeableCard } from './TouchGestures';

interface TableData {
  id: string | number;
  [key: string]: any;
}

interface MobileTableProps {
  data: TableData[];
  columns: {
    key: string;
    label: string;
    priority: 'high' | 'medium' | 'low';
    render?: (value: any, row: TableData) => React.ReactNode;
  }[];
  onRowAction?: (action: string, row: TableData) => void;
  actions?: { label: string; value: string }[];
}

export const MobileOptimizedTable = ({ 
  data, 
  columns, 
  onRowAction,
  actions = []
}: MobileTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  const toggleExpanded = (id: string | number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const highPriorityColumns = columns.filter(col => col.priority === 'high');
  const otherColumns = columns.filter(col => col.priority !== 'high');

  return (
    <div className="space-y-2">
      {data.map((row) => {
        const isExpanded = expandedRows.has(row.id);
        
        return (
          <SwipeableCard
            key={row.id}
            onSwipeLeft={() => actions.length > 0 && onRowAction?.(actions[0].value, row)}
            onSwipeRight={() => toggleExpanded(row.id)}
          >
            <Card className="p-4">
              {/* Always visible high priority data */}
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-1">
                  {highPriorityColumns.map((col) => (
                    <div key={col.key} className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center space-x-2">
                  {actions.length > 0 && (
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {otherColumns.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(row.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>

              {/* Expandable additional data */}
              {isExpanded && otherColumns.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-1 gap-2">
                    {otherColumns.map((col) => (
                      <div key={col.key} className="flex justify-between">
                        <span className="text-sm text-gray-600">{col.label}:</span>
                        <span className="text-sm font-medium">
                          {col.render ? col.render(row[col.key], row) : row[col.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </SwipeableCard>
        );
      })}
    </div>
  );
};
