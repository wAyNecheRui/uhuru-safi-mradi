
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Shield, Users, Building, Info, Briefcase, Award } from 'lucide-react';

const RoleCards = () => {
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
    <div className="grid md:grid-cols-3 gap-8 mb-16">
      {userTypes.map((userType) => {
        const IconComponent = userType.icon;
        return (
          <HoverCard key={userType.id}>
            <HoverCardTrigger asChild>
              <Card className="group cursor-help transform transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20">
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
                    <Info className="w-4 h-4 mr-2" />
                    Show More
                  </div>
                </CardContent>
              </Card>
            </HoverCardTrigger>
            <HoverCardContent className="w-[480px] p-0 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-b border-slate-200">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${userType.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{userType.title}</h3>
                    <p className="text-slate-600 font-medium">Professional Role Overview</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-slate-600">
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {userType.detailedDescription.overview}
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <Briefcase className="w-5 h-5 text-slate-600" />
                      <h4 className="font-bold text-slate-900 text-lg">Key Responsibilities</h4>
                    </div>
                    <div className="space-y-2">
                      {userType.detailedDescription.responsibilities.map((responsibility, index) => (
                        <div key={index} className="flex items-start space-x-3 p-2 bg-slate-50 rounded-md">
                          <div className="w-2 h-2 bg-slate-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-slate-700 leading-relaxed">{responsibility}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <Award className="w-5 h-5 text-amber-600" />
                      <h4 className="font-bold text-slate-900 text-lg">Key Benefits</h4>
                    </div>
                    <div className="space-y-2">
                      {userType.detailedDescription.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start space-x-3 p-2 bg-amber-50 rounded-md border border-amber-100">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-slate-700 leading-relaxed">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
};

export default RoleCards;
