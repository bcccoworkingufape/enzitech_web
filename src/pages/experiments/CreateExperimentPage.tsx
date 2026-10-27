import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Atom, Flask, Plus, TestTube, Trash } from '@phosphor-icons/react';
import { experimentsApi, treatmentsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import type { Enzyme } from '@/api/types';
import { Page } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { CheckCard } from '@/components/Controls';
import { LoadingView, NotFoundView } from '@/components/StateViews';
import { Stepper } from '@/components/StepIndicator';
import { TextField } from '@/components/TextField';
import { useSnackbar } from '@/context/SnackbarContext';
import { enzymeColor, enzymeTypeLabel } from '@/lib/enzymes';
import { sanitizeInteger } from '@/lib/format';
import { queryKeys, useEnzymes } from '@/lib/queries';
import { fieldRules, validate } from '@/lib/validators';
import { EnzymeConfigFields, emptyConfig, isConfigEmpty, isConfigValid, toExperimentEnzyme, type EnzymeConfig } from './enzymeConfig';

const STEPS = ['Identificação', 'Tratamentos e repetições', 'Enzimas', 'Variáveis'];

interface PendingTreatment {
  name: string;
  description: string;
}

export function CreateExperimentPage() {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const { data: allEnzymes = [], isLoading: loadingEnzymes } = useEnzymes();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [treatments, setTreatments] = useState<PendingTreatment[]>([]);
  const [treatmentName, setTreatmentName] = useState('');
  const [treatmentDescription, setTreatmentDescription] = useState('');
  const [repetitions, setRepetitions] = useState('');
  const [selectedEnzymes, setSelectedEnzymes] = useState<Enzyme[]>([]);
  const [configs, setConfigs] = useState<Record<string, EnzymeConfig>>({});
  const [saving, setSaving] = useState(false);

  const nameError = validate(name, fieldRules.longText);
  const descriptionError = validate(description, fieldRules.longText);
  const repetitionsError = validate(repetitions, fieldRules.repetitions);
  const allConfigsValid = selectedEnzymes.every((e) => isConfigValid(configs[e.id] ?? emptyConfig()));

  const canAdvance = [
    !nameError && !descriptionError,
    !repetitionsError && treatments.length > 0,
    selectedEnzymes.length > 0,
    allConfigsValid,
  ][step - 1];

  const toggleEnzyme = (enzyme: Enzyme) => {
    setSelectedEnzymes((current) =>
      current.some((e) => e.id === enzyme.id) ? current.filter((e) => e.id !== enzyme.id) : [...current, enzyme],
    );
    setConfigs((c) => (c[enzyme.id] ? c : { ...c, [enzyme.id]: emptyConfig() }));
  };

  const addTreatment = () => {
    if (!treatmentName.trim()) return;
    setTreatments((t) => [...t, { name: treatmentName.trim(), description: treatmentDescription.trim() }]);
    setTreatmentName('');
    setTreatmentDescription('');
  };

  const create = async () => {
    setSaving(true);
    try {
      const treatmentIds: string[] = [];
      for (const t of treatments) {
        const created = await treatmentsApi.create(t.name, t.description);
        treatmentIds.push(created.id);
      }
      const experiment = await experimentsApi.create({
        name: name.trim(),
        description: description.trim(),
        repetitions: parseInt(repetitions, 10),
        processes: treatmentIds,
        experimentsEnzymes: selectedEnzymes.map((e) => toExperimentEnzyme(e, configs[e.id])),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments });
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      queryClient.setQueryData(queryKeys.experiment(experiment.id), experiment);
      snackbar.show('Experimento criado com sucesso!', { type: 'success' });
      navigate(`/experimentos/${experiment.id}`, { replace: true });
    } catch (error) {
      snackbar.show(errorMessage(error), { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      title="Novo experimento"
      description="Cadastre um novo experimento em quatro etapas."
      crumbs={[{ label: 'Experimentos', to: '/experimentos' }, { label: 'Novo experimento' }]}
      narrow
    >
      <section className="card">
        <Stepper steps={STEPS} current={step} />
        <hr className="divider" />
        <div className="card-body">
          {step === 1 && (
            <>
              <StepHeading icon={<Flask size={20} />} title="Identificação do experimento" />
              <TextField label="Nome" value={name} onChange={setName} error={name ? nameError : null} autoFocus />
              <TextField
                label="Descrição"
                multiline
                value={description}
                onChange={setDescription}
                error={description ? descriptionError : null}
              />
            </>
          )}

          {step === 2 && (
            <>
              <StepHeading icon={<TestTube size={20} />} title="Tratamentos" subtitle="Adicione os tratamentos que serão avaliados neste experimento." />
              <div className="form-grid">
                <TextField label="Nome do tratamento" value={treatmentName} onChange={setTreatmentName} />
                <TextField
                  label="Descrição (opcional)"
                  value={treatmentDescription}
                  onChange={setTreatmentDescription}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTreatment())}
                />
              </div>
              <Button variant="outline" icon={<Plus size={18} />} onClick={addTreatment} disabled={!treatmentName.trim()}>
                Adicionar tratamento
              </Button>

              <div className="card" style={{ marginTop: 16, boxShadow: 'none' }}>
                {treatments.length === 0 ? (
                  <p className="muted" style={{ padding: 16 }}>Nenhum tratamento adicionado ainda</p>
                ) : (
                  <ul className="list-plain">
                    {treatments.map((t, i) => (
                      <li key={i}>
                        <div style={{ minWidth: 0 }}>
                          <div className="cell-title">{t.name}</div>
                          {t.description && <div className="cell-sub">{t.description}</div>}
                        </div>
                        <button
                          className="icon-btn sm danger"
                          aria-label={`Remover ${t.name}`}
                          onClick={() => setTreatments((list) => list.filter((_, idx) => idx !== i))}
                        >
                          <Trash size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{ height: 24 }} />
              <StepHeading title="Repetições" />
              <div style={{ maxWidth: 320 }}>
                <TextField
                  label="Quantidade de repetições por tratamento"
                  inputMode="numeric"
                  value={repetitions}
                  onChange={(v) => setRepetitions(sanitizeInteger(v))}
                  error={repetitions ? repetitionsError : null}
                  hint="Entre 1 e 100"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <StepHeading icon={<Atom size={20} />} title="Enzimas do experimento" subtitle="Selecione as enzimas que serão analisadas." />
              {loadingEnzymes ? (
                <LoadingView message="Carregando enzimas..." />
              ) : allEnzymes.length === 0 ? (
                <NotFoundView message="Nenhuma enzima cadastrada, entre em contato com o seu Administrador para solucionar este problema." />
              ) : (
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
              )}
            </>
          )}

          {step === 4 && (
            <>
              <StepHeading title="Variáveis por enzima" subtitle="Preencha as demais variáveis usadas no cálculo de cada enzima." />
              <div className="stack" style={{ gap: 16 }}>
                {selectedEnzymes.map((enzyme) => {
                  const config = configs[enzyme.id] ?? emptyConfig();
                  const status = isConfigEmpty(config) ? 'chip-neutral' : isConfigValid(config) ? 'chip-done' : 'chip-pending';
                  return (
                    <div key={enzyme.id} className="card" style={{ boxShadow: 'none' }}>
                      <div className="card-header">
                        <h3 className="card-title">
                          <span className="color-dot" style={{ background: enzymeColor(enzyme.type) }} />
                          {enzyme.name}
                        </h3>
                        <span className={`chip ${status}`}>
                          {isConfigEmpty(config) ? 'Pendente' : isConfigValid(config) ? 'Completo' : 'Revisar'}
                        </span>
                      </div>
                      <div className="card-body" style={{ paddingBottom: 4 }}>
                        <EnzymeConfigFields
                          enzyme={enzyme}
                          config={config}
                          showCurve
                          onChange={(c) => setConfigs((all) => ({ ...all, [enzyme.id]: c }))}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <footer className="card-footer spread">
          <Button
            variant="text"
            icon={<ArrowLeft size={18} />}
            onClick={() => (step === 1 ? navigate('/experimentos') : setStep(step - 1))}
            disabled={saving}
          >
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>
          {step < 4 ? (
            <Button disabled={!canAdvance} onClick={() => setStep(step + 1)}>
              Próximo <ArrowRight size={18} />
            </Button>
          ) : (
            <Button disabled={!canAdvance} loading={saving} onClick={create}>
              Criar experimento
            </Button>
          )}
        </footer>
      </section>
    </Page>
  );
}

export function StepHeading({ icon, title, subtitle }: { icon?: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 className="card-title">
        {icon}
        {title}
      </h2>
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
    </div>
  );
}
