
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Users, Building, Eye, DollarSign, CheckCircle, TrendingUp, ChevronRight } from 'lucide-react';
import logoImg from '@/assets/uhuru-safi-logo.png';
import MobileNavigation from '@/components/MobileNavigation';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';

const Landing = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();

  const userTypes = [
    {
      id: 'citizen',
      title: 'Citizens',
      description: 'Report infrastructure problems, verify project progress, and register your skills for opportunities.',
      icon: Users,
      color: 'from-slate-600 to-slate-700',
      hoverColor: 'hover:from-slate-700 hover:to-slate-800',
      detailedDescription: {
        overview: 'Citizens are the backbone of transparent governance, serving as both reporters and verifiers of community infrastructure needs.',
        responsibilities: [
          'Identify and report infrastructure problems in your community',
          'Verify the progress and quality of ongoing projects',
          'Participate in community voting for project priorities',
          'Register skills and availability for local workforce opportunities'
        ],
        benefits: [
          'Direct impact on community development',
          'Transparency in how public funds are used',
          'Opportunity to earn income through verification tasks',
          'Voice in local infrastructure decisions'
        ]
      }
    },
    {
      id: 'contractor',
      title: 'Contractors',
      description: 'Bid on verified projects, track progress, and receive guaranteed payments through secure escrow.',
      icon: Building,
      color: 'from-slate-600 to-slate-700',
      hoverColor: 'hover:from-slate-700 hover:to-slate-800',
      detailedDescription: {
        overview: 'Contractors are verified service providers who deliver infrastructure solutions with guaranteed payment security.',
        responsibilities: [
          'Complete verification process to establish credibility',
          'Submit competitive bids on community-verified projects',
          'Deliver high-quality work according to project specifications',
          'Maintain transparent communication throughout project lifecycle'
        ],
        benefits: [
          'Access to pre-verified, legitimate projects',
          'Guaranteed payments through secure escrow system',
          'Build reputation through transparent performance tracking',
          'Reduced payment delays and disputes'
        ]
      }
    },
    {
      id: 'government',
      title: 'Government',
      description: 'Oversee projects, manage budgets, and ensure transparent allocation of public funds.',
      icon: Shield,
      color: 'from-slate-600 to-slate-700',
      hoverColor: 'hover:from-slate-700 hover:to-slate-800',
      detailedDescription: {
        overview: 'Government officials ensure responsible stewardship of public resources through transparent project management.',
        responsibilities: [
          'Review and approve community-reported infrastructure needs',
          'Allocate budgets based on verified community priorities',
          'Monitor contractor performance and project progress',
          'Ensure compliance with regulations and standards'
        ],
        benefits: [
          'Enhanced transparency builds public trust',
          'Data-driven decision making for resource allocation',
          'Reduced corruption through open processes',
          'Improved accountability and performance metrics'
        ]
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600">
      {/* Header */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <ResponsiveContainer>
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src={logoImg} alt="Uhuru Safi" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              <span className="text-white font-bold text-lg sm:text-xl">Uhuru Safi</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button 
                className="text-white hover:text-slate-200 transition-colors text-sm lg:text-base"
                onClick={() => navigate('/transparency')}
              >
                Transparency
              </button>
              <button 
                className="text-white hover:text-slate-200 transition-colors text-sm lg:text-base"
                onClick={() => navigate('/about')}
              >
                About
              </button>
              <button 
                className="text-white hover:text-slate-200 transition-colors text-sm lg:text-base"
                onClick={() => navigate('/how-it-works')}
              >
                How it Works
              </button>
              <button 
                className="text-white hover:text-slate-200 transition-colors text-sm lg:text-base"
                onClick={() => navigate('/contact')}
              >
                Contact
              </button>
            </div>

            {/* Mobile Navigation */}
            <MobileNavigation />
          </div>
        </ResponsiveContainer>
      </nav>

      {/* Main Content */}
      <main>
        <ResponsiveContainer className="py-8 sm:py-12 lg:py-16">
          <div className="text-center mb-12 lg:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Transparent Government
              <span className="block text-amber-400 mt-2">Project Delivery</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-200 mb-6 sm:mb-8 max-w-3xl mx-auto px-4 leading-relaxed">
              Empowering citizens to identify infrastructure needs, connecting verified contractors, 
              and ensuring transparent project funding and delivery through innovative escrow mechanisms.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button 
                size={isMobile ? "default" : "lg"}
                className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </Button>
            </div>
          </div>

          {/* Role Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16 px-4">
            {userTypes.map((userType) => {
              const IconComponent = userType.icon;
              return (
                <Card key={userType.id} className="group transform transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20">
                  <CardHeader className="text-center pb-4 p-4 sm:p-6">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${userType.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-all duration-300`}>
                      <IconComponent className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">
                      {userType.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pb-6 sm:pb-8 p-4 sm:p-6">
                    <p className="text-slate-200 mb-4 sm:mb-6 font-medium text-sm sm:text-base leading-relaxed">
                      {userType.description}
                    </p>
                    
                    <div className="flex flex-col gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size={isMobile ? "sm" : "default"}
                            className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-amber-400 transition-colors w-full"
                          >
                            Learn More
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto mx-4 sm:mx-0">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-3 text-xl sm:text-2xl">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${userType.color} rounded-xl flex items-center justify-center`}>
                              <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <span>{userType.title} Role</span>
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6 mt-6">
                          {/* Overview Section */}
                          <div className="bg-slate-50 rounded-lg p-4 sm:p-6">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Role Overview</h3>
                            <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                              {userType.detailedDescription.overview}
                            </p>
                          </div>
                          
                          {/* Responsibilities Section */}
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 flex items-center">
                              <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                              Key Responsibilities
                            </h3>
                            <div className="space-y-3">
                              {userType.detailedDescription.responsibilities.map((responsibility, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <p className="text-slate-700 text-sm leading-relaxed">{responsibility}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Benefits Section */}
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 flex items-center">
                              <TrendingUp className="w-5 h-5 text-emerald-600 mr-2" />
                              Key Benefits
                            </h3>
                            <div className="space-y-3">
                              {userType.detailedDescription.benefits.map((benefit, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-emerald-50 rounded-lg">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <p className="text-slate-700 text-sm leading-relaxed">{benefit}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Call to Action */}
                          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 sm:p-6 text-center">
                            <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Ready to Get Started?</h4>
                            <p className="text-slate-600 mb-4 text-sm sm:text-base">Sign up to access {userType.title.toLowerCase()} features and make a difference.</p>
                            <Button 
                              className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto"
                              onClick={() => navigate('/auth')}
                            >
                              Sign Up Now
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Features Section */}
          <div className="text-center mb-12 lg:mb-16 px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Key Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              <div className="text-center p-4">
                <Eye className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Full Transparency</h4>
                <p className="text-slate-200 text-sm leading-relaxed">Real-time project tracking and public fund visibility</p>
              </div>
              <div className="text-center p-4">
                <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Secure Escrow</h4>
                <p className="text-slate-200 text-sm leading-relaxed">Guaranteed contractor payments upon milestone completion</p>
              </div>
              <div className="text-center p-4">
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Citizen Verification</h4>
                <p className="text-slate-200 text-sm leading-relaxed">Community-validated project needs and progress</p>
              </div>
              <div className="text-center p-4">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Data Analytics</h4>
                <p className="text-slate-200 text-sm leading-relaxed">Comprehensive reporting and performance insights</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20 mx-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Explore Platform Features</h3>
            <p className="text-slate-200 mb-6 text-sm sm:text-base leading-relaxed">Browse through citizen, contractor, and government dashboards to see all features.</p>
          </div>
        </ResponsiveContainer>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/20 bg-white/5 backdrop-blur-md py-6 sm:py-8 mt-12 lg:mt-16">
        <ResponsiveContainer>
          <div className="text-center">
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Built for transparency in Kenyan governance • Empowering communities through technology
            </p>
          </div>
        </ResponsiveContainer>
      </footer>
    </div>
  );
};

export default Landing;
