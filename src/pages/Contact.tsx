
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

const Contact = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    userType: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-contact', {
        body: {
          name: formData.name,
          email: formData.email,
          user_type: formData.userType || null,
          subject: formData.subject,
          message: formData.message,
        },
      });
      if (error) throw error;
      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '', userType: '' });
    } catch (err) {
      console.error('Contact form error:', err);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-background to-muted">
      <SEO
        title="Contact Uhuru Safi — Get in Touch"
        description="Contact the Uhuru Safi team for support, partnerships, or to report issues with Kenya's public infrastructure transparency platform."
        canonicalPath="/contact"
      />
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-50">
        <ResponsiveContainer>
          <div className="py-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
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
            <div className="flex items-center justify-center space-x-3 mb-4 sm:mb-6">
              <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Contact Us</h1>
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed">
              We're here to help you understand how Uhuru Safi can transform government project 
              delivery in your community. Reach out to us with any questions or feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Information */}
            <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
              <div className="bg-card rounded-xl shadow-sm p-6 sm:p-8 mx-4 lg:mx-0">
                <div className="bg-primary/5 rounded-lg p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-6">Get in Touch</h2>
                  
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center space-x-4">
                      <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-foreground text-base sm:text-lg">Email</div>
                        <div className="text-muted-foreground text-sm sm:text-base break-all">info@uhurusafi.org</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-foreground text-base sm:text-lg">Phone</div>
                        <div className="text-muted-foreground text-sm sm:text-base">0728 277 587</div>
                        <div className="text-muted-foreground text-sm sm:text-base">0798 561 854</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-foreground text-base sm:text-lg">Address</div>
                        <div className="text-muted-foreground text-sm sm:text-base">Nairobi, Kenya</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card rounded-xl shadow-sm p-6 sm:p-8 mx-4 lg:mx-0 order-1 lg:order-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label htmlFor="userType" className="block text-sm font-medium text-foreground mb-2">
                    I am a...
                  </label>
                  <select
                    id="userType"
                    name="userType"
                    value={formData.userType}
                    onChange={handleInputChange}
                    className="w-full h-10 sm:h-12 px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring text-sm sm:text-base bg-background"
                  >
                    <option value="">Select your role</option>
                    <option value="citizen">Citizen</option>
                    <option value="contractor">Contractor</option>
                    <option value="government">Government Official</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="What is this regarding?"
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us how we can help you..."
                    rows={isMobile ? 4 : 5}
                    className="text-sm sm:text-base resize-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  size={isMobile ? "default" : "lg"} 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </div>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default Contact;
