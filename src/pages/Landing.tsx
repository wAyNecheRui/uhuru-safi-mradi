
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Building, Gavel } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const userTypes = [
    {
      id: 'citizen',
      title: 'Citizen',
      description: 'Report issues, track projects, participate in community decisions',
      icon: Users,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      route: '/citizen'
    },
    {
      id: 'contractor',
      title: 'Contractor',
      description: 'Bid on projects, manage contracts, track payments',
      icon: Building,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      route: '/contractor'
    },
    {
      id: 'government',
      title: 'Government',
      description: 'Manage projects, review reports, allocate resources',
      icon: Gavel,
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      route: '/government'
    }
  ];

  const handleRoleSelect = (route: string) => {
    if (route === '/citizen') {
      navigate('/dashboard');
    } else {
      // For now, redirect contractor and government to main dashboard
      // In future, these would have their own specialized dashboards
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-green-600">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Uwazi Kenya</h1>
                <p className="text-lg text-gray-600 mt-1">
                  Government Transparency Platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Choose your role to start using Kenya's government transparency system.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {userTypes.map((userType) => {
            const IconComponent = userType.icon;
            return (
              <Card 
                key={userType.id} 
                className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-gray-200 hover:border-green-400"
                onClick={() => handleRoleSelect(userType.route)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-20 h-20 bg-gradient-to-br ${userType.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-all duration-300`}>
                    <IconComponent className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                    {userType.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <p className="text-gray-700 mb-6 font-medium">
                    {userType.description}
                  </p>
                  <Button 
                    className={`w-full bg-gradient-to-r ${userType.color} ${userType.hoverColor} text-white font-semibold py-3 rounded-lg transition-all duration-300 group-hover:shadow-md`}
                  >
                    Start Here
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Our Services
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              'M-Pesa Integration',
              'SMS/USSD Support',
              'Offline Access',
              'Real-time Updates'
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md">
                <h4 className="font-semibold text-gray-900">{feature}</h4>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            Built for transparency in Kenyan governance
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
