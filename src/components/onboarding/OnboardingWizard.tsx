import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle, CheckCircle, ArrowRight, ArrowLeft,
  Users, Briefcase, Shield, MapPin, Camera, Vote, FileCheck,
  Wallet, BarChart3, Sparkles
} from 'lucide-react';

interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  illustration: string;
  actionLabel?: string;
  actionHref?: string;
}

interface OnboardingWizardProps {
  userType: 'citizen' | 'contractor' | 'government';
  userName: string;
  onComplete: () => void;
  onSkip: () => void;
}

const roleSteps: Record<string, WizardStep[]> = {
  citizen: [
    {
      id: 'welcome',
      title: 'Welcome to Uhuru Safi',
      subtitle: 'Your voice matters',
      description: 'As a citizen, you play a vital role in identifying infrastructure problems and holding the government accountable. Your reports drive real change in your community.',
      icon: <Users className="h-8 w-8" />,
      illustration: '🏛️',
    },
    {
      id: 'report',
      title: 'Report Infrastructure Issues',
      subtitle: 'Step 1 of the Citizen Cycle',
      description: 'Use your phone camera and GPS to document problems like potholes, broken pipes, or missing streetlights. Your report is automatically tagged with location and timestamp evidence.',
      icon: <Camera className="h-8 w-8" />,
      illustration: '📸',
      actionLabel: 'Try Reporting',
      actionHref: '/citizen/report',
    },
    {
      id: 'vote',
      title: 'Community Validation',
      subtitle: 'Step 2: Collective voice',
      description: 'Once a report is submitted, nearby citizens can verify and upvote it. Reports with 3+ community votes are prioritized for government review — ensuring the most pressing issues get addressed first.',
      icon: <Vote className="h-8 w-8" />,
      illustration: '🗳️',
      actionLabel: 'View Community Votes',
      actionHref: '/citizen/community-voting',
    },
    {
      id: 'track',
      title: 'Track Progress in Real-Time',
      subtitle: 'Step 3: Transparency',
      description: 'Follow your reported issues from approval through contractor bidding to project completion. Verify milestone progress and rate contractor work quality — keeping everyone accountable.',
      icon: <BarChart3 className="h-8 w-8" />,
      illustration: '📊',
      actionLabel: 'View My Reports',
      actionHref: '/citizen/track-reports',
    },
  ],
  contractor: [
    {
      id: 'welcome',
      title: 'Welcome, Contractor',
      subtitle: 'Transparent procurement',
      description: 'Uhuru Safi provides a level playing field. All project bidding is transparent, evaluation is score-based, and payments are guaranteed through escrow. No more chasing invoices.',
      icon: <Briefcase className="h-8 w-8" />,
      illustration: '🏗️',
    },
    {
      id: 'verify',
      title: 'Complete Verification',
      subtitle: 'Step 1: Get verified',
      description: 'Submit your NCA registration, KRA PIN, business permit, and tax compliance certificate. Verified contractors gain trust badges and access to more projects.',
      icon: <FileCheck className="h-8 w-8" />,
      illustration: '✅',
      actionLabel: 'Start Verification',
      actionHref: '/contractor/verification',
    },
    {
      id: 'bid',
      title: 'Bid on Projects',
      subtitle: 'Step 2: Win work',
      description: 'Browse community-verified projects in your registered counties. Submit competitive bids with technical approaches. Bids are scored on price (40%), technical merit (35%), experience (15%), and AGPO bonus (10%).',
      icon: <Wallet className="h-8 w-8" />,
      illustration: '💰',
      actionLabel: 'Browse Projects',
      actionHref: '/contractor/bidding',
    },
    {
      id: 'milestones',
      title: 'Deliver & Get Paid',
      subtitle: 'Step 3: Milestone-based payment',
      description: 'Projects are broken into milestones with clear deliverables. Submit photo evidence and GPS-tagged progress updates. Once verified by citizens and approved by government, payment is released from escrow automatically.',
      icon: <CheckCircle className="h-8 w-8" />,
      illustration: '🎯',
      actionLabel: 'View Dashboard',
      actionHref: '/contractor',
    },
  ],
  government: [
    {
      id: 'welcome',
      title: 'Welcome, Official',
      subtitle: 'Accountable governance',
      description: 'Uhuru Safi streamlines project oversight with transparent procurement, milestone tracking, and citizen feedback loops. Everything is auditable and blockchain-logged.',
      icon: <Shield className="h-8 w-8" />,
      illustration: '🇰🇪',
    },
    {
      id: 'review',
      title: 'Review & Approve Reports',
      subtitle: 'Step 1: Prioritize',
      description: 'Community-validated reports are ranked by priority score (votes × impact × urgency). Review reports, allocate budgets, and open bidding windows. AGPO-reserved projects are automatically flagged.',
      icon: <AlertTriangle className="h-8 w-8" />,
      illustration: '📋',
      actionLabel: 'View Reports',
      actionHref: '/government/reports',
    },
    {
      id: 'procure',
      title: 'Manage Procurement',
      subtitle: 'Step 2: Fair selection',
      description: 'Evaluate contractor bids using the standardized scoring matrix. Issue Local Purchase Orders (LPOs), fund escrow accounts, and approve project milestones — all with full audit trails.',
      icon: <Wallet className="h-8 w-8" />,
      illustration: '📑',
      actionLabel: 'Bid Approvals',
      actionHref: '/government/bid-approval',
    },
    {
      id: 'monitor',
      title: 'Monitor & Release Payments',
      subtitle: 'Step 3: Oversight',
      description: 'Track project progress with GPS-verified milestone evidence. Citizen verification percentages give you ground-truth confidence. Release escrow payments only when deliverables are confirmed.',
      icon: <BarChart3 className="h-8 w-8" />,
      illustration: '📈',
      actionLabel: 'Analytics Dashboard',
      actionHref: '/government/analytics',
    },
  ],
};

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ userType, userName, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = roleSteps[userType] || roleSteps.citizen;
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header progress */}
        <div className="px-6 pt-5 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                Getting Started — {currentStep + 1} of {steps.length}
              </span>
            </div>
            <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Skip
            </button>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Step content */}
        <div className="px-6 py-8 text-center space-y-5">
          {/* Large illustration */}
          <div className="text-6xl mb-2">{step.illustration}</div>

          {/* Icon + badge */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {step.icon}
            </div>
            <Badge variant="outline" className="text-xs">{step.subtitle}</Badge>
          </div>

          {/* Title */}
          <h2 className="text-xl font-display font-bold text-foreground">
            {currentStep === 0 ? `${step.title}, ${userName || 'User'}!` : step.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            {step.description}
          </p>

          {/* Step action */}
          {step.actionLabel && step.actionHref && (
            <a
              href={step.actionHref}
              className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
              onClick={(e) => {
                e.preventDefault();
                onComplete();
                window.location.href = step.actionHref!;
              }}
            >
              {step.actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep(s => s - 1)}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep ? 'w-6 bg-primary' : i < currentStep ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <Button size="sm" onClick={onComplete} className="gap-1">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => setCurrentStep(s => s + 1)} className="gap-1">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
