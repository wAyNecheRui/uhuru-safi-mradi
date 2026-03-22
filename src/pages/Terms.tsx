import React from 'react';
import Header from '@/components/Header';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const Terms = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Terms of Service' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <FileText className="h-8 w-8 mr-3 text-green-600" />
              Terms of Service
            </h1>
            <p className="text-gray-600">Last updated: March 2026</p>
          </div>

          <div className="space-y-6">
            {[
              { title: '1. Acceptance of Terms', content: 'By accessing and using the Uhuru Safi Government Transparency Platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.' },
              { title: '2. User Accounts', content: 'You must register for an account to use most platform features. You are responsible for maintaining the confidentiality of your login credentials. All information provided must be accurate and truthful. Providing false information may result in account suspension.' },
              { title: '3. Reporting Obligations', content: 'Citizens must submit reports in good faith based on verified observations. Submitting knowingly false or misleading reports is prohibited and may result in account suspension and legal action under Kenyan law.' },
              { title: '4. Community Voting', content: 'Community votes must be cast honestly based on genuine knowledge of the reported issue. Vote manipulation, coordinated fake voting, or any form of electoral fraud on the platform is strictly prohibited.' },
              { title: '5. Contractor Responsibilities', content: 'Contractors must provide accurate company information, valid certifications, and truthful bid proposals. Any misrepresentation of qualifications, experience, or capabilities will result in immediate disqualification and potential legal action.' },
              { title: '6. Government Official Conduct', content: 'Government officials must act in accordance with the Public Officer Ethics Act (2003) and the Anti-Corruption and Economic Crimes Act (2003). All approvals, evaluations, and decisions made on the platform are recorded and auditable.' },
              { title: '7. Data Protection', content: 'Your personal data is processed in accordance with the Kenya Data Protection Act (2019). Sensitive information including national IDs, KRA PINs, and financial data is encrypted at rest. You may request data export or deletion through the Settings page.' },
              { title: '8. Intellectual Property', content: 'All platform content, design, and functionality are the property of the Government of Kenya. User-submitted content (reports, photos, reviews) remains the property of the user but is licensed to the platform for public transparency purposes.' },
              { title: '9. Limitation of Liability', content: 'The platform is provided "as is" without warranties. While we strive for accuracy, we are not liable for decisions made based on platform data. Users should verify critical information through official government channels.' },
              { title: '10. Governing Law', content: 'These terms are governed by the laws of the Republic of Kenya. Any disputes shall be resolved through the Kenyan judicial system.' },
            ].map((section, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{section.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default Terms;
