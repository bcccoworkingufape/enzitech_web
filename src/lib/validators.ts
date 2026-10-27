export const LIMITS = {
  email: 254,
  password: 128,
  name: 120,
  institution: 200,
  longText: 2000,
  minRepetitions: 1,
  maxRepetitions: 100,
  maxAbsorbance: 5,
  minDuration: 0.5,
  maxDuration: 240,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ&\- ]*$/;
const SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>]/;

export const passwordChecks = (password: string) => ({
  minLength: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  special: SPECIAL_RE.test(password),
});

export const isStrongPassword = (password: string) => Object.values(passwordChecks(password)).every(Boolean);

export type Rule = (value: string) => string | null;

export const rules = {
  required: (): Rule => (v) => (v.trim() === '' ? '⚠ Campo obrigatório' : null),
  email: (): Rule => (v) => (v && !EMAIL_RE.test(v.trim()) ? '⚠ E-mail inválido' : null),
  name: (): Rule => (v) => (v && !NAME_RE.test(v) ? '⚠ Nome inválido' : null),
  maxChars: (max: number): Rule => (v) =>
    v.length > max ? `⚠ Esse campo deve ter no máximo ${max} caractere(s)` : null,
  strongPassword: (): Rule => (v) => (v && !isStrongPassword(v) ? '⚠ Senha não atende ao padrão informado.' : null),
  equals: (other: () => string): Rule => (v) => (v && v !== other() ? '⚠ As senhas digitadas não coincidem.' : null),
  numeric: (): Rule => (v) => (v && Number.isNaN(Number(v.replace(',', '.'))) ? '⚠ Número inválido' : null),
  greaterThanZero: (): Rule => (v) => (v && !(Number(v.replace(',', '.')) > 0) ? '⚠ Insira um número maior que zero' : null),
  integer: (): Rule => (v) => (v && !Number.isInteger(Number(v.replace(',', '.'))) ? '⚠ Insira um número inteiro' : null),
  min: (min: number): Rule => (v) =>
    v && Number(v.replace(',', '.')) < min ? `⚠ Número deve ser maior ou igual a ${min}.` : null,
  max: (max: number): Rule => (v) =>
    v && Number(v.replace(',', '.')) > max ? `⚠ Número deve ser menor ou igual a ${max}.` : null,
};

export function validate(value: string, fieldRules: Rule[]): string | null {
  for (const rule of fieldRules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

export const fieldRules = {
  email: [rules.required(), rules.email(), rules.maxChars(LIMITS.email)],
  password: [rules.required(), rules.strongPassword(), rules.maxChars(LIMITS.password)],
  name: [rules.required(), rules.name(), rules.maxChars(LIMITS.name)],
  institution: [rules.required(), rules.name(), rules.maxChars(LIMITS.institution)],
  longText: [rules.required(), rules.maxChars(LIMITS.longText)],
  repetitions: [
    rules.required(),
    rules.integer(),
    rules.greaterThanZero(),
    rules.min(LIMITS.minRepetitions),
    rules.max(LIMITS.maxRepetitions),
  ],
  absorbance: [rules.required(), rules.numeric(), rules.greaterThanZero(), rules.max(LIMITS.maxAbsorbance)],
  duration: [
    rules.required(),
    rules.numeric(),
    rules.greaterThanZero(),
    rules.integer(),
    rules.min(LIMITS.minDuration),
    rules.max(LIMITS.maxDuration),
  ],
  positiveDecimal: [rules.required(), rules.numeric(), rules.greaterThanZero()],
};
