import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Users, Building, Eye, Wallet, CheckCircle, TrendingUp, ChevronRight, ArrowRight } from 'lucide-react';
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

  const features = [
    { icon: Eye, title: 'Full Transparency', description: 'Real-time project tracking and public fund visibility', color: 'text-amber-400' },
    { icon: Wallet, title: 'Secure Escrow', description: 'Guaranteed contractor payments upon milestone completion', color: 'text-emerald-400' },
    { icon: CheckCircle, title: 'Citizen Verification', description: 'Community-validated project needs and progress', color: 'text-blue-400' },
    { icon: TrendingUp, title: 'Data Analytics', description: 'Comprehensive reporting and performance insights', color: 'text-indigo-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <ResponsiveContainer>
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Uhuru Safi" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
              <span className="text-white font-bold text-lg">Uhuru Safi</span>
            </div>
            
            <div className="hidden md:flex items-center gap-1">
              {['Projects', 'Transparency', 'About', 'How it Works', 'Contact'].map((item) => (
                <button 
                  key={item}
                  className="text-white/70 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                  onClick={() => navigate(item === 'Projects' ? '/projects' : `/${item.toLowerCase().replace(/ /g, '-')}`)}
                >
                  {item}
                </button>
              ))}
            </div>

            <MobileNavigation />
          </div>
        </ResponsiveContainer>
      </nav>

      <main>
        {/* Hero */}
        <ResponsiveContainer className="pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
              Transparent Government
              <span className="block text-amber-400 mt-1">Project Delivery</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Empowering citizens to identify infrastructure needs, connecting verified contractors, 
              and ensuring transparent project funding through innovative escrow mechanisms.
            </p>
            
            <Button 
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-8 h-12 text-base font-semibold shadow-lg shadow-amber-500/20"
              onClick={() => navigate('/auth')}
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </ResponsiveContainer>

        {/* Role Cards */}
        <ResponsiveContainer className="pb-12 sm:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 stagger-children">
            {userTypes.map((userType) => {
              const IconComponent = userType.icon;
              return (
                <Card 
                  key={userType.id} 
                  className="group bg-white/[0.07] backdrop-blur-md border-white/10 hover:bg-white/[0.12] transition-all duration-300 card-hover"
                >
                  <CardHeader className="text-center pb-3 pt-6">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/15 transition-colors">
                      <IconComponent className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {userType.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pb-6">
                    <p className="text-slate-300 text-sm leading-relaxed mb-5">
                      {userType.description}
                    </p>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-amber-400 rounded-lg w-full"
                        >
                          Learn More
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[85dvh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-3 text-lg">
                            <div className={`w-10 h-10 bg-gradient-to-br ${userType.color} rounded-xl flex items-center justify-center`}>
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                            {userType.title} Role
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-5 mt-4">
                          <div className="bg-muted rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-foreground mb-2">Overview</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {userType.detailedDescription.overview}
                            </p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                              Key Responsibilities
                            </h3>
                            <div className="space-y-2">
                              {userType.detailedDescription.responsibilities.map((r, i) => (
                                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-blue-50 rounded-lg">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                                  <p className="text-sm text-foreground/80 leading-relaxed">{r}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-emerald-600" />
                              Key Benefits
                            </h3>
                            <div className="space-y-2">
                              {userType.detailedDescription.benefits.map((b, i) => (
                                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-emerald-50 rounded-lg">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                                  <p className="text-sm text-foreground/80 leading-relaxed">{b}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-amber-50 rounded-xl p-4 text-center">
                            <h4 className="text-sm font-semibold text-foreground mb-1.5">Ready to Get Started?</h4>
                            <p className="text-xs text-muted-foreground mb-3">Join as a {userType.title.toLowerCase()} and make a difference.</p>
                            <Button 
                              size="sm"
                              className="bg-amber-500 hover:bg-amber-600 text-white"
                              onClick={() => navigate('/auth')}
                            >
                              Sign Up Now
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ResponsiveContainer>

        {/* Features */}
        <ResponsiveContainer className="pb-12 sm:pb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-8">Key Features</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 stagger-children">
            {features.map((f, i) => (
              <div key={i} className="text-center p-4 sm:p-5 bg-white/[0.05] rounded-2xl border border-white/10 hover:bg-white/[0.08] transition-all duration-200">
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{f.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </ResponsiveContainer>

        {/* CTA */}
        <ResponsiveContainer className="pb-12 sm:pb-16">
          <div className="text-center bg-white/[0.07] backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Explore Platform Features</h3>
            <p className="text-sm text-slate-300 mb-5 max-w-md mx-auto leading-relaxed">
              Browse through citizen, contractor, and government dashboards to see all features.
            </p>
            <Button 
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
              onClick={() => navigate('/auth')}
            >
              Sign In to Explore
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </ResponsiveContainer>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/[0.03] py-6">
        <ResponsiveContainer>
          <p className="text-center text-slate-400 text-xs leading-relaxed">
            Built for transparency in Kenyan governance • Empowering communities through technology
          </p>
        </ResponsiveContainer>
      </footer>
    </div>
  );
};

export default Landing;
