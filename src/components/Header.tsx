
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';

interface HeaderProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  selectedCounty: string;
  onCountyChange: (county: string) => void;
  getText: (en: string, sw: string) => string;
}

const Header = ({ currentLanguage, onLanguageChange, selectedCounty, onCountyChange, getText }: HeaderProps) => {
  return (
    <header className="bg-white shadow-lg border-b-4 border-green-600">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getText('Uwazi Kenya', 'Uwazi Kenya')}
              </h1>
              <p className="text-sm text-gray-600">
                {getText('Government Transparency Platform', 'Jukwaa la Uwazi wa Serikali')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSelector 
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
            <select 
              value={selectedCounty} 
              onChange={(e) => onCountyChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="Nairobi">{getText('Nairobi County', 'Kaunti ya Nairobi')}</option>
              <option value="Mombasa">{getText('Mombasa County', 'Kaunti ya Mombasa')}</option>
              <option value="Kisumu">{getText('Kisumu County', 'Kaunti ya Kisumu')}</option>
              <option value="Nakuru">{getText('Nakuru County', 'Kaunti ya Nakuru')}</option>
            </select>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {getText('Live Data', 'Data ya Moja kwa Moja')}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
