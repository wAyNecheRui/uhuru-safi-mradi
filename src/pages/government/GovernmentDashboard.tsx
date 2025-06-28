
import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import GovernmentDashboard from '@/components/GovernmentDashboard';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const GovernmentDashboardPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header 
        currentLanguage="en"
        onLanguageChange={() => {}}
        selectedCounty="Nairobi"
        onCountyChange={() => {}}
        getText={(en: string) => en}
      />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav />
          <GovernmentDashboard />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GovernmentDashboardPage;
