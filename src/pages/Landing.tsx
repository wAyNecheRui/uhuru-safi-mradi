
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Building, Eye, DollarSign, CheckCircle, TrendingUp, ChevronRight } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const userTypes = [
    {
      id: 'citizen',
      title: 'Citizens',
      description: 'Report infrastructure problems, verify project progress, and register your skills for opportunities.',
      icon: Users,
      color: 'from-slate-600 to-slate-700',
      hoverColor: 'hover:from-slate-700 hover:to-slate-800',
      route: '/citizen'
    },
    {
      id: 'contractor',
      title: 'Contractors',
      description: 'Bid on verified projects, track progress, and receive guaranteed payments through secure escrow.',
      icon: Building,
      color: 'from-blue-600 to-blue-700',
      hoverColor: 'hover:from-blue-700 hover:to-blue-800',
      route: '/contractor'
    },
    {
      id: 'government',
      title: 'Government',
      description: 'Oversee projects, manage budgets, and ensure transparent allocation of public funds.',
      icon: Shield,
      color: 'from-indigo-600 to-indigo-700',
      hoverColor: 'hover:from-indigo-700 hover:to-indigo-800',
      route: '/government'
    }
  ];

  const handleRoleSelect = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-blue-800">
      {/* Header */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-white" />
              <span className="text-white font-bold text-xl">Uhuru Safi</span>
            </div>
            <div className="hidden md:flex space-x-4">
              <button className="text-white hover:text-slate-200 transition-colors">About</button>
              <button className="text-white hover:text-slate-200 transition-colors">How it Works</button>
              <button className="text-white hover:text-slate-200 transition-colors">Contact</button>
              <Button 
                variant="outline" 
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Transparent Government
            <span className="block text-amber-400">Project Delivery</span>
          </h1>
          <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto">
            Empowering citizens to identify infrastructure needs, connecting verified contractors, 
            and ensuring transparent project funding and delivery through innovative escrow mechanisms.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-8"
              onClick={() => navigate('/auth')}
            >
              Get Started Today
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={() => navigate('/contractor-database')}
            >
              Browse Contractors
            </Button>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {userTypes.map((userType) => {
            const IconComponent = userType.icon;
            return (
              <Card 
                key={userType.id} 
                className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20"
                onClick={() => handleRoleSelect(userType.route)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-20 h-20 bg-gradient-to-br ${userType.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-all duration-300`}>
                    <IconComponent className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">
                    {userType.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <p className="text-slate-200 mb-6 font-medium">
                    {userType.description}
                  </p>
                  <div className="flex items-center justify-center text-amber-400 font-semibold">
                    Get Started <ChevronRight className="w-5 h-5 ml-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Key Features</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <Eye className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Full Transparency</h4>
              <p className="text-slate-200 text-sm">Real-time project tracking and public fund visibility</p>
            </div>
            <div className="text-center">
              <DollarSign className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Secure Escrow</h4>
              <p className="text-slate-200 text-sm">Guaranteed contractor payments upon milestone completion</p>
            </div>
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Citizen Verification</h4>
              <p className="text-slate-200 text-sm">Community-validated project needs and progress</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Data Analytics</h4>
              <p className="text-slate-200 text-sm">Comprehensive reporting and performance insights</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Transform Your Community?</h3>
          <p className="text-slate-200 mb-6">Join thousands of citizens, contractors, and officials building transparent infrastructure.</p>
          <Button 
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-8"
            onClick={() => navigate('/auth')}
          >
            Join Uhuru Safi Today
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/20 bg-white/5 backdrop-blur-md py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-300">
            Built for transparency in Kenyan governance • Empowering communities through technology
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
