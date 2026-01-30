
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send, MessageSquare, ArrowLeft } from 'lucide-react';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';

const Contact = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
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
    setFormData({ name: '', email: '', subject: '', message: '', userType: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <ResponsiveContainer>
          <div className="py-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
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
              <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Contact Us</h1>
            </div>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto px-4 leading-relaxed">
              We're here to help you understand how Uhuru Safi can transform government project 
              delivery in your community. Reach out to us with any questions or feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Information */}
            <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mx-4 lg:mx-0">
                <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6">Get in Touch</h2>
                  
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center space-x-4">
                      <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900 text-base sm:text-lg">Email</div>
                        <div className="text-slate-600 text-sm sm:text-base break-all">info@uhurusafi.org</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900 text-base sm:text-lg">Phone</div>
                        <div className="text-slate-600 text-sm sm:text-base">0728 277 587</div>
                        <div className="text-slate-600 text-sm sm:text-base">0798 561 854</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900 text-base sm:text-lg">Address</div>
                        <div className="text-slate-600 text-sm sm:text-base">Nairobi, Kenya</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mx-4 lg:mx-0 order-1 lg:order-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
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
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
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
                  <label htmlFor="userType" className="block text-sm font-medium text-slate-700 mb-2">
                    I am a...
                  </label>
                  <select
                    id="userType"
                    name="userType"
                    value={formData.userType}
                    onChange={handleInputChange}
                    className="w-full h-10 sm:h-12 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-white"
                  >
                    <option value="">Select your role</option>
                    <option value="citizen">Citizen</option>
                    <option value="contractor">Contractor</option>
                    <option value="government">Government Official</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
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
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
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
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
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
