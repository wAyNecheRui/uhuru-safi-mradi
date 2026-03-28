import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRIES, getCountryByCode } from '@/constants/countries';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  disabled?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, countryCode, onCountryCodeChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = useMemo(() => getCountryByCode(countryCode) || COUNTRIES[0], [countryCode]);

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase();
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.phoneCode.includes(q));
  }, [search]);

  return (
    <div className="flex gap-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            type="button"
            disabled={disabled}
            className="rounded-r-none border-r-0 px-2.5 h-10 min-w-[90px] justify-between gap-1 font-normal"
          >
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="text-xs text-muted-foreground">{selected.phoneCode}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0" align="start">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
                autoFocus
              />
            </div>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="p-1">
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent/50 ${
                    countryCode === c.code ? 'bg-primary/10 text-primary' : ''
                  }`}
                  onClick={() => { onCountryCodeChange(c.code); setOpen(false); setSearch(''); }}
                >
                  <span>{c.flag}</span>
                  <span className="truncate flex-1 text-left">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.phoneCode}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        placeholder="Phone number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-l-none h-10"
      />
    </div>
  );
};

export default PhoneInput;
