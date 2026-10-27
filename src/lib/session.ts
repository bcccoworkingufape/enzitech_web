import type { User } from '@/api/types';

const TOKEN_KEY = 'enzitech.token';
const USER_KEY = 'enzitech.user';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
  }
}

export const session = {
  getToken: () => read(TOKEN_KEY),
  getUser(): User | null {
    const raw = read(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  save(token: string, user: User) {
    write(TOKEN_KEY, token);
    write(USER_KEY, JSON.stringify(user));
  },
  clear() {
    write(TOKEN_KEY, null);
    write(USER_KEY, null);
  },
};

export const preferences = {
  get<T>(key: string, fallback: T): T {
    const raw = read(`enzitech.pref.${key}`);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    write(`enzitech.pref.${key}`, JSON.stringify(value));
  },
};
