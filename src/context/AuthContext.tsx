import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setUnauthorizedHandler } from '@/api/client';
import { authApi, usersApi } from '@/api/endpoints';
import type { User } from '@/api/types';
import { session } from '@/lib/session';
import { useSnackbar } from './SnackbarContext';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: (message?: string) => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const [user, setUser] = useState<User | null>(() => (session.getToken() ? session.getUser() : null));

  const logout = useCallback(
    (message?: string) => {
      session.clear();
      queryClient.clear();
      setUser(null);
      if (message) snackbar.show(message);
    },
    [queryClient, snackbar],
  );

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    session.save(response.token, response.user);
    setUser(response.user);
    return response.user;
  }, []);

  const updateUser = useCallback((next: User) => {
    session.saveUser(next);
    setUser(next);
  }, []);

  const userRef = useRef(user);
  userRef.current = user;

  // O usuário salvo no navegador é uma cópia do login; revalida ao abrir o app para
  // refletir mudanças feitas em outro dispositivo (ex.: nova foto de perfil).
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    usersApi
      .me()
      .then((fresh) => {
        if (!cancelled && session.getToken() && fresh.id === userRef.current?.id) updateUser(fresh);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId, updateUser]);

  useEffect(
    () =>
      session.onExternalChange(() => {
        const current = userRef.current;
        const next = session.getToken() ? session.getUser() : null;
        if (current?.id === next?.id) {
          if (next) setUser(next);
          return;
        }
        queryClient.clear();
        setUser(next);
        if (current && !next) snackbar.show('Sua sessão foi encerrada em outra aba.');
      }),
    [queryClient, snackbar],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      snackbar.show('Não autorizado: Token expirado ou usuário inválido.', { type: 'error' });
      logout('Faça seu login novamente.');
    });
    return () => setUnauthorizedHandler(null);
  }, [logout, snackbar]);

  const value = useMemo(
    () => ({ user, isAdmin: user?.role === 'ADMIN', login, logout, updateUser }),
    [user, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
