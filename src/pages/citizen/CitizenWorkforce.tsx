
import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import WorkforceIntegration from '@/components/WorkforceIntegration';

const CitizenWorkforce = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Workforce Registry' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header 
        currentLanguage="en"
        onLanguageChange={() => {}}
        selectedCounty="Nairobi"
        onCountyChange={() => {}}
        getText={(en: string) => en}
      />
      
      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />
        <WorkforceIntegration />
      </main>
    </div>
  );
};

export default CitizenWorkforce;
