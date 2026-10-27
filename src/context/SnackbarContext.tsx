import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type SnackbarType = 'regular' | 'success' | 'error';

interface SnackbarOptions {
  type?: SnackbarType;
  duration?: number;
  action?: { label: string; onClick: () => void };
  color?: string;
  centered?: boolean;
  onDismiss?: () => void;
}

interface SnackbarItem extends SnackbarOptions {
  id: number;
  message: string;
}

interface SnackbarContextValue {
  show: (message: string, options?: SnackbarOptions) => void;
  clear: () => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SnackbarItem[]>([]);
  const itemsRef = useRef<SnackbarItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(1);

  const update = (next: SnackbarItem[]) => {
    itemsRef.current = next;
    setItems(next);
  };

  const dismiss = useCallback((id: number, runOnDismiss: boolean) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    const item = itemsRef.current.find((i) => i.id === id);
    if (!item) return;
    update(itemsRef.current.filter((i) => i.id !== id));
    if (runOnDismiss) item.onDismiss?.();
  }, []);

  const clear = useCallback(() => {
    const current = itemsRef.current;
    current.forEach((item) => clearTimeout(timers.current.get(item.id)));
    timers.current.clear();
    update([]);
    current.forEach((item) => item.onDismiss?.());
  }, []);

  const show = useCallback(
    (message: string, options: SnackbarOptions = {}) => {
      clear();
      const id = nextId.current++;
      update([{ id, message, ...options }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id, true), options.duration ?? 4000),
      );
    },
    [clear, dismiss],
  );

  const value = useMemo(() => ({ show, clear }), [show, clear]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <div className="snackbar-host" role="status" aria-live="polite">
        {items.map((item) => (
          <div
            key={item.id}
            className={`snackbar ${item.type ?? 'regular'} ${item.centered ? 'centered' : ''}`}
            style={item.color ? { background: item.color, color: '#fff' } : undefined}
          >
            <span className="snackbar-message">{item.message}</span>
            {item.action && (
              <button
                className="snackbar-action"
                onClick={() => {
                  item.action!.onClick();
                  dismiss(item.id, false);
                }}
              >
                {item.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar deve ser usado dentro de SnackbarProvider');
  return ctx;
}
