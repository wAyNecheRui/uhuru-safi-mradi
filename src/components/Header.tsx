import React from 'react';
import { Shield } from 'lucide-react';
import ProfileButton from '@/components/ProfileButton';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';

interface HeaderProps {
  showCountySelector?: boolean;
  selectedCounty?: string;
  onCountyChange?: (county: string) => void;
}

const counties = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu',
  'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa',
  'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

const Header = ({ showCountySelector = false, selectedCounty = 'Nairobi', onCountyChange }: HeaderProps) => {
  const { isAuthenticated } = useAuth();
  
  const handleCountyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onCountyChange?.(event.target.value);
  };

  return (
    <header className="bg-white shadow-lg border-b-4 border-gradient-to-r from-slate-600 to-blue-600" style={{borderImage: 'linear-gradient(to right, #475569, #2563eb) 1'}}>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
                Uhuru Safi
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 truncate">
                Government Transparency Platform
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAuthenticated && (
              <>
                <NotificationBell />
                <ProfileButton />
              </>
            )}
            
            {showCountySelector && (
              <div className="flex-shrink-0">
                <select 
                  value={selectedCounty} 
                  onChange={handleCountyChange}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-0 max-w-[140px] sm:max-w-none"
                >
                  {counties.map((county) => (
                    <option key={county} value={county}>
                      {county} County
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
