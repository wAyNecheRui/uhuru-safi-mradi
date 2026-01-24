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
  DollarSign,
  Calendar,
  Settings,
  XCircle,
  Info,
  Briefcase,
  ShieldCheck,
  FileText,
  Users,
  Loader2,
  Building2,
  Scale,
  AlertOctagon,
  Flag
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { normalizeCategory, getCategoryBadgeColor, getCategoryLabel, filterNotificationsByCategory } from '@/utils/notificationCategories';

const GovernmentNotifications = () => {
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
    reportSubmissions: true,
    bidSubmissions: true,
    paymentApprovals: true,
    milestoneCompletions: true,
    verificationRequests: true,
    complianceAlerts: true,
    securityAlerts: true,
    systemUpdates: true,
    smsNotifications: false,
    emailDigest: true
  });

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Notifications' }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('government_notification_preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  const savePreferences = () => {
    localStorage.setItem('government_notification_preferences', JSON.stringify(preferences));
    toast.success('Notification preferences saved!');
  };

  const getNotificationIcon = (type: string, category: string) => {
    if (type === 'success') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (type === 'warning') return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    if (type === 'error') return <XCircle className="h-5 w-5 text-red-600" />;
    
    switch (category) {
      case 'project': return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'payment': return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'bid': return <Briefcase className="h-5 w-5 text-purple-600" />;
      case 'verification': return <ShieldCheck className="h-5 w-5 text-teal-600" />;
      case 'milestone': return <FileText className="h-5 w-5 text-orange-600" />;
      case 'report': return <Flag className="h-5 w-5 text-indigo-600" />;
      case 'compliance': return <Scale className="h-5 w-5 text-amber-600" />;
      case 'security': return <AlertOctagon className="h-5 w-5 text-red-600" />;
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

  const urgentCount = notifications.filter(n => 
    !n.read && (n.type === 'error' || n.type === 'warning' || normalizeCategory(n.category) === 'system')
  ).length;

  const renderNotificationCard = (notification: any) => (
    <Card 
      key={notification.id} 
      className={cn(
        "hover:shadow-lg transition-all cursor-pointer border-l-4",
        !notification.read 
          ? 'bg-primary/5 border-l-primary' 
          : 'border-l-transparent',
        (notification.type === 'error' || notification.category === 'security') && !notification.read
          ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
          : ''
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
                className={cn("text-xs capitalize", getCategoryBadgeColor(notification.category))}
              >
                {getCategoryLabel(notification.category)}
              </Badge>
              {(notification.type === 'error' || notification.type === 'warning') && (
                <Badge variant="destructive" className="text-xs">
                  {notification.type === 'error' ? 'Critical' : 'Warning'}
                </Badge>
              )}
              {notification.action_url && (
                <span className="text-xs text-primary">View details →</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
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
                Government Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    {unreadCount} new
                  </Badge>
                )}
                {urgentCount > 0 && (
                  <Badge variant="outline" className="text-sm bg-red-100 text-red-800 border-red-300">
                    {urgentCount} urgent
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
            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 bg-muted/50">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="urgent" className="text-xs sm:text-sm text-red-600">
                Urgent {urgentCount > 0 && `(${urgentCount})`}
              </TabsTrigger>
              <TabsTrigger value="report" className="text-xs sm:text-sm">Reports</TabsTrigger>
              <TabsTrigger value="bid" className="text-xs sm:text-sm">Bids</TabsTrigger>
              <TabsTrigger value="payment" className="text-xs sm:text-sm">Payments</TabsTrigger>
              <TabsTrigger value="project" className="text-xs sm:text-sm">Projects</TabsTrigger>
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

            {/* Urgent */}
            <TabsContent value="urgent">
              <ScrollArea className="h-[calc(100vh-350px)]">
                {filterByCategory('urgent').length === 0 ? (
                  renderEmptyState("No Urgent Alerts", <AlertOctagon className="h-12 w-12 text-green-500" />)
                ) : (
                  <div className="space-y-3 pr-4">
                    {filterByCategory('urgent').map(renderNotificationCard)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Reports */}
            <TabsContent value="report">
              <ScrollArea className="h-[calc(100vh-350px)]">
                {filterByCategory('report').length === 0 ? (
                  renderEmptyState("No Report Submissions", <Flag className="h-12 w-12" />)
                ) : (
                  <div className="space-y-3 pr-4">
                    {filterByCategory('report').map(renderNotificationCard)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Bids */}
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

            {/* Payments */}
            <TabsContent value="payment">
              <ScrollArea className="h-[calc(100vh-350px)]">
                {filterByCategory('payment').length === 0 ? (
                  renderEmptyState("No Payment Alerts", <DollarSign className="h-12 w-12" />)
                ) : (
                  <div className="space-y-3 pr-4">
                    {filterByCategory('payment').map(renderNotificationCard)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Projects */}
            <TabsContent value="project">
              <ScrollArea className="h-[calc(100vh-350px)]">
                {filterByCategory('project').length === 0 ? (
                  renderEmptyState("No Project Updates", <Building2 className="h-12 w-12" />)
                ) : (
                  <div className="space-y-3 pr-4">
                    {filterByCategory('project').map(renderNotificationCard)}
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
                    Government Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    {[
                      { key: 'reportSubmissions', label: 'Report Submissions', desc: 'New citizen problem reports' },
                      { key: 'bidSubmissions', label: 'Bid Submissions', desc: 'New contractor bids for approval' },
                      { key: 'paymentApprovals', label: 'Payment Approvals', desc: 'Milestone payments pending release' },
                      { key: 'milestoneCompletions', label: 'Milestone Completions', desc: 'Project progress updates' },
                      { key: 'verificationRequests', label: 'Verification Requests', desc: 'Contractor and role verifications' },
                      { key: 'complianceAlerts', label: 'Compliance Alerts', desc: 'Regulatory and audit notifications' },
                      { key: 'securityAlerts', label: 'Security Alerts', desc: 'Critical security notifications' },
                      { key: 'systemUpdates', label: 'System Updates', desc: 'Platform and maintenance updates' },
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
                          <p className="text-sm text-muted-foreground">Urgent and security alerts via SMS</p>
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
                          <p className="text-sm text-muted-foreground">Daily activity summary via email</p>
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

                  <Button className="w-full" onClick={savePreferences}>
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

export default GovernmentNotifications;
