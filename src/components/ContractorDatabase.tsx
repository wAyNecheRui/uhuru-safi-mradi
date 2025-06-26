
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Building, Star, MapPin, Phone, Mail, Award, CheckCircle, AlertTriangle } from 'lucide-react';

const ContractorDatabase = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  
  const contractors = [
    {
      id: 'CTR-001',
      name: 'Quality Builders Ltd',
      category: 'Road Construction',
      location: 'Nairobi County',
      rating: 4.8,
      projects: 45,
      yearsExperience: 8,
      verificationStatus: 'verified',
      phone: '+254 700 123 456',
      email: 'info@qualitybuilders.co.ke',
      specializations: ['Road Construction', 'Water Infrastructure', 'Building Construction'],
      certifications: ['NCA Registration', 'OSHA Safety', 'Environmental Compliance'],
      recentProjects: [
        { name: 'Machakos Market Road', value: 4800000, status: 'completed' },
        { name: 'Kibera Water Pipeline', value: 4200000, status: 'in_progress' }
      ]
    },
    {
      id: 'CTR-002',
      name: 'Aqua Solutions Kenya',
      category: 'Water Infrastructure',
      location: 'Mombasa County',
      rating: 4.6,
      projects: 32,
      yearsExperience: 6,
      verificationStatus: 'verified',
      phone: '+254 711 234 567',
      email: 'contracts@aquasolutions.co.ke',
      specializations: ['Water Supply', 'Sewerage Systems', 'Borehole Drilling'],
      certifications: ['Water Resources Authority License', 'OSHA Safety'],
      recentProjects: [
        { name: 'Kilifi Water Project', value: 6200000, status: 'completed' },
        { name: 'Malindi Sewerage Upgrade', value: 3800000, status: 'in_progress' }
      ]
    },
    {
      id: 'CTR-003',
      name: 'Power Connect Ltd',
      category: 'Electrical Infrastructure',
      location: 'Kisumu County',
      rating: 4.4,
      projects: 28,
      yearsExperience: 5,
      verificationStatus: 'pending',
      phone: '+254 722 345 678',
      email: 'info@powerconnect.co.ke',
      specializations: ['Street Lighting', 'Power Distribution', 'Solar Systems'],
      certifications: ['Electrical Engineers Board', 'OSHA Safety'],
      recentProjects: [
        { name: 'Kisumu Street Lighting', value: 2100000, status: 'completed' }
      ]
    }
  ];

  const categories = ['all', 'Road Construction', 'Water Infrastructure', 'Electrical Infrastructure', 'Building Construction'];
  const locations = ['all', 'Nairobi County', 'Mombasa County', 'Kisumu County', 'Machakos County'];

  const filteredContractors = contractors.filter(contractor => {
    const matchesSearch = contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contractor.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || contractor.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || contractor.location === selectedLocation;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
          <CardTitle className="flex items-center text-2xl">
            <Building className="h-6 w-6 mr-3 text-blue-600" />
            Contractor Database & Verification System
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Search, verify, and connect with qualified contractors for your infrastructure projects.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          {/* Search and Filter Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search contractors or specializations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === 'all' ? 'All Locations' : loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredContractors.length} contractor{filteredContractors.length !== 1 ? 's' : ''}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>

          {/* Contractor Cards */}
          <div className="space-y-6">
            {filteredContractors.map((contractor) => (
              <Card key={contractor.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{contractor.name}</h3>
                        <Badge className={getVerificationColor(contractor.verificationStatus)}>
                          {contractor.verificationStatus === 'verified' ? (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 mr-1" />
                          )}
                          {contractor.verificationStatus.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Building className="h-4 w-4 mr-2" />
                            {contractor.category}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {contractor.location}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {contractor.phone}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {contractor.email}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-semibold">{contractor.rating}/5.0</span>
                            <span className="text-sm text-gray-600 ml-2">({contractor.projects} projects)</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <Award className="h-4 w-4 inline mr-1" />
                            {contractor.yearsExperience} years experience
                          </div>
                        </div>
                      </div>

                      {/* Specializations */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Specializations:</h4>
                        <div className="flex flex-wrap gap-2">
                          {contractor.specializations.map((spec, index) => (
                            <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Certifications */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Certifications:</h4>
                        <div className="flex flex-wrap gap-2">
                          {contractor.certifications.map((cert, index) => (
                            <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Recent Projects */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Recent Projects:</h4>
                        <div className="space-y-2">
                          {contractor.recentProjects.map((project, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">{project.name}</span>
                                <Badge className={project.status === 'completed' ? 'bg-green-100 text-green-800 ml-2' : 'bg-blue-100 text-blue-800 ml-2'}>
                                  {project.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                              <span className="font-semibold text-green-600">{formatAmount(project.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        View Full Profile
                      </Button>
                      <Button variant="outline">
                        Request Quote
                      </Button>
                      <Button variant="outline">
                        Contact Contractor
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredContractors.length === 0 && (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contractors found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractorDatabase;
