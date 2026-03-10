import React, { useState } from 'react';
import { Bell, Check, CheckCheck, ExternalLink, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const NotificationBell: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    isConnected,
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useRealtimeNotifications();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getTypeIcon = (type: string, category: string) => {
    switch (category) {
      case 'report': return '📋';
      case 'bid': return '💼';
      case 'bidding': return '🏗️';
      case 'milestone': return '🎯';
      case 'payment': return '💰';
      case 'escrow': return '🏦';
      case 'project': return '📁';
      case 'vote': return '🗳️';
      case 'verification': return '✅';
      case 'issue': return '⚠️';
      case 'rating': return '⭐';
      case 'system': return '🔔';
      default: return '🔔';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      setIsOpen(false);
      navigate(notification.action_url);
    }
  };

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(notifications.map(n => n.category).filter(Boolean)))];
  
  // Filter notifications
  const filteredNotifications = selectedCategory === 'all' 
    ? notifications 
    : notifications.filter(n => n.category === selectedCategory);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={cn(
            "h-5 w-5 transition-all", 
            unreadCount > 0 && "animate-pulse text-primary"
          )} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs animate-in zoom-in-50"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Notifications</h4>
            <Badge variant="outline" className="text-xs">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 mr-1 text-emerald-500" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1 text-muted-foreground" />
                  Connecting...
                </>
              )}
            </Badge>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Category Filter */}
        {categories.length > 2 && (
          <div className="px-4 py-2 border-b">
            <ScrollArea className="w-full">
              <div className="flex gap-1 pb-1">
                {categories.slice(0, 6).map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    {cat === 'all' && unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto mb-2"></div>
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No notifications</p>
              <p className="text-sm mt-1">
                {selectedCategory === 'all' 
                  ? "You're all caught up!" 
                  : `No ${selectedCategory} notifications`}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "p-4 hover:bg-muted/50 cursor-pointer transition-all group",
                    !notification.read && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg">
                      {getTypeIcon(notification.type, notification.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          "text-sm truncate",
                          !notification.read ? "font-semibold" : "font-medium"
                        )}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDelete(e, notification.id)}
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          {notification.category && (
                            <Badge variant="outline" className="text-xs">
                              {notification.category}
                            </Badge>
                          )}
                        </div>
                        {notification.action_url && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="p-3 border-t bg-muted/30">
            <Button 
              variant="ghost" 
              className="w-full text-sm"
              onClick={() => {
                setIsOpen(false);
                const userType = window.location.pathname.split('/')[1] || 'citizen';
                const validTypes = ['citizen', 'contractor', 'government'];
                const notifPath = validTypes.includes(userType) ? `/${userType}/notifications` : '/citizen/notifications';
                navigate(notifPath);
              }}
            >
              View All Notifications
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
