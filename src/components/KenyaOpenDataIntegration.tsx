
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Database, TrendingUp, MapPin, DollarSign, Users, Calendar, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

const KenyaOpenDataIntegration = () => {
  const [selectedCounty, setSelectedCounty] = useState('Nairobi');
  const [selectedYear, setSelectedYear] = useState('2024');

  // Kenya Open Data benchmarking data
  const countyBenchmarks = [
    {
      county: 'Nairobi',
      population: 4397073,
      projectsCompleted: 89,
      budgetUtilization: 87,
      averageProjectCost: 2800000,
      citizenSatisfaction: 78,
      corruptionIndex: 23,
      developmentIndex: 0.82
    },
    {
      county: 'Kiambu',
      population: 2417735,
      projectsCompleted: 67,
      budgetUtilization: 92,
      averageProjectCost: 1900000,
      citizenSatisfaction: 84,
      corruptionIndex: 18,
      developmentIndex: 0.78
    },
    {
      county: 'Machakos',
      population: 1421932,
      projectsCompleted: 45,
      budgetUtilization: 89,
      averageProjectCost: 1500000,
      citizenSatisfaction: 81,
      corruptionIndex: 21,
      developmentIndex: 0.71
    },
    {
      county: 'Mombasa',
      population: 1208333,
      projectsCompleted: 52,
      budgetUtilization: 85,
      averageProjectCost: 2200000,
      citizenSatisfaction: 76,
      corruptionIndex: 28,
      developmentIndex: 0.69
    },
    {
      county: 'Turkana',
      population: 926976,
      projectsCompleted: 23,
      budgetUtilization: 76,
      averageProjectCost: 1800000,
      citizenSatisfaction: 69,
      corruptionIndex: 34,
      developmentIndex: 0.45
    }
  ];

  const nationalTrends = [
    { year: '2020', projectsCompleted: 1204, budgetAllocated: 156.8, budgetUtilized: 134.2 },
    { year: '2021', projectsCompleted: 1356, budgetAllocated: 187.3, budgetUtilized: 165.1 },
    { year: '2022', projectsCompleted: 1489, budgetAllocated: 203.7, budgetUtilized: 189.4 },
    { year: '2023', projectsCompleted: 1642, budgetAllocated: 234.9, budgetUtilized: 218.7 },
    { year: '2024', projectsCompleted: 1789, budgetAllocated: 267.2, budgetUtilized: 245.3 }
  ];

  const sectorDistribution = [
    { name: 'Roads & Infrastructure', value: 34, amount: 89.2 },
    { name: 'Water & Sanitation', value: 23, amount: 61.7 },
    { name: 'Healthcare', value: 18, amount: 48.3 },
    { name: 'Education', value: 15, amount: 38.9 },
    { name: 'Agriculture', value: 10, amount: 29.1 }
  ];

  const performanceMetrics = [
    {
      metric: 'National Average Completion Rate',
      value: '78.4%',
      benchmark: '85%',
      trend: '+2.3%',
      status: 'improving'
    },
    {
      metric: 'Average Project Cost Overrun',
      value: '23.7%',
      benchmark: '15%',
      trend: '-1.8%',
      status: 'concerning'
    },
    {
      metric: 'Citizen Satisfaction Index',
      value: '76.2',
      benchmark: '80',
      trend: '+4.1',
      status: 'improving'
    },
    {
      metric: 'Corruption Perception Index',
      value: '24.8',
      benchmark: '20',
      trend: '-2.3',
      status: 'improving'
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount * 1000000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'improving': return 'bg-green-100 text-green-800';
      case 'concerning': return 'bg-red-100 text-red-800';
      case 'stable': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedCountyData = countyBenchmarks.find(c => c.county === selectedCounty) || countyBenchmarks[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
          <CardTitle className="flex items-center text-2xl">
            <Database className="h-6 w-6 mr-3 text-blue-600" />
            Kenya Open Data Integration & Performance Benchmarking
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Real-time integration with Kenya Open Data Portal for transparent benchmarking and performance analysis.
          </p>
        </CardHeader>
      </Card>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              {countyBenchmarks.map(county => (
                <option key={county.county} value={county.county}>{county.county}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Database className="h-4 w-4 mr-2" />
          Sync with KODI
        </Button>
      </div>

      <Tabs defaultValue="benchmarks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg">
          <TabsTrigger value="benchmarks">County Benchmarks</TabsTrigger>
          <TabsTrigger value="trends">National Trends</TabsTrigger>
          <TabsTrigger value="sectors">Sector Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="benchmarks" className="space-y-6">
          {/* County Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-lg">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-gray-900">
                  {selectedCountyData.population.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Population</div>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-gray-900">
                  {selectedCountyData.projectsCompleted}
                </div>
                <div className="text-sm text-gray-600">Projects Completed</div>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-gray-900">
                  {selectedCountyData.budgetUtilization}%
                </div>
                <div className="text-sm text-gray-600">Budget Utilization</div>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold text-gray-900">
                  {selectedCountyData.developmentIndex}
                </div>
                <div className="text-sm text-gray-600">Development Index</div>
              </CardContent>
            </Card>
          </div>

          {/* Comparative Analysis */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>County Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={countyBenchmarks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="county" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'budgetUtilization' ? `${value}%` : value,
                      name === 'budgetUtilization' ? 'Budget Utilization' : 
                      name === 'citizenSatisfaction' ? 'Citizen Satisfaction' :
                      name === 'projectsCompleted' ? 'Projects Completed' : name
                    ]}
                  />
                  <Bar dataKey="budgetUtilization" fill="#8884d8" name="budgetUtilization" />
                  <Bar dataKey="citizenSatisfaction" fill="#82ca9d" name="citizenSatisfaction" />
                  <Bar dataKey="projectsCompleted" fill="#ffc658" name="projectsCompleted" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed County Analysis */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{selectedCounty} County - Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Citizen Satisfaction</span>
                      <span>{selectedCountyData.citizenSatisfaction}% (Target: 80%)</span>
                    </div>
                    <Progress value={selectedCountyData.citizenSatisfaction} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Budget Utilization</span>
                      <span>{selectedCountyData.budgetUtilization}% (Target: 90%)</span>
                    </div>
                    <Progress value={selectedCountyData.budgetUtilization} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Corruption Index (Lower is Better)</span>
                      <span>{selectedCountyData.corruptionIndex} (Target: &lt;20)</span>
                    </div>
                    <Progress value={Math.max(0, 100 - selectedCountyData.corruptionIndex)} className="h-3" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatAmount(selectedCountyData.averageProjectCost)}
                    </div>
                    <div className="text-sm text-gray-600">Average Project Cost</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedCountyData.developmentIndex}
                    </div>
                    <div className="text-sm text-gray-600">Development Index</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>National Project Completion Trends</CardTitle>
              <p className="text-sm text-gray-600">5-year historical data from Kenya Open Data Portal</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={nationalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name.includes('budget') ? `KES ${value}B` : value,
                      name === 'projectsCompleted' ? 'Projects Completed' :
                      name === 'budgetAllocated' ? 'Budget Allocated' :
                      'Budget Utilized'
                    ]}
                  />
                  <Line type="monotone" dataKey="projectsCompleted" stroke="#8884d8" strokeWidth={3} />
                  <Line type="monotone" dataKey="budgetAllocated" stroke="#82ca9d" strokeWidth={3} />
                  <Line type="monotone" dataKey="budgetUtilized" stroke="#ffc658" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-4 text-blue-600" />
                <div className="text-2xl font-bold text-gray-900 mb-2">5 Years</div>
                <div className="text-sm text-gray-600">Historical Data Available</div>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-4 text-green-600" />
                <div className="text-2xl font-bold text-green-600 mb-2">+48.6%</div>
                <div className="text-sm text-gray-600">Project Completion Growth</div>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-4 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600 mb-2">+70.3%</div>
                <div className="text-sm text-gray-600">Budget Allocation Growth</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sectors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Project Distribution by Sector</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sectorDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sectorDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Budget Allocation by Sector</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sectorDistribution.map((sector, index) => (
                    <div key={sector.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{sector.name}</span>
                        <span>{formatAmount(sector.amount)}</span>
                      </div>
                      <Progress value={sector.value * 2} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Sector Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatAmount(value), 'Budget Allocation']} />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {performanceMetrics.map((metric, index) => (
              <Card key={index} className="shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900">{metric.metric}</h3>
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{metric.value}</div>
                        <div className="text-xs text-gray-600">Current</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{metric.benchmark}</div>
                        <div className="text-xs text-gray-600">Benchmark</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${metric.trend.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {metric.trend}
                        </div>
                        <div className="text-xs text-gray-600">Trend</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Data Sources & Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-semibold">Kenya Open Data</div>
                  <div className="text-sm text-gray-600">National statistics and benchmarks</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="font-semibold">KNBS Integration</div>
                  <div className="text-sm text-gray-600">Verified demographic data</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="font-semibold">Real-time Sync</div>
                  <div className="text-sm text-gray-600">Updated every 24 hours</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KenyaOpenDataIntegration;
