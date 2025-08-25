import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
  iconColor?: string;
  textColor?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message,
  fullScreen = false,
  iconColor,
  textColor
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
          <Loader2 className={`${sizeClasses[size]} animate-spin ${iconColor || 'text-primary'}`} />
          {message && <p className={`${textColor || 'text-muted-foreground'}`}>{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4" role="status" aria-live="polite">
      <Loader2 className={`${sizeClasses[size]} animate-spin ${iconColor || 'text-primary'}`} />
      {message && <span className={`ml-2 ${textColor || 'text-muted-foreground'}`}>{message}</span>}
    </div>
  );
};