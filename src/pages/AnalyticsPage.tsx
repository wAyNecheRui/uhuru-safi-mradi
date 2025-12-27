import React from 'react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';

const AnalyticsPage = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Analytics Dashboard' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNav items={breadcrumbItems} />
        <AnalyticsDashboard />
      </main>
    </div>
  );
};

export default AnalyticsPage;