import type { ReactNode } from 'react';
import { IconLogo, ThemedSvg } from './Brand';

export function LoadingView({ message }: { message?: string }) {
  return (
    <div className="state-view">
      <IconLogo width={75} spinning />
      {message && <p className="term">{message}</p>}
    </div>
  );
}

export function ErrorView({ message, action }: { message?: string; action?: ReactNode }) {
  return (
    <div className="state-view">
      <ThemedSvg name="error" alt="" />
      {message && <p className="term">{message}</p>}
      {action}
    </div>
  );
}

export function NotFoundView({ title, message, action }: { title?: string; message?: string; action?: ReactNode }) {
  return (
    <div className="state-view">
      <ThemedSvg name="not_found" alt="" />
      {title && <h2 className="step-title">{title}</h2>}
      {message && <p className="term">{message}</p>}
      {action}
    </div>
  );
}
