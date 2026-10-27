import { useEffect, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react';

interface DialogProps {
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
  wide?: boolean;
  onSubmit?: () => void;
}

export function Dialog({ title, children, actions, onClose, wide, onSubmit }: DialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const body = (
    <>
      <div className="dialog-content">{children}</div>
      {actions && <div className="dialog-actions">{actions}</div>}
    </>
  );

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`dialog ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <div className="dialog-header">
          <h2 className="dialog-title">{title}</h2>
          <button type="button" className="icon-btn sm" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        {onSubmit ? (
          <form
            noValidate
            style={{ display: 'contents' }}
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            {body}
          </form>
        ) : (
          body
        )}
      </div>
    </div>
  );
}
