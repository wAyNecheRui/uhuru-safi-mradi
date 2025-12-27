import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import CommunityValidation from '@/components/CommunityValidation';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const CitizenCommunityVoting = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Community Validation' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <CommunityValidation />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenCommunityVoting;