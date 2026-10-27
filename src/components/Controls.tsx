import { useEffect, useRef, type ReactNode } from 'react';
import { CaretDown, CaretUp, CaretUpDown, Check } from '@phosphor-icons/react';
import { toPercent } from '@/lib/format';

export function PercentIndicator({
  value,
  radius = 40,
  lineWidth = 10,
  labelSize = 16,
}: {
  value: number;
  radius?: number;
  lineWidth?: number;
  labelSize?: number;
}) {
  const size = radius * 2;
  const r = radius - lineWidth / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(value, 0), 1);
  return (
    <div className="percent" style={{ width: size, height: size }} role="img" aria-label={`Progresso ${toPercent(clamped)}`}>
      <svg width={size} height={size}>
        <circle className="track" cx={radius} cy={radius} r={r} fill="none" strokeWidth={lineWidth} />
        <circle
          className="bar"
          cx={radius}
          cy={radius}
          r={r}
          fill="none"
          strokeWidth={lineWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          style={clamped === 0 ? { display: 'none' } : undefined}
        />
      </svg>
      <span className="percent-label" style={{ fontSize: labelSize }}>
        {toPercent(clamped)}
      </span>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(Math.max(value, 0), 1);
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(clamped * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${clamped * 100}%` }} />
      </div>
      <span className="progress-value">{toPercent(clamped)}</span>
    </div>
  );
}

export function SegmentedButton<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label?: string; icon?: ReactNode; title?: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={option.value === value}
          title={option.title}
          aria-label={option.label ? undefined : option.title}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />
  );
}

export function CheckCard({
  title,
  subtitle,
  checked,
  onToggle,
  color,
}: {
  title: string;
  subtitle?: string;
  checked: boolean;
  onToggle: () => void;
  color?: string;
}) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} className="check-card" onClick={onToggle}>
      <span className="check-box">{checked && <Check size={12} weight="bold" />}</span>
      <span className="check-card-text">
        <span>{title}</span>
        {subtitle && <span className="check-card-sub">{subtitle}</span>}
      </span>
      {color && <span className="color-dot" style={{ background: color }} />}
    </button>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number; icon?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          className="tab"
          aria-selected={tab.value === value}
          onClick={() => onChange(tab.value)}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && <span className="tab-badge">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

export type SortState<K extends string> = { key: K; dir: 'asc' | 'desc' } | null;

export function SortHeader<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: K;
  sort: SortState<K>;
  onSort: (sort: SortState<K>) => void;
}) {
  const active = sort?.key === sortKey;
  const next = (): SortState<K> =>
    !active ? { key: sortKey, dir: 'asc' } : sort!.dir === 'asc' ? { key: sortKey, dir: 'desc' } : null;
  return (
    <button type="button" className={`th-sort ${active ? 'active' : ''}`} onClick={() => onSort(next())}>
      {label}
      {active ? sort!.dir === 'asc' ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" /> : <CaretUpDown size={12} />}
    </button>
  );
}

export function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  tone?: 'secondary' | 'tertiary';
}) {
  return (
    <div className="card stat">
      <span className={`stat-icon ${tone ?? ''}`}>{icon}</span>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export function Card({
  title,
  subtitle,
  icon,
  actions,
  children,
  footer,
  bodyless,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  bodyless?: boolean;
}) {
  return (
    <section className="card">
      {(title || actions) && (
        <header className="card-header">
          <div>
            {title && (
              <h2 className="card-title">
                {icon}
                {title}
              </h2>
            )}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {bodyless ? children : <div className="card-body">{children}</div>}
      {footer && <footer className="card-footer">{footer}</footer>}
    </section>
  );
}

export function useDismiss<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onClose();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return ref;
}
