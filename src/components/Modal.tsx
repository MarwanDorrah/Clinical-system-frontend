import React, { ReactNode, useEffect, useRef, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
  disableBackdropClose?: boolean;
  disableEscapeClose?: boolean;
  zIndex?: number;
}

class ModalStackManager {
  private static instance: ModalStackManager;
  private stack: string[] = [];
  private originalOverflow: string = '';
  private originalPaddingRight: string = '';

  static getInstance(): ModalStackManager {
    if (!ModalStackManager.instance) {
      ModalStackManager.instance = new ModalStackManager();
    }
    return ModalStackManager.instance;
  }

  push(id: string): number {
    if (this.stack.length === 0) {
      
      this.originalOverflow = document.body.style.overflow;
      this.originalPaddingRight = document.body.style.paddingRight;
      
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.classList.add('modal-open');
    }
    
    this.stack.push(id);
    return 50 + (this.stack.length - 1) * 10; 
  }

  pop(id: string): void {
    const index = this.stack.indexOf(id);
    if (index > -1) {
      this.stack.splice(index, 1);
    }

    if (this.stack.length === 0) {
      
      document.body.style.overflow = this.originalOverflow;
      document.body.style.paddingRight = this.originalPaddingRight;
      document.body.classList.remove('modal-open');
    }
  }

  getZIndex(id: string): number {
    const index = this.stack.indexOf(id);
    return index > -1 ? 50 + index * 10 : 50;
  }
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  footer,
  disableBackdropClose = false,
  disableEscapeClose = false,
  zIndex
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const modalIdRef = useRef<string>(`modal-${Math.random().toString(36).substr(2, 9)}`);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const computedZIndexRef = useRef<number>(zIndex || 50);

  useEffect(() => {
    if (isOpen) {
      const stackManager = ModalStackManager.getInstance();
      const assignedZIndex = stackManager.push(modalIdRef.current);
      computedZIndexRef.current = zIndex || assignedZIndex;

      previousActiveElementRef.current = document.activeElement as HTMLElement;

      return () => {
        stackManager.pop(modalIdRef.current);

        if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
          
          setTimeout(() => {
            previousActiveElementRef.current?.focus();
          }, 0);
        }
      };
    }
  }, [isOpen, zIndex]);

  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && !disableEscapeClose) {
      
      const stackManager = ModalStackManager.getInstance();
      const topModalIndex = stackManager['stack'].length - 1;
      const thisModalIndex = stackManager['stack'].indexOf(modalIdRef.current);
      
      if (thisModalIndex === topModalIndex) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    }
  }, [disableEscapeClose, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleEscape, true); 
    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [isOpen, handleEscape]);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const focusTimeout = setTimeout(() => {
      firstElement.focus();
    }, 100);

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener('keydown', handleTab);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm sm:max-w-md',
    md: 'max-w-md sm:max-w-2xl',
    lg: 'max-w-lg md:max-w-4xl',
    xl: 'max-w-xl md:max-w-6xl',
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    
    if (e.target === e.currentTarget && !disableBackdropClose) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center px-4 py-6 bg-black/50 backdrop-blur-sm"
      style={{ zIndex: computedZIndexRef.current }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`modal-title-${modalIdRef.current}`}
    >
      {}
      <div
        ref={modalRef}
        className={`relative bg-white rounded-xl shadow-2xl w-full ${sizeStyles[size]} flex flex-col`}
        style={{
          maxHeight: 'calc(100vh - 4rem)', 
          height: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-start gap-4 flex-shrink-0 bg-white rounded-t-xl">
          <h3 
            id={`modal-title-${modalIdRef.current}`}
            className="text-lg sm:text-xl font-bold text-gray-900 leading-tight"
            style={{
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              hyphens: 'auto'
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-full p-2 flex-shrink-0"
            aria-label="Close modal"
            type="button"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {}
        <div 
          className="px-4 sm:px-6 py-4 overflow-y-auto flex-1"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {children}
        </div>

        {}
        {footer && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
