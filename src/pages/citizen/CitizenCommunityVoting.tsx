
import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import CommunityVoting from '@/components/CommunityVoting';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const CitizenCommunityVoting = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Community Voting' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header 
        selectedCounty="Nairobi"
        onCountyChange={() => {}}
      />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <CommunityVoting />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CitizenCommunityVoting;
