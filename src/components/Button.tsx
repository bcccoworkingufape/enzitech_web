import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'outline' | 'text' | 'danger';
  size?: 'sm' | 'md';
  block?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'filled',
  size = 'md',
  block,
  loading,
  icon,
  children,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn-${variant}`, size === 'sm' && 'btn-sm', block && 'btn-block', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={classes} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span className={`spinner small ${variant === 'filled' || variant === 'danger' ? 'on-primary' : ''}`} aria-label="Carregando" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
