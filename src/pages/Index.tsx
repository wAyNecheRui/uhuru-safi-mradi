import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Briefcase, Shield, TrendingUp, AlertTriangle, CheckCircle, Clock, Phone, Wifi } from 'lucide-react';
import IssueReportingForm from '@/components/IssueReportingForm';
import ProjectMap from '@/components/ProjectMap';
import ContractorBidding from '@/components/ContractorBidding';
import GovernmentDashboard from '@/components/GovernmentDashboard';
import CommunityVoting from '@/components/CommunityVoting';
import EscrowManagement from '@/components/EscrowManagement';
import LanguageSelector from '@/components/LanguageSelector';
import SimplifiedReporting from '@/components/SimplifiedReporting';
import SMSIntegration from '@/components/SMSIntegration';
import OfflineSupport from '@/components/OfflineSupport';

const Index = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCounty, setSelectedCounty] = useState('Nairobi');
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const getText = (en: string, sw: string) => {
    return currentLanguage === 'sw' ? sw : en;
  };

  // Mock data for demonstration
  const projectStats = {
    totalProjects: 1247,
    activeProjects: 89,
    completedProjects: 892,
    totalFunds: 'KES 2.4B',
    citizenReports: 3456,
    verifiedContractors: 234
  };

  const recentIssues = [
    {
      id: 1,
      title: 'Pothole on Mombasa Road',
      location: 'Nairobi County',
      votes: 156,
      status: 'Under Review',
      urgency: 'High',
      reportedAt: '2 hours ago'
    },
    {
      id: 2,
      title: 'Broken Street Light - Kasarani',
      location: 'Nairobi County',
      votes: 89,
      status: 'Contractor Assigned',
      urgency: 'Medium',
      reportedAt: '5 hours ago'
    },
    {
      id: 3,
      title: 'Water Pipeline Leak',
      location: 'Kiambu County',
      votes: 234,
      status: 'In Progress',
      urgency: 'Critical',
      reportedAt: '1 day ago'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Under Review': return 'bg-yellow-500';
      case 'Contractor Assigned': return 'bg-blue-500';
      case 'In Progress': return 'bg-orange-500';
      case 'Completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'text-red-600 bg-red-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-green-600">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getText('Uwazi Kenya', 'Uwazi Kenya')}
                </h1>
                <p className="text-sm text-gray-600">
                  {getText('Government Transparency Platform', 'Jukwaa la Uwazi wa Serikali')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector 
                currentLanguage={currentLanguage}
                onLanguageChange={setCurrentLanguage}
              />
              <select 
                value={selectedCounty} 
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="Nairobi">{getText('Nairobi County', 'Kaunti ya Nairobi')}</option>
                <option value="Mombasa">{getText('Mombasa County', 'Kaunti ya Mombasa')}</option>
                <option value="Kisumu">{getText('Kisumu County', 'Kaunti ya Kisumu')}</option>
                <option value="Nakuru">{getText('Nakuru County', 'Kaunti ya Nakuru')}</option>
              </select>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {getText('Live Data', 'Data ya Moja kwa Moja')}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 h-auto p-1 bg-white shadow-lg rounded-lg">
            <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">{getText('Overview', 'Muhtasari')}</span>
            </TabsTrigger>
            <TabsTrigger value="simple-report" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">{getText('Quick Report', 'Ripoti Haraka')}</span>
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">{getText('SMS/USSD', 'SMS/USSD')}</span>
            </TabsTrigger>
            <TabsTrigger value="offline" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Wifi className="h-4 w-4" />
              <span className="hidden sm:inline">{getText('Offline', 'Bila Mtandao')}</span>
            </TabsTrigger>
            <TabsTrigger value="voting" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{getText('Community', 'Jamii')}</span>
            </TabsTrigger>
            <TabsTrigger value="bidding" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">{getText('Contractors', 'Wakandarasi')}</span>
            </TabsTrigger>
            <TabsTrigger value="government" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{getText('Government', 'Serikali')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    {getText('Active Projects', 'Miradi Inayoendelea')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{projectStats.activeProjects}</div>
                  <p className="text-green-100 text-sm">
                    {getText('Ongoing infrastructure work', 'Kazi za miundombinu zinazoendelea')}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    {getText('Citizen Reports', 'Ripoti za Wananchi')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{projectStats.citizenReports.toLocaleString()}</div>
                  <p className="text-blue-100 text-sm">
                    {getText('Issues reported this month', 'Masuala yaliyoripotiwa mwezi huu')}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    {getText('Total Funds', 'Jumla ya Fedha')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{projectStats.totalFunds}</div>
                  <p className="text-purple-100 text-sm">
                    {getText('Allocated this fiscal year', 'Zimegawiwa mwaka huu wa fedha')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Map and Recent Issues */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-green-600" />
                    {getText(`Project Map - ${selectedCounty}`, `Ramani ya Miradi - ${selectedCounty}`)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ProjectMap selectedCounty={selectedCounty} />
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                    {getText('Recent Issues', 'Masuala ya Hivi Karibuni')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentIssues.map((issue) => (
                    <div key={issue.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{issue.title}</h4>
                        <Badge className={getUrgencyColor(issue.urgency)}>
                          {issue.urgency}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{issue.location}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            <Users className="h-4 w-4 inline mr-1" />
                            {issue.votes} {getText('votes', 'kura')}
                          </span>
                          <span className="text-xs text-gray-400">{issue.reportedAt}</span>
                        </div>
                        <Badge className={`${getStatusColor(issue.status)} text-white`}>
                          {issue.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Simplified Reporting Tab */}
          <TabsContent value="simple-report">
            <SimplifiedReporting />
          </TabsContent>

          {/* SMS Integration Tab */}
          <TabsContent value="sms">
            <SMSIntegration />
          </TabsContent>

          {/* Offline Support Tab */}
          <TabsContent value="offline">
            <OfflineSupport />
          </TabsContent>

          {/* Community Voting Tab */}
          <TabsContent value="voting">
            <CommunityVoting />
          </TabsContent>

          {/* Contractor Bidding Tab */}
          <TabsContent value="bidding">
            <ContractorBidding />
          </TabsContent>

          {/* Government Dashboard Tab */}
          <TabsContent value="government">
            <GovernmentDashboard />
          </TabsContent>

          {/* Escrow Management Tab */}
          <TabsContent value="escrow">
            <EscrowManagement />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-400">
              {getText(
                'Built for transparency in Kenyan governance • Powered by citizen participation',
                'Imejengwa kwa uwazi katika utawala wa Kenya • Inaendeshwa na ushiriki wa wananchi'
              )}
            </p>
            <div className="flex justify-center space-x-6 mt-4 flex-wrap gap-2">
              <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600">
                {getText('M-Pesa Integration Ready', 'M-Pesa Tayari Kuunganishwa')}
              </Badge>
              <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600">
                {getText('Blockchain Audit Trail', 'Ukaguzi wa Blockchain')}
              </Badge>
              <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600">
                {getText('SMS/USSD Support', 'Msaada wa SMS/USSD')}
              </Badge>
              <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600">
                {getText('Offline Capable', 'Inaweza Kutumika Bila Mtandao')}
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
