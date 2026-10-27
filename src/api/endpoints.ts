import { http } from './client';
import type {
  AuthResponse,
  Enzyme,
  Experiment,
  ExperimentList,
  ExperimentRequest,
  Page,
  Repetition,
  RepetitionRequest,
  TotalResultExperiment,
  Treatment,
  User,
} from './types';

export const authApi = {
  login: (email: string, password: string) => http.post<AuthResponse>('/auth/login', { email, password }),
  forgotPassword: (email: string) => http.post<void>('/auth/forgot-password', { email }),
  verifyPin: (email: string, token: string) => http.post<void>('/auth/verify-pin', { email, token }),
  resetPassword: (email: string, token: string, newPassword: string) =>
    http.post<void>('/auth/reset-password', { email, token, newPassword }),
  createAccount: (name: string, email: string, password: string) =>
    http.post<User>('/users', { name, email, password }),
};

export const experimentsApi = {
  list: (finished?: boolean) =>
    http.get<ExperimentList>(`/experiments${finished === undefined ? '' : `?finished=${finished}`}`),
  get: (id: string) => http.get<Experiment>(`/experiments/${id}`),
  create: (data: ExperimentRequest) => http.post<Experiment>('/experiments', data),
  update: (id: string, data: ExperimentRequest) => http.put<Experiment>(`/experiments/${id}`, data),
  remove: (id: string) => http.delete(`/experiments/${id}`),
  repetitions: (id: string) => http.get<Repetition[]>(`/experiments/${id}/repetitions`),
  previewRepetition: (id: string, data: RepetitionRequest) =>
    http.post<Repetition>(`/experiments/${id}/repetitions/preview`, data),
  saveRepetition: (id: string, data: RepetitionRequest) => http.put<Experiment>(`/experiments/${id}/repetitions`, data),
  results: (id: string) => http.get<{ result: TotalResultExperiment[] }>(`/experiments/get-total-result/${id}`),
};

export const treatmentsApi = {
  list: () => http.get<Treatment[]>('/treatments'),
  create: (name: string, description: string) => http.post<Treatment>('/treatments', { name, description }),
  remove: (id: string) => http.delete(`/treatments/${id}`),
};

export const enzymesApi = {
  list: async () => (await http.get<Page<Enzyme>>('/enzymes?size=1000&sort=name')).content,
  create: (data: { name: string; variableA: number; variableB: number; type: string }) =>
    http.post<Enzyme>('/enzymes', data),
  remove: (id: string) => http.delete(`/enzymes/${id}`),
};
