
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Building, Shield, Bell, BookOpen, MessageCircle } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useNotifications } from '@/hooks/useNotifications';
import OnboardingModal from './OnboardingModal';
import NotificationCenter from '../notifications/NotificationCenter';

interface RoleBasedWelcomeProps {
  userType: 'citizen' | 'contractor' | 'government';
  userId: string;
}

const RoleBasedWelcome = ({ userType, userId }: RoleBasedWelcomeProps) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { onboarding, isLoading, completeStep } = useOnboarding(userType);
  const { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearNotifications } = useNotifications(userId);

  useEffect(() => {
    // Show onboarding modal for new users
    if (onboarding && !onboarding.isCompleted) {
      setShowOnboarding(true);
    }
  }, [onboarding, userType]);

  const getRoleInfo = (type: string) => {
    const info = {
      citizen: {
        icon: <Users className="h-6 w-6" />,
        title: 'Citizen Portal',
        description: 'Report issues, track progress, and participate in community decisions',
        keyFeatures: [
          'Report infrastructure problems',
          'Track your submissions',
          'Vote on community priorities',
          'Connect with local workforce'
        ]
      },
      contractor: {
        icon: <Building className="h-6 w-6" />,
        title: 'Contractor Hub',
        description: 'Bid on projects, manage contracts, and track payments',
        keyFeatures: [
          'Browse and bid on projects',
          'Manage active contracts',
          'Track milestone payments',
          'Complete verification process'
        ]
      },
      government: {
        icon: <Shield className="h-6 w-6" />,
        title: 'Government Dashboard',
        description: 'Manage projects, allocate resources, and oversee development',
        keyFeatures: [
          'Review and approve projects',
          'Manage budget allocation',
          'Monitor contractor performance',
          'Access community feedback'
        ]
      }
    };
    return info[type] || info.citizen;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const roleInfo = getRoleInfo(userType);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
          <CardTitle className="flex items-center space-x-3">
            {roleInfo.icon}
            <div>
              <h2 className="text-2xl font-bold">{roleInfo.title}</h2>
              <p className="text-gray-600 mt-1">{roleInfo.description}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Key Features
              </h3>
              <ul className="space-y-2">
                {roleInfo.keyFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="rounded-full">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  View All Notifications
                </Button>
                
                {onboarding && !onboarding.isCompleted && (
                  <Button 
                    className="w-full"
                    onClick={() => setShowOnboarding(true)}
                  >
                    Complete Setup ({onboarding.currentStep}/{onboarding.steps.length})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showNotifications && (
        <NotificationCenter
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClearAll={clearNotifications}
        />
      )}

      {onboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onboarding={onboarding}
          onCompleteStep={completeStep}
        />
      )}
    </div>
  );
};

export default RoleBasedWelcome;
