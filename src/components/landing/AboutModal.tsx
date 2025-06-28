
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-2xl">
            <Shield className="w-8 h-8 text-blue-600" />
            <span>About Uhuru Safi</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          {/* Mission Section */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Our Mission</h3>
            <p className="text-slate-700 leading-relaxed">
              Uhuru Safi is dedicated to transforming government project delivery through transparency, 
              accountability, and community participation. We empower citizens to identify infrastructure 
              needs, connect verified contractors with legitimate projects, and ensure transparent 
              allocation and management of public funds.
            </p>
          </div>

          {/* Vision Section */}
          <div className="bg-emerald-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Our Vision</h3>
            <p className="text-slate-700 leading-relaxed">
              To create a future where every public infrastructure project is delivered transparently, 
              efficiently, and with full community oversight, building trust between citizens and government 
              while ensuring optimal use of public resources.
            </p>
          </div>

          {/* Core Values */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Core Values</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-900">Transparency</h4>
                  <p className="text-sm text-slate-600">Open access to project information and fund allocation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-900">Accountability</h4>
                  <p className="text-sm text-slate-600">Clear responsibility and performance tracking</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-900">Community Participation</h4>
                  <p className="text-sm text-slate-600">Citizen-driven problem identification and verification</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-indigo-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-900">Innovation</h4>
                  <p className="text-sm text-slate-600">Technology-driven solutions for governance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Statistics */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Our Impact</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">1,247</div>
                <div className="text-sm text-slate-600">Projects Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">KES 2.4B</div>
                <div className="text-sm text-slate-600">Funds Managed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">3,456</div>
                <div className="text-sm text-slate-600">Citizen Reports</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">234</div>
                <div className="text-sm text-slate-600">Verified Contractors</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AboutModal;
