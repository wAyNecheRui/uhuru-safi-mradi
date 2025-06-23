
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface AppFooterProps {
  getText: (en: string, sw: string) => string;
}

const AppFooter = ({ getText }: AppFooterProps) => {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-gray-400">
            {getText(
              'Built for transparency in Kenyan governance • Powered by citizen participation',
              'Imejengwa kwa uwazi katika utawala wa Kenya • Inaendeshwa na ushiriki wa wananchi'
            )}
          </p>
          <div className="flex justify-center space-x-6 mt-4 flex-wrap gap-2">
            <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600">
              {getText('M-Pesa Integration Ready', 'M-Pesa Tayari Kuunganishwa')}
            </Badge>
            <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600">
              {getText('Blockchain Audit Trail', 'Ukaguzi wa Blockchain')}
            </Badge>
            <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600">
              {getText('SMS/USSD Support', 'Msaada wa SMS/USSD')}
            </Badge>
            <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600">
              {getText('Offline Capable', 'Inaweza Kutumika Bila Mtandao')}
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
