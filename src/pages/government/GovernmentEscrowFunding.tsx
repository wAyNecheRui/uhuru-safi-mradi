import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Wallet, Building2, ArrowRight, CheckCircle2, AlertCircle, Phone, Users, Calculator, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface WorkforceJobSummary {
  positions_available: number;
  wage_max: number;
  wage_min: number;
  duration_days: number;
  title: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  status: string;
  contractor_id: string | null;
  jobs: WorkforceJobSummary[];
  calculatedWagePool: number;
  escrow?: {
    id: string;
    total_amount: number;
    held_amount: number;
    released_amount: number;
    worker_wage_allocation: number;
    worker_wage_released: number;
    status: string;
  } | null;
}

export default function GovernmentEscrowFunding() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [fundingAmount, setFundingAmount] = useState("");
  const [workerWageAmount, setWorkerWageAmount] = useState("");
  const [treasuryReference, setTreasuryReference] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .in('status', ['planning', 'in_progress', 'bidding']);

      if (error) throw error;

      // Fetch escrow accounts for projects
      const projectsWithEscrow = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { data: escrow } = await supabase
            .from('escrow_accounts')
            .select('*')
            .eq('project_id', project.id)
            .single();

          return { ...project, escrow };
        })
      );

      setProjects(projectsWithEscrow);
    } catch (error: any) {
      toast.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const getRemainingAmount = (project: Project) => {
    if (!project.budget) return 0;
    const alreadyFunded = project.escrow?.held_amount || 0;
    return Math.max(0, project.budget - alreadyFunded);
  };

  const handleFundEscrow = async () => {
    if (!selectedProject || !fundingAmount) return;

    const amount = parseFloat(fundingAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Prevent overfunding - amount cannot exceed remaining balance
    const remainingAmount = getRemainingAmount(selectedProject);
    if (amount > remainingAmount) {
      toast.error("Cannot overfund escrow", {
        description: `Maximum fundable amount is KES ${remainingAmount.toLocaleString()}`
      });
      return;
    }

    const wagePercent = Math.min(100, Math.max(0, parseFloat(workerWagePercent) || 0));
    const workerWageAllocation = Math.round((amount * wagePercent) / 100);

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke('fund-escrow-c2b', {
        body: {
          project_id: selectedProject.id,
          amount,
          treasury_reference: treasuryReference || `TRS-${Date.now()}`,
          worker_wage_allocation: workerWageAllocation
        }
      });

      if (response.error) throw new Error(response.error.message);

      toast.success(`Successfully funded escrow with KES ${amount.toLocaleString()}`, {
        description: `M-Pesa Reference: ${response.data.transaction.mpesa_reference}`
      });

      setShowConfirmDialog(false);
      setSelectedProject(null);
      setFundingAmount("");
      setTreasuryReference("");
      fetchProjects();
    } catch (error: any) {
      toast.error("Failed to fund escrow", { description: error.message });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getEscrowProgress = (project: Project) => {
    if (!project.escrow || !project.budget) return 0;
    return (project.escrow.held_amount / project.budget) * 100;
  };

  const isFullyFunded = (project: Project) => {
    if (!project.escrow || !project.budget) return false;
    return project.escrow.held_amount >= project.budget;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          Escrow Funding (M-Pesa C2B)
        </h1>
        <p className="text-muted-foreground mt-2">
          Fund project escrow accounts using M-Pesa Customer-to-Business payments from Treasury
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{projects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Funded Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {projects.filter(p => p.escrow && p.escrow.held_amount > 0).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending Funding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {projects.filter(p => !p.escrow || p.escrow.held_amount === 0).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">{project.title}</h3>
                    <Badge variant={project.escrow?.held_amount ? "default" : "outline"}>
                      {project.escrow?.held_amount ? "Funded" : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2">{project.description}</p>
                  
                  {project.budget && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Contractor Bid: {formatCurrency(project.budget)}</span>
                        <span>
                          Funded: {formatCurrency(project.escrow?.held_amount || 0)}
                        </span>
                      </div>
                      <Progress value={getEscrowProgress(project)} className="h-2" />
                      {!isFullyFunded(project) && getRemainingAmount(project) > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Remaining: {formatCurrency(getRemainingAmount(project))}
                        </p>
                      )}
                    </div>
                  )}

                  {project.escrow && (
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      <span className="text-green-600">
                        <CheckCircle2 className="h-4 w-4 inline mr-1" />
                        Released: {formatCurrency(project.escrow.released_amount)}
                      </span>
                      <span className="text-blue-600">
                        Held: {formatCurrency(project.escrow.held_amount)}
                      </span>
                      {project.escrow.worker_wage_allocation > 0 && (
                        <span className="text-orange-600">
                          👷 Worker Wages: {formatCurrency(project.escrow.worker_wage_released)}/{formatCurrency(project.escrow.worker_wage_allocation)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {isFullyFunded(project) ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200 py-2 px-4">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Fully Funded
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedProject(project);
                        const remainingAmount = project.budget 
                          ? project.budget - (project.escrow?.held_amount || 0) 
                          : 0;
                        setFundingAmount(remainingAmount.toString());
                      }}
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Fund Escrow
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {projects.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No projects available for funding</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Funding Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fund Escrow via M-Pesa C2B</DialogTitle>
            <DialogDescription>
              Transfer funds from Treasury to project escrow account
            </DialogDescription>
          </DialogHeader>

          {selectedProject && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedProject.title}</p>
                <p className="text-sm text-muted-foreground">
                  Contractor Bid Amount: {formatCurrency(selectedProject.budget || 0)}
                </p>
                {selectedProject.escrow && selectedProject.escrow.held_amount > 0 && (
                  <p className="text-sm text-green-600">
                    Already funded: {formatCurrency(selectedProject.escrow.held_amount)}
                  </p>
                )}
                <p className="text-sm font-medium text-primary mt-1">
                  Remaining to fund: {formatCurrency(getRemainingAmount(selectedProject))}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={fundingAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    const maxAmount = getRemainingAmount(selectedProject);
                    // Prevent entering more than remaining amount
                    if (!isNaN(val) && val > maxAmount) {
                      setFundingAmount(maxAmount.toString());
                    } else {
                      setFundingAmount(e.target.value);
                    }
                  }}
                  max={getRemainingAmount(selectedProject)}
                  placeholder="Enter amount to fund"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum: {formatCurrency(getRemainingAmount(selectedProject))}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wagePercent">Worker Wage Allocation (%)</Label>
                <Input
                  id="wagePercent"
                  type="number"
                  min="0"
                  max="50"
                  value={workerWagePercent}
                  onChange={(e) => setWorkerWagePercent(e.target.value)}
                  placeholder="e.g., 20"
                />
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(Math.round((parseFloat(fundingAmount) || 0) * (parseFloat(workerWagePercent) || 0) / 100))} reserved for worker wages
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Treasury Reference (Optional)</Label>
                <Input
                  id="reference"
                  value={treasuryReference}
                  onChange={(e) => setTreasuryReference(e.target.value)}
                  placeholder="e.g., TRS-2024-001"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Phone className="h-5 w-5 text-green-600" />
                <div className="text-sm">
                  <p className="font-medium text-green-700 dark:text-green-400">M-Pesa PayBill</p>
                  <p className="text-green-600">Business No: 174379</p>
                </div>
              </div>

              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm">
                <p className="font-medium text-orange-700 dark:text-orange-400">👷 Escrow Worker Protection</p>
                <p className="text-orange-600 dark:text-orange-300 mt-1">
                  Worker wages are paid directly from escrow — contractors cannot withhold them.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProject(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => setShowConfirmDialog(true)}
              disabled={!fundingAmount || parseFloat(fundingAmount) <= 0}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Proceed to Fund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Escrow Funding</DialogTitle>
            <DialogDescription>
              You are about to fund the escrow account with M-Pesa C2B
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg space-y-2">
            <p><strong>Project:</strong> {selectedProject?.title}</p>
            <p><strong>Total Amount:</strong> {formatCurrency(parseFloat(fundingAmount) || 0)}</p>
            <p><strong>Worker Wage Pool:</strong> {formatCurrency(Math.round((parseFloat(fundingAmount) || 0) * (parseFloat(workerWagePercent) || 0) / 100))}</p>
            <p><strong>Milestone Pool:</strong> {formatCurrency((parseFloat(fundingAmount) || 0) - Math.round((parseFloat(fundingAmount) || 0) * (parseFloat(workerWagePercent) || 0) / 100))}</p>
            <p><strong>Reference:</strong> {treasuryReference || `TRS-${Date.now()}`}</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFundEscrow} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}