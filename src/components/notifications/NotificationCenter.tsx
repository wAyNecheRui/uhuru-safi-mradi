import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Settings, 
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Zap,
  X,
  ExternalLink,
  BellOff,
  BellRing
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useSystemAlerts } from '@/hooks/useSystemAlerts';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { getCategoryLabel } from '@/utils/notificationCategories';

interface NotificationCenterProps {
  trigger?: React.ReactNode;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ trigger }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  
  const { 
    notifications: dbNotifications, 
    unreadCount: dbUnreadCount,
    isConnected,
    markAsRead: markDbAsRead,
    markAllAsRead: markAllDbAsRead,
    deleteNotification,
  } = useRealtimeNotifications();

  const {
    alerts: systemAlerts,
    unreadCount: alertUnreadCount,
    markAsRead: markAlertAsRead,
    markAllAsRead: markAllAlertsAsRead,
    dismissAlert
  } = useSystemAlerts({ showToasts: false });

  const {
    isSupported: pushSupported,
    isEnabled: pushEnabled,
    permissionStatus,
    requestPermission,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    isLoading: pushLoading
  } = usePushNotifications();

  const totalUnread = dbUnreadCount + alertUnreadCount;

  const [preferences, setPreferences] = useState({
    inApp: true,
    push: false,
    projects: true,
    payments: true,
    bids: true,
    system: true
  });

  useEffect(() => {
    const saved = localStorage.getItem('notification_preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  const updatePreference = (key: string, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem('notification_preferences', JSON.stringify(newPrefs));
  };

  const handleEnablePush = async () => {
    if (pushEnabled) {
      await unsubscribePush();
      updatePreference('push', false);
    } else {
      const success = await requestPermission();
      if (success) {
        await subscribePush();
        updatePreference('push', true);
      }
    }
  };

  const handleMarkAllAsRead = () => {
    markAllDbAsRead();
    markAllAlertsAsRead();
  };

  const handleNotificationClick = (notification: any, isAlert: boolean = false) => {
    if (isAlert) {
      markAlertAsRead(notification.id);
    } else {
      markDbAsRead(notification.id);
    }
    
    if (notification.action_url || notification.actionUrl) {
      setOpen(false);
      navigate(notification.action_url || notification.actionUrl);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Normalize various categories to match our tab filters
  const normalizeCategory = (category: string): string => {
    const categoryMap: Record<string, string> = {
      // Project-related
      'project': 'project',
      'milestone': 'project',
      'issue': 'project',
      'rating': 'project',
      'verification': 'project',
      // Payment-related
      'payment': 'payment',
      'escrow': 'payment',
      // Bid-related
      'bid': 'bid',
      'bidding': 'bid',
      // Report-related
      'report': 'report',
      'vote': 'report',
      // System-related
      'system': 'system',
      'security': 'system',
      'workflow': 'system',
      'general': 'system',
      'compliance': 'system',
    };
    return categoryMap[category] || 'system';
  };

  const getCategoryColor = (category: string) => {
    const normalizedCategory = normalizeCategory(category);
    const colors: Record<string, string> = {
      project: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      payment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      bid: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      report: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      system: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[normalizedCategory] || colors.system;
  };

  const renderNotificationItem = (item: any, isAlert: boolean = false) => {
    const isRead = item.read;
    const category = item.category || 'system';
    const timestamp = isAlert ? item.timestamp : new Date(item.created_at);
    const severity = item.severity || item.type || 'info';

    return (
      <div
        key={item.id}
        onClick={() => handleNotificationClick(item, isAlert)}
        className={cn(
          'p-3 rounded-lg cursor-pointer transition-colors border',
          isRead 
            ? 'bg-muted/30 border-transparent' 
            : 'bg-card border-primary/20 shadow-sm',
          'hover:bg-accent/50'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getSeverityIcon(severity)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('font-medium text-sm', !isRead && 'text-foreground')}>
                {item.title}
              </span>
              {!isRead && (
                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {item.message}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={cn('text-xs px-1.5 py-0', getCategoryColor(category))}>
                {getCategoryLabel(category)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(timestamp, { addSuffix: true })}
              </span>
              {(item.action_url || item.actionUrl) && (
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </div>
          {isAlert && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                dismissAlert(item.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const allNotifications = [
    ...systemAlerts.map(a => ({ ...a, isAlert: true, created_at: a.timestamp.toISOString() })),
    ...dbNotifications.map(n => ({ ...n, isAlert: false, timestamp: new Date(n.created_at) }))
  ].sort((a, b) => {
    const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.created_at).getTime();
    const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.created_at).getTime();
    return bTime - aTime;
  });

  // Apply user preferences filter - only show notifications for enabled categories
  const applyPreferencesFilter = (items: typeof allNotifications) => {
    if (!preferences.inApp) return []; // In-app notifications disabled
    
    return items.filter(item => {
      const normalized = normalizeCategory(item.category || 'system');
      
      // Check category preferences
      if (normalized === 'project' && !preferences.projects) return false;
      if (normalized === 'payment' && !preferences.payments) return false;
      if (normalized === 'bid' && !preferences.bids) return false;
      if (normalized === 'system' && !preferences.system) return false;
      // Reports are always shown (no specific toggle for reports)
      
      return true;
    });
  };

  const filterNotifications = (category?: string) => {
    const filtered = applyPreferencesFilter(allNotifications);
    
    if (!category || category === 'all') return filtered;
    
    // Filter by normalized category
    return filtered.filter(n => normalizeCategory(n.category || 'system') === category);
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      {totalUnread > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {totalUnread > 99 ? '99+' : totalUnread}
        </Badge>
      )}
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col" hideCloseButton>
        <SheetHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="flex items-center gap-2 min-w-0">
              <Zap className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="truncate">Notification Center</span>
            </SheetTitle>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleMarkAllAsRead}
                disabled={totalUnread === 0}
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowSettings(!showSettings)}
                title={showSettings ? "Back to notifications" : "Settings"}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isConnected ? (
              <>
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Live updates active
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                Connecting...
              </>
            )}
            {totalUnread > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {totalUnread} unread
              </Badge>
            )}
          </div>
        </SheetHeader>

        {showSettings ? (
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Notification Delivery</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="in-app" className="text-sm">In-App Notifications</Label>
                      <p className="text-xs text-muted-foreground">Show notifications in the app</p>
                    </div>
                    <Switch 
                      id="in-app" 
                      checked={preferences.inApp}
                      onCheckedChange={(v) => updatePreference('inApp', v)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push" className="text-sm flex items-center gap-2">
                        Push Notifications
                        {!pushSupported && (
                          <Badge variant="outline" className="text-xs">Not supported</Badge>
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {pushEnabled 
                          ? 'Receive alerts even when app is closed' 
                          : 'Enable to receive alerts when app is closed'}
                      </p>
                    </div>
                    <Switch 
                      id="push" 
                      checked={pushEnabled}
                      onCheckedChange={handleEnablePush}
                      disabled={!pushSupported || pushLoading}
                    />
                  </div>
                  
                  {permissionStatus === 'denied' && (
                    <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
                      <CardContent className="p-3 text-xs">
                        <div className="flex items-center gap-2">
                          <BellOff className="h-4 w-4 text-yellow-600" />
                          <span>Notifications blocked. Enable in browser settings.</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-3">Categories</h3>
                <div className="space-y-3">
                  {[
                    { key: 'projects', label: 'Project Updates', desc: 'Status changes, milestones' },
                    { key: 'payments', label: 'Payment Alerts', desc: 'Releases, transactions' },
                    { key: 'bids', label: 'Bid Notifications', desc: 'New bids, selections' },
                    { key: 'system', label: 'System Alerts', desc: 'Security, workflow updates' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key} className="text-sm">{label}</Label>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Switch 
                        id={key} 
                        checked={preferences[key as keyof typeof preferences] as boolean}
                        onCheckedChange={(v) => updatePreference(key, v)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowSettings(false)}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <div className="px-4 pt-2 flex-shrink-0">
                <TabsList className="w-full grid grid-cols-5">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="project" className="text-xs">Projects</TabsTrigger>
                  <TabsTrigger value="payment" className="text-xs">Payments</TabsTrigger>
                  <TabsTrigger value="bid" className="text-xs">Bids</TabsTrigger>
                  <TabsTrigger value="report" className="text-xs">Reports</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <TabsContent value="all" className="mt-0 h-full data-[state=active]:flex data-[state=active]:flex-col">
                  <ScrollArea className="flex-1 px-4">
                    <div className="space-y-2 py-2 pb-4">
                      {filterNotifications().length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <BellRing className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notifications yet</p>
                          <p className="text-xs mt-1">You're all caught up</p>
                        </div>
                      ) : (
                        filterNotifications().map(n => renderNotificationItem(n, n.isAlert))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="project" className="mt-0 h-full data-[state=active]:flex data-[state=active]:flex-col">
                  <ScrollArea className="flex-1 px-4">
                    <div className="space-y-2 py-2 pb-4">
                      {filterNotifications('project').length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">No project notifications</p>
                        </div>
                      ) : (
                        filterNotifications('project').map(n => renderNotificationItem(n, n.isAlert))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="payment" className="mt-0 h-full data-[state=active]:flex data-[state=active]:flex-col">
                  <ScrollArea className="flex-1 px-4">
                    <div className="space-y-2 py-2 pb-4">
                      {filterNotifications('payment').length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">No payment notifications</p>
                        </div>
                      ) : (
                        filterNotifications('payment').map(n => renderNotificationItem(n, n.isAlert))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="bid" className="mt-0 h-full data-[state=active]:flex data-[state=active]:flex-col">
                  <ScrollArea className="flex-1 px-4">
                    <div className="space-y-2 py-2 pb-4">
                      {filterNotifications('bid').length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">No bid notifications</p>
                        </div>
                      ) : (
                        filterNotifications('bid').map(n => renderNotificationItem(n, n.isAlert))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="report" className="mt-0 h-full data-[state=active]:flex data-[state=active]:flex-col">
                  <ScrollArea className="flex-1 px-4">
                    <div className="space-y-2 py-2 pb-4">
                      {filterNotifications('report').length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">No report notifications</p>
                        </div>
                      ) : (
                        filterNotifications('report').map(n => renderNotificationItem(n, n.isAlert))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>

            <div className="p-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  // Navigate to role-specific notifications page
                  const userType = user?.user_type || 'citizen';
                  const routes: Record<string, string> = {
                    citizen: '/citizen/notifications',
                    contractor: '/contractor/notifications',
                    government: '/government/notifications',
                    admin: '/government/notifications'
                  };
                  navigate(routes[userType] || '/citizen/notifications');
                }}
              >
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;
