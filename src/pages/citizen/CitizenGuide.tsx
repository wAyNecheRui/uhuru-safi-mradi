import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  BookOpen, 
  AlertTriangle,
  CheckCircle,
  Users,
  Briefcase,
  Shield,
  FileText,
  Camera,
  MapPin,
  DollarSign,
  Phone,
  PlayCircle,
  Download,
  ExternalLink
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const CitizenGuide = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Citizen Guide' }
  ];

  const tutorials = [
    {
      id: 'reporting',
      title: 'Reporting Problems Effectively',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      steps: [
        'Take clear photos/videos of the problem from multiple angles',
        'Enable GPS on your phone for automatic location tagging',
        'Select the correct category (Roads, Water, Healthcare, etc.)',
        'Write a detailed description including size, severity, and impact',
        'Add estimated affected population for prioritization',
        'Submit and track your report through the portal'
      ]
    },
    {
      id: 'verifying',
      title: 'Verifying Projects Properly',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      steps: [
        'Visit the project site in person when possible',
        'Compare current state with milestone requirements',
        'Take dated photos as evidence of verification',
        'Use the QR code check-in at the project site',
        'Rate quality honestly on the 1-5 scale',
        'Report any issues or discrepancies immediately'
      ]
    },
    {
      id: 'jobs',
      title: 'Applying for Jobs',
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      steps: [
        'Register your skills in the Skills Registry',
        'Upload relevant certifications and experience documents',
        'Keep your profile updated with accurate information',
        'Check job listings regularly for opportunities in your area',
        'Apply with a clear message highlighting your qualifications',
        'Respond promptly to interview and selection communications'
      ]
    },
    {
      id: 'rights',
      title: 'Rights & Responsibilities',
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      points: [
        {
          title: 'Your Rights',
          items: [
            'Report infrastructure problems in your community',
            'Vote on community priorities',
            'Access transparency data on all projects',
            'Verify project milestones',
            'Apply for local employment opportunities',
            'Report corruption anonymously'
          ]
        },
        {
          title: 'Your Responsibilities',
          items: [
            'Report problems accurately and honestly',
            'Verify projects only after physical inspection',
            'Respect contractor work sites',
            'Participate in community voting',
            'Report any suspected corruption',
            'Keep your profile information updated'
          ]
        }
      ]
    }
  ];

  const localDataSections = [
    {
      title: 'County Development Plans',
      description: 'View approved development plans for your county',
      icon: FileText,
      items: [
        'Nairobi County - Annual Development Plan 2024',
        'Nairobi County - 5-Year Strategic Plan 2023-2028',
        'Infrastructure Priority Areas 2024'
      ]
    },
    {
      title: 'Budget Allocations',
      description: 'See how public funds are allocated in your constituency',
      icon: DollarSign,
      items: [
        'Roads & Transport: KES 2.5B (35%)',
        'Water & Sanitation: KES 1.8B (25%)',
        'Healthcare Infrastructure: KES 1.2B (17%)',
        'Education Facilities: KES 900M (13%)',
        'Other Infrastructure: KES 700M (10%)'
      ]
    },
    {
      title: 'Historical Project Performance',
      description: 'Review past project outcomes in your area',
      icon: CheckCircle,
      items: [
        '2023: 45 projects completed (87% on time)',
        '2023: KES 3.2B disbursed to contractors',
        '2023: Average citizen satisfaction: 4.2/5',
        '2022: 38 projects completed (79% on time)'
      ]
    }
  ];

  const faqs = [
    {
      question: 'How long does it take for my report to be reviewed?',
      answer: 'Reports typically go through community voting for 7-14 days. Once they reach 50+ votes, they are escalated to government review, which takes 5-10 business days. Urgent reports may be fast-tracked.'
    },
    {
      question: 'Can I report problems anonymously?',
      answer: 'You must be registered to submit reports, but corruption-related complaints can be submitted anonymously through the EACC integration. Your identity is protected under whistleblower laws.'
    },
    {
      question: 'How do I get paid for verification work?',
      answer: 'Verified community verifiers receive M-Pesa micropayments for each successful verification. Payments are typically processed within 48 hours after verification approval.'
    },
    {
      question: 'What happens if I report a fake problem?',
      answer: 'Submitting false reports may result in account suspension. Repeat offenders may be permanently banned and reported to relevant authorities. Always verify information before reporting.'
    },
    {
      question: 'How can I become a top verifier?',
      answer: 'Consistently verify projects accurately, maintain a high approval rate (>90%), participate in at least 10 verifications per month, and complete the verifier training program to earn "Top Verifier" status.'
    },
    {
      question: 'Can I track how my vote affected a project?',
      answer: 'Yes! Your voting history shows which projects you supported. You can see when projects reach voting thresholds, get approved, and track their progress through completion.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <BookOpen className="h-8 w-8 mr-3 text-green-600" />
              Citizen Guide & Resources
            </h1>
            <p className="text-gray-600">Everything you need to know about participating in community development.</p>
          </div>

          <Tabs defaultValue="tutorials" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg">
              <TabsTrigger value="tutorials">How-To Guides</TabsTrigger>
              <TabsTrigger value="data">Local Data Access</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="tutorials" className="space-y-6">
              {tutorials.map((tutorial) => {
                const IconComponent = tutorial.icon;
                return (
                  <Card key={tutorial.id} className="overflow-hidden">
                    <CardHeader className={`${tutorial.bgColor}`}>
                      <CardTitle className="flex items-center">
                        <IconComponent className={`h-6 w-6 mr-3 ${tutorial.color}`} />
                        {tutorial.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {'steps' in tutorial ? (
                        <div className="space-y-3">
                          {tutorial.steps.map((step, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full ${tutorial.bgColor} flex items-center justify-center flex-shrink-0`}>
                                <span className={`font-bold ${tutorial.color}`}>{index + 1}</span>
                              </div>
                              <p className="text-gray-700 pt-1">{step}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                          {tutorial.points?.map((point, index) => (
                            <div key={index} className="space-y-3">
                              <h4 className="font-semibold text-gray-900">{point.title}</h4>
                              <ul className="space-y-2">
                                {point.items.map((item, itemIndex) => (
                                  <li key={itemIndex} className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                                    <span className="text-gray-700">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-6 flex flex-wrap gap-3">
                        <Button variant="outline" size="sm">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Watch Tutorial
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Quick Tips Card */}
              <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-800">
                    <Camera className="h-5 w-5 mr-2" />
                    Pro Tips for Effective Reporting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-lg">
                      <Camera className="h-8 w-8 text-blue-600 mb-2" />
                      <h4 className="font-medium mb-1">Better Photos</h4>
                      <p className="text-sm text-gray-600">Take photos in good lighting, include surrounding context, and capture from multiple angles.</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg">
                      <MapPin className="h-8 w-8 text-green-600 mb-2" />
                      <h4 className="font-medium mb-1">Accurate Location</h4>
                      <p className="text-sm text-gray-600">Enable GPS before taking photos. Include nearby landmarks in your description.</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg">
                      <Users className="h-8 w-8 text-purple-600 mb-2" />
                      <h4 className="font-medium mb-1">Community Impact</h4>
                      <p className="text-sm text-gray-600">Estimate affected population and describe how the problem impacts daily life.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              {localDataSections.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <IconComponent className="h-5 w-5 mr-2 text-green-600" />
                        {section.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {section.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <span className="text-gray-700">{item}</span>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Contact Information */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-800">
                    <Phone className="h-5 w-5 mr-2" />
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-lg text-center">
                      <Phone className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium mb-1">Helpline</h4>
                      <p className="text-green-600 font-semibold">*483#</p>
                      <p className="text-sm text-gray-600">USSD Access</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg text-center">
                      <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium mb-1">SMS Support</h4>
                      <p className="text-blue-600 font-semibold">0800 123 456</p>
                      <p className="text-sm text-gray-600">Toll-free</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg text-center">
                      <Shield className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <h4 className="font-medium mb-1">EACC Hotline</h4>
                      <p className="text-red-600 font-semibold">0800 720 099</p>
                      <p className="text-sm text-gray-600">Anonymous</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faq" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">Still have questions?</h3>
                  <p className="text-purple-700 mb-4">Our support team is here to help you navigate the platform.</p>
                  <div className="flex justify-center gap-3">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      Contact Support
                    </Button>
                    <Button variant="outline" className="border-purple-300 text-purple-700">
                      Visit Help Center
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenGuide;
