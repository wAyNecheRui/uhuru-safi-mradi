import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare,
  Wallet,
  Calendar,
  Settings,
  XCircle,
  Info,
  Briefcase,
  ShieldCheck,
  FileText,
  Users,
  Loader2
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { normalizeCategory, getCategoryBadgeColor as getStandardBadgeColor, getCategoryLabel, filterNotificationsByCategory } from '@/utils/notificationCategories';
import { useState, useEffect } from 'react';

const CitizenNotifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  } = useRealtimeNotifications();

  const [preferences, setPreferences] = useState({
    projectUpdates: true,
    votingAlerts: true,
    paymentAlerts: true,
    bidNotifications: true,
    reportUpdates: true,
    verificationAlerts: true,
    smsNotifications: false,
    emailDigest: true
  });

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Notifications' }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('citizen_notification_preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  const savePreferences = () => {
    localStorage.setItem('citizen_notification_preferences', JSON.stringify(preferences));
    toast.success('Notification preferences saved!');
  };

  const getNotificationIcon = (type: string, category: string) => {
    // First check by type for status icons
    if (type === 'success') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (type === 'warning') return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    if (type === 'error') return <XCircle className="h-5 w-5 text-red-600" />;
    
    // Then by category for contextual icons
    switch (category) {
      case 'project': return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'payment': return <Wallet className="h-5 w-5 text-green-600" />;
      case 'report': return <MessageSquare className="h-5 w-5 text-purple-600" />;
      case 'verification': return <ShieldCheck className="h-5 w-5 text-teal-600" />;
      case 'bid': return <Briefcase className="h-5 w-5 text-indigo-600" />;
      case 'milestone': return <FileText className="h-5 w-5 text-orange-600" />;
      case 'workflow': return <Users className="h-5 w-5 text-cyan-600" />;
      case 'system': return <Settings className="h-5 w-5 text-gray-600" />;
      default: return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const filterByCategory = (category: string) => {
    return filterNotificationsByCategory(notifications, category);
  };

  const renderNotificationCard = (notification: any) => (
    <Card 
      key={notification.id} 
      className={cn(
        "hover:shadow-lg transition-all cursor-pointer border-l-4",
        !notification.read 
          ? 'bg-primary/5 border-l-primary' 
          : 'border-l-transparent'
      )}
      onClick={() => handleNotificationClick(notification)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex-shrink-0">
            {getNotificationIcon(notification.type, notification.category)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2 mb-1">
              <h3 className={cn(
                "font-semibold truncate",
                !notification.read ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {notification.title}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {notification.message}
            </p>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn("text-xs capitalize", getStandardBadgeColor(notification.category))}
              >
                {getCategoryLabel(notification.category)}
              </Badge>
              {notification.action_url && (
                <span className="text-xs text-primary">View details →</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              deleteNotification(notification.id);
            }}
          >
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (message: string, icon: React.ReactNode) => (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 opacity-50">{icon}</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{message}</h3>
        <p className="text-muted-foreground">Check back later for updates.</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Bell className="h-7 w-7 text-primary" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    {unreadCount} new
                  </Badge>
                )}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isConnected ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Live updates active</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                    <span>Connecting...</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
              <Button 
                variant="outline" 
                onClick={clearAll}
                disabled={notifications.length === 0}
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Tabs for categories */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-muted/50">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs sm:text-sm">
                Unread ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="project" className="text-xs sm:text-sm">Projects</TabsTrigger>
              <TabsTrigger value="payment" className="text-xs sm:text-sm">Payments</TabsTrigger>
              <TabsTrigger value="bid" className="text-xs sm:text-sm">Bids</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">
                <Settings className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            {/* All Notifications */}
            <TabsContent value="all">
              <ScrollArea className="h-[calc(100vh-350px)]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : notifications.length === 0 ? (
                  renderEmptyState("No Notifications", <Bell className="h-12 w-12" />)
                ) : (
                  <div className="space-y-3 pr-4">
                    {notifications.map(renderNotificationCard)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Unread Notifications */}
            <TabsContent value="unread">
              <ScrollArea className="h-[calc(100vh-350px)]">
                {filterByCategory('unread').length === 0 ? (
                  renderEmptyState("All Caught Up!", <CheckCircle className="h-12 w-12 text-green-500" />)
                ) : (
                  <div className="space-y-3 pr-4">
                    {filterByCategory('unread').map(renderNotificationCard)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Project Notifications */}
            <TabsContent value="project">
              <ScrollArea className="h-[calc(100vh-350px)]">
                {filterByCategory('project').length === 0 ? (
                  renderEmptyState("No Project Updates", <Calendar className="h-12 w-12" />)
                ) : (
                  <div className="space-y-3 pr-4">
                    {filterByCategory('project').map(renderNotificationCard)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Payment Notifications */}
            <TabsContent value="payment">
              <ScrollArea className="h-[calc(100vh-350px)]">
                {filterByCategory('payment').length === 0 ? (
                  renderEmptyState("No Payment Alerts", <Wallet className="h-12 w-12" />)
                ) : (
                  <div className="space-y-3 pr-4">
                    {filterByCategory('payment').map(renderNotificationCard)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Bid Notifications */}
            <TabsContent value="bid">
              <ScrollArea className="h-[calc(100vh-350px)]">
                {filterByCategory('bid').length === 0 ? (
                  renderEmptyState("No Bid Notifications", <Briefcase className="h-12 w-12" />)
                ) : (
                  <div className="space-y-3 pr-4">
                    {filterByCategory('bid').map(renderNotificationCard)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    {[
                      { key: 'projectUpdates', label: 'Project Updates', desc: 'Status changes, milestones, and completions' },
                      { key: 'votingAlerts', label: 'Voting Alerts', desc: 'New reports needing community votes' },
                      { key: 'paymentAlerts', label: 'Payment Alerts', desc: 'Escrow funding and payment releases' },
                      { key: 'bidNotifications', label: 'Bid Notifications', desc: 'Contractor bids and selections' },
                      { key: 'reportUpdates', label: 'Report Updates', desc: 'Your submitted report status changes' },
                      { key: 'verificationAlerts', label: 'Verification Alerts', desc: 'Milestone verification requests' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-foreground">{label}</h4>
                          <p className="text-sm text-muted-foreground">{desc}</p>
                        </div>
                        <Switch 
                          checked={preferences[key as keyof typeof preferences] as boolean}
                          onCheckedChange={(checked) => 
                            setPreferences(prev => ({ ...prev, [key]: checked }))
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium text-foreground mb-4">Delivery Methods</h4>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-foreground">SMS Notifications</h4>
                          <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
                        </div>
                        <Switch 
                          checked={preferences.smsNotifications}
                          onCheckedChange={(checked) => 
                            setPreferences(prev => ({ ...prev, smsNotifications: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-foreground">Email Digest</h4>
                          <p className="text-sm text-muted-foreground">Weekly summary via email</p>
                        </div>
                        <Switch 
                          checked={preferences.emailDigest}
                          onCheckedChange={(checked) => 
                            setPreferences(prev => ({ ...prev, emailDigest: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={savePreferences}
                  >
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenNotifications;
