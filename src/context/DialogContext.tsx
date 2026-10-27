import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Dialog } from '@/components/Dialog';

interface ConfirmOptions {
  title: string;
  content: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

const DialogContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  );

  const close = (result: boolean) => {
    pending?.resolve(result);
    setPending(null);
  };

  return (
    <DialogContext.Provider value={confirm}>
      {children}
      {pending && (
        <Dialog
          title={pending.title}
          onClose={() => close(false)}
          actions={
            <>
              <button className="btn btn-text" onClick={() => close(false)} autoFocus>
                {pending.cancelLabel ?? 'Cancelar'}
              </button>
              <button className="btn btn-danger" onClick={() => close(true)}>
                {pending.confirmLabel ?? 'Excluir'}
              </button>
            </>
          }
        >
          {pending.content}
        </Dialog>
      )}
    </DialogContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useConfirm deve ser usado dentro de DialogProvider');
  return ctx;
}
