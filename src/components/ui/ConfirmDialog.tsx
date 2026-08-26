import React from 'react';
import { LiquidModal } from './LiquidModal';
import { LiquidButton } from './LiquidButton';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false
}) => {
  return (
    <LiquidModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <LiquidButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </LiquidButton>
          <LiquidButton
            type="button"
            variant={isDestructive ? 'destructive' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </LiquidButton>
        </div>
      </div>
    </LiquidModal>
  );
};
