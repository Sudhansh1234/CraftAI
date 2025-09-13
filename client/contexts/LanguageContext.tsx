import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Language {
  code: string;
  name: string;
  native: string;
  script: string;
}

export const languages: Language[] = [
  { code: 'en', name: 'English', native: 'English', script: 'Latin' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', script: 'Devanagari' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', script: 'Bengali' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', script: 'Telugu' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', script: 'Devanagari' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', script: 'Tamil' },
  { code: 'ur', name: 'Urdu', native: 'اردو', script: 'Arabic' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', script: 'Gujarati' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', script: 'Malayalam' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', script: 'Odia' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', script: 'Assamese' }
];

interface LanguageContextType {
  selectedLanguage: string | null;
  setSelectedLanguage: (language: string | null) => void;
  getCurrentLanguage: () => Language | null;
  getLanguageName: (code: string) => string;
  getLanguageNative: (code: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [selectedLanguage, setSelectedLanguageState] = useState<string | null>(null);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      setSelectedLanguageState(savedLanguage);
    }
  }, []);

  // Save language to localStorage when it changes
  const setSelectedLanguage = (language: string | null) => {
    setSelectedLanguageState(language);
    if (language) {
      localStorage.setItem('selectedLanguage', language);
    } else {
      localStorage.removeItem('selectedLanguage');
    }
  };

  const getCurrentLanguage = (): Language | null => {
    if (!selectedLanguage) return null;
    return languages.find(lang => lang.code === selectedLanguage) || null;
  };

  const getLanguageName = (code: string): string => {
    const language = languages.find(lang => lang.code === code);
    return language ? language.name : 'English';
  };

  const getLanguageNative = (code: string): string => {
    const language = languages.find(lang => lang.code === code);
    return language ? language.native : 'English';
  };

  const value: LanguageContextType = {
    selectedLanguage,
    setSelectedLanguage,
    getCurrentLanguage,
    getLanguageName,
    getLanguageNative
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
