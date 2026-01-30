import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import RealTimeBidTracking from '@/components/contractor/RealTimeBidTracking';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const ContractorBidTracking = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contractor', href: '/contractor' },
    { label: 'Bid Tracking' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <RealTimeBidTracking />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ContractorBidTracking;