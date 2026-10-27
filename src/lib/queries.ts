import { useQuery } from '@tanstack/react-query';
import { enzymesApi, experimentsApi, treatmentsApi } from '@/api/endpoints';

export const queryKeys = {
  experiments: () => ['experiments'] as const,
  experiment: (id: string) => ['experiment', id] as const,
  repetitions: (id: string) => ['repetitions', id] as const,
  results: (id: string) => ['results', id] as const,
  treatments: ['treatments'] as const,
  enzymes: ['enzymes'] as const,
};

export const useAllExperiments = () =>
  useQuery({ queryKey: queryKeys.experiments(), queryFn: () => experimentsApi.list() });

export const useExperiment = (id: string) =>
  useQuery({ queryKey: queryKeys.experiment(id), queryFn: () => experimentsApi.get(id) });

export const useTreatments = () => useQuery({ queryKey: queryKeys.treatments, queryFn: treatmentsApi.list });

export const useEnzymes = () => useQuery({ queryKey: queryKeys.enzymes, queryFn: enzymesApi.list });
