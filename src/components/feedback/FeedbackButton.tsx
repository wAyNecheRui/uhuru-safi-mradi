import React, { useState } from 'react';
import { MessageSquarePlus, Send, X, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FeedbackType = 'bug' | 'feature' | 'help';

const FEEDBACK_OPTIONS: { type: FeedbackType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'bug', label: 'Bug Report', icon: Bug, color: 'text-destructive' },
  { type: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-500' },
  { type: 'help', label: 'Need Help', icon: HelpCircle, color: 'text-primary' },
];

const FeedbackButton: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please describe your issue or feedback.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: user?.name || 'Anonymous',
        email: user?.email || 'no-email@uhuru-safi.ke',
        subject: `[${feedbackType.toUpperCase()}] ${subject || 'In-app feedback'}`,
        message: `Type: ${feedbackType}\nPage: ${window.location.pathname}\nUser Agent: ${navigator.userAgent}\n\n${message}`,
        user_type: user?.user_type || null,
      });

      if (error) throw error;

      toast.success('Thank you! Your feedback has been submitted.');
      setIsOpen(false);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-4 z-40 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
        aria-label="Submit feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>

      {/* Feedback panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />
          <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80dvh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-base font-semibold text-foreground">Send Feedback</h3>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-3 gap-2">
                {FEEDBACK_OPTIONS.map(({ type, label, icon: Icon, color }) => (
                  <button
                    key={type}
                    onClick={() => setFeedbackType(type)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center',
                      feedbackType === type
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <Icon className={cn('w-5 h-5', color)} />
                    <span className="text-xs font-medium text-foreground">{label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Subject (optional)</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary..."
                  maxLength={120}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Description *</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What happened? What did you expect?"
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
              </div>

              <p className="text-xs text-muted-foreground">
                Your current page and browser info will be included to help us diagnose issues.
              </p>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting || !message.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton;
