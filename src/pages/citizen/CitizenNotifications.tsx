import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare,
  Users,
  DollarSign,
  Calendar,
  Settings,
  Trash2,
  Eye,
  Clock
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  read: boolean;
  action_url?: string;
  created_at: string;
}

const CitizenNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    projectUpdates: true,
    votingAlerts: true,
    communityMeetings: true,
    smsNotifications: false,
    emailDigest: true
  });

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Notifications' }
  ];

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string, category: string) => {
    if (type === 'success') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (type === 'warning') return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    if (type === 'error') return <AlertTriangle className="h-5 w-5 text-red-600" />;
    
    switch (category) {
      case 'project': return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'payment': return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'report': return <MessageSquare className="h-5 w-5 text-purple-600" />;
      case 'verification': return <CheckCircle className="h-5 w-5 text-teal-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Sample notifications for demo
  const sampleNotifications: Notification[] = [
    {
      id: '1',
      title: 'Problem Report Approved',
      message: 'Your reported problem "Pothole on Mombasa Road" has been approved and funding allocated.',
      type: 'success',
      category: 'report',
      read: false,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Contractor Started Work',
      message: 'ABC Construction has started work on the road repair project in your area.',
      type: 'info',
      category: 'project',
      read: false,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '3',
      title: 'Verification Needed',
      message: 'Milestone 2 of "Water Pipeline Installation" requires your verification.',
      type: 'warning',
      category: 'verification',
      read: true,
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '4',
      title: 'Community Meeting',
      message: 'Community development meeting scheduled for next week at Kasarani Community Center.',
      type: 'info',
      category: 'system',
      read: true,
      created_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: '5',
      title: 'Urgent Voting Needed',
      message: '5 new problems in your area need community votes. Your participation matters!',
      type: 'warning',
      category: 'report',
      read: false,
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const displayNotifications = notifications.length > 0 ? notifications : sampleNotifications;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-3 bg-red-500">{unreadCount} new</Badge>
                )}
              </h1>
              <p className="text-gray-600">Stay updated on your reports, projects, and community activities.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {loading ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="animate-pulse">Loading notifications...</div>
                  </CardContent>
                </Card>
              ) : displayNotifications.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications</h3>
                    <p className="text-gray-600">You're all caught up!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {displayNotifications.map((notification) => (
                    <Card 
                      key={notification.id} 
                      className={`hover:shadow-lg transition-shadow cursor-pointer ${
                        !notification.read ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            {getNotificationIcon(notification.type, notification.category)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  {formatDate(notification.created_at)}
                                </span>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm">{notification.message}</p>
                            {notification.action_url && (
                              <Button variant="link" className="p-0 h-auto mt-2 text-blue-600">
                                View Details →
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="unread" className="space-y-4">
              {displayNotifications.filter(n => !n.read).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                    <p className="text-gray-600">No unread notifications.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {displayNotifications.filter(n => !n.read).map((notification) => (
                    <Card 
                      key={notification.id} 
                      className="bg-blue-50 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            {getNotificationIcon(notification.type, notification.category)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                              <span className="text-sm text-gray-500">
                                {formatDate(notification.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm">{notification.message}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              {displayNotifications.filter(n => n.category === 'project' || n.category === 'verification').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Project Updates</h3>
                    <p className="text-gray-600">Project-related notifications will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {displayNotifications
                    .filter(n => n.category === 'project' || n.category === 'verification')
                    .map((notification) => (
                      <Card key={notification.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="mt-1">
                              {getNotificationIcon(notification.type, notification.category)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
                              <p className="text-gray-600 text-sm">{notification.message}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Project Updates</h4>
                        <p className="text-sm text-gray-600">Get notified when your reported problems are approved or contractors start work.</p>
                      </div>
                      <Switch 
                        checked={preferences.projectUpdates}
                        onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, projectUpdates: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Voting Alerts</h4>
                        <p className="text-sm text-gray-600">Receive alerts when new problems in your area need community votes.</p>
                      </div>
                      <Switch 
                        checked={preferences.votingAlerts}
                        onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, votingAlerts: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Community Meetings</h4>
                        <p className="text-sm text-gray-600">Get notified about upcoming community development meetings.</p>
                      </div>
                      <Switch 
                        checked={preferences.communityMeetings}
                        onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, communityMeetings: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                        <p className="text-sm text-gray-600">Receive important updates via SMS to your registered phone number.</p>
                      </div>
                      <Switch 
                        checked={preferences.smsNotifications}
                        onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, smsNotifications: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Email Digest</h4>
                        <p className="text-sm text-gray-600">Receive a weekly summary of community activities via email.</p>
                      </div>
                      <Switch 
                        checked={preferences.emailDigest}
                        onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailDigest: checked }))}
                      />
                    </div>
                  </div>

                  <Button className="w-full bg-green-600 hover:bg-green-700">
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
