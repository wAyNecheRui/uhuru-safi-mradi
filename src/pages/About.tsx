
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Users, Building, Eye, CheckCircle, TrendingUp, ArrowLeft } from 'lucide-react';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';

const About = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <ResponsiveContainer>
          <div className="py-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
              size={isMobile ? "sm" : "default"}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </div>
        </ResponsiveContainer>
      </header>

      {/* Main Content */}
      <main>
        <ResponsiveContainer maxWidth="2xl" className="py-8 sm:py-12">
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4 sm:mb-6">
              <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">About Uhuru Safi</h1>
            </div>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto px-4 leading-relaxed">
              Transforming government project delivery through transparency, accountability, and community participation.
            </p>
          </div>

          <div className="space-y-8 sm:space-y-12">
            {/* Mission Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mx-4 sm:mx-0">
              <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4">Our Mission</h2>
                <p className="text-slate-700 leading-relaxed text-base sm:text-lg">
                  Uhuru Safi is dedicated to transforming government project delivery through transparency, 
                  accountability, and community participation. We empower citizens to identify infrastructure 
                  needs, connect verified contractors with legitimate projects, and ensure transparent 
                  allocation and management of public funds.
                </p>
              </div>
            </div>

            {/* Vision Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mx-4 sm:mx-0">
              <div className="bg-emerald-50 rounded-lg p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4">Our Vision</h2>
                <p className="text-slate-700 leading-relaxed text-base sm:text-lg">
                  To create a future where every public infrastructure project is delivered transparently, 
                  efficiently, and with full community oversight, building trust between citizens and government 
                  while ensuring optimal use of public resources.
                </p>
              </div>
            </div>

            {/* Core Values */}
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mx-4 sm:mx-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6">Core Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-start space-x-4 p-4 sm:p-6 bg-slate-50 rounded-lg">
                  <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Transparency</h3>
                    <p className="text-slate-600 text-sm sm:text-base">Open access to project information and fund allocation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 sm:p-6 bg-slate-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Accountability</h3>
                    <p className="text-slate-600 text-sm sm:text-base">Clear responsibility and performance tracking</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 sm:p-6 bg-slate-50 rounded-lg">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Community Participation</h3>
                    <p className="text-slate-600 text-sm sm:text-base">Citizen-driven problem identification and verification</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 sm:p-6 bg-slate-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Innovation</h3>
                    <p className="text-slate-600 text-sm sm:text-base">Technology-driven solutions for governance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Note */}
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mx-4 sm:mx-0">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6 text-center">Our Impact</h2>
                <p className="text-slate-700 text-center leading-relaxed">
                  Since launch, Uhuru Safi has enabled citizens across Kenya to report infrastructure issues, 
                  track government projects in real-time, and ensure transparent allocation of public funds. 
                  Our platform connects verified contractors with legitimate projects while providing 
                  secure escrow-based payments upon milestone completion.
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 sm:p-8 text-center text-white mx-4 sm:mx-0">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Ready to Make a Difference?</h2>
              <p className="text-blue-100 mb-6 text-base sm:text-lg leading-relaxed">
                Join thousands of citizens, contractors, and officials building transparent infrastructure.
              </p>
              <Button 
                size={isMobile ? "default" : "lg"}
                className="bg-white text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                onClick={() => navigate('/auth')}
              >
                Get Started Today
              </Button>
            </div>
          </div>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default About;
