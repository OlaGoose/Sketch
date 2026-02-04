'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  ReactNode,
} from 'react';
import { LoftDialog, LoftPromptDialog } from './ui/LoftDialog';

type AlertState = { type: 'alert'; message: string };
type ConfirmState = {
  type: 'confirm';
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};
type PromptField = { label: string; defaultValue?: string; placeholder?: string; multiline?: boolean };
type PromptState = {
  type: 'prompt';
  title: string;
  fields: PromptField[];
  confirmLabel?: string;
  cancelLabel?: string;
};

type DialogState = AlertState | ConfirmState | PromptState | null;

interface DialogContextValue {
  alert: (message: string) => Promise<void>;
  confirm: (
    message: string,
    options?: { confirmLabel?: string; cancelLabel?: string; danger?: boolean }
  ) => Promise<boolean>;
  prompt: (
    title: string,
    fields: PromptField[],
    options?: { confirmLabel?: string; cancelLabel?: string }
  ) => Promise<string[] | null>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return ctx;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(null);
  const resolveRef = useRef<((value: unknown) => void) | null>(null);

  const alert = useCallback((message: string) => {
    return new Promise<void>((resolve) => {
      resolveRef.current = () => resolve();
      setState({ type: 'alert', message });
    });
  }, []);

  const confirm = useCallback(
    (
      message: string,
      options?: { confirmLabel?: string; cancelLabel?: string; danger?: boolean }
    ) => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = (value: unknown) => resolve(value as boolean);
        setState({
          type: 'confirm',
          message,
          confirmLabel: options?.confirmLabel,
          cancelLabel: options?.cancelLabel,
          danger: options?.danger,
        });
      });
    },
    []
  );

  const prompt = useCallback(
    (
      title: string,
      fields: PromptField[],
      options?: { confirmLabel?: string; cancelLabel?: string }
    ) => {
      return new Promise<string[] | null>((resolve) => {
        resolveRef.current = (value: unknown) => resolve(value as string[] | null);
        setState({
          type: 'prompt',
          title,
          fields,
          confirmLabel: options?.confirmLabel,
          cancelLabel: options?.cancelLabel,
        });
      });
    },
    []
  );

  const handleClose = useCallback(() => {
    if (state?.type === 'confirm') {
      resolveRef.current?.(false);
    } else if (state?.type === 'prompt') {
      resolveRef.current?.(null);
    } else {
      resolveRef.current?.(undefined);
    }
    resolveRef.current = null;
    setState(null);
  }, [state?.type]);

  const handleConfirm = useCallback(() => {
    if (state?.type === 'confirm') {
      resolveRef.current?.(true);
    }
    resolveRef.current = null;
    setState(null);
  }, [state?.type]);

  const handlePromptConfirm = useCallback((values: string[]) => {
    resolveRef.current?.(values);
    resolveRef.current = null;
    setState(null);
  }, []);

  const handlePromptCancel = useCallback(() => {
    resolveRef.current?.(null);
    resolveRef.current = null;
    setState(null);
  }, []);

  return (
    <DialogContext.Provider value={{ alert, confirm, prompt }}>
      {children}
      {state?.type === 'alert' && (
        <LoftDialog
          open
          onClose={handleClose}
          message={state.message}
          onConfirm={handleClose}
        />
      )}
      {state?.type === 'confirm' && (
        <LoftDialog
          open
          onClose={handleClose}
          message={state.message}
          variant={state.danger ? 'danger' : 'confirm'}
          confirmLabel={state.confirmLabel ?? 'CONFIRM'}
          cancelLabel={state.cancelLabel ?? 'CANCEL'}
          onConfirm={handleConfirm}
          onCancel={handleClose}
        />
      )}
      {state?.type === 'prompt' && (
        <LoftPromptDialog
          open
          onClose={handlePromptCancel}
          title={state.title}
          fields={state.fields}
          confirmLabel={state.confirmLabel ?? 'OK'}
          cancelLabel={state.cancelLabel ?? 'CANCEL'}
          onConfirm={handlePromptConfirm}
          onCancel={handlePromptCancel}
        />
      )}
    </DialogContext.Provider>
  );
}
