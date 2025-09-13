import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface ThemeToggleProps {
  variant?: 'default' | 'minimal' | 'compact';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'default' }) => {
  const { theme, setTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getNextTheme = () => {
    switch (theme) {
      case 'light':
        return 'dark';
      case 'dark':
        return 'system';
      case 'system':
        return 'light';
      default:
        return 'dark';
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Light';
    }
  };

  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme(getNextTheme())}
        className="h-8 w-8 p-0"
        title={`Switch to ${getNextTheme()} mode`}
      >
        {getIcon()}
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme(getNextTheme())}
        className="h-8 px-2"
        title={`Switch to ${getNextTheme()} mode`}
      >
        {getIcon()}
        <span className="ml-1 text-xs">{getLabel()}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => setTheme(getNextTheme())}
      className="flex items-center gap-2"
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </Button>
  );
};
