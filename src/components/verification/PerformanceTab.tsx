
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Award, DollarSign, Users, Star } from 'lucide-react';

const PerformanceTab = () => {
  const performanceMetrics = [
    { label: 'On-Time Completion', value: 98, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { label: 'Budget Compliance', value: 95, color: 'text-green-600', bgColor: 'bg-green-100' },
    { label: 'Quality Score', value: 94, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { label: 'Safety Record', value: 99, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { label: 'Client Satisfaction', value: 96, color: 'text-pink-600', bgColor: 'bg-pink-100' },
    { label: 'Innovation Index', value: 87, color: 'text-indigo-600', bgColor: 'bg-indigo-100' }
  ];

  const financialCapacity = {
    bondingCapacity: 'KES 50M',
    insuranceCoverage: 'KES 25M',
    bankGuarantee: 'KES 15M',
    workingCapital: 'KES 10M',
    creditRating: 'AA-',
    taxCompliance: 'Compliant'
  };

  const communityFeedback = [
    { project: 'Machakos Market Road', rating: 4.8, feedback: 'Excellent work quality and community engagement', votes: 234 },
    { project: 'Kibera Water Pipeline', rating: 4.6, feedback: 'Timely completion with minimal disruption', votes: 189 },
    { project: 'Kasarani Street Lights', rating: 4.9, feedback: 'Outstanding technical execution', votes: 156 }
  ];

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                  <span className={`text-2xl font-bold ${metric.color}`}>{metric.value}%</span>
                </div>
                <Progress value={metric.value} className="h-2" />
                <div className={`text-xs px-2 py-1 rounded-full ${metric.bgColor} ${metric.color} text-center`}>
                  {metric.value >= 95 ? 'Excellent' : metric.value >= 85 ? 'Good' : 'Needs Improvement'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Capacity Assessment */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Financial Capacity Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Bonding Capacity</div>
              <div className="text-xl font-bold text-green-600">{financialCapacity.bondingCapacity}</div>
              <Badge className="bg-green-100 text-green-800">Verified</Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Insurance Coverage</div>
              <div className="text-xl font-bold text-blue-600">{financialCapacity.insuranceCoverage}</div>
              <Badge className="bg-blue-100 text-blue-800">Active</Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Bank Guarantee</div>
              <div className="text-xl font-bold text-purple-600">{financialCapacity.bankGuarantee}</div>
              <Badge className="bg-purple-100 text-purple-800">Available</Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Working Capital</div>
              <div className="text-xl font-bold text-orange-600">{financialCapacity.workingCapital}</div>
              <Badge className="bg-orange-100 text-orange-800">Liquid</Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Credit Rating</div>
              <div className="text-xl font-bold text-indigo-600">{financialCapacity.creditRating}</div>
              <Badge className="bg-indigo-100 text-indigo-800">Stable</Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Tax Compliance</div>
              <div className="text-xl font-bold text-green-600">{financialCapacity.taxCompliance}</div>
              <Badge className="bg-green-100 text-green-800">Current</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Impact Assessment */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-purple-600" />
            Community Impact Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {communityFeedback.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-gray-900">{item.project}</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 font-semibold">{item.rating}</span>
                    </div>
                    <Badge variant="outline" className="text-purple-700">
                      {item.votes} votes
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{item.feedback}</p>
                <div className="mt-2">
                  <Progress value={(item.rating / 5) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Recent Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last 3 Months</span>
                <Badge className="bg-green-100 text-green-800">↗ Improving</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Project Success Rate</span>
                <span className="font-semibold text-green-600">97%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Delay</span>
                <span className="font-semibold text-blue-600">-2.3 days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-gold-600" />
              Awards & Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Best Contractor 2023 - Nairobi County</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-silver-500" />
                <span className="text-sm">Excellence in Road Construction 2023</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-bronze-500" />
                <span className="text-sm">Community Choice Award 2022</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceTab;
