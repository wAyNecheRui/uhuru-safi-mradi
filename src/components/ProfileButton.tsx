import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import UserProfileModal from '@/components/UserProfileModal';
import { useAuth } from '@/contexts/AuthContext';

const ProfileButton = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsProfileOpen(true)}
        className="flex items-center gap-2"
      >
        <User className="h-4 w-4" />
        Profile
      </Button>

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
};

export default ProfileButton;