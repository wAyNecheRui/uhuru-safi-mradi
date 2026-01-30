import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import KenyaOpenDataIntegration from '@/components/KenyaOpenDataIntegration';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const GovernmentBenchmarks = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Performance Benchmarks' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <KenyaOpenDataIntegration />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GovernmentBenchmarks;