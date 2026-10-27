import type { Enzyme, ExperimentEnzymeRequest } from '@/api/types';
import { TextField } from '@/components/TextField';
import { formatNumber, parseDecimal, sanitizeDecimal, sanitizeInteger } from '@/lib/format';
import { fieldRules, validate } from '@/lib/validators';

export interface EnzymeConfig {
  duration: string;
  size: string;
  weightSample: string;
  weightGround: string;
}

export const emptyConfig = (): EnzymeConfig => ({ duration: '', size: '', weightSample: '', weightGround: '' });

const FIELDS: { key: keyof EnzymeConfig; label: string; integer?: boolean }[] = [
  { key: 'duration', label: 'Tempo (h)', integer: true },
  { key: 'size', label: 'Volume da Solução' },
  { key: 'weightSample', label: 'Peso da amostra (g)' },
  { key: 'weightGround', label: 'Fator de correção' },
];

export function configErrors(config: EnzymeConfig): Partial<Record<keyof EnzymeConfig, string>> {
  const errors: Partial<Record<keyof EnzymeConfig, string>> = {};
  for (const { key } of FIELDS) {
    const error = validate(config[key], key === 'duration' ? fieldRules.duration : fieldRules.positiveDecimal);
    if (error) errors[key] = error;
  }
  return errors;
}

export const isConfigEmpty = (config: EnzymeConfig) => FIELDS.every(({ key }) => config[key] === '');
export const isConfigValid = (config: EnzymeConfig) => Object.keys(configErrors(config)).length === 0;

export function toExperimentEnzyme(enzyme: Enzyme, config: EnzymeConfig): ExperimentEnzymeRequest {
  return {
    enzyme: enzyme.id,
    variableA: enzyme.variableA,
    variableB: enzyme.variableB,
    duration: parseInt(config.duration, 10),
    weightSample: parseDecimal(config.weightSample),
    weightGround: parseDecimal(config.weightGround),
    size: parseDecimal(config.size),
  };
}

export function EnzymeConfigFields({
  enzyme,
  config,
  onChange,
  showCurve = false,
}: {
  enzyme: Enzyme;
  config: EnzymeConfig;
  onChange: (config: EnzymeConfig) => void;
  showCurve?: boolean;
}) {
  const errors = configErrors(config);
  return (
    <div className="form-grid-4">
      {showCurve && (
        <>
          <TextField label="Variável A" value={formatNumber(enzyme.variableA)} onChange={() => {}} disabled hint="Da enzima" />
          <TextField label="Variável B" value={formatNumber(enzyme.variableB)} onChange={() => {}} disabled hint="Da enzima" />
          <span className="span-2 desktop-spacer" />
        </>
      )}
      {FIELDS.map(({ key, label, integer }) => (
        <TextField
          key={key}
          label={label}
          inputMode={integer ? 'numeric' : 'decimal'}
          value={config[key]}
          error={config[key] ? errors[key] : null}
          onChange={(v) => onChange({ ...config, [key]: integer ? sanitizeInteger(v) : sanitizeDecimal(v) })}
        />
      ))}
    </div>
  );
}
