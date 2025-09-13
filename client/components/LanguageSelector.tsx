import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Languages, Globe } from 'lucide-react';
import { useLanguage, languages } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'minimal';
  showIcon?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'default', 
  showIcon = true,
  className = ''
}) => {
  const { selectedLanguage, setSelectedLanguage, getCurrentLanguage } = useLanguage();
  const { t } = useTranslation();

  const currentLanguage = getCurrentLanguage();

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Globe className="h-4 w-4 text-muted-foreground" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              {currentLanguage?.native || 'English'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {languages.map((language) => (
              <DropdownMenuItem
                key={language.code}
                onClick={() => setSelectedLanguage(language.code)}
                className="flex items-center justify-between"
              >
                <span className="font-medium">{language.native}</span>
                <span className="text-sm text-muted-foreground">{language.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <Languages className="h-4 w-4 text-muted-foreground" />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              {currentLanguage?.native || 'English'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {languages.map((language) => (
              <DropdownMenuItem
                key={language.code}
                onClick={() => setSelectedLanguage(language.code)}
                className="flex items-center justify-between"
              >
                <span className="font-medium">{language.native}</span>
                <span className="text-sm text-muted-foreground">{language.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <Languages className="h-4 w-4 text-muted-foreground" />}
      <span className="text-sm text-muted-foreground">{t('language')}:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {currentLanguage?.native || 'English'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => setSelectedLanguage(language.code)}
              className="flex items-center justify-between"
            >
              <span className="font-medium">{language.native}</span>
              <span className="text-sm text-muted-foreground">{language.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
