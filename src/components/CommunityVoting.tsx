
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThumbsUp, ThumbsDown, Users, MapPin, Clock, AlertTriangle, Camera, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CommunityVoting = () => {
  const [votes, setVotes] = useState<Record<number, 'up' | 'down' | null>>({});
  const { toast } = useToast();

  const pendingIssues = [
    {
      id: 1,
      title: 'Broken Water Pipe on Thika Road',
      description: 'Major water pipe burst causing flooding and blocking traffic. Water is wasting and causing traffic jams during peak hours.',
      location: 'Thika Road, Kasarani',
      county: 'Nairobi',
      reportedBy: 'John M.',
      reportedAt: '2 hours ago',
      urgency: 'Critical',
      category: 'Water & Sanitation',
      votes: { up: 234, down: 12 },
      photos: 3,
      comments: 18,
      estimatedCost: 'KES 450,000',
      timeToFix: '2-3 days'
    },
    {
      id: 2,
      title: 'Streetlight Outage in CBD',
      description: 'Multiple streetlights not working on Kenyatta Avenue creating safety concerns, especially for night time pedestrians and small businesses.',
      location: 'Kenyatta Avenue, CBD',
      county: 'Nairobi',
      reportedBy: 'Sarah K.',
      reportedAt: '6 hours ago',
      urgency: 'High',
      category: 'Public Safety',
      votes: { up: 189, down: 8 },
      photos: 2,
      comments: 24,
      estimatedCost: 'KES 120,000',
      timeToFix: '1-2 days'
    },
    {
      id: 3,
      title: 'Pothole near Kenyatta University',
      description: 'Large pothole on the main road leading to Kenyatta University causing vehicle damage and accidents.',
      location: 'Thika Road, near KU',
      county: 'Kiambu',
      reportedBy: 'Michael O.',
      reportedAt: '1 day ago',
      urgency: 'Medium',
      category: 'Roads & Transportation',
      votes: { up: 156, down: 23 },
      photos: 5,
      comments: 31,
      estimatedCost: 'KES 75,000',
      timeToFix: '1 day'
    },
    {
      id: 4,
      title: 'Garbage Collection Point Overflowing',
      description: 'Waste collection point in Kibera overflowing, creating health hazards and attracting pests.',
      location: 'Kibera, Langata',
      county: 'Nairobi',
      reportedBy: 'Grace W.',
      reportedAt: '3 days ago',
      urgency: 'High',
      category: 'Waste Management',
      votes: { up: 298, down: 15 },
      photos: 4,
      comments: 42,
      estimatedCost: 'KES 85,000',
      timeToFix: '1 day'
    }
  ];

  const approvedIssues = [
    {
      id: 5,
      title: 'School Roof Repair - Mathare Primary',
      description: 'Leaking roof at Mathare Primary School affecting 400+ students during rainy season.',
      location: 'Mathare, Nairobi',
      county: 'Nairobi',
      votes: { up: 567, down: 34 },
      status: 'Bidding Phase',
      approvedBudget: 'KES 2.1M',
      contractor: 'TBD',
      timeline: '3 weeks'
    },
    {
      id: 6,
      title: 'Market Road Rehabilitation',
      description: 'Complete road rehabilitation for Machakos market access road.',
      location: 'Machakos Town',
      county: 'Machakos',
      votes: { up: 423, down: 21 },
      status: 'In Progress',
      approvedBudget: 'KES 4.8M',
      contractor: 'Highway Construction Ltd',
      timeline: '6 weeks',
      progress: 35
    }
  ];

  const handleVote = (issueId: number, voteType: 'up' | 'down') => {
    const currentVote = votes[issueId];
    
    if (currentVote === voteType) {
      // Remove vote if clicking same button
      setVotes(prev => ({ ...prev, [issueId]: null }));
      toast({
        title: "Vote removed",
        description: "Your vote has been removed.",
      });
    } else {
      // Add or change vote
      setVotes(prev => ({ ...prev, [issueId]: voteType }));
      toast({
        title: "Vote recorded",
        description: `You voted ${voteType === 'up' ? 'to prioritize' : 'against'} this issue.`,
      });
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Water & Sanitation': 'bg-blue-100 text-blue-800',
      'Public Safety': 'bg-purple-100 text-purple-800',
      'Roads & Transportation': 'bg-indigo-100 text-indigo-800',
      'Waste Management': 'bg-green-100 text-green-800',
      'Healthcare Facilities': 'bg-pink-100 text-pink-800',
      'Education Infrastructure': 'bg-cyan-100 text-cyan-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const calculateVotePercentage = (upVotes: number, downVotes: number) => {
    const total = upVotes + downVotes;
    return total > 0 ? Math.round((upVotes / total) * 100) : 0;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center text-2xl">
            <Users className="h-6 w-6 mr-3 text-blue-600" />
            Community Voting Dashboard
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Help prioritize infrastructure issues in your community. Vote on reported problems to influence government resource allocation.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Pending Issues ({pendingIssues.length})
          </TabsTrigger>
          <TabsTrigger 
            value="approved" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Approved Projects ({approvedIssues.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          <div className="grid gap-6">
            {pendingIssues.map((issue) => {
              const userVote = votes[issue.id];
              const votePercentage = calculateVotePercentage(issue.votes.up, issue.votes.down);
              
              return (
                <Card key={issue.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Main Content */}
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="text-xl font-semibold text-gray-900">{issue.title}</h3>
                          <div className="flex gap-2">
                            <Badge className={getUrgencyColor(issue.urgency)}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {issue.urgency}
                            </Badge>
                            <Badge className={getCategoryColor(issue.category)}>
                              {issue.category}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-gray-700 leading-relaxed">{issue.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {issue.location}, {issue.county}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            Reported {issue.reportedAt} by {issue.reportedBy}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Camera className="h-4 w-4 mr-2" />
                            {issue.photos} photos attached
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {issue.comments} community comments
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Estimated Cost:</span>
                            <div className="text-lg font-semibold text-green-600">{issue.estimatedCost}</div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">Time to Fix:</span>
                            <div className="text-lg font-semibold text-blue-600">{issue.timeToFix}</div>
                          </div>
                        </div>
                      </div>

                      {/* Voting Section */}
                      <div className="lg:w-80 space-y-4">
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3">Community Priority</h4>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>Support: {issue.votes.up}</span>
                              <span>Against: {issue.votes.down}</span>
                            </div>
                            
                            <Progress value={votePercentage} className="h-2" />
                            
                            <div className="text-center text-sm text-gray-600">
                              {votePercentage}% community support
                            </div>
                          </div>

                          <div className="flex gap-3 mt-4">
                            <Button
                              onClick={() => handleVote(issue.id, 'up')}
                              variant={userVote === 'up' ? 'default' : 'outline'}
                              className={`flex-1 ${
                                userVote === 'up' 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'border-green-300 text-green-700 hover:bg-green-50'
                              }`}
                            >
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Prioritize
                            </Button>
                            
                            <Button
                              onClick={() => handleVote(issue.id, 'down')}
                              variant={userVote === 'down' ? 'default' : 'outline'}
                              className={`flex-1 ${
                                userVote === 'down' 
                                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                                  : 'border-red-300 text-red-700 hover:bg-red-50'
                              }`}
                            >
                              <ThumbsDown className="h-4 w-4 mr-2" />
                              Not Priority
                            </Button>
                          </div>

                          {votePercentage >= 70 && (
                            <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded text-sm text-green-800 text-center">
                              🎉 High community support! Moving to bidding phase.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="space-y-6">
          <div className="grid gap-6">
            {approvedIssues.map((issue) => (
              <Card key={issue.id} className="shadow-lg border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-xl font-semibold text-gray-900">{issue.title}</h3>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {issue.status}
                      </Badge>
                    </div>

                    <p className="text-gray-700">{issue.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Location:</span>
                        <div>{issue.location}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Budget:</span>
                        <div className="text-green-600 font-semibold">{issue.approvedBudget}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Contractor:</span>
                        <div>{issue.contractor}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Timeline:</span>
                        <div>{issue.timeline}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          Community Support: {Math.round((issue.votes.up / (issue.votes.up + issue.votes.down)) * 100)}%
                        </span>
                        <span className="text-sm text-gray-600">
                          ({issue.votes.up} votes)
                        </span>
                      </div>
                      
                      {issue.progress && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Progress:</span>
                          <div className="w-24">
                            <Progress value={issue.progress} className="h-2" />
                          </div>
                          <span className="text-sm font-medium">{issue.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Information Panel */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-4">How Community Voting Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-blue-800">Voting Process:</h4>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Issues with 70%+ support move to bidding phase
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Your vote is weighted by location proximity
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Verified citizens get higher vote weight
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-blue-800">Transparency Features:</h4>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  All voting data is publicly auditable
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  SMS notifications for rural areas via USSD
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Real-time updates on project progress
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityVoting;
