import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, FileText, Plus, Printer, Download, Eye, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface LPO {
  id: string;
  lpo_number: string;
  project_id: string;
  contractor_id: string;
  description: string;
  total_amount: number;
  status: string;
  terms_conditions: string | null;
  issued_at: string;
  valid_until: string | null;
  issued_by: string;
  project?: { title: string };
  contractor_profile?: { company_name: string };
}

interface Project {
  id: string;
  title: string;
  budget: number | null;
  contractor_id: string | null;
  contractor_profile?: { company_name: string; user_id: string } | null;
}

export default function GovernmentLPO() {
  const { user } = useAuth();
  const [lpos, setLpos] = useState<LPO[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedLPO, setSelectedLPO] = useState<LPO | null>(null);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    project_id: "",
    description: "",
    total_amount: "",
    terms_conditions: "",
    valid_days: "30"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch LPOs
      const { data: lposData, error: lposError } = await supabase
        .from('local_purchase_orders')
        .select('*')
        .order('issued_at', { ascending: false });

      if (lposError) throw lposError;

      // Fetch projects with contractors
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, title, budget, contractor_id')
        .not('contractor_id', 'is', null);

      if (projectsError) throw projectsError;

      // Enrich with contractor info
      const enrichedProjects = await Promise.all(
        (projectsData || []).map(async (project) => {
          if (project.contractor_id) {
            const { data: contractor } = await supabase
              .from('contractor_profiles')
              .select('company_name, user_id')
              .eq('user_id', project.contractor_id)
              .single();
            return { ...project, contractor_profile: contractor };
          }
          return project;
        })
      );

      setLpos(lposData || []);
      setProjects(enrichedProjects);
    } catch (error: any) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const generateLPONumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `LPO-${year}-${random}`;
  };

  const handleCreateLPO = async () => {
    if (!formData.project_id || !formData.description || !formData.total_amount) {
      toast.error("Please fill all required fields");
      return;
    }

    const selectedProject = projects.find(p => p.id === formData.project_id);
    if (!selectedProject?.contractor_id) {
      toast.error("Selected project has no contractor assigned");
      return;
    }

    setCreating(true);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + parseInt(formData.valid_days));

      const { error } = await supabase
        .from('local_purchase_orders')
        .insert({
          lpo_number: generateLPONumber(),
          project_id: formData.project_id,
          contractor_id: selectedProject.contractor_id,
          description: formData.description,
          total_amount: parseFloat(formData.total_amount),
          terms_conditions: formData.terms_conditions || null,
          valid_until: validUntil.toISOString(),
          issued_by: user?.id,
          status: 'issued'
        });

      if (error) throw error;

      toast.success("LPO created successfully");
      setShowCreateDialog(false);
      setFormData({
        project_id: "",
        description: "",
        total_amount: "",
        terms_conditions: "",
        valid_days: "30"
      });
      fetchData();
    } catch (error: any) {
      toast.error("Failed to create LPO", { description: error.message });
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued': return 'default';
      case 'accepted': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  const handlePrint = (lpo: LPO) => {
    const printContent = `
      <html>
        <head>
          <title>LPO - ${lpo.lpo_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; }
            .details { margin: 20px 0; }
            .details p { margin: 5px 0; }
            .amount { font-size: 24px; font-weight: bold; margin: 20px 0; }
            .terms { margin-top: 30px; padding: 15px; background: #f5f5f5; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 50px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LOCAL PURCHASE ORDER</h1>
            <h2>${lpo.lpo_number}</h2>
          </div>
          <div class="details">
            <p><strong>Date Issued:</strong> ${format(new Date(lpo.issued_at), 'PPP')}</p>
            <p><strong>Valid Until:</strong> ${lpo.valid_until ? format(new Date(lpo.valid_until), 'PPP') : 'N/A'}</p>
            <p><strong>Contractor:</strong> ${lpo.contractor_profile?.company_name || 'N/A'}</p>
            <p><strong>Project:</strong> ${lpo.project?.title || 'N/A'}</p>
          </div>
          <div class="amount">
            Total Amount: ${formatCurrency(lpo.total_amount)}
          </div>
          <div>
            <h3>Description:</h3>
            <p>${lpo.description}</p>
          </div>
          ${lpo.terms_conditions ? `
            <div class="terms">
              <h3>Terms & Conditions:</h3>
              <p>${lpo.terms_conditions}</p>
            </div>
          ` : ''}
          <div class="footer">
            <div>
              <div class="signature-line"></div>
              <p>Authorized Signature</p>
            </div>
            <div>
              <div class="signature-line"></div>
              <p>Contractor Acceptance</p>
            </div>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

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
            <FileText className="h-8 w-8 text-primary" />
            Local Purchase Orders
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate and manage LPOs for approved projects
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create LPO
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total LPOs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{lpos.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {lpos.filter(l => l.status === 'issued').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {lpos.filter(l => l.status === 'completed').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(lpos.reduce((sum, l) => sum + l.total_amount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* LPO List */}
      <div className="space-y-4">
        {lpos.map((lpo) => (
          <Card key={lpo.id}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-mono font-bold">{lpo.lpo_number}</span>
                    <Badge variant={getStatusColor(lpo.status)}>{lpo.status}</Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-2">{lpo.description}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>
                      <Building2 className="h-4 w-4 inline mr-1" />
                      {lpo.contractor_profile?.company_name || 'Unknown'}
                    </span>
                    <span className="font-semibold">{formatCurrency(lpo.total_amount)}</span>
                    <span className="text-muted-foreground">
                      Issued: {format(new Date(lpo.issued_at), 'PP')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedLPO(lpo);
                      setShowViewDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handlePrint(lpo)}>
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {lpos.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No LPOs created yet</p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First LPO
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create LPO Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg flex flex-col max-h-[90dvh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="pr-8">Create Local Purchase Order</DialogTitle>
            <DialogDescription>
              Generate an LPO for an approved project with assigned contractor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
            <div className="space-y-2">
              <Label>Select Project *</Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => {
                  const project = projects.find(p => p.id === value);
                  setFormData({
                    ...formData,
                    project_id: value,
                    total_amount: project?.budget?.toString() || ""
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title} - {project.contractor_profile?.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the goods/services..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (KES) *</Label>
                <Input
                  type="number"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Valid For (Days)</Label>
                <Input
                  type="number"
                  value={formData.valid_days}
                  onChange={(e) => setFormData({ ...formData, valid_days: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Terms & Conditions (Optional)</Label>
              <Textarea
                value={formData.terms_conditions}
                onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                placeholder="Enter any specific terms..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLPO} disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create LPO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View LPO Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg flex flex-col max-h-[90dvh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="pr-8">{selectedLPO?.lpo_number}</DialogTitle>
          </DialogHeader>

          {selectedLPO && (
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p><Badge variant={getStatusColor(selectedLPO.status)}>{selectedLPO.status}</Badge></p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-bold">{formatCurrency(selectedLPO.total_amount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Issued</Label>
                  <p>{format(new Date(selectedLPO.issued_at), 'PPP')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Valid Until</Label>
                  <p>{selectedLPO.valid_until ? format(new Date(selectedLPO.valid_until), 'PPP') : 'N/A'}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{selectedLPO.description}</p>
              </div>

              {selectedLPO.terms_conditions && (
                <div>
                  <Label className="text-muted-foreground">Terms & Conditions</Label>
                  <p className="mt-1 p-3 bg-muted rounded">{selectedLPO.terms_conditions}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            {selectedLPO && (
              <Button onClick={() => handlePrint(selectedLPO)}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}