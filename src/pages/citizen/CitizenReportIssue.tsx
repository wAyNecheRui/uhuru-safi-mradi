
import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import EnhancedProblemReporting from '@/components/EnhancedProblemReporting';

const CitizenReportIssue = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Report Issue' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header 
        currentLanguage="en"
        onLanguageChange={() => {}}
        selectedCounty="Nairobi"
        onCountyChange={() => {}}
        getText={(en: string) => en}
      />
      
      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />
        <EnhancedProblemReporting />
      </main>
    </div>
  );
};

export default CitizenReportIssue;
