import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Loader2, AlertTriangle, Plus, MessageSquare, CheckCircle2, 
  Clock, Shield, XCircle, Filter, Building2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface Dispute {
  id: string;
  project_id: string;
  milestone_id: string | null;
  raised_by: string;
  dispute_type: string;
  title: string;
  description: string;
  evidence_urls: string[];
  status: string;
  priority: string;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  project?: { title: string };
}

interface Project {
  id: string;
  title: string;
}

export default function DisputeResolution() {
  const { user } = useAuth();
  const [userType, setUserType] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserType = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .single();
        setUserType(data?.user_type || null);
      }
    };
    fetchUserType();
  }, [user]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formData, setFormData] = useState({
    project_id: "",
    dispute_type: "",
    title: "",
    description: "",
    priority: "medium"
  });

  const [resolution, setResolution] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch disputes
      const { data: disputesData, error: disputesError } = await supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });

      if (disputesError) throw disputesError;

      // Enrich with project titles
      const enriched = await Promise.all(
        (disputesData || []).map(async (dispute) => {
          const { data: project } = await supabase
            .from('projects')
            .select('title')
            .eq('id', dispute.project_id)
            .single();
          return { ...dispute, project };
        })
      );

      // Fetch user's projects for creating disputes
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, title');

      setDisputes(enriched);
      setProjects(projectsData || []);
    } catch (error: any) {
      toast.error("Failed to fetch disputes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispute = async () => {
    if (!formData.project_id || !formData.dispute_type || !formData.title || !formData.description) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('disputes')
        .insert({
          project_id: formData.project_id,
          dispute_type: formData.dispute_type,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          raised_by: user?.id,
          status: 'open'
        });

      if (error) throw error;

      toast.success("Dispute submitted successfully");
      setShowCreateDialog(false);
      setFormData({
        project_id: "",
        dispute_type: "",
        title: "",
        description: "",
        priority: "medium"
      });
      fetchData();
    } catch (error: any) {
      toast.error("Failed to create dispute", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute || !resolution) {
      toast.error("Please provide a resolution");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          resolution,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', selectedDispute.id);

      if (error) throw error;

      toast.success("Dispute resolved successfully");
      setShowResolveDialog(false);
      setSelectedDispute(null);
      setResolution("");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to resolve dispute", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (disputeId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('disputes')
        .update({ status: newStatus })
        .eq('id', disputeId);

      if (error) throw error;

      toast.success(`Dispute status updated to ${newStatus}`);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'under_review': return 'default';
      case 'resolved': return 'secondary';
      case 'escalated': return 'destructive';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4" />;
      case 'under_review': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle2 className="h-4 w-4" />;
      case 'escalated': return <Shield className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const filteredDisputes = filterStatus === "all" 
    ? disputes 
    : disputes.filter(d => d.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            Dispute Resolution Center
          </h1>
          <p className="text-muted-foreground mt-2">
            File and manage disputes related to project quality, payments, or timelines
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Raise Dispute
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{disputes.length}</p>
            <p className="text-xs text-muted-foreground">Total Disputes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {disputes.filter(d => d.status === 'open').length}
            </p>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {disputes.filter(d => d.status === 'under_review').length}
            </p>
            <p className="text-xs text-muted-foreground">Under Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {disputes.filter(d => d.status === 'resolved').length}
            </p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">
              {disputes.filter(d => d.status === 'escalated').length}
            </p>
            <p className="text-xs text-muted-foreground">Escalated</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Disputes</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {filteredDisputes.map((dispute) => (
          <Card key={dispute.id}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(dispute.status)}
                    <h3 className="font-semibold">{dispute.title}</h3>
                    <Badge variant={getStatusColor(dispute.status)}>{dispute.status}</Badge>
                    <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(dispute.priority)}`}>
                      {dispute.priority}
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                    {dispute.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {dispute.project?.title || 'Unknown Project'}
                    </span>
                    <Badge variant="outline">{dispute.dispute_type}</Badge>
                    <span className="text-muted-foreground">
                      Filed: {format(new Date(dispute.created_at), 'PP')}
                    </span>
                  </div>

                  {dispute.resolution && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">Resolution:</p>
                      <p className="text-sm">{dispute.resolution}</p>
                    </div>
                  )}
                </div>

                {userType === 'government' && dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                  <div className="flex flex-col gap-2">
                    {dispute.status === 'open' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateStatus(dispute.id, 'under_review')}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Start Review
                      </Button>
                    )}
                    <Button 
                      size="sm"
                      onClick={() => {
                        setSelectedDispute(dispute);
                        setShowResolveDialog(true);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                    {dispute.status !== 'escalated' && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleUpdateStatus(dispute.id, 'escalated')}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Escalate
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDisputes.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">No disputes found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dispute Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Raise a Dispute</DialogTitle>
            <DialogDescription>
              File a formal dispute regarding project quality, payment, or timeline issues
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dispute Type *</Label>
                <Select
                  value={formData.dispute_type}
                  onValueChange={(value) => setFormData({ ...formData, dispute_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quality">Quality Issue</SelectItem>
                    <SelectItem value="payment">Payment Issue</SelectItem>
                    <SelectItem value="timeline">Timeline Issue</SelectItem>
                    <SelectItem value="scope">Scope Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief title for the dispute"
              />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the issue in detail..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDispute} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Submit Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dispute Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              {selectedDispute?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{selectedDispute?.description}</p>
            </div>

            <div className="space-y-2">
              <Label>Resolution *</Label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how the dispute was resolved..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolveDispute} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Resolve Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}