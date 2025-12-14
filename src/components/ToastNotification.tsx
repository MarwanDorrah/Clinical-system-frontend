'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastNotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  position?: 'top-right' | 'top-center' | 'bottom-right';
  onClose: () => void;
}

export default function ToastNotification({
  type,
  message,
  duration = 5000,
  position = 'top-right',
  onClose,
}: ToastNotificationProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };

  const typeConfig = {
    success: {
      bg: 'bg-success-50 border-success-500',
      text: 'text-success-700',
      icon: <CheckCircle className="w-5 h-5 text-success-500" />,
    },
    error: {
      bg: 'bg-danger-50 border-danger-500',
      text: 'text-danger-700',
      icon: <XCircle className="w-5 h-5 text-danger-500" />,
    },
    warning: {
      bg: 'bg-warning-50 border-warning-500',
      text: 'text-warning-700',
      icon: <AlertTriangle className="w-5 h-5 text-warning-500" />,
    },
    info: {
      bg: 'bg-info-50 border-info-500',
      text: 'text-info-700',
      icon: <Info className="w-5 h-5 text-info-500" />,
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 animate-slide-in`}
      role="alert"
    >
      <div
        className={`${config.bg} ${config.text} border-l-4 rounded-lg shadow-lg p-4 flex items-start space-x-3 min-w-[320px] max-w-md`}
      >
        <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
