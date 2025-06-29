
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Shield, X, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TouchGesture } from './mobile/TouchGestures';

interface MobileNavigationProps {
  onNavigate?: (path: string) => void;
}

const MobileNavigation = ({ onNavigate }: MobileNavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
    onNavigate?.(path);
  };

  const handleSwipeClose = () => {
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Report Issue', path: '/report' },
    { label: 'Track Reports', path: '/track' },
    { label: 'Contractors', path: '/contractor-database' },
    { label: 'Community Voting', path: '/voting' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Sign In', path: '/auth' },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white hover:bg-white/20"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[400px] bg-slate-800 border-slate-700 p-0">
        <TouchGesture onSwipeRight={handleSwipeClose} className="h-full">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-white font-bold text-xl">Uhuru Safi</span>
                  <p className="text-slate-300 text-sm">Transparency Platform</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="space-y-1 px-4">
                {menuItems.map((item) => (
                  <TouchGesture
                    key={item.path}
                    onSwipeRight={() => handleNavigation(item.path)}
                  >
                    <Button
                      variant="ghost"
                      className={`w-full justify-between text-left h-12 px-4 ${
                        isActive(item.path) 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <span className="font-medium">{item.label}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TouchGesture>
                ))}
              </div>
            </nav>

            <div className="p-4 border-t border-slate-700">
              <div className="text-center text-slate-400 text-sm">
                <p>Swipe right to navigate</p>
                <p className="mt-1">Swipe left to close</p>
              </div>
            </div>
          </div>
        </TouchGesture>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;
