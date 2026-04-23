
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

interface MobileNavDrawerProps {
  items: NavItem[];
  onNavigate?: (path: string) => void;
}

export const MobileNavDrawer = ({ items, onNavigate }: MobileNavDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
    onNavigate?.(path);
  };

  const toggleGroup = (label: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedGroups(newExpanded);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-lg">Navigation</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.label}>
                  {item.children ? (
                    <div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12"
                        onClick={() => toggleGroup(item.label)}
                      >
                        {item.icon && <item.icon className="mr-3 h-5 w-5" />}
                        {item.label}
                      </Button>
                      {expandedGroups.has(item.label) && (
                        <div className="ml-6 mt-2 space-y-1">
                          {item.children.map((child) => (
                            <Button
                              key={child.path}
                              variant="ghost"
                              className={`w-full justify-start h-10 ${
                                isActive(child.path) ? 'bg-accent text-accent-foreground' : ''
                              }`}
                              onClick={() => handleNavigation(child.path)}
                            >
                              {child.icon && <child.icon className="mr-3 h-4 w-4" />}
                              {child.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className={`w-full justify-start h-12 ${
                        isActive(item.path) ? 'bg-accent text-accent-foreground' : ''
                      }`}
                      onClick={() => handleNavigation(item.path)}
                    >
                      {item.icon && <item.icon className="mr-3 h-5 w-5" />}
                      {item.label}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};
