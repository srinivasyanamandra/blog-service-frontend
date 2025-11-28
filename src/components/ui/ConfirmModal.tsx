import React from 'react';
import { Button } from './button';
import { SunflowerIcon } from '../SunflowerIcon';

export interface ConfirmModalProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
  praiseMessage?: string | null;
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = 'Please confirm',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  praiseMessage,
  children,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full" role="dialog" aria-modal="true">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <SunflowerIcon className="w-20 h-20 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
          {description && <p className="text-gray-600 mb-4">{description}</p>}

          {praiseMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded text-green-700">
              {praiseMessage}
            </div>
          )}

          {children}

          <div className="flex gap-3 justify-center mt-6">
            <Button
              onClick={async () => await onConfirm()}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
              size="sm"
              disabled={loading}
              aria-label={confirmLabel}
            >
              {loading ? (
                <>
                  <SunflowerIcon className="w-4 h-4 animate-spin" /> {confirmLabel}
                </>
              ) : (
                confirmLabel
              )}
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm" aria-label={cancelLabel}>
              {cancelLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
