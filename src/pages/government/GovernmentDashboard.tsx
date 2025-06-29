
import React, { useState } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import GovernmentDashboard from '@/components/GovernmentDashboard';
import ResponsiveContainer from '@/components/ResponsiveContainer';

const GovernmentDashboardPage = () => {
  const [selectedCounty, setSelectedCounty] = useState('Nairobi');

  const handleCountyChange = (county: string) => {
    console.log('Government Dashboard - County changed to:', county);
    setSelectedCounty(county);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header 
        selectedCounty={selectedCounty}
        onCountyChange={handleCountyChange}
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
