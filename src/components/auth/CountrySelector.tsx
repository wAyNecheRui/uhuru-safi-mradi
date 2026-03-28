import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRIES, type Country } from '@/constants/countries';

interface CountrySelectorProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ value, onChange, disabled, placeholder = 'Select country' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = useMemo(() => COUNTRIES.find(c => c.code === value), [value]);

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase();
    // Kenya always stays at top if it matches
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between h-10 font-normal text-left border-input"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <span className="text-lg leading-none">{selected.flag}</span>
              <span>{selected.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 border-muted"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="h-[240px]">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No countries found</p>
          ) : (
            <div className="p-1">
              {filtered.map((country, i) => (
                <React.Fragment key={country.code}>
                  {/* Separator after Kenya */}
                  {i === 1 && filtered[0]?.code === 'KE' && (
                    <div className="my-1 border-t border-border" />
                  )}
                  <button
                    type="button"
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors hover:bg-accent/50 ${
                      value === country.code ? 'bg-primary/10 text-primary font-medium' : ''
                    }`}
                    onClick={() => {
                      onChange(country.code);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <span className="text-lg leading-none">{country.flag}</span>
                    <span className="truncate">{country.name}</span>
                    {country.code === 'KE' && i === 0 && (
                      <span className="ml-auto text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        Flagship
                      </span>
                    )}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default CountrySelector;
