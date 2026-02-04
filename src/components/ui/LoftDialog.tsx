'use client';

import { LoftModal } from './LoftModal';

interface LoftDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  variant?: 'alert' | 'confirm' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function LoftDialog({
  open,
  onClose,
  title,
  message,
  variant = 'alert',
  confirmLabel = 'OK',
  cancelLabel = 'CANCEL',
  onConfirm,
  onCancel,
}: LoftDialogProps) {
  const isConfirm = variant === 'confirm' || variant === 'danger';
  const isDanger = variant === 'danger';

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <LoftModal open={open} onClose={isConfirm ? handleCancel : onClose}>
      <p className="text-loft-black mb-6 whitespace-pre-wrap">{message}</p>
      <div className="flex gap-3 justify-end">
        {isConfirm && (
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-loft-gray text-loft-black border-2 border-loft-black font-bold shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          className={
            isDanger
              ? 'px-4 py-2 bg-red-600 text-white border-2 border-loft-black font-bold shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all'
              : 'px-4 py-2 bg-loft-yellow text-loft-black border-2 border-loft-black font-bold shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all'
          }
        >
          {confirmLabel}
        </button>
      </div>
    </LoftModal>
  );
}

interface LoftPromptField {
  label: string;
  defaultValue?: string;
  placeholder?: string;
  multiline?: boolean;
}

interface LoftPromptDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: LoftPromptField[];
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (values: string[]) => void;
  onCancel?: () => void;
}

export function LoftPromptDialog({
  open,
  onClose,
  title,
  fields,
  confirmLabel = 'OK',
  cancelLabel = 'CANCEL',
  onConfirm,
  onCancel,
}: LoftPromptDialogProps) {
  return (
    <LoftModal open={open} onClose={onClose} maxWidth="max-w-lg">
      <h2 className="text-xl font-black uppercase tracking-wide text-loft-black mb-4">
        {title}
      </h2>
      <LoftPromptForm
        fields={fields}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        onConfirm={onConfirm}
        onCancel={() => {
          onCancel?.();
          onClose();
        }}
      />
    </LoftModal>
  );
}

function LoftPromptForm({
  fields,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  fields: LoftPromptField[];
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: (values: string[]) => void;
  onCancel: () => void;
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const values = fields.map((_, i) => {
      const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[name="prompt-field-${i}"]`
      );
      return el ? String(el.value) : '';
    });
    onConfirm(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field, i) => (
        <div key={i}>
          <label
            htmlFor={`prompt-field-${i}`}
            className="block text-sm font-bold text-loft-black mb-1 uppercase tracking-wide"
          >
            {field.label}
          </label>
          {field.multiline ? (
            <textarea
              id={`prompt-field-${i}`}
              name={`prompt-field-${i}`}
              defaultValue={field.defaultValue}
              placeholder={field.placeholder}
              rows={4}
              className="w-full border-2 border-loft-black px-3 py-2 font-sans text-loft-black focus:outline-none focus:ring-2 focus:ring-loft-yellow resize-none"
            />
          ) : (
            <input
              id={`prompt-field-${i}`}
              name={`prompt-field-${i}`}
              type="text"
              defaultValue={field.defaultValue}
              placeholder={field.placeholder}
              className="w-full border-2 border-loft-black px-3 py-2 font-sans text-loft-black focus:outline-none focus:ring-2 focus:ring-loft-yellow"
            />
          )}
        </div>
      ))}
      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-loft-gray text-loft-black border-2 border-loft-black font-bold shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-loft-yellow text-loft-black border-2 border-loft-black font-bold shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
        >
          {confirmLabel}
        </button>
      </div>
    </form>
  );
}
