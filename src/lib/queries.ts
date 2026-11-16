import { useQuery } from '@tanstack/react-query';
import { enzymesApi, experimentsApi, treatmentsApi, usersApi } from '@/api/endpoints';

export const queryKeys = {
  experiments: () => ['experiments'] as const,
  experiment: (id: string) => ['experiment', id] as const,
  repetitions: (id: string) => ['repetitions', id] as const,
  results: (id: string) => ['results', id] as const,
  treatments: ['treatments'] as const,
  enzymes: ['enzymes'] as const,
  avatar: (userId: string, version: string) => ['avatar', userId, version] as const,
};

export const useAllExperiments = () =>
  useQuery({ queryKey: queryKeys.experiments(), queryFn: () => experimentsApi.list() });

export const useExperiment = (id: string) =>
  useQuery({ queryKey: queryKeys.experiment(id), queryFn: () => experimentsApi.get(id) });

export const useTreatments = () => useQuery({ queryKey: queryKeys.treatments, queryFn: treatmentsApi.list });

export const useEnzymes = () => useQuery({ queryKey: queryKeys.enzymes, queryFn: enzymesApi.list });

/** A chave inclui a versão: trocar a foto gera outra chave e a antiga nunca precisa ser revalidada. */
export const useAvatar = (userId: string, version: string | null | undefined) =>
  useQuery({
    queryKey: queryKeys.avatar(userId, version ?? ''),
    queryFn: () => usersApi.avatar(userId, version!),
    enabled: !!version,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
