import React from 'react';
import WorkforcePlatform from '@/components/WorkforcePlatform';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';

const WorkforcePage = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Workforce Platform' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header 
        selectedCounty="Nairobi"
        onCountyChange={() => {}}
      />
      
      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />
        <WorkforcePlatform />
      </main>
    </div>
  );
};

export default WorkforcePage;