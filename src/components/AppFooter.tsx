import React from 'react';
import { Badge } from '@/components/ui/badge';

interface AppFooterProps {
  getText: (en: string, sw: string) => string;
}

const AppFooter = ({ getText }: AppFooterProps) => {
  return (
    <footer className="bg-sidebar border-t border-border py-8 mt-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mx-auto">
            {getText(
              'Built for transparency in Kenyan governance • Powered by citizen participation',
              'Imejengwa kwa uwazi katika utawala wa Kenya • Inaendeshwa na ushiriki wa wananchi'
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              getText('M-Pesa Integration Ready', 'M-Pesa Tayari Kuunganishwa'),
              getText('Blockchain Audit Trail', 'Ukaguzi wa Blockchain'),
              getText('SMS/USSD Support', 'Msaada wa SMS/USSD'),
              getText('Offline Capable', 'Inaweza Kutumika Bila Mtandao'),
            ].map((label) => (
              <Badge 
                key={label}
                variant="outline" 
                className="text-[10px] font-normal"
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
