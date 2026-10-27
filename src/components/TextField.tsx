import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeClosed } from '@phosphor-icons/react';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement & HTMLTextAreaElement>, 'onChange' | 'value'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: string;
  suffix?: ReactNode;
  multiline?: boolean;
}

export function TextField({ label, value, onChange, error, hint, type = 'text', suffix, multiline, ...rest }: TextFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const common = {
    id,
    className: `field-input ${isPassword || suffix ? 'with-suffix' : ''}`,
    value,
    'aria-invalid': !!error,
    'aria-describedby': describedBy,
    ...rest,
  };

  return (
    <div className={`field ${error ? 'invalid' : ''}`}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="field-control">
        {multiline ? (
          <textarea {...common} onChange={(e) => onChange(e.target.value)} rows={3} />
        ) : (
          <input {...common} type={isPassword && visible ? 'text' : type} onChange={(e) => onChange(e.target.value)} />
        )}
        {isPassword ? (
          <button
            type="button"
            className="field-suffix"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {visible ? <Eye size={20} /> : <EyeClosed size={20} />}
          </button>
        ) : (
          suffix && <span className="field-suffix">{suffix}</span>
        )}
      </div>
      {error ? (
        <span id={`${id}-error`} className="field-error">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${id}-hint`} className="field-hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({ label, value, onChange, options, placeholder = 'Selecionar' }: SelectFieldProps) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} className="field-input field-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
