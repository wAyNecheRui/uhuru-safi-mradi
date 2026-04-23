
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Search, Building, Shield, CheckCircle, Wallet, ArrowLeft } from 'lucide-react';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';
import SEO from '@/components/SEO';

const HowItWorks = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const steps = [
    {
      icon: Search,
      title: "Problem Identification",
      description: "Citizens identify and report infrastructure problems in their communities through our simple reporting system.",
      details: ["Photo documentation", "GPS location tracking", "Priority assessment", "Community validation"]
    },
    {
      icon: Users,
      title: "Community Verification",
      description: "Other community members verify reported issues through our transparent voting and verification system.",
      details: ["Peer review process", "Evidence validation", "Priority ranking", "Consensus building"]
    },
    {
      icon: Shield,
      title: "Government Review",
      description: "Government officials review verified issues, allocate budgets, and approve projects for implementation.",
      details: ["Budget allocation", "Project approval", "Compliance review", "Timeline setting"]
    },
    {
      icon: Building,
      title: "Contractor Bidding",
      description: "Verified contractors submit competitive bids for approved projects with transparent evaluation criteria.",
      details: ["Open bidding process", "Qualification verification", "Competitive evaluation", "Contract award"]
    },
    {
      icon: Wallet,
      title: "Secure Escrow",
      description: "Project funds are held in secure escrow and released based on verified milestone completion.",
      details: ["Milestone-based payments", "Community verification", "Quality assurance", "Dispute resolution"]
    },
    {
      icon: CheckCircle,
      title: "Project Completion",
      description: "Communities verify project completion and quality, ensuring accountability and transparency.",
      details: ["Final inspection", "Quality verification", "Community acceptance", "Performance rating"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
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
        <ResponsiveContainer className="py-8 sm:py-12">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 sm:mb-6">How Uhuru Safi Works</h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto px-4 leading-relaxed">
              Our platform creates a seamless flow from problem identification to project completion, 
              ensuring transparency, accountability, and community participation at every step.
            </p>
          </div>

          {/* Process Overview */}
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-8 sm:mb-12 mx-4 sm:mx-0">
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3">Transparent Government Project Delivery</h2>
              <p className="text-slate-700 leading-relaxed text-base sm:text-lg">
                Our platform creates a seamless flow from problem identification to project completion, 
                ensuring transparency, accountability, and community participation at every step.
              </p>
            </div>
          </div>

          {/* Step-by-step Process */}
          <div className="space-y-6 sm:space-y-8 mb-8 sm:mb-12">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mx-4 sm:mx-0">
                  <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="flex-shrink-0 w-full sm:w-auto text-center sm:text-left">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-600 to-blue-600 rounded-full flex items-center justify-center mb-3 mx-auto sm:mx-0">
                        <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-slate-600">Step {index + 1}</span>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3">{step.title}</h3>
                      <p className="text-slate-700 mb-4 sm:mb-6 text-base sm:text-lg leading-relaxed">{step.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {step.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-center space-x-2 justify-center sm:justify-start">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <span className="text-slate-600 text-sm sm:text-base">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benefits Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-8 sm:mb-12 mx-4 sm:mx-0">
            <div className="bg-amber-50 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6 text-center">Key Benefits</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Increased Transparency</h3>
                  <p className="text-slate-600 text-sm sm:text-base">Real-time project tracking and fund visibility</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Community Empowerment</h3>
                  <p className="text-slate-600 text-sm sm:text-base">Direct citizen participation in governance</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Guaranteed Payments</h3>
                  <p className="text-slate-600 text-sm sm:text-base">Secure escrow system for contractors</p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 sm:p-8 text-center text-white mx-4 sm:mx-0">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-blue-100 mb-6 text-base sm:text-lg leading-relaxed">
              Join the transparent governance revolution and help build better infrastructure for your community.
            </p>
            <Button 
              size={isMobile ? "default" : "lg"}
              className="bg-white text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
              onClick={() => navigate('/auth')}
            >
              Join Uhuru Safi Today
            </Button>
          </div>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default HowItWorks;
