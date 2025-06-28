
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal = ({ isOpen, onClose }: ContactModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    userType: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    // Here you would typically send the data to your backend
    alert('Thank you for your message! We will get back to you soon.');
    onClose();
    setFormData({ name: '', email: '', subject: '', message: '', userType: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-2xl">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <span>Contact Us</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-8 mt-6">
          {/* Contact Information */}
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Get in Touch</h3>
              <p className="text-slate-700 mb-6">
                We're here to help you understand how Uhuru Safi can transform government project 
                delivery in your community. Reach out to us with any questions or feedback.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Email</div>
                    <div className="text-slate-600">info@uhurusafi.org</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Phone</div>
                    <div className="text-slate-600">+254 700 123 456</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Address</div>
                    <div className="text-slate-600">Nairobi, Kenya</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Hours */}
            <div className="bg-emerald-50 rounded-lg p-6">
              <h4 className="font-semibold text-slate-900 mb-3">Support Hours</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Monday - Friday</span>
                  <span className="text-slate-900">8:00 AM - 6:00 PM EAT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Saturday</span>
                  <span className="text-slate-900">9:00 AM - 1:00 PM EAT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sunday</span>
                  <span className="text-slate-900">Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
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
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
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
                />
              </div>

              <div>
                <label htmlFor="userType" className="block text-sm font-medium text-slate-700 mb-1">
                  I am a...
                </label>
                <select
                  id="userType"
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select your role</option>
                  <option value="citizen">Citizen</option>
                  <option value="contractor">Contractor</option>
                  <option value="government">Government Official</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
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
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                  Message *
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us how we can help you..."
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;
