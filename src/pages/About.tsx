
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Users, Building, Eye, CheckCircle, TrendingUp, ArrowLeft } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Shield className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">About Uhuru Safi</h1>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Transforming government project delivery through transparency, accountability, and community participation.
          </p>
        </div>

        <div className="space-y-12">
          {/* Mission Section */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Our Mission</h2>
              <p className="text-slate-700 leading-relaxed text-lg">
                Uhuru Safi is dedicated to transforming government project delivery through transparency, 
                accountability, and community participation. We empower citizens to identify infrastructure 
                needs, connect verified contractors with legitimate projects, and ensure transparent 
                allocation and management of public funds.
              </p>
            </div>
          </div>

          {/* Vision Section */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="bg-emerald-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Our Vision</h2>
              <p className="text-slate-700 leading-relaxed text-lg">
                To create a future where every public infrastructure project is delivered transparently, 
                efficiently, and with full community oversight, building trust between citizens and government 
                while ensuring optimal use of public resources.
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">Core Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4 p-6 bg-slate-50 rounded-lg">
                <Eye className="w-8 h-8 text-blue-600 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Transparency</h3>
                  <p className="text-slate-600">Open access to project information and fund allocation</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 p-6 bg-slate-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-emerald-600 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Accountability</h3>
                  <p className="text-slate-600">Clear responsibility and performance tracking</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 p-6 bg-slate-50 rounded-lg">
                <Users className="w-8 h-8 text-purple-600 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Community Participation</h3>
                  <p className="text-slate-600">Citizen-driven problem identification and verification</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 p-6 bg-slate-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-indigo-600 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Innovation</h3>
                  <p className="text-slate-600">Technology-driven solutions for governance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Statistics */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6 text-center">Our Impact</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">1,247</div>
                  <div className="text-slate-600">Projects Tracked</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">KES 2.4B</div>
                  <div className="text-slate-600">Funds Managed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">3,456</div>
                  <div className="text-slate-600">Citizen Reports</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">234</div>
                  <div className="text-slate-600">Verified Contractors</div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Make a Difference?</h2>
            <p className="text-blue-100 mb-6 text-lg">
              Join thousands of citizens, contractors, and officials building transparent infrastructure.
            </p>
            <Button 
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => navigate('/auth')}
            >
              Get Started Today
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
