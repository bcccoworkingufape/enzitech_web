import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Atom, Check, TestTube } from '@phosphor-icons/react';
import { experimentsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import type { Experiment, Repetition } from '@/api/types';
import { Page } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { Card, CheckCard, ProgressBar } from '@/components/Controls';
import { TableSkeleton } from '@/components/ListHelpers';
import { ErrorView, LoadingView, NotFoundView } from '@/components/StateViews';
import { Stepper } from '@/components/StepIndicator';
import { useSnackbar } from '@/context/SnackbarContext';
import { enzymeColor, enzymeTypeLabel } from '@/lib/enzymes';
import { formatNumber, parseDecimal, sanitizeDecimal } from '@/lib/format';
import { queryKeys, useExperiment } from '@/lib/queries';
import { fieldRules, validate } from '@/lib/validators';

export function CalculateExperimentPage() {
  const { id = '' } = useParams();
  const { data: experiment, isLoading, isError } = useExperiment(id);
  const crumbs = [
    { label: 'Experimentos', to: '/experimentos' },
    { label: experiment?.name ?? 'Experimento', to: `/experimentos/${id}` },
    { label: 'Cálculo enzimático' },
  ];

  return (
    <Page title="Cálculo enzimático" description="Insira os dados das amostras de cada repetição." crumbs={crumbs}>
      {isLoading ? (
        <LoadingView message="Carregando experimento..." />
      ) : isError || !experiment ? (
        <ErrorView message="Erro ao carregar o experimento" />
      ) : (
        <CalculateFlow experiment={experiment} />
      )}
    </Page>
  );
}

function CalculateFlow({ experiment }: { experiment: Experiment }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [treatmentIds, setTreatmentIds] = useState<string[]>([]);
  const [enzymeIds, setEnzymeIds] = useState<string[]>([]);
  const detailsPath = `/experimentos/${experiment.id}`;

  const toggle = (set: React.Dispatch<React.SetStateAction<string[]>>, value: string) =>
    set((list) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]));
  const toggleAll = (set: React.Dispatch<React.SetStateAction<string[]>>, ids: string[], selected: string[]) =>
    set(selected.length === ids.length ? [] : ids);

  if (experiment.processes.length === 0 || experiment.enzymes.length === 0) {
    return (
      <section className="card">
        <NotFoundView title="Experimento inválido!" message="Não é possível prosseguir sem dados de tratamento(s) e/ou enzima(s)" />
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="card">
        <Stepper steps={['Escolher combinações', 'Preenchimento e cálculo']} current={step} />
      </section>

      {step === 1 ? (
        <>
          <div className="grid-2">
            <Card
              title="Tratamentos"
              icon={<TestTube size={20} />}
              actions={
                <Button variant="text" size="sm" onClick={() => toggleAll(setTreatmentIds, experiment.processes.map((t) => t.id), treatmentIds)}>
                  {treatmentIds.length === experiment.processes.length ? 'Limpar' : 'Selecionar todos'}
                </Button>
              }
            >
              <div className="check-grid" style={{ gridTemplateColumns: '1fr' }}>
                {experiment.processes.map((t) => (
                  <CheckCard key={t.id} title={t.name} checked={treatmentIds.includes(t.id)} onToggle={() => toggle(setTreatmentIds, t.id)} />
                ))}
              </div>
            </Card>
            <Card
              title="Enzimas"
              icon={<Atom size={20} />}
              actions={
                <Button variant="text" size="sm" onClick={() => toggleAll(setEnzymeIds, experiment.enzymes.map((e) => e.id), enzymeIds)}>
                  {enzymeIds.length === experiment.enzymes.length ? 'Limpar' : 'Selecionar todas'}
                </Button>
              }
            >
              <div className="check-grid" style={{ gridTemplateColumns: '1fr' }}>
                {experiment.enzymes.map((e) => (
                  <CheckCard
                    key={e.id}
                    title={e.name}
                    subtitle={enzymeTypeLabel(e.type)}
                    checked={enzymeIds.includes(e.id)}
                    onToggle={() => toggle(setEnzymeIds, e.id)}
                    color={enzymeColor(e.type)}
                  />
                ))}
              </div>
            </Card>
          </div>
          <div className="card sticky-actions">
            <Button variant="text" icon={<ArrowLeft size={18} />} onClick={() => navigate(detailsPath)}>
              Voltar ao experimento
            </Button>
            <Button disabled={!treatmentIds.length || !enzymeIds.length} onClick={() => setStep(2)}>
              Próximo <ArrowRight size={18} />
            </Button>
          </div>
        </>
      ) : (
        <RepetitionsStep
          experiment={experiment}
          treatmentIds={treatmentIds}
          enzymeIds={enzymeIds}
          onBack={() => setStep(1)}
          onFinish={() => navigate(detailsPath)}
        />
      )}
    </div>
  );
}

function RepetitionsStep({
  experiment,
  treatmentIds,
  enzymeIds,
  onBack,
  onFinish,
}: {
  experiment: Experiment;
  treatmentIds: string[];
  enzymeIds: string[];
  onBack: () => void;
  onFinish: () => void;
}) {
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.repetitions(experiment.id),
    queryFn: () => experimentsApi.repetitions(experiment.id),
  });

  const groups = useMemo(() => {
    const filtered = data
      .filter((r) => treatmentIds.includes(r.treatmentId) && enzymeIds.includes(r.enzymeId))
      .sort(
        (a, b) =>
          a.treatmentName.localeCompare(b.treatmentName) ||
          a.enzymeName.localeCompare(b.enzymeName) ||
          a.repetitionNumber - b.repetitionNumber,
      );
    const map = new Map<string, Repetition[]>();
    for (const r of filtered) {
      const key = `${r.treatmentId}|${r.enzymeId}`;
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return [...map.values()];
  }, [data, treatmentIds, enzymeIds]);

  const enzymeType = (enzymeId: string) => experiment.enzymes.find((e) => e.id === enzymeId)?.type ?? '';

  return (
    <>
      {isLoading ? (
        <section className="card"><TableSkeleton /></section>
      ) : isError ? (
        <section className="card">
          <ErrorView message="Não foi possível carregar as repetições." action={<Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>} />
        </section>
      ) : (
        groups.map((group) => {
          const done = group.filter((r) => r.status === 'COMPLETED').length;
          return (
            <Card
              key={`${group[0].treatmentId}|${group[0].enzymeId}`}
              title={
                <>
                  <span className="color-dot" style={{ background: enzymeColor(enzymeType(group[0].enzymeId)) }} />
                  {group[0].treatmentName} — {group[0].enzymeName}
                </>
              }
              subtitle={`${done} de ${group.length} repetições concluídas`}
              actions={<div style={{ width: 180 }}><ProgressBar value={group.length ? done / group.length : 0} /></div>}
              bodyless
            >
              <div className="table-wrap">
                <table className="table rep-table">
                  <thead>
                    <tr>
                      <th>Repetição</th>
                      <th>Status</th>
                      <th className="num">Amostra</th>
                      <th className="num">Amostra branca</th>
                      <th className="num">Curva</th>
                      <th className="num">Resultado</th>
                      <th className="actions"><span className="sr-only">Ações</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((repetition) => (
                      <RepetitionRow key={repetition.id} experimentId={experiment.id} repetition={repetition} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })
      )}
      <div className="card sticky-actions">
        <Button variant="text" icon={<ArrowLeft size={18} />} onClick={onBack}>
          Voltar
        </Button>
        <Button icon={<Check size={18} weight="bold" />} onClick={onFinish}>
          Concluir
        </Button>
      </div>
    </>
  );
}

function RepetitionRow({ experimentId, repetition }: { experimentId: string; repetition: Repetition }) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const [sample, setSample] = useState('');
  const [whiteSample, setWhiteSample] = useState('');
  const [preview, setPreview] = useState<Repetition | null>(null);
  const [loading, setLoading] = useState(false);
  const completed = repetition.status === 'COMPLETED';

  const sampleError = sample ? validate(sample, fieldRules.absorbance) : null;
  const whiteSampleError = whiteSample ? validate(whiteSample, fieldRules.absorbance) : null;
  const canCalculate = !!sample && !!whiteSample && !sampleError && !whiteSampleError;

  const payload = () => ({
    treatmentId: repetition.treatmentId,
    enzymeId: repetition.enzymeId,
    repetitionNumber: repetition.repetitionNumber,
    sample: parseDecimal(sample),
    whiteSample: parseDecimal(whiteSample),
  });

  const calculate = async () => {
    setLoading(true);
    try {
      setPreview(await experimentsApi.previewRepetition(experimentId, payload()));
    } catch (error) {
      snackbar.show(errorMessage(error), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setLoading(true);
    try {
      const updated = await experimentsApi.saveRepetition(experimentId, payload());
      queryClient.setQueryData(queryKeys.experiment(experimentId), updated);
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.results(experimentId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.repetitions(experimentId) });
      snackbar.show('Repetição salva com sucesso!', { type: 'success' });
    } catch (error) {
      snackbar.show(errorMessage(error), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const label = `${repetition.repetitionNumber}ª repetição`;

  if (completed) {
    return (
      <tr>
        <td className="cell-title">{label}</td>
        <td><span className="chip chip-done">Concluído</span></td>
        <td className="num">{formatNumber(repetition.sample)}</td>
        <td className="num">{formatNumber(repetition.whiteSample)}</td>
        <td className="num">{formatNumber(repetition.curve)}</td>
        <td className="num">{formatNumber(repetition.result)}</td>
        <td className="actions" />
      </tr>
    );
  }

  return (
    <tr>
      <td className="cell-title">{label}</td>
      <td><span className="chip chip-pending">Pendente</span></td>
      <td className="num">
        <input
          inputMode="decimal"
          aria-label={`Amostra da ${label}`}
          title={sampleError ?? undefined}
          aria-invalid={!!sampleError}
          value={sample}
          placeholder="0,000"
          onChange={(e) => {
            setSample(sanitizeDecimal(e.target.value));
            setPreview(null);
          }}
        />
      </td>
      <td className="num">
        <input
          inputMode="decimal"
          aria-label={`Amostra branca da ${label}`}
          title={whiteSampleError ?? undefined}
          aria-invalid={!!whiteSampleError}
          value={whiteSample}
          placeholder="0,000"
          onChange={(e) => {
            setWhiteSample(sanitizeDecimal(e.target.value));
            setPreview(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && canCalculate && (preview ? save() : calculate())}
        />
      </td>
      <td className="num rep-preview">{preview ? formatNumber(preview.curve) : '—'}</td>
      <td className="num rep-preview">{preview ? formatNumber(preview.result) : '—'}</td>
      <td className="actions">
        {preview ? (
          <Button size="sm" loading={loading} onClick={save}>
            Salvar repetição
          </Button>
        ) : (
          <Button size="sm" variant="tonal" loading={loading} disabled={!canCalculate} onClick={calculate}>
            Calcular
          </Button>
        )}
      </td>
    </tr>
  );
}
