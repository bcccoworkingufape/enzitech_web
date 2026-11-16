import type { ReactNode } from 'react';
import { ChartLineUp, FileXls, Flask } from '@phosphor-icons/react';
import { AnimatedLogo } from './AnimatedLogo';

export function AuthLayout({
  title,
  description,
  steps,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  steps?: [number, number];
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div className="auth-rings" aria-hidden="true" />
        <div className="auth-brand">
          <AnimatedLogo className="auth-logo" />
          <p className="auth-tagline">Atividades enzimáticas do solo, do experimento ao resultado.</p>
        </div>
        <div className="auth-aside-foot">
          <ul className="auth-features">
            <li>
              <Flask size={18} /> Tratamentos, enzimas e repetições
            </li>
            <li>
              <ChartLineUp size={18} /> Cálculo automático das amostras
            </li>
            <li>
              <FileXls size={18} /> Resultados em Excel
            </li>
          </ul>
          <small>BCC Coworking · LEMA · UFAPE</small>
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-form">
          <div className="auth-form-head">
            <span className="auth-mobile-logo">
              <AnimatedLogo />
            </span>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
            {steps && (
              <div className="auth-steps" aria-label={`Etapa ${steps[0]} de ${steps[1]}`}>
                {Array.from({ length: steps[1] }, (_, i) => (
                  <span key={i} className={i < steps[0] ? 'on' : ''} />
                ))}
              </div>
            )}
          </div>
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
        <small className="auth-version">Enzitech v{__APP_VERSION__}</small>
      </main>
    </div>
  );
}
