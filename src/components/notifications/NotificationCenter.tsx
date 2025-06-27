
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Notification } from '@/types/onboarding';

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

const NotificationCenter = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll
}: NotificationCenterProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      project: 'bg-blue-100 text-blue-800',
      payment: 'bg-green-100 text-green-800',
      report: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full px-2 py-1 text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex space-x-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
                Mark All Read
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClearAll}>
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  notification.isRead
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-white border-blue-200 shadow-sm'
                }`}
                onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getCategoryColor(notification.category)}>
                          {notification.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    {notification.actionUrl && notification.actionText && (
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(notification.actionUrl, '_blank');
                        }}
                      >
                        {notification.actionText}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
