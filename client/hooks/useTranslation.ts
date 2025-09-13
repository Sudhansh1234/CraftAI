import { useLanguage } from '@/contexts/LanguageContext';
import { translations, Translations } from '@/lib/translations';

export const useTranslation = () => {
  const { selectedLanguage } = useLanguage();
  
  const t = (key: keyof Translations): string => {
    const language = selectedLanguage || 'en';
    const translation = translations[language] || translations.en;
    return translation[key] || translations.en[key] || key;
  };
  
  return { t };
};
