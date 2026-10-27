import type { ReactNode } from 'react';
import { ChartLineUp, FileXls, Flask } from '@phosphor-icons/react';
import { LogoMark } from './Brand';

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
        <img className="auth-aside-logo" src="/svgs/dark/full_logo.svg" alt="Enzitech" />
        <div>
          <h2>Atividades enzimáticas do solo, do experimento ao resultado.</h2>
          <p>Organize tratamentos e enzimas, registre as repetições e calcule os resultados direto do navegador.</p>
          <div className="auth-features">
            <div><Flask size={20} /> Experimentos com tratamentos, enzimas e repetições</div>
            <div><ChartLineUp size={20} /> Cálculo automático a partir das amostras</div>
            <div><FileXls size={20} /> Resultados exportáveis para Excel</div>
          </div>
        </div>
        <small>BCC Coworking · LEMA · UFAPE</small>
      </aside>
      <main className="auth-main">
        <div className="auth-form">
          <div className="auth-form-head">
            <span className="auth-mobile-logo">
              <LogoMark width={56} />
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
      </main>
    </div>
  );
}
