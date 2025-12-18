'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, X } from 'lucide-react';
import Button from './Button';

export default function TokenExpirationWarning() {
  const { isAuthenticated, tokenExpiresIn, isTokenExpiringSoon, refreshAuthStatus } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !isTokenExpiringSoon) {
      setIsDismissed(false);
      return;
    }

    const updateTimer = () => {
      const minutes = Math.floor(tokenExpiresIn / 60000);
      const seconds = Math.floor((tokenExpiresIn % 60000) / 1000);
      
      if (minutes > 0) {
        setTimeRemaining(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
      } else if (seconds > 0) {
        setTimeRemaining(`${seconds} second${seconds !== 1 ? 's' : ''}`);
      } else {
        setTimeRemaining('less than a second');
      }
    };

    updateTimer();
    const interval = setInterval(() => {
      updateTimer();
      refreshAuthStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, tokenExpiresIn, isTokenExpiringSoon, refreshAuthStatus]);

  if (!isAuthenticated || !isTokenExpiringSoon || isDismissed) {
    return null;
  }

  return (
    <div className='fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white shadow-lg'>
      <div className='max-w-7xl mx-auto px-4 py-3'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3 flex-1'>
            <Clock className='w-5 h-5 animate-pulse' />
            <div>
              <p className='font-semibold'>Session Expiring Soon</p>
              <p className='text-sm text-yellow-100'>
                Your session will expire in {timeRemaining}. Save your work to avoid losing changes.
              </p>
            </div>
          </div>
          
          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                
                window.location.reload();
              }}
              className='bg-white text-yellow-700 hover:bg-yellow-50 border-white'
            >
              Refresh Session
            </Button>
            <button
              onClick={() => setIsDismissed(true)}
              className='p-1 hover:bg-yellow-600 rounded'
              aria-label='Dismiss warning'
            >
              <X className='w-5 h-5' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
