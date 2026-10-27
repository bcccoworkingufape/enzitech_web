import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Atom, Flask, TestTube } from '@phosphor-icons/react';
import { experimentsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import type { Enzyme, Experiment, Treatment } from '@/api/types';
import { Page } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { Card, CheckCard } from '@/components/Controls';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { TextField } from '@/components/TextField';
import { useSnackbar } from '@/context/SnackbarContext';
import { enzymeColor, enzymeTypeLabel } from '@/lib/enzymes';
import { sanitizeInteger } from '@/lib/format';
import { queryKeys, useEnzymes, useExperiment, useTreatments } from '@/lib/queries';
import { rules, validate } from '@/lib/validators';
import { EnzymeConfigFields, emptyConfig, isConfigValid, toExperimentEnzyme, type EnzymeConfig } from './enzymeConfig';

export function EditExperimentPage() {
  const { id = '' } = useParams();
  const experiment = useExperiment(id);
  const treatments = useTreatments();
  const enzymes = useEnzymes();

  const crumbs = [
    { label: 'Experimentos', to: '/experimentos' },
    { label: experiment.data?.name ?? 'Experimento', to: `/experimentos/${id}` },
    { label: 'Editar' },
  ];

  return (
    <Page title="Editar experimento" crumbs={crumbs} narrow>
      {experiment.isLoading || treatments.isLoading || enzymes.isLoading ? (
        <LoadingView message="Carregando experimento..." />
      ) : experiment.data && treatments.data && enzymes.data ? (
        <EditForm experiment={experiment.data} allTreatments={treatments.data} allEnzymes={enzymes.data} />
      ) : (
        <ErrorView message="Erro ao carregar o experimento" />
      )}
    </Page>
  );
}

function EditForm({
  experiment,
  allTreatments,
  allEnzymes,
}: {
  experiment: Experiment;
  allTreatments: Treatment[];
  allEnzymes: Enzyme[];
}) {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const [name, setName] = useState(experiment.name);
  const [description, setDescription] = useState(experiment.description);
  const [repetitions, setRepetitions] = useState(String(experiment.repetitions));
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [selectedEnzymes, setSelectedEnzymes] = useState<Enzyme[]>([]);
  const [configs, setConfigs] = useState<Record<string, EnzymeConfig>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedTreatments(
      experiment.processes
        .map((p) => p.sourceTreatmentId)
        .filter((sid): sid is string => !!sid && allTreatments.some((t) => t.id === sid)),
    );
    const preselected: Enzyme[] = [];
    const initialConfigs: Record<string, EnzymeConfig> = {};
    for (const ee of experiment.experimentEnzymes) {
      const global = allEnzymes.find((e) => e.id === ee.enzyme.sourceEnzymeId);
      if (!global) continue;
      preselected.push(global);
      initialConfigs[global.id] = {
        duration: ee.duration != null ? String(Math.round(ee.duration)) : '',
        size: ee.size != null ? String(ee.size) : '',
        weightSample: ee.weightSample != null ? String(ee.weightSample) : '',
        weightGround: ee.weightGround != null ? String(ee.weightGround) : '',
      };
    }
    setSelectedEnzymes(preselected);
    setConfigs(initialConfigs);
  }, [experiment, allTreatments, allEnzymes]);

  const repetitionsError = validate(repetitions, [rules.required(), rules.greaterThanZero(), rules.integer()]);
  const canSave =
    name.trim() !== '' &&
    description.trim() !== '' &&
    !repetitionsError &&
    selectedTreatments.length > 0 &&
    selectedEnzymes.length > 0 &&
    selectedEnzymes.every((e) => isConfigValid(configs[e.id] ?? emptyConfig()));

  const toggleTreatment = (tid: string) =>
    setSelectedTreatments((s) => (s.includes(tid) ? s.filter((x) => x !== tid) : [...s, tid]));

  const toggleEnzyme = (enzyme: Enzyme) => {
    setSelectedEnzymes((s) => (s.some((e) => e.id === enzyme.id) ? s.filter((e) => e.id !== enzyme.id) : [...s, enzyme]));
    setConfigs((c) => (c[enzyme.id] ? c : { ...c, [enzyme.id]: emptyConfig() }));
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const updated = await experimentsApi.update(experiment.id, {
        name: name.trim(),
        description: description.trim(),
        repetitions: parseInt(repetitions, 10),
        processes: selectedTreatments,
        experimentsEnzymes: selectedEnzymes.map((e) => toExperimentEnzyme(e, configs[e.id])),
      });
      queryClient.setQueryData(queryKeys.experiment(experiment.id), updated);
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.repetitions(experiment.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.results(experiment.id) });
      snackbar.show('Experimento atualizado com sucesso!', { type: 'success' });
      navigate(`/experimentos/${experiment.id}`, { replace: true });
    } catch (error) {
      snackbar.show(errorMessage(error), { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => (e.preventDefault(), save())} noValidate className="stack">
      <Card title="Identificação do experimento" icon={<Flask size={20} />}>
        <TextField label="Nome" value={name} onChange={setName} error={name.trim() ? null : '⚠ Campo obrigatório'} />
        <TextField
          label="Descrição"
          multiline
          value={description}
          onChange={setDescription}
          error={description.trim() ? null : '⚠ Campo obrigatório'}
        />
        <div style={{ maxWidth: 320 }}>
          <TextField
            label="Quantidade de repetições por tratamento"
            inputMode="numeric"
            value={repetitions}
            onChange={(v) => setRepetitions(sanitizeInteger(v))}
            error={repetitionsError}
          />
        </div>
      </Card>

      <Card title="Tratamentos" icon={<TestTube size={20} />} subtitle="Selecione os tratamentos avaliados neste experimento.">
        {allTreatments.length === 0 ? (
          <ErrorView message="Nenhum tratamento cadastrado! É necessário pelo menos um tratamento para prosseguir." />
        ) : (
          <div className="check-grid">
            {allTreatments.map((t) => (
              <CheckCard
                key={t.id}
                title={t.name}
                subtitle={t.description ?? undefined}
                checked={selectedTreatments.includes(t.id)}
                onToggle={() => toggleTreatment(t.id)}
              />
            ))}
          </div>
        )}
      </Card>

      <Card title="Enzimas" icon={<Atom size={20} />} subtitle="Selecione as enzimas e preencha as variáveis de cada uma.">
        <div className="check-grid">
          {allEnzymes.map((enzyme) => (
            <CheckCard
              key={enzyme.id}
              title={enzyme.name}
              subtitle={enzymeTypeLabel(enzyme.type)}
              checked={selectedEnzymes.some((e) => e.id === enzyme.id)}
              onToggle={() => toggleEnzyme(enzyme)}
              color={enzymeColor(enzyme.type)}
            />
          ))}
        </div>
        {selectedEnzymes.map((enzyme) => (
          <div key={enzyme.id} style={{ marginTop: 24 }}>
            <h3 className="card-title" style={{ fontSize: 15, marginBottom: 12 }}>
              <span className="color-dot" style={{ background: enzymeColor(enzyme.type) }} />
              {enzyme.name}
            </h3>
            <EnzymeConfigFields
              enzyme={enzyme}
              config={configs[enzyme.id] ?? emptyConfig()}
              onChange={(c) => setConfigs((all) => ({ ...all, [enzyme.id]: c }))}
            />
          </div>
        ))}
      </Card>

      <div className="card sticky-actions">
        <span className="muted" style={{ fontSize: 13 }}>
          {canSave ? 'Tudo pronto para salvar.' : 'Preencha todos os campos obrigatórios para salvar.'}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="text" onClick={() => navigate(`/experimentos/${experiment.id}`)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSave} loading={saving}>
            Salvar alterações
          </Button>
        </div>
      </div>
    </form>
  );
}
