
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Star, Briefcase, Award, Clock, DollarSign, Users, Shield, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ContractorBidding = () => {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [bidForm, setBidForm] = useState({
    amount: '',
    timeline: '',
    methodology: '',
    teamSize: '',
    experience: ''
  });
  
  const { toast } = useToast();

  const openProjects = [
    {
      id: 1,
      title: 'Mombasa Road Pothole Repair',
      description: 'Comprehensive repair of multiple potholes along Mombasa Road affecting traffic flow.',
      location: 'Mombasa Road, Nairobi',
      budget: 'KES 2.5M',
      timeline: '3 weeks',
      urgency: 'High',
      requirements: ['KRA Certificate', 'NCA Class 6 or above', 'Road construction experience'],
      bidsReceived: 12,
      daysLeft: 5,
      communityVotes: 234,
      specifications: 'Cold patch asphalt repair, proper drainage, traffic management during work hours.'
    },
    {
      id: 2,
      title: 'Kasarani Street Light Installation',
      description: 'Installation of solar-powered LED street lights in Kasarani residential area.',
      location: 'Kasarani, Nairobi',
      budget: 'KES 1.2M',
      timeline: '2 weeks',
      urgency: 'Medium',
      requirements: ['KRA Certificate', 'NCA Class 4 or above', 'Electrical installation experience'],
      bidsReceived: 8,
      daysLeft: 7,
      communityVotes: 189,
      specifications: 'Solar LED lights, 6m poles, automatic sensors, 2-year warranty required.'
    },
    {
      id: 3,
      title: 'Kibera Water Pipeline Extension',
      description: 'Extension of clean water pipeline to serve additional 500 households in Kibera.',
      location: 'Kibera, Nairobi',
      budget: 'KES 4.8M',
      timeline: '6 weeks',
      urgency: 'Critical',
      requirements: ['KRA Certificate', 'NCA Class 7 or above', 'Water infrastructure experience'],
      bidsReceived: 15,
      daysLeft: 3,
      communityVotes: 456,
      specifications: 'HDPE pipes, pressure testing, household connections, quality certification.'
    }
  ];

  const myBids = [
    {
      id: 1,
      projectTitle: 'School Roof Repair - Mathare Primary',
      bidAmount: 'KES 1.9M',
      status: 'Under Review',
      submittedDate: '2024-01-15',
      aiRanking: 2,
      totalBids: 9,
      feedback: 'Competitive pricing, strong past performance record.'
    },
    {
      id: 2,
      projectTitle: 'Market Road Rehabilitation',
      bidAmount: 'KES 4.2M',
      status: 'Selected',
      submittedDate: '2024-01-10',
      aiRanking: 1,
      totalBids: 12,
      feedback: 'Best overall score: cost-effective, excellent timeline, proven track record.'
    },
    {
      id: 3,
      projectTitle: 'Health Center Renovation',
      bidAmount: 'KES 3.1M',
      status: 'Not Selected',
      submittedDate: '2024-01-05',
      aiRanking: 4,
      totalBids: 8,
      feedback: 'Timeline was competitive but cost was higher than selected bid.'
    }
  ];

  const contractorProfile = {
    name: 'ABC Construction Ltd',
    kraNumber: 'KRA-123456789',
    ncaClass: 'Class 6',
    yearsExperience: 12,
    completedProjects: 89,
    rating: 4.7,
    specialties: ['Road Construction', 'Water Infrastructure', 'Building Construction'],
    certifications: ['ISO 9001:2015', 'OHSAS 18001', 'ISO 14001'],
    recentProjects: [
      { name: 'Thika Road Bridge Repair', rating: 4.8, completed: '2023-12-15' },
      { name: 'Nakuru Water Pipeline', rating: 4.6, completed: '2023-11-20' },
      { name: 'Meru Hospital Construction', rating: 4.9, completed: '2023-10-10' }
    ]
  };

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    toast({
      title: "Bid submitted successfully!",
      description: "Your bid has been submitted and will be ranked by our AI system. You'll receive updates via SMS.",
    });

    setBidForm({
      amount: '',
      timeline: '',
      methodology: '',
      teamSize: '',
      experience: ''
    });
    setSelectedProject(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Selected': return 'bg-green-100 text-green-800 border-green-200';
      case 'Under Review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Not Selected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-purple-600">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardTitle className="flex items-center text-2xl">
            <Briefcase className="h-6 w-6 mr-3 text-purple-600" />
            Contractor Bidding Platform
          </CardTitle>
          <p className="text-gray-600 mt-2">
            AI-powered bidding system for verified contractors. Transparent, competitive, and merit-based project allocation.
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Contractor Profile Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                  ABC
                </div>
                <h3 className="font-semibold">{contractorProfile.name}</h3>
                <div className="flex items-center justify-center mt-2">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-lg font-semibold">{contractorProfile.rating}</span>
                  <span className="text-sm text-gray-500 ml-1">({contractorProfile.completedProjects} projects)</span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">KRA Number:</span>
                  <div className="text-gray-600">{contractorProfile.kraNumber}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">NCA Class:</span>
                  <Badge className="ml-2 bg-green-100 text-green-800">{contractorProfile.ncaClass}</Badge>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Experience:</span>
                  <div className="text-gray-600">{contractorProfile.yearsExperience} years</div>
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-700 text-sm">Specialties:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {contractorProfile.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-700 text-sm">Certifications:</span>
                <div className="space-y-1 mt-1">
                  {contractorProfile.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center text-xs text-gray-600">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      {cert}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="available" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
              <TabsTrigger 
                value="available" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Available Projects ({openProjects.length})
              </TabsTrigger>
              <TabsTrigger 
                value="mybids" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                My Bids ({myBids.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-6">
              <div className="grid gap-6">
                {openProjects.map((project) => (
                  <Card key={project.id} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                          <div className="flex gap-2">
                            <Badge className={getUrgencyColor(project.urgency)}>
                              {project.urgency} Priority
                            </Badge>
                            <Badge variant="outline" className="text-blue-600">
                              {project.daysLeft} days left
                            </Badge>
                          </div>
                        </div>

                        <p className="text-gray-700">{project.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600" />
                            <div className="font-semibold text-green-600">{project.budget}</div>
                            <div className="text-xs text-gray-600">Budget</div>
                          </div>
                          <div className="text-center">
                            <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                            <div className="font-semibold text-blue-600">{project.timeline}</div>
                            <div className="text-xs text-gray-600">Timeline</div>
                          </div>
                          <div className="text-center">
                            <Users className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                            <div className="font-semibold text-purple-600">{project.bidsReceived}</div>
                            <div className="text-xs text-gray-600">Bids Received</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Requirements:</h4>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                            {project.requirements.map((req, index) => (
                              <li key={index} className="flex items-center text-gray-600">
                                <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Technical Specifications:</h4>
                          <p className="text-sm text-gray-600">{project.specifications}</p>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="text-sm text-gray-600">
                            Community support: {project.communityVotes} votes
                          </div>
                          <Button
                            onClick={() => setSelectedProject(project.id)}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          >
                            Submit Bid
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="mybids" className="space-y-6">
              <div className="grid gap-4">
                {myBids.map((bid) => (
                  <Card key={bid.id} className="shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="text-lg font-semibold text-gray-900">{bid.projectTitle}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Bid Amount: <span className="font-semibold text-green-600">{bid.bidAmount}</span></span>
                            <span>Submitted: {new Date(bid.submittedDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge className={getStatusColor(bid.status)}>
                              {bid.status}
                            </Badge>
                            <div className="flex items-center text-sm">
                              <Award className="h-4 w-4 mr-1 text-blue-600" />
                              AI Ranking: #{bid.aiRanking} of {bid.totalBids}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 italic">{bid.feedback}</p>
                        </div>
                        
                        {bid.status === 'Selected' && (
                          <Button variant="outline" className="border-green-500 text-green-700 hover:bg-green-50">
                            View Contract
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bid Submission Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Submit Bid for Project #{selectedProject}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBidSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Bid Amount (KES)</Label>
                    <Input
                      id="amount"
                      value={bidForm.amount}
                      onChange={(e) => setBidForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="e.g., 2,400,000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeline">Timeline</Label>
                    <Input
                      id="timeline"
                      value={bidForm.timeline}
                      onChange={(e) => setBidForm(prev => ({ ...prev, timeline: e.target.value }))}
                      placeholder="e.g., 3 weeks"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="methodology">Project Methodology</Label>
                  <Textarea
                    id="methodology"
                    value={bidForm.methodology}
                    onChange={(e) => setBidForm(prev => ({ ...prev, methodology: e.target.value }))}
                    placeholder="Describe your approach to completing this project..."
                    className="h-24"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teamSize">Team Size</Label>
                    <Input
                      id="teamSize"
                      value={bidForm.teamSize}
                      onChange={(e) => setBidForm(prev => ({ ...prev, teamSize: e.target.value }))}
                      placeholder="e.g., 12 workers"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Relevant Experience</Label>
                    <Input
                      id="experience"
                      value={bidForm.experience}
                      onChange={(e) => setBidForm(prev => ({ ...prev, experience: e.target.value }))}
                      placeholder="Years of similar work"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedProject(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Submit Bid
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Ranking Information */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-purple-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            AI-Powered Bid Ranking System
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-purple-800 mb-2">Cost Analysis (40%)</h4>
              <ul className="space-y-1 text-sm text-purple-700">
                <li>• Competitive pricing evaluation</li>
                <li>• Budget efficiency analysis</li>
                <li>• Value for money assessment</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-800 mb-2">Timeline & Capacity (30%)</h4>
              <ul className="space-y-1 text-sm text-purple-700">
                <li>• Realistic timeline assessment</li>
                <li>• Team size and expertise</li>
                <li>• Current workload analysis</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-800 mb-2">Past Performance (30%)</h4>
              <ul className="space-y-1 text-sm text-purple-700">
                <li>• Previous project ratings</li>
                <li>• On-time completion record</li>
                <li>• Quality of work history</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractorBidding;
