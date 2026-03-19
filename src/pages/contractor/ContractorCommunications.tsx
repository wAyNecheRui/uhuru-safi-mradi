import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  MessageSquare, Bell, AlertTriangle, Send, User, Building2, 
  Users, FileText, Clock, CheckCircle, Loader2, Plus, Search
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  from: string;
  fromType: 'government' | 'citizen' | 'supplier' | 'subcontractor';
  subject: string;
  preview: string;
  timestamp: string;
  read: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface Dispute {
  id: string;
  projectName: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  createdAt: string;
  description: string;
}

const ContractorCommunications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [newDisputeOpen, setNewDisputeOpen] = useState(false);
  const [disputeForm, setDisputeForm] = useState({
    projectId: '',
    category: '',
    description: ''
  });

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contractor', href: '/contractor' },
    { label: 'Communications' }
  ];

  useEffect(() => {
    if (user) {
      fetchCommunicationsData();
    }
  }, [user]);

  const fetchCommunicationsData = async () => {
    try {
      setLoading(true);
      
      // Fetch notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const formattedNotifications: Notification[] = notificationsData?.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type as Notification['type'],
        timestamp: n.created_at,
        read: n.read,
        actionUrl: n.action_url || undefined
      })) || [];

      // Messages would come from a messaging table in production
      // Currently not implemented - showing empty state
      setMessages([]);
      setNotifications(formattedNotifications);
      setDisputes([]);

    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDispute = async () => {
    if (!disputeForm.category || !disputeForm.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Dispute Submitted",
      description: "Your dispute has been submitted and will be reviewed by county officials.",
    });

    setNewDisputeOpen(false);
    setDisputeForm({ projectId: '', category: '', description: '' });
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const getFromTypeIcon = (type: string) => {
    switch (type) {
      case 'government': return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'citizen': return <Users className="h-5 w-5 text-green-600" />;
      case 'supplier': return <FileText className="h-5 w-5 text-purple-600" />;
      default: return <User className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getDisputeStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading communications...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Communications & Support</h1>
            <p className="text-gray-600">Manage messages, notifications, and dispute resolution.</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-lg border-l-4 border-l-blue-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {messages.filter(m => !m.read).length}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-l-4 border-l-yellow-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Notifications</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {notifications.filter(n => !n.read).length}
                    </p>
                  </div>
                  <Bell className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-l-4 border-l-red-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open Disputes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {disputes.filter(d => d.status === 'open' || d.status === 'in_progress').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-l-4 border-l-green-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {disputes.filter(d => d.status === 'resolved').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="messages" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg">
              <TabsTrigger value="messages" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Messages ({messages.length})
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
                Notifications ({notifications.filter(n => !n.read).length})
              </TabsTrigger>
              <TabsTrigger value="disputes" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Disputes ({disputes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                      Inbox
                    </CardTitle>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search messages..." className="pl-10 w-64" />
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Send className="h-4 w-4 mr-2" />
                        Compose
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No messages yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors ${
                            message.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {getFromTypeIcon(message.fromType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`font-medium truncate ${!message.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {message.from}
                              </p>
                              <span className="text-xs text-gray-500">
                                {new Date(message.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className={`text-sm ${!message.read ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                              {message.subject}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{message.preview}</p>
                          </div>
                          {!message.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-yellow-600" />
                    System Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No notifications yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-4 rounded-lg border ${getNotificationTypeColor(notification.type)} ${
                            !notification.read ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">{notification.title}</p>
                              <p className="text-sm mt-1">{notification.message}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs opacity-75">
                                {new Date(notification.timestamp).toLocaleString()}
                              </span>
                              {!notification.read && (
                                <Badge variant="outline" className="text-xs">New</Badge>
                              )}
                            </div>
                          </div>
                          {notification.actionUrl && (
                            <Button size="sm" variant="outline" className="mt-2">
                              View Details
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="disputes" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                      Dispute Resolution
                    </CardTitle>
                    <Button onClick={() => setNewDisputeOpen(true)} className="bg-red-600 hover:bg-red-700">
                      <Plus className="h-4 w-4 mr-2" />
                      New Dispute
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {disputes.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Open Disputes</h3>
                      <p className="text-gray-600">You don't have any active disputes. That's great!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {disputes.map((dispute) => (
                        <div key={dispute.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{dispute.projectName}</h4>
                              <p className="text-sm text-gray-500">{dispute.category}</p>
                            </div>
                            <Badge className={getDisputeStatusColor(dispute.status)}>
                              {dispute.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{dispute.description}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              <Clock className="h-4 w-4 inline mr-1" />
                              Opened: {new Date(dispute.createdAt).toLocaleDateString()}
                            </span>
                            <Button size="sm" variant="outline">View Details</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>
      </main>

      {/* New Dispute Dialog */}
      <Dialog open={newDisputeOpen} onOpenChange={setNewDisputeOpen}>
        <DialogContent className="max-w-lg flex flex-col max-h-[90dvh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="pr-8">Submit New Dispute</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0 pr-1">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={disputeForm.category} 
                onValueChange={(value) => setDisputeForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dispute category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quality">Quality Issues</SelectItem>
                  <SelectItem value="payments">Payment Disputes</SelectItem>
                  <SelectItem value="scope">Scope Changes</SelectItem>
                  <SelectItem value="timeline">Timeline Disputes</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={disputeForm.description}
                onChange={(e) => setDisputeForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the issue in detail..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDisputeOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitDispute} className="bg-red-600 hover:bg-red-700">
              Submit Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractorCommunications;
