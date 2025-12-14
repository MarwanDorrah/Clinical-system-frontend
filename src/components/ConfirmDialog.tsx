'use client';

import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const variantConfig = {
    danger: {
      icon: 'bg-danger-100 text-danger-600',
      button: 'danger' as const,
    },
    warning: {
      icon: 'bg-warning-100 text-warning-600',
      button: 'primary' as const,
    },
    info: {
      icon: 'bg-info-100 text-info-600',
      button: 'primary' as const,
    },
  };

  const config = variantConfig[variant];

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="space-y-4">
        {/* Icon */}
        <div className="flex justify-center">
          <div className={`${config.icon} rounded-full p-3`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>

        {/* Message */}
        <p className="text-center text-gray-600">{message}</p>

        {/* Actions */}
        <div className="flex space-x-3 justify-center pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={config.button}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
