
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Search, Building, Shield, CheckCircle, Wallet } from 'lucide-react';

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90dvh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl pr-8">How Uhuru Safi Works</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto min-h-0 space-y-8 py-2 pr-1">
          {/* Process Overview */}
          <div className="bg-primary/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-3">Transparent Government Project Delivery</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our platform creates a seamless flow from problem identification to project completion, 
              ensuring transparency, accountability, and community participation at every step.
            </p>
          </div>

          {/* Step-by-step Process */}
          <div className="space-y-6">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="flex items-start space-x-6 p-6 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="text-center mt-2">
                      <span className="text-sm font-semibold text-muted-foreground">Step {index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-foreground mb-2">{step.title}</h4>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {step.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm text-muted-foreground">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benefits Section */}
          <div className="bg-secondary/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Key Benefits</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-foreground">Increased Transparency</h4>
                <p className="text-sm text-muted-foreground mt-1">Real-time project tracking and fund visibility</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <h4 className="font-semibold text-foreground">Community Empowerment</h4>
                <p className="text-sm text-muted-foreground mt-1">Direct citizen participation in governance</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-accent-foreground rounded-full flex items-center justify-center mx-auto mb-2">
                  <Wallet className="w-6 h-6 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground">Guaranteed Payments</h4>
                <p className="text-sm text-muted-foreground mt-1">Secure escrow system for contractors</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksModal;
