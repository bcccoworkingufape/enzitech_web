export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Enzyme {
  id: string;
  sourceEnzymeId: string | null;
  name: string;
  variableA: number;
  variableB: number;
  type: string;
  formula: string | null;
  formulaCurve: string | null;
  formulaCalculation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  id: string;
  sourceTreatmentId: string | null;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentEnzyme {
  id: string;
  enzyme: Enzyme;
  variableA: number;
  variableB: number;
  duration: number;
  weightSample: number;
  weightGround: number;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  repetitions: number;
  progress: number;
  user: User;
  processes: Treatment[];
  experimentEnzymes: ExperimentEnzyme[];
  enzymes: Enzyme[];
  createdAt: string;
  updatedAt: string;
  resultsHash: string | null;
  resultsSignedAt: string | null;
}

export interface ExperimentList {
  total: number;
  experiments: Experiment[];
}

export interface ExperimentEnzymeRequest {
  enzyme: string;
  variableA: number;
  variableB: number;
  duration: number;
  weightSample: number;
  weightGround: number;
  size: number;
}

export interface ExperimentRequest {
  name: string;
  description: string;
  repetitions: number;
  processes: string[];
  experimentsEnzymes: ExperimentEnzymeRequest[];
}

export type RepetitionStatus = 'PENDING' | 'COMPLETED';

export interface Repetition {
  id: string;
  treatmentId: string;
  treatmentName: string;
  enzymeId: string;
  enzymeName: string;
  repetitionNumber: number;
  status: RepetitionStatus;
  sample: number | null;
  whiteSample: number | null;
  differenceBetweenSamples: number | null;
  curve: number | null;
  result: number | null;
}

export interface RepetitionRequest {
  treatmentId: string;
  enzymeId: string;
  repetitionNumber: number;
  sample: number;
  whiteSample: number;
}

export interface TotalResultData {
  id: string;
  repetitionId: number;
  sample: number;
  whiteSample: number;
  differenceBetweenSamples: number;
  variableA: number;
  variableB: number;
  curve: number;
  correctionFactor: number;
  time: number;
  volume: number;
  weightSample: number;
  result: number;
}

export interface TotalResultEnzyme {
  id: string;
  name: string;
  type: string;
  formula: string | null;
  variableA: number;
  variableB: number;
  duration: number;
  weightSample: number;
  weightGround: number;
  size: number;
}

export interface TotalResultExperiment {
  enzyme: TotalResultEnzyme;
  processes: {
    process: { id: string; name: string; description: string | null };
    results: TotalResultData[];
  }[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
}
