
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Shield, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileNavigationProps {
  onNavigate?: (path: string) => void;
}

const MobileNavigation = ({ onNavigate }: MobileNavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
    onNavigate?.(path);
  };

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'How it Works', path: '/how-it-works' },
    { label: 'Contact', path: '/contact' },
    { label: 'Contractors', path: '/contractor-database' },
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
      <SheetContent side="right" className="w-[280px] sm:w-[350px] bg-slate-800 border-slate-700">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-white" />
            <span className="text-white font-bold text-xl">Uhuru Safi</span>
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
        
        <nav className="space-y-4">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className="w-full justify-start text-left text-white hover:bg-white/20 hover:text-amber-400"
              onClick={() => handleNavigation(item.path)}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;
