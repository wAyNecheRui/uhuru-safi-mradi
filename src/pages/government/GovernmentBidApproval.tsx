import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, XCircle, AlertCircle, Clock, DollarSign, 
  Users, FileText, Award, TrendingUp, Loader2, RefreshCw,
  AlertTriangle, MapPin, Camera, Shield, Gavel
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BiddingWorkflowService, BidRequirements, TopBid } from '@/services/BiddingWorkflowService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ProjectWithBids {
  id: string;
  title: string;
  description: string;
  location: string | null;
  estimated_cost: number | null;
  priority: string | null;
  bidding_status: string | null;
  bidding_end_date: string | null;
  bidding_extensions: number;
  is_agpo_reserved: boolean;
  is_emergency: boolean;
  photo_urls: string[] | null;
  requirements?: BidRequirements | null;
  topBids?: TopBid[];
}

const GovernmentBidApproval = () => {
  const [readyProjects, setReadyProjects] = useState<ProjectWithBids[]>([]);
  const [insufficientProjects, setInsufficientProjects] = useState<ProjectWithBids[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectWithBids | null>(null);
  const [selectedBid, setSelectedBid] = useState<TopBid | null>(null);
  const [justification, setJustification] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showDirectProcurementDialog, setShowDirectProcurementDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Get all approved projects with open bidding
      const { data: projects, error } = await supabase
        .from('problem_reports')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ready: ProjectWithBids[] = [];
      const insufficient: ProjectWithBids[] = [];

      for (const project of projects || []) {
        const requirements = await BiddingWorkflowService.checkBidRequirements(project.id);
        const topBids = await BiddingWorkflowService.getTopBidsForApproval(project.id);
        
        // First evaluate all bids if not already evaluated
        if (topBids.length > 0 && topBids[0].total_score === 0) {
          await BiddingWorkflowService.evaluateAllBids(project.id);
          // Re-fetch top bids after evaluation
          const updatedTopBids = await BiddingWorkflowService.getTopBidsForApproval(project.id);
          
          const projectWithData = { ...project, requirements, topBids: updatedTopBids };
          if (requirements?.meets_requirements) {
            ready.push(projectWithData);
          } else {
            insufficient.push(projectWithData);
          }
        } else {
          const projectWithData = { ...project, requirements, topBids };
          if (requirements?.meets_requirements) {
            ready.push(projectWithData);
          } else {
            insufficient.push(projectWithData);
          }
        }
      }

      setReadyProjects(ready);
      setInsufficientProjects(insufficient);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBid = async () => {
    if (!selectedProject || !selectedBid) return;
    
    setProcessing(true);
    try {
      const success = await BiddingWorkflowService.selectWinningBid(
        selectedProject.id,
        selectedBid.bid_id,
        justification
      );

      if (success) {
        toast({
          title: "Contractor Selected",
          description: "The winning contractor has been selected and the project will proceed."
        });
        setShowApprovalDialog(false);
        setSelectedProject(null);
        setSelectedBid(null);
        setJustification('');
        fetchProjects();
      } else {
        throw new Error('Failed to select contractor');
      }
    } catch (error) {
      console.error('Error selecting bid:', error);
      toast({
        title: "Error",
        description: "Failed to select contractor",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleExtendBidding = async () => {
    if (!selectedProject) return;
    
    setProcessing(true);
    try {
      const success = await BiddingWorkflowService.extendBiddingWindow(selectedProject.id);
      
      if (success) {
        toast({
          title: "Bidding Extended",
          description: "The bidding window has been extended by 7 days."
        });
        setShowExtendDialog(false);
        setSelectedProject(null);
        fetchProjects();
      } else {
        toast({
          title: "Cannot Extend",
          description: "Maximum extensions (2) have been reached. Consider direct procurement.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error extending bidding:', error);
      toast({
        title: "Error",
        description: "Failed to extend bidding window",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDirectProcurement = async () => {
    if (!selectedProject || !justification.trim()) return;
    
    setProcessing(true);
    try {
      const success = await BiddingWorkflowService.requestDirectProcurement(
        selectedProject.id,
        justification
      );

      if (success) {
        toast({
          title: "Request Submitted",
          description: "Direct procurement request has been submitted for committee approval."
        });
        setShowDirectProcurementDialog(false);
        setSelectedProject(null);
        setJustification('');
        fetchProjects();
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('Error requesting direct procurement:', error);
      toast({
        title: "Error",
        description: "Failed to submit direct procurement request",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'TBD';
    return BiddingWorkflowService.formatCurrency(amount);
  };

  const getStatusColor = (project: ProjectWithBids) => {
    if (project.requirements?.meets_requirements) return 'border-l-green-500';
    if ((project.bidding_extensions || 0) >= 2) return 'border-l-red-500';
    if ((project.bidding_extensions || 0) >= 1) return 'border-l-orange-500';
    return 'border-l-yellow-500';
  };

  const getStatusBadge = (project: ProjectWithBids) => {
    if (project.requirements?.meets_requirements) {
      return <Badge className="bg-green-100 text-green-800">Ready for Approval</Badge>;
    }
    if ((project.bidding_extensions || 0) >= 2) {
      return <Badge className="bg-red-100 text-red-800">Requires Exception</Badge>;
    }
    if ((project.bidding_extensions || 0) >= 1) {
      return <Badge className="bg-orange-100 text-orange-800">Extended Bidding</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Insufficient Bids</Badge>;
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Bid Approval' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Header selectedCounty="Nairobi" onCountyChange={() => {}} />
        <main className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header selectedCounty="Nairobi" onCountyChange={() => {}} />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8 space-y-6">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Bid Approval Dashboard</h1>
              <p className="text-gray-600">Kenya Public Procurement Act Compliant Workflow</p>
            </div>
            <Button onClick={fetchProjects} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Compliance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-700">{readyProjects.length}</p>
                <p className="text-sm text-green-600">Ready for Approval</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold text-yellow-700">{insufficientProjects.filter(p => (p.bidding_extensions || 0) === 0).length}</p>
                <p className="text-sm text-yellow-600">Awaiting Bids</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="text-2xl font-bold text-orange-700">{insufficientProjects.filter(p => (p.bidding_extensions || 0) === 1).length}</p>
                <p className="text-sm text-orange-600">Extended Bidding</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold text-red-700">{insufficientProjects.filter(p => (p.bidding_extensions || 0) >= 2).length}</p>
                <p className="text-sm text-red-600">Requires Exception</p>
              </CardContent>
            </Card>
          </div>

          {/* Legal Requirements Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-800">Kenya Public Procurement Act Requirements</p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Standard projects: Minimum <strong>3 bids</strong> required</li>
                    <li>• High-value projects (&gt;KSh 1B): Minimum <strong>5 bids</strong> required</li>
                    <li>• Emergency projects: Minimum <strong>2 bids</strong> required</li>
                    <li>• AGPO reserved: Minimum <strong>2 qualified women/youth bids</strong></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="ready" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ready" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Ready for Approval ({readyProjects.length})
              </TabsTrigger>
              <TabsTrigger value="insufficient" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Insufficient Bids ({insufficientProjects.length})
              </TabsTrigger>
            </TabsList>

            {/* Ready for Approval Tab */}
            <TabsContent value="ready" className="space-y-6">
              {readyProjects.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No projects ready for approval</p>
                    <p className="text-sm text-gray-500">Projects need minimum bids before approval</p>
                  </CardContent>
                </Card>
              ) : (
                readyProjects.map((project) => (
                  <Card key={project.id} className={`shadow-lg border-l-4 ${getStatusColor(project)}`}>
                    <CardHeader className="pb-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-xl">{project.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <MapPin className="h-4 w-4" />
                            {project.location || 'Location not specified'}
                          </div>
                        </div>
                        {getStatusBadge(project)}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Bid Requirements Status */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-800">
                          <CheckCircle className="h-5 w-5" />
                          Bid Requirements Met
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Total Bids</p>
                            <p className="text-lg font-bold text-green-700">
                              {project.requirements?.bid_count || 0} / {project.requirements?.min_required || 3}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">AGPO Bids</p>
                            <p className="text-lg font-bold text-green-700">
                              {project.requirements?.agpo_bids || 0} / {project.requirements?.agpo_required || 1}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Budget</p>
                            <p className="text-lg font-bold text-green-700">
                              {formatCurrency(project.estimated_cost)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Status</p>
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ready
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Top 3 Bids Table */}
                      {project.topBids && project.topBids.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Award className="h-5 w-5 text-blue-600" />
                            Top 3 Evaluated Bids (40-30-30 Scoring)
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="p-3 text-left">Rank</th>
                                  <th className="p-3 text-left">Contractor</th>
                                  <th className="p-3 text-right">Bid Amount</th>
                                  <th className="p-3 text-right">Duration</th>
                                  <th className="p-3 text-right">Price (40%)</th>
                                  <th className="p-3 text-right">Tech (30%)</th>
                                  <th className="p-3 text-right">Exp (30%)</th>
                                  <th className="p-3 text-right">AGPO</th>
                                  <th className="p-3 text-right">Total</th>
                                  <th className="p-3 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {project.topBids.map((bid) => (
                                  <tr key={bid.bid_id} className={`border-b ${bid.rank === 1 ? 'bg-green-50' : ''}`}>
                                    <td className="p-3">
                                      <Badge variant={bid.rank === 1 ? 'default' : 'outline'}>
                                        #{bid.rank}
                                      </Badge>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-2">
                                        {bid.contractor_name}
                                        {bid.is_agpo && (
                                          <Badge className="bg-purple-100 text-purple-800 text-xs">AGPO</Badge>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-3 text-right font-medium">
                                      {formatCurrency(bid.bid_amount)}
                                    </td>
                                    <td className="p-3 text-right">{bid.estimated_duration} days</td>
                                    <td className="p-3 text-right">{bid.price_score?.toFixed(1) || 0}</td>
                                    <td className="p-3 text-right">{bid.technical_score?.toFixed(1) || 0}</td>
                                    <td className="p-3 text-right">{bid.experience_score?.toFixed(1) || 0}</td>
                                    <td className="p-3 text-right text-purple-600">+{bid.agpo_bonus || 0}</td>
                                    <td className="p-3 text-right font-bold text-green-700">
                                      {bid.total_score?.toFixed(1) || 0}
                                    </td>
                                    <td className="p-3 text-center">
                                      <Button 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProject(project);
                                          setSelectedBid(bid);
                                          setShowApprovalDialog(true);
                                        }}
                                      >
                                        Select
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Photos */}
                      {project.photo_urls && project.photo_urls.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                            <Camera className="h-4 w-4" />
                            Evidence Photos:
                          </span>
                          <div className="flex gap-2 overflow-x-auto">
                            {project.photo_urls.slice(0, 4).map((url, index) => (
                              <img 
                                key={index} 
                                src={url} 
                                alt={`Evidence ${index + 1}`}
                                className="h-20 w-20 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Insufficient Bids Tab */}
            <TabsContent value="insufficient" className="space-y-6">
              {insufficientProjects.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-gray-600">All projects have sufficient bids</p>
                  </CardContent>
                </Card>
              ) : (
                insufficientProjects.map((project) => (
                  <Card key={project.id} className={`shadow-lg border-l-4 ${getStatusColor(project)}`}>
                    <CardHeader className="pb-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-xl">{project.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <MapPin className="h-4 w-4" />
                            {project.location || 'Location not specified'}
                          </div>
                        </div>
                        {getStatusBadge(project)}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Bid Requirements Status */}
                      <div className={`rounded-lg p-4 ${
                        (project.bidding_extensions || 0) >= 2 ? 'bg-red-50' : 'bg-yellow-50'
                      }`}>
                        <h4 className={`font-semibold mb-3 flex items-center gap-2 ${
                          (project.bidding_extensions || 0) >= 2 ? 'text-red-800' : 'text-yellow-800'
                        }`}>
                          <AlertCircle className="h-5 w-5" />
                          {project.requirements?.status_message || 'Insufficient Bids'}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Current Bids</p>
                            <p className="text-lg font-bold">
                              {project.requirements?.bid_count || 0} / {project.requirements?.min_required || 3}
                            </p>
                            <Progress 
                              value={((project.requirements?.bid_count || 0) / (project.requirements?.min_required || 3)) * 100} 
                              className="h-2 mt-1"
                            />
                          </div>
                          <div>
                            <p className="text-gray-600">Extensions Used</p>
                            <p className="text-lg font-bold">
                              {project.bidding_extensions || 0} / 2
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Days Remaining</p>
                            <p className="text-lg font-bold">
                              {project.requirements?.days_remaining || 0} days
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Budget</p>
                            <p className="text-lg font-bold">
                              {formatCurrency(project.estimated_cost)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t">
                        {(project.bidding_extensions || 0) < 2 && (
                          <Button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowExtendDialog(true);
                            }}
                            variant="outline"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Extend Bidding (+7 days)
                          </Button>
                        )}
                        {(project.bidding_extensions || 0) >= 2 && (
                          <Button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowDirectProcurementDialog(true);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Gavel className="h-4 w-4 mr-2" />
                            Request Direct Procurement
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>
      </main>

      {/* Bid Selection Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Confirm Contractor Selection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBid && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-semibold text-green-800">{selectedBid.contractor_name}</p>
                <p className="text-sm text-green-700">
                  Bid: {formatCurrency(selectedBid.bid_amount)} • {selectedBid.estimated_duration} days
                </p>
                <p className="text-sm text-green-700">
                  Score: {selectedBid.total_score?.toFixed(1)} / 105
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">
                Approval Justification (Required)
              </label>
              <Textarea
                placeholder="Provide justification for selecting this contractor..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={4}
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <p className="font-medium">This action will:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Award the contract to the selected contractor</li>
                <li>Reject all other bids</li>
                <li>Create an audit trail on the blockchain</li>
                <li>Notify the winning contractor</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSelectBid}
              disabled={processing || !justification.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Bidding Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Extend Bidding Period
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              This will extend the bidding window by 7 days and re-advertise the project to contractors.
            </p>
            <div className="bg-orange-50 p-3 rounded-lg text-sm text-orange-800">
              <p className="font-medium">Current Status:</p>
              <p>Extensions used: {selectedProject?.bidding_extensions || 0} / 2</p>
              <p>After extension: {(selectedProject?.bidding_extensions || 0) + 1} / 2</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExtendBidding}
              disabled={processing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Extend by 7 Days
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Direct Procurement Dialog */}
      <Dialog open={showDirectProcurementDialog} onOpenChange={setShowDirectProcurementDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-red-600" />
              Request Direct Procurement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 p-3 rounded-lg text-sm text-red-800">
              <p className="font-medium">⚠️ Exception Process Required</p>
              <p className="mt-1">
                Direct procurement requires county committee approval, EACC clearance, and public justification.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Public Justification (Required)
              </label>
              <Textarea
                placeholder="Explain why direct procurement is necessary and how public interest is served..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={4}
              />
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium">This request will require:</p>
              <ul className="list-disc list-inside mt-1">
                <li>County Procurement Committee approval</li>
                <li>EACC clearance for selected contractor</li>
                <li>Controller of Budget authorization</li>
                <li>Public disclosure of justification</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDirectProcurementDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDirectProcurement}
              disabled={processing || !justification.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GovernmentBidApproval;
