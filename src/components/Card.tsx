import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  headerAction?: ReactNode;
  noPadding?: boolean;
  hoverable?: boolean;
}

export default function Card({ 
  children, 
  title, 
  subtitle, 
  className = '', 
  headerAction,
  noPadding = false,
  hoverable = false
}: CardProps) {
  return (
    <div className={`
      bg-white rounded-xl shadow-sm border border-gray-100
      ${hoverable ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}
      ${className}
    `}>
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  );
}
