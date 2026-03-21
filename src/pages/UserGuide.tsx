import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, Building2, Briefcase, MapPin, FileText, Vote, 
  Shield, Wallet, CheckCircle, ArrowRight, AlertTriangle,
  Phone, Camera, Star, Clock, TrendingUp, Eye, Settings,
  Home, BookOpen, Wallet, UserCheck, FileSearch, ClipboardList
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useNavigate } from 'react-router-dom';

const UserGuide = () => {
  const navigate = useNavigate();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'User Guide' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8 space-y-6">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Platform User Guide
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Learn how to use every feature of the Kenya Public Project Accountability Platform 
              based on your role as a Citizen, Contractor, or Government Official.
            </p>
          </div>

          <Tabs defaultValue="citizen" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:max-w-lg lg:mx-auto">
              <TabsTrigger value="citizen" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Citizen
              </TabsTrigger>
              <TabsTrigger value="contractor" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Contractor
              </TabsTrigger>
              <TabsTrigger value="government" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Government
              </TabsTrigger>
            </TabsList>

            {/* CITIZEN GUIDE */}
            <TabsContent value="citizen" className="space-y-6">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Users className="h-6 w-6 text-green-600" />
                    Citizen User Guide
                  </CardTitle>
                  <CardDescription>
                    As a citizen, you are the foundation of this platform. You identify problems, 
                    validate community issues, vote on priorities, verify completed work, and 
                    register for local employment opportunities.
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-6">
                {/* Getting Started */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Home className="h-5 w-5 text-blue-600" />
                      Getting Started
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold">1. Registration</h4>
                      <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-4">
                        <li>Go to <strong>/auth</strong> and click "Register"</li>
                        <li>Select "Citizen" as your user type</li>
                        <li>Enter your full name, email, phone number, and location (County)</li>
                        <li>Create a secure password and verify your email</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold">2. Dashboard Overview</h4>
                      <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-4">
                        <li>After login, you'll see the <strong>Citizen Dashboard</strong> at <strong>/citizen</strong></li>
                        <li>View statistics: reports submitted, community votes, verified work</li>
                        <li>Quick access to all citizen features via navigation menu</li>
                      </ul>
                    </div>
                    <Button onClick={() => navigate('/citizen')} className="mt-4">
                      Go to Citizen Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Report Problems */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      Cycle 1: Report Infrastructure Problems
                    </CardTitle>
                    <CardDescription>
                      The Problem Identification Cycle - How to report issues in your community
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Camera className="h-4 w-4" /> Step 1: Document the Problem
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Navigate to <strong>/citizen/report-issue</strong></li>
                          <li>• Take photos/videos of the infrastructure issue</li>
                          <li>• Enable GPS for automatic location tagging</li>
                          <li>• Use provided templates for clear descriptions</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Step 2: Fill Report Details
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Select category (Roads, Water, Electricity, etc.)</li>
                          <li>• Describe the problem in detail</li>
                          <li>• Estimate affected population</li>
                          <li>• Add estimated repair cost if known</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Step 3: Location & Impact
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Pin exact location on map</li>
                          <li>• Select County, Constituency, Ward</li>
                          <li>• Describe impact on daily life</li>
                          <li>• Rate urgency level</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Step 4: Submit & Track
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Review and submit your report</li>
                          <li>• Receive confirmation with tracking ID</li>
                          <li>• Track status at <strong>/citizen/track</strong></li>
                          <li>• Receive notifications on status changes</li>
                        </ul>
                      </div>
                    </div>
                    <Button onClick={() => navigate('/citizen/report')} variant="outline">
                      Report an Issue <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Community Voting */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Vote className="h-5 w-5 text-purple-600" />
                      Community Validation & Priority Voting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">
                      Participate in validating reported problems and voting on which issues 
                      should be prioritized.
                    </p>
                    <div className="space-y-3">
                      <h4 className="font-semibold">How to Vote:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-4">
                        <li>Go to <strong>/citizen/voting</strong></li>
                        <li>Browse problems reported in your area</li>
                        <li>Validate if the problem exists (you've seen it)</li>
                        <li>Upvote issues you believe are urgent</li>
                        <li>Add comments with additional information</li>
                        <li>Higher voted issues get reviewed first by government</li>
                      </ol>
                    </div>
                    <Button onClick={() => navigate('/citizen/voting')} variant="outline">
                      Vote on Community Issues <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Verify Work */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5 text-green-600" />
                      Verify Completed Work (Milestone Verification)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Important:</strong> Contractors cannot receive payment until 
                        at least 2 citizens verify the completed work!
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold">Verification Process:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-4">
                        <li>Go to <strong>/citizen/projects</strong></li>
                        <li>View projects in your area with completed milestones</li>
                        <li>Visit the project site physically</li>
                        <li>Take photos of the completed work</li>
                        <li>Submit verification with your assessment</li>
                        <li>Your verification contributes to payment release approval</li>
                      </ol>
                    </div>
                    <Button onClick={() => navigate('/citizen/projects')} variant="outline">
                      View Projects to Verify <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Workforce Registration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      Cycle 3: Register for Local Employment
                    </CardTitle>
                    <CardDescription>
                      The Workforce Integration Cycle - Get hired for local infrastructure projects
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold">How to Register as a Skilled Worker:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-4">
                        <li>Go to <strong>/citizen/workforce</strong></li>
                        <li>Register your skills (masonry, plumbing, electrical, etc.)</li>
                        <li>Upload your CV and certifications</li>
                        <li>Set your availability and preferred work areas</li>
                        <li>Get matched with contractors when projects are approved in your area</li>
                        <li>Apply for job postings directly</li>
                        <li>Build your verified work history for future opportunities</li>
                      </ol>
                    </div>
                    <Button onClick={() => navigate('/citizen/workforce')} variant="outline">
                      Register Skills <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Transparency Portal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-600" />
                      Cycle 4: View Public Transparency Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">
                      Access complete transparency on how public funds are spent.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">What You Can See:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• All project budgets and spending</li>
                          <li>• Contractor performance ratings</li>
                          <li>• Payment transaction records</li>
                          <li>• Regional development statistics</li>
                        </ul>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Where to Access:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• <strong>/citizen/transparency</strong></li>
                          <li>• <strong>/public/transparency</strong> (no login required)</li>
                        </ul>
                      </div>
                    </div>
                    <Button onClick={() => navigate('/citizen/transparency')} variant="outline">
                      View Transparency Portal <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Navigation Summary */}
                <Card className="bg-gradient-to-r from-green-50 to-blue-50">
                  <CardHeader>
                    <CardTitle>Citizen Navigation Quick Reference</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { path: '/citizen', label: 'Dashboard', icon: Home },
                        { path: '/citizen/report', label: 'Report Issue', icon: AlertTriangle },
                        { path: '/citizen/track', label: 'Track Reports', icon: FileSearch },
                        { path: '/citizen/voting', label: 'Community Voting', icon: Vote },
                        { path: '/citizen/projects', label: 'View Projects', icon: ClipboardList },
                        { path: '/citizen/workforce', label: 'Workforce', icon: Briefcase },
                        { path: '/citizen/transparency', label: 'Transparency', icon: Eye },
                        { path: '/citizen/notifications', label: 'Notifications', icon: Phone },
                        { path: '/citizen/guide', label: 'Help Guide', icon: BookOpen },
                      ].map((item) => (
                        <Button 
                          key={item.path}
                          variant="outline" 
                          className="justify-start"
                          onClick={() => navigate(item.path)}
                        >
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* CONTRACTOR GUIDE */}
            <TabsContent value="contractor" className="space-y-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                    Contractor User Guide
                  </CardTitle>
                  <CardDescription>
                    As a contractor, you can register your company, get verified, bid on government 
                    projects, hire local workers, manage milestones, and receive payments through 
                    the transparent escrow system.
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-6">
                {/* Getting Started */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Home className="h-5 w-5 text-blue-600" />
                      Getting Started as a Contractor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold">1. Registration</h4>
                      <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-4">
                        <li>Go to <strong>/auth</strong> and click "Register"</li>
                        <li>Select "Contractor" as your user type</li>
                        <li>Enter company name, registration number, KRA PIN</li>
                        <li>Complete company profile after registration</li>
                      </ul>
                    </div>
                    <Button onClick={() => navigate('/contractor')} className="mt-4">
                      Go to Contractor Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Verification */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Cycle 2: Contractor Verification
                    </CardTitle>
                    <CardDescription>
                      The Trust & Verification Cycle - Get verified to bid on projects
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>Required:</strong> You must be verified before you can submit bids!
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Documents Needed:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Company Registration Certificate</li>
                          <li>• Tax Compliance Certificate (KRA)</li>
                          <li>• Business Permit</li>
                          <li>• AGPO Certificate (if applicable)</li>
                          <li>• NCA License</li>
                          <li>• Previous Project Portfolio</li>
                        </ul>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Verification Steps:</h4>
                        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                          <li>Go to <strong>/contractor/verification</strong></li>
                          <li>Upload all required documents</li>
                          <li>Complete company profile</li>
                          <li>Submit for government review</li>
                          <li>Receive verification status</li>
                        </ol>
                      </div>
                    </div>
                    <Button onClick={() => navigate('/contractor/verification')} variant="outline">
                      Start Verification <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Bidding */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-orange-600" />
                      Competitive Bidding Process
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold">How to Submit Bids:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-4">
                        <li>Go to <strong>/contractor/bidding</strong></li>
                        <li>Browse available projects open for bidding</li>
                        <li>Review project requirements and budget</li>
                        <li>Use standardized bid templates</li>
                        <li>Submit technical and financial proposals</li>
                        <li>Track bid status at <strong>/contractor/bid-tracking</strong></li>
                        <li>Receive notification if selected</li>
                      </ol>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <Star className="h-8 w-8 mx-auto text-green-600 mb-2" />
                        <p className="font-semibold text-sm">AGPO Bonus</p>
                        <p className="text-xs text-gray-600">Women/Youth/PWD get scoring bonus</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <Clock className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                        <p className="font-semibold text-sm">Real-time Tracking</p>
                        <p className="text-xs text-gray-600">Monitor bid status live</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <CheckCircle className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                        <p className="font-semibold text-sm">Transparent Scoring</p>
                        <p className="text-xs text-gray-600">See how bids are evaluated</p>
                      </div>
                    </div>
                    <Button onClick={() => navigate('/contractor/bidding')} variant="outline">
                      View Open Tenders <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Project Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-indigo-600" />
                      Project Execution & Milestone Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ol className="list-decimal list-inside space-y-3 text-sm text-gray-600 ml-4">
                      <li><strong>View Assigned Projects:</strong> Go to <strong>/contractor/projects</strong></li>
                      <li><strong>Hire Local Workers:</strong> Use workforce panel to hire from local registry</li>
                      <li><strong>Complete Milestones:</strong> Work through project milestones sequentially</li>
                      <li><strong>Submit Evidence:</strong> Upload photos/videos of completed work</li>
                      <li><strong>Wait for Verification:</strong> Citizens and government must verify</li>
                      <li><strong>Receive Payment:</strong> Milestone payments released via M-Pesa</li>
                    </ol>
                    <Button onClick={() => navigate('/contractor/projects')} variant="outline">
                      Manage Projects <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Financials */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-green-600" />
                      Payment & Financials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Payment Flow:</h4>
                      <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                        <li>Government funds escrow account for your project</li>
                        <li>Complete milestone and submit evidence</li>
                        <li>Citizens verify completed work (minimum 2 verifications)</li>
                        <li>Government approves payment release</li>
                        <li>Funds sent directly to your M-Pesa</li>
                      </ol>
                    </div>
                    <Button onClick={() => navigate('/contractor/financials')} variant="outline">
                      View Financials <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Navigation Summary */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle>Contractor Navigation Quick Reference</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { path: '/contractor', label: 'Dashboard', icon: Home },
                        { path: '/contractor/verification', label: 'Verification', icon: Shield },
                        { path: '/contractor/bidding', label: 'Bidding', icon: FileText },
                        { path: '/contractor/tracking', label: 'Bid Tracking', icon: Clock },
                        { path: '/contractor/projects', label: 'Projects', icon: ClipboardList },
                        { path: '/contractor/financials', label: 'Financials', icon: Wallet },
                        { path: '/contractor/performance', label: 'Performance', icon: TrendingUp },
                        { path: '/contractor/templates', label: 'Bid Templates', icon: FileText },
                        { path: '/contractor/communications', label: 'Messages', icon: Phone },
                      ].map((item) => (
                        <Button 
                          key={item.path}
                          variant="outline" 
                          className="justify-start"
                          onClick={() => navigate(item.path)}
                        >
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* GOVERNMENT GUIDE */}
            <TabsContent value="government" className="space-y-6">
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Building2 className="h-6 w-6 text-purple-600" />
                    Government Official User Guide
                  </CardTitle>
                  <CardDescription>
                    As a government official, you review citizen reports, allocate budgets, 
                    evaluate contractor bids, fund escrow accounts, approve milestone payments, 
                    and ensure project completion and transparency.
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-6">
                {/* Getting Started */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Home className="h-5 w-5 text-purple-600" />
                      Getting Started as a Government Official
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold">1. Registration & Verification</h4>
                      <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-4">
                        <li>Go to <strong>/auth</strong> and click "Register"</li>
                        <li>Select "Government" as your user type</li>
                        <li>Enter your department, position, and employee number</li>
                        <li>Your account will be verified by system administrators</li>
                        <li>You'll be assigned to specific counties based on your jurisdiction</li>
                      </ul>
                    </div>
                    <Button onClick={() => navigate('/government')} className="mt-4">
                      Go to Government Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Report Review */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileSearch className="h-5 w-5 text-orange-600" />
                      Review & Approve Citizen Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold">Report Review Process:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-4">
                        <li>Go to <strong>/government/reports</strong></li>
                        <li>View reports from your assigned counties</li>
                        <li>See community validation votes and priority scores</li>
                        <li>Review evidence (photos, videos, GPS location)</li>
                        <li>Approve, reject, or request more information</li>
                        <li>Allocate budget for approved reports</li>
                        <li>Open bidding for contractor selection</li>
                      </ol>
                    </div>
                    <Button onClick={() => navigate('/government/reports')} variant="outline">
                      Review Reports <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Contractor Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-green-600" />
                      Contractor Verification & Bid Approval
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Verify Contractors:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Go to <strong>/government/verification-requests</strong></li>
                          <li>• Review submitted documents</li>
                          <li>• Verify KRA PIN and compliance</li>
                          <li>• Check past project history</li>
                          <li>• Approve or reject verification</li>
                        </ul>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Evaluate Bids:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Go to <strong>/government/bid-approval</strong></li>
                          <li>• Score technical proposals</li>
                          <li>• Evaluate pricing competitiveness</li>
                          <li>• Apply AGPO bonuses</li>
                          <li>• Select winning contractor</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => navigate('/government/verification-requests')} variant="outline">
                        Verification Requests
                      </Button>
                      <Button onClick={() => navigate('/government/bid-approval')} variant="outline">
                        Bid Approval
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Escrow & Payments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      Escrow Funding & Payment Release
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>Demo Mode:</strong> The escrow system is in demo mode for testing. 
                        M-Pesa transactions are simulated but all other functionality works normally.
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Wallet className="h-4 w-4" /> Fund Escrow (C2B):
                        </h4>
                        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                          <li>Go to <strong>/government/escrow-funding</strong></li>
                          <li>Select project to fund</li>
                          <li>Enter funding amount</li>
                          <li>Add treasury reference</li>
                          <li>Confirm M-Pesa payment</li>
                        </ol>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <ArrowRight className="h-4 w-4" /> Release Payment (B2C):
                        </h4>
                        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                          <li>Go to <strong>/government/payment-release</strong></li>
                          <li>View verified milestones</li>
                          <li>Check citizen verifications (min 2)</li>
                          <li>Approve payment release</li>
                          <li>Funds sent to contractor M-Pesa</li>
                        </ol>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => navigate('/government/escrow-funding')} variant="outline">
                        Fund Escrow
                      </Button>
                      <Button onClick={() => navigate('/government/payment-release')} variant="outline">
                        Release Payments
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Project Monitoring */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-600" />
                      Project Monitoring & Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Portfolio Overview:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• <strong>/government/portfolio</strong> - All projects overview</li>
                          <li>• View project progress and milestones</li>
                          <li>• Monitor budget vs. expenditure</li>
                          <li>• Identify delayed or over-budget projects</li>
                        </ul>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Analytics & Reports:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• <strong>/government/analytics</strong> - Statistics</li>
                          <li>• Regional development metrics</li>
                          <li>• Contractor performance ratings</li>
                          <li>• Community impact measurements</li>
                        </ul>
                      </div>
                    </div>
                    <Button onClick={() => navigate('/government/portfolio')} variant="outline">
                      View Portfolio <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Navigation Summary */}
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardHeader>
                    <CardTitle>Government Navigation Quick Reference</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { path: '/government', label: 'Dashboard', icon: Home },
                        { path: '/government/reports', label: 'Review Reports', icon: FileSearch },
                        { path: '/government/projects', label: 'Projects', icon: ClipboardList },
                        { path: '/government/portfolio', label: 'Portfolio', icon: Building2 },
                        { path: '/government/bid-approval', label: 'Bid Approval', icon: CheckCircle },
                        { path: '/government/verification-requests', label: 'Verify Contractors', icon: Shield },
                        { path: '/government/escrow-funding', label: 'Fund Escrow', icon: Wallet },
                        { path: '/government/payment-release', label: 'Release Payments', icon: Wallet },
                        { path: '/government/milestones', label: 'Milestones', icon: Clock },
                        { path: '/government/analytics', label: 'Analytics', icon: TrendingUp },
                        { path: '/government/lpo', label: 'LPO Management', icon: FileText },
                        { path: '/government/blockchain', label: 'Blockchain Records', icon: Eye },
                      ].map((item) => (
                        <Button 
                          key={item.path}
                          variant="outline" 
                          className="justify-start"
                          onClick={() => navigate(item.path)}
                        >
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Common Features */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Features Available to All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <Eye className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                  <h4 className="font-semibold text-sm">Public Transparency Portal</h4>
                  <p className="text-xs text-gray-500 mt-1">/public/transparency</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <Phone className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                  <h4 className="font-semibold text-sm">USSD Access</h4>
                  <p className="text-xs text-gray-500 mt-1">*384# for feature phones</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <MapPin className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                  <h4 className="font-semibold text-sm">Project Map</h4>
                  <p className="text-xs text-gray-500 mt-1">View all projects on map</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <Settings className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                  <h4 className="font-semibold text-sm">Profile Settings</h4>
                  <p className="text-xs text-gray-500 mt-1">Manage your account</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start */}
          <Card className="bg-gradient-to-r from-green-100 via-blue-100 to-purple-100">
            <CardHeader>
              <CardTitle className="text-center">Quick Start</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Ready to get started? Register now based on your role.
              </p>
              <Button onClick={() => navigate('/auth')} size="lg">
                Register / Login <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </ResponsiveContainer>
      </main>

      <footer className="bg-primary py-6 mt-8">
        <div className="container mx-auto text-center text-primary-foreground">
          <p>Kenya Public Project Accountability Platform • Complete User Guide</p>
        </div>
      </footer>
    </div>
  );
};

export default UserGuide;
