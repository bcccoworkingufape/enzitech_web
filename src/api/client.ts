import { session } from '@/lib/session';

const PRD_SERVER = 'https://enzitech.api.bcccoworking.org';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || PRD_SERVER).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly serverMessage: string,
  ) {
    super(serverMessage || `HTTP ${status}`);
  }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const token = session.getToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NetworkError');
  }

  if (!response.ok) {
    let message = '';
    try {
      const data = await response.json();
      if (data && typeof data === 'object') {
        message = data.error ?? data.message ?? Object.values(data).find((v) => typeof v === 'string') ?? '';
      }
    } catch {
    }
    if (response.status === 401) onUnauthorized?.();
    throw new ApiError(response.status, String(message));
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
};

const KNOWN_BACKEND_MESSAGES: Record<string, string> = {
  'O e-mail não está cadastrado em nossa base de dados.': '⚠ O e-mail não está cadastrado em nossa base de dados.',
  'Código inválido.': '⚠ Código inválido.',
  'Código inválido ou não encontrado.': '⚠ Código inválido ou não encontrado.',
  'O código expirou. Por favor, solicite um novo.': '⚠ O código expirou. Por favor, solicite um novo.',
  'A nova senha não pode ser igual à senha atual.': '⚠ A nova senha não pode ser igual à senha atual.',
};

export function errorMessage(
  error: unknown,
  options: { isLogin?: boolean; useBackendMessage?: boolean } = {},
): string {
  if (!(error instanceof ApiError)) return '⚠ Ocorreu um erro inesperado.';
  if (options.useBackendMessage) {
    const known = KNOWN_BACKEND_MESSAGES[error.serverMessage.trim()];
    if (known) return known;
  }
  switch (error.status) {
    case 0:
      return '⚠ Sem conexão com a internet, verifique seu acesso à rede e tente novamente.';
    case 400:
      return options.isLogin ? '⚠ E-mail ou senha inválidos.' : '⚠ Dados incorretos: Algum campo inválido ou ausente.';
    case 401:
      return '⚠ Não autorizado: Token expirado ou usuário inválido.';
    case 403:
      return '⚠ Acesso negado: Você não tem permissão para executar esta ação.';
    case 404:
      return options.isLogin ? '⚠ Usuário não encontrado.' : '⚠ Não encontrado: Talvez essa informação não exista mais.';
    case 422:
      return '⚠ Entidade não processável: Não foi possível processar as instruções presentes.';
    case 500:
      return '⚠ Erro do Servidor: Não foi possível atender à solicitação.';
    case 502:
      return '⚠ Bad Gateway: Não foi possível atender à solicitação.';
    case 503:
      return '⚠ Erro do Servidor: Não foi possível atender à solicitação neste momento.';
    default:
      return '⚠ Erro de Servidor, tente novamente mais tarde.';
  }
}
