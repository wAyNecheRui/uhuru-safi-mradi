import React from 'react';
import Header from '@/components/Header';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const Privacy = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Privacy Policy' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Shield className="h-8 w-8 mr-3 text-green-600" />
              Privacy Policy
            </h1>
            <p className="text-gray-600">Last updated: March 2026 · Compliant with the Kenya Data Protection Act (2019)</p>
          </div>

          <div className="space-y-6">
            {[
              { title: '1. Information We Collect', content: 'We collect information you provide during registration (name, email, phone number, national ID, KRA PIN), location data when submitting reports, photos and media uploaded as evidence, and usage analytics to improve the platform.' },
              { title: '2. How We Use Your Information', content: 'Your information is used to verify your identity, process problem reports, facilitate community voting, manage contractor bids and project milestones, enable M-Pesa payments, and provide location-based services for verification proximity checks.' },
              { title: '3. Data Encryption & Security', content: 'Sensitive personal data (national IDs, KRA PINs, phone numbers, bank accounts) is encrypted using AES encryption before storage. All data transmission uses TLS/HTTPS. Access to decrypted data is restricted to authorized personnel only.' },
              { title: '4. Data Sharing', content: 'We do not sell your personal data. Information may be shared with: government agencies for official project oversight, the Ethics and Anti-Corruption Commission (EACC) for corruption investigations, and law enforcement when required by Kenyan law.' },
              { title: '5. Location Data', content: 'GPS coordinates are collected when you submit reports, vote on community issues, or verify project milestones. This ensures geographic authenticity and prevents fraud. You can disable location services, but some features may be limited.' },
              { title: '6. Your Rights', content: 'Under the Kenya Data Protection Act, you have the right to: access your personal data, request correction of inaccurate data, request deletion of your data (subject to legal retention requirements), object to processing of your data, and data portability.' },
              { title: '7. Data Retention', content: 'Account data is retained for the duration of your account. Project records, audit trails, and financial transactions are retained for 7 years as required by Kenyan financial regulations. You may request account deletion through the Settings page.' },
              { title: '8. Cookies & Analytics', content: 'We use essential cookies for authentication and session management. Analytics data is collected anonymously to improve platform performance. No third-party advertising cookies are used.' },
              { title: '9. Children\'s Privacy', content: 'The platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children.' },
              { title: '10. Contact', content: 'For privacy-related inquiries, contact our Data Protection Officer at privacy@infrastructure.go.ke or call our toll-free support line at 0800 123 456.' },
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

export default Privacy;
