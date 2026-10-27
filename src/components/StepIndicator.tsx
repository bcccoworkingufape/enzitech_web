import { Fragment } from 'react';
import { Check } from '@phosphor-icons/react';

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav className="hstepper" aria-label={`Etapa ${current} de ${steps.length}`}>
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'active' : 'todo';
        return (
          <Fragment key={label}>
            {i > 0 && <span className={`hstep-line ${n <= current ? 'done' : ''}`} />}
            <div className="hstep" data-state={state} aria-current={state === 'active' ? 'step' : undefined}>
              <span className="hstep-circle">{state === 'done' ? <Check size={14} weight="bold" /> : n}</span>
              <span>{label}</span>
            </div>
          </Fragment>
        );
      })}
    </nav>
  );
}
