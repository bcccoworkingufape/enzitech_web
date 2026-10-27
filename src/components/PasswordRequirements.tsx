import { CheckCircle, Circle, ShieldCheck } from '@phosphor-icons/react';
import { passwordChecks } from '@/lib/validators';

export function PasswordRequirements({ password }: { password: string }) {
  const checks = passwordChecks(password);
  const rows: [string, boolean][] = [
    ['Mínimo de 8 caracteres', checks.minLength],
    ['Uma letra maiúscula', checks.uppercase],
    ['Uma letra minúscula', checks.lowercase],
    ['Um caractere especial (ex: !@#$%)', checks.special],
  ];
  return (
    <div className="password-req">
      <div className="password-req-title">
        <ShieldCheck size={16} />
        Sua senha deve conter:
      </div>
      <div className="password-req-grid">
        {rows.map(([label, met]) => (
          <div key={label} className={`password-req-row ${met ? 'met' : ''}`}>
            {met ? <CheckCircle size={16} weight="fill" /> : <Circle size={16} />}
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
