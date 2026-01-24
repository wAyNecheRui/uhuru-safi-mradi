
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Users, Building, Eye, CheckCircle, TrendingUp } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal = ({ isOpen, onClose }: AboutModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90dvh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-3 text-xl sm:text-2xl pr-8">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            <span className="truncate">About Uhuru Safi</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto min-h-0 space-y-6 py-2 pr-1">
          {/* Mission Section */}
          <div className="bg-primary/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">
              Uhuru Safi is dedicated to transforming government project delivery through transparency, 
              accountability, and community participation. We empower citizens to identify infrastructure 
              needs, connect verified contractors with legitimate projects, and ensure transparent 
              allocation and management of public funds.
            </p>
          </div>

          {/* Vision Section */}
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Our Vision</h3>
            <p className="text-muted-foreground leading-relaxed">
              To create a future where every public infrastructure project is delivered transparently, 
              efficiently, and with full community oversight, building trust between citizens and government 
              while ensuring optimal use of public resources.
            </p>
          </div>

          {/* Core Values */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Core Values</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                <Eye className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground">Transparency</h4>
                  <p className="text-sm text-muted-foreground">Open access to project information and fund allocation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground">Accountability</h4>
                  <p className="text-sm text-muted-foreground">Clear responsibility and performance tracking</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground">Community Participation</h4>
                  <p className="text-sm text-muted-foreground">Citizen-driven problem identification and verification</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground">Innovation</h4>
                  <p className="text-sm text-muted-foreground">Technology-driven solutions for governance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Statistics */}
          <div className="bg-gradient-to-r from-muted/50 to-primary/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Our Impact</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">1,247</div>
                <div className="text-sm text-muted-foreground">Projects Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">KES 2.4B</div>
                <div className="text-sm text-muted-foreground">Funds Managed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">3,456</div>
                <div className="text-sm text-muted-foreground">Citizen Reports</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">234</div>
                <div className="text-sm text-muted-foreground">Verified Contractors</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AboutModal;
