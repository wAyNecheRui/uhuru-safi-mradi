
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Search, Building, Shield, CheckCircle, DollarSign } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowItWorksModal = ({ isOpen, onClose }: HowItWorksModalProps) => {
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
      icon: DollarSign,
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">How Uhuru Safi Works</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 mt-6">
          {/* Process Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Transparent Government Project Delivery</h3>
            <p className="text-slate-700 leading-relaxed">
              Our platform creates a seamless flow from problem identification to project completion, 
              ensuring transparency, accountability, and community participation at every step.
            </p>
          </div>

          {/* Step-by-step Process */}
          <div className="space-y-6">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="flex items-start space-x-6 p-6 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-blue-600 rounded-full flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center mt-2">
                      <span className="text-sm font-semibold text-slate-600">Step {index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h4>
                    <p className="text-slate-700 mb-4">{step.description}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {step.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-slate-600">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benefits Section */}
          <div className="bg-amber-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Key Benefits</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-slate-900">Increased Transparency</h4>
                <p className="text-sm text-slate-600 mt-1">Real-time project tracking and fund visibility</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-slate-900">Community Empowerment</h4>
                <p className="text-sm text-slate-600 mt-1">Direct citizen participation in governance</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibent text-slate-900">Guaranteed Payments</h4>
                <p className="text-sm text-slate-600 mt-1">Secure escrow system for contractors</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksModal;
