import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import EnhancedProblemReporting from '@/components/EnhancedProblemReporting';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const CitizenReportIssue = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Report Issue' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <EnhancedProblemReporting />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenReportIssue;