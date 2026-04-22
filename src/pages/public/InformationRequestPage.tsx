import React, { useState } from 'react';
import { z } from 'zod';
import Header from '@/components/Header';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileSearch, Scale, Calendar, CheckCircle2, Loader2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const ATISchema = z.object({
  requester_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  requester_email: z.string().trim().email('Invalid email').max(320).optional().or(z.literal('')),
  requester_phone: z.string().trim().max(30).optional().or(z.literal('')),
  subject: z.string().trim().min(5, 'Subject too short').max(300),
  description: z
    .string()
    .trim()
    .min(20, 'Please provide more detail (min 20 characters)')
    .max(5000),
});

const InformationRequestPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: string; deadline: string } | null>(null);
  const [form, setForm] = useState({
    requester_name: '',
    requester_email: '',
    requester_phone: '',
    subject: '',
    description: '',
  });

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Transparency', href: '/transparency' },
    { label: 'Request Information' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = ATISchema.safeParse(form);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast({
        title: 'Please check your form',
        description: first ?? 'One or more fields are invalid.',
        variant: 'destructive',
      });
      return;
    }
    if (!parsed.data.requester_email && !parsed.data.requester_phone) {
      toast({
        title: 'Contact information required',
        description: 'Provide either an email or phone number so we can respond.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('information_requests')
        .insert({
          requester_id: user?.id ?? null,
          requester_name: parsed.data.requester_name,
          requester_email: parsed.data.requester_email || null,
          requester_phone: parsed.data.requester_phone || null,
          subject: parsed.data.subject,
          description: parsed.data.description,
          status: 'submitted',
        })
        .select('id, statutory_deadline')
        .single();

      if (error) throw error;

      setSuccess({
        id: data.id,
        deadline: new Date(data.statutory_deadline).toLocaleDateString('en-KE', {
          dateStyle: 'long',
        }),
      });
      setForm({
        requester_name: '',
        requester_email: '',
        requester_phone: '',
        subject: '',
        description: '',
      });
    } catch (err: any) {
      console.error('ATI request error:', err);
      toast({
        title: 'Submission failed',
        description: err.message ?? 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <ResponsiveContainer className="py-6 sm:py-8 max-w-4xl">
          <BreadcrumbNav items={breadcrumbItems} />

          <div className="mb-6 flex items-start gap-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <FileSearch className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                Request Public Information
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Exercise your right under the Access to Information Act, 2016
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-xs gap-1">
                  <Scale className="h-3 w-3" /> ATIA 2016
                </Badge>
                <Badge variant="outline" className="text-xs gap-1">
                  <Calendar className="h-3 w-3" /> 21-day response
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Free of charge
                </Badge>
              </div>
            </div>
          </div>

          {success ? (
            <Card className="border-primary/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  <CardTitle>Request submitted successfully</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  Your reference number:{' '}
                  <code className="px-2 py-1 rounded bg-muted text-xs font-mono">
                    {success.id.slice(0, 8).toUpperCase()}
                  </code>
                </p>
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertTitle>Statutory response deadline</AlertTitle>
                  <AlertDescription>
                    Government must respond by <strong>{success.deadline}</strong> as required
                    by Section 9(1) of the Access to Information Act, 2016. If no response is
                    received, you may escalate to the Commission on Administrative Justice
                    (Office of the Ombudsman).
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                  Save this reference number. We will contact you using the contact information
                  you provided.
                </p>
                <Button onClick={() => setSuccess(null)} variant="outline">
                  Submit another request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>How this works</AlertTitle>
                <AlertDescription className="text-sm space-y-1">
                  <p>
                    Under the <strong>Access to Information Act, 2016</strong>, every Kenyan
                    citizen has the right to request information held by public bodies. Common
                    requests include:
                  </p>
                  <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                    <li>Bid evaluation reports for specific projects</li>
                    <li>Payment records and milestone disbursements</li>
                    <li>Contractor performance and credentials</li>
                    <li>Procurement decisions and justifications</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Submit your information request</CardTitle>
                  <CardDescription>
                    All fields marked with * are required. Provide either email or phone for
                    response delivery.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="name">Your full name *</Label>
                        <Input
                          id="name"
                          value={form.requester_name}
                          onChange={(e) =>
                            setForm({ ...form, requester_name: e.target.value })
                          }
                          maxLength={150}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.requester_email}
                          onChange={(e) =>
                            setForm({ ...form, requester_email: e.target.value })
                          }
                          placeholder="you@example.com"
                          maxLength={320}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={form.requester_phone}
                          onChange={(e) =>
                            setForm({ ...form, requester_phone: e.target.value })
                          }
                          placeholder="07XX XXX XXX"
                          maxLength={30}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="e.g., Bid evaluation report for Kibera water project"
                        maxLength={300}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description of information requested *</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe in detail what information you need. Include project names, dates, contractor names, or report references where possible."
                        rows={6}
                        maxLength={5000}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {form.description.length}/5000 · minimum 20 characters
                      </p>
                    </div>

                    <Alert variant="default" className="border-primary/30">
                      <Scale className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        By submitting, you confirm this request is made in good faith. False
                        information may attract penalties under Section 28 of the ATIA, 2016.
                      </AlertDescription>
                    </Alert>

                    <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit request'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default InformationRequestPage;
