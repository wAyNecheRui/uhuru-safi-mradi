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

  const calculateWagePool = (jobs: WorkforceJobSummary[]) => {
    return jobs.reduce((total, job) => {
      const dailyRate = job.wage_max || job.wage_min || 0;
      const positions = job.positions_available || 1;
      const days = job.duration_days || 30;
      return total + (dailyRate * positions * days);
    }, 0);
  };

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .in('status', ['planning', 'in_progress', 'bidding']);

      if (error) throw error;

      const projectsWithDetails = await Promise.all(
        (projectsData || []).map(async (project) => {
          const [{ data: escrow }, { data: jobs }] = await Promise.all([
            supabase.from('escrow_accounts').select('*').eq('project_id', project.id).single(),
            supabase.from('workforce_jobs').select('title, positions_available, wage_min, wage_max, duration_days').eq('project_id', project.id)
          ]);

          const jobSummaries: WorkforceJobSummary[] = (jobs || []).map(j => ({
            title: j.title,
            positions_available: j.positions_available || 1,
            wage_min: j.wage_min || 0,
            wage_max: j.wage_max || 0,
            duration_days: j.duration_days || 30,
          }));

          return {
            ...project,
            escrow,
            jobs: jobSummaries,
            calculatedWagePool: calculateWagePool(jobSummaries),
          };
        })
      );

      setProjects(projectsWithDetails);
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
    if (processing) return;
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

    const workerWageAllocation = parseFloat(workerWageAmount) || 0;

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

      toast.success(`[UAT Demo] Escrow funded with KES ${amount.toLocaleString()}`, {
        description: `Simulated M-Pesa Ref: ${response.data.transaction.mpesa_reference}. No real funds moved.`
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
      {/* UAT Demo Banner */}
      <div className="mb-6 bg-amber-50 border-2 border-amber-400 border-dashed rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-amber-800">UAT / Demo Mode</p>
          <p className="text-sm text-amber-700">
            All M-Pesa C2B transactions are simulated. No real funds are collected or disbursed.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          Escrow Funding (M-Pesa C2B) — Demo
        </h1>
        <p className="text-muted-foreground mt-2">
          Fund project escrow accounts using simulated M-Pesa Customer-to-Business payments from Treasury
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

                  {project.jobs.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {project.jobs.reduce((sum, j) => sum + j.positions_available, 0)} workers across {project.jobs.length} job(s) —
                      Calculated wage need: {formatCurrency(project.calculatedWagePool)}
                      {project.escrow?.worker_wage_allocation ? (
                        project.escrow.worker_wage_allocation >= project.calculatedWagePool
                          ? <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">✓ Covered</Badge>
                          : <Badge variant="outline" className="ml-2 text-xs bg-destructive/10 text-destructive border-destructive/20">⚠ Shortfall</Badge>
                      ) : null}
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
                        // Auto-set worker wage amount from calculated pool minus already allocated
                        const alreadyAllocated = project.escrow?.worker_wage_allocation || 0;
                        const recommended = Math.max(0, project.calculatedWagePool - alreadyAllocated);
                        setWorkerWageAmount(recommended.toString());
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
        <DialogContent className="max-w-md flex flex-col max-h-[90dvh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="pr-8">Fund Escrow via M-Pesa C2B (UAT Demo)</DialogTitle>
            <DialogDescription>
              <span className="text-amber-600 font-medium">Demo Mode — No real M-Pesa transaction will occur.</span>{' '}
              Simulate transfer of funds from Treasury to project escrow account.
            </DialogDescription>
          </DialogHeader>

          {selectedProject && (
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
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
                <Label htmlFor="wageAmount">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Worker Wage Allocation (KES)
                  </div>
                </Label>
                <Input
                  id="wageAmount"
                  type="number"
                  min="0"
                  max={parseFloat(fundingAmount) || 0}
                  value={workerWageAmount}
                  onChange={(e) => setWorkerWageAmount(e.target.value)}
                  placeholder="Auto-calculated from job postings"
                />
                {selectedProject && selectedProject.jobs.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-primary flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Calculated from {selectedProject.jobs.length} job posting(s):
                    </p>
                    {selectedProject.jobs.map((job, i) => (
                      <p key={i} className="text-xs text-muted-foreground ml-4">
                        • {job.title}: {job.positions_available} workers × KES {job.wage_max || job.wage_min}/day × {job.duration_days} days = {formatCurrency((job.wage_max || job.wage_min) * job.positions_available * job.duration_days)}
                      </p>
                    ))}
                    <p className="text-xs font-medium text-muted-foreground">
                      Total required: {formatCurrency(selectedProject.calculatedWagePool)}
                      {selectedProject.escrow?.worker_wage_allocation ? ` (already allocated: ${formatCurrency(selectedProject.escrow.worker_wage_allocation)})` : ''}
                    </p>
                    {(parseFloat(workerWageAmount) || 0) < (selectedProject.calculatedWagePool - (selectedProject.escrow?.worker_wage_allocation || 0)) && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Warning: Allocation is below the calculated requirement — workers may not be fully covered
                      </p>
                    )}
                  </div>
                ) : selectedProject ? (
                  <p className="text-xs text-muted-foreground">
                    No job postings yet — wage pool cannot be auto-calculated. Set manually or wait for contractor to post jobs.
                  </p>
                ) : null}
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
          <DialogFooter className="flex-shrink-0">
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
        <DialogContent className="flex flex-col max-h-[90dvh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="pr-8">Confirm Escrow Funding (UAT Demo)</DialogTitle>
            <DialogDescription>
              <span className="text-amber-600 font-medium">Demo Mode — No real funds will be disbursed.</span>{' '}
              You are about to simulate funding the escrow account with M-Pesa C2B.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg space-y-2">
            <p><strong>Project:</strong> {selectedProject?.title}</p>
            <p><strong>Total Amount:</strong> {formatCurrency(parseFloat(fundingAmount) || 0)}</p>
            <p><strong>Worker Wage Pool:</strong> {formatCurrency(parseFloat(workerWageAmount) || 0)}</p>
            <p><strong>Milestone Pool:</strong> {formatCurrency((parseFloat(fundingAmount) || 0) - (parseFloat(workerWageAmount) || 0))}</p>
            <p><strong>Reference:</strong> {treasuryReference || `TRS-${Date.now()}`}</p>
          </div>

          <DialogFooter className="flex-shrink-0">
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