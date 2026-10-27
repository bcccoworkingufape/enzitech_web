import { useState } from 'react';
import { validate, type Rule } from '@/lib/validators';

export function useField(initial: string, fieldRules: Rule[] = []) {
  const [value, setValue] = useState(initial);
  const [touched, setTouched] = useState(false);
  const error = validate(value, fieldRules);
  return {
    value,
    setValue,
    error,
    valid: error === null,
    touch: () => setTouched(true),
    props: {
      value,
      onChange: (v: string) => {
        setValue(v);
        setTouched(true);
      },
      onBlur: () => setTouched(true),
      error: touched ? error : null,
    },
  };
}
