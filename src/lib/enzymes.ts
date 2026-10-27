export const ENZYME_TYPES = [
  { key: 'Betaglucosidase', label: 'Beta-Glicosidase', color: 'var(--enzyme-betaglucosidase)' },
  { key: 'Aryl', label: 'Aryl', color: 'var(--enzyme-aryl)' },
  { key: 'FosfataseAcida', label: 'Fosfatase Ácida', color: 'var(--enzyme-fosfatase-acida)' },
  { key: 'FosfataseAlcalina', label: 'Fosfatase Alcalina', color: 'var(--enzyme-fosfatase-alcalina)' },
  { key: 'Urease', label: 'Urease', color: 'var(--enzyme-urease)' },
  { key: 'FDA', label: 'FDA', color: 'var(--enzyme-fda)' },
] as const;

export function enzymeTypeLabel(type: string): string {
  return ENZYME_TYPES.find((t) => t.key === type)?.label ?? type;
}

export function enzymeColor(type: string): string {
  return ENZYME_TYPES.find((t) => t.key === type)?.color ?? '#000000';
}
