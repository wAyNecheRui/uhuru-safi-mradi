/**
 * LanguageSwitcher
 *
 * Compact dropdown for toggling between English and Kiswahili. The current
 * choice is persisted to localStorage by i18next-browser-languagedetector,
 * so the selection survives reloads. Render this anywhere — typically the
 * header, mobile drawer, or settings page.
 */
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function LanguageSwitcher({ className, variant = 'default' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();

  const current = (SUPPORTED_LANGUAGES as readonly string[]).includes(i18n.language)
    ? (i18n.language as SupportedLanguage)
    : 'en';

  const handleChange = (value: string) => {
    void i18n.changeLanguage(value);
  };

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger
        className={cn(
          variant === 'compact' ? 'h-8 w-[120px] text-xs' : 'w-[160px]',
          className,
        )}
        aria-label={t('language.label')}
      >
        <Globe className="h-4 w-4 mr-2 text-muted-foreground" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{t('language.english')}</SelectItem>
        <SelectItem value="sw">{t('language.swahili')}</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default LanguageSwitcher;
