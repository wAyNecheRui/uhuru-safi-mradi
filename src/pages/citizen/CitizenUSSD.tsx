import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import USSDIntegration from '@/components/USSDIntegration';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const CitizenUSSD = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'USSD Services' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <USSDIntegration />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenUSSD;