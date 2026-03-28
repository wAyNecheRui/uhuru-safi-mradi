import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';

interface RegistrationSuccessProps {
  role: 'citizen' | 'contractor' | 'government';
  userName: string;
  onContinue: () => void;
}

const RegistrationSuccess: React.FC<RegistrationSuccessProps> = ({ role, userName, onContinue }) => {
  const isPending = role !== 'citizen';

  return (
    <div className="text-center space-y-6 py-4">
      <div className="w-20 h-20 rounded-full bg-[hsl(var(--success))]/15 flex items-center justify-center mx-auto animate-fade-in-up">
        {isPending ? (
          <Clock className="h-10 w-10 text-primary" />
        ) : (
          <CheckCircle2 className="h-10 w-10 text-[hsl(var(--success))]" />
        )}
      </div>

      <div className="space-y-2">
        <h2 className="font-display font-bold text-foreground text-xl">
          {isPending ? 'Verification Pending' : 'You\'re All Set! 🎉'}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {role === 'citizen' && (
            <>Welcome, {userName}! Your account is ready. Start exploring projects and reporting issues in your community.</>
          )}
          {role === 'contractor' && (
            <>Thank you, {userName}! Your documents are under review. You'll get full bidding access within 24–48 hours. We'll notify you by email.</>
          )}
          {role === 'government' && (
            <>Thank you for helping bring transparency, {userName}! Your account is being verified so only authorised officials can approve milestones and payments.</>
          )}
        </p>
      </div>

      {/* Status badge */}
      {isPending && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 text-accent-foreground">
          <div className="w-2 h-2 rounded-full bg-accent status-pulse" />
          <span className="text-sm font-medium">Pending Verification</span>
        </div>
      )}

      <div className="space-y-3 pt-2">
        <Button
          onClick={onContinue}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          {isPending ? 'Browse Projects While You Wait' : 'Go to Dashboard'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Please check your email to verify your account.
        </p>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
