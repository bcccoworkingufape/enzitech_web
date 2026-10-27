import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Atom, CalendarBlank, CaretRight, ClockCounterClockwise, FileText, FunctionIcon, PencilSimple, Repeat, TestTube, Trash } from '@phosphor-icons/react';
import { experimentsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import { Page } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { Card, PercentIndicator } from '@/components/Controls';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { useConfirm } from '@/context/DialogContext';
import { useSettings } from '@/context/SettingsContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { formatDate, formatNumber } from '@/lib/format';
import { useExperiment } from '@/lib/queries';
import { EnzymeTypeBadge } from '@/pages/enzymes/EnzymesPage';

export function ExperimentDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const snackbar = useSnackbar();
  const { confirmDeletion } = useSettings();
  const { data: experiment, isLoading, isError } = useExperiment(id);
  const crumbs = [{ label: 'Experimentos', to: '/experimentos' }, { label: experiment?.name ?? 'Detalhes' }];

  if (isLoading) return <Page title="Carregando…" crumbs={crumbs}><LoadingView message="Carregando experimento..." /></Page>;
  if (isError || !experiment) return <Page title="Experimento" crumbs={crumbs}><ErrorView message="Erro ao carregar o experimento" /></Page>;

  const finished = experiment.progress >= 1;
  const started = experiment.progress > 0;

  const onDelete = async () => {
    if (confirmDeletion) {
      const ok = await confirm({ title: 'Excluir o experimento?', content: 'Você tem certeza que deseja excluir este experimento?' });
      if (!ok) return;
    }
    try {
      await experimentsApi.remove(experiment.id);
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      queryClient.removeQueries({ queryKey: ['experiment', experiment.id] });
      snackbar.show(`${experiment.name} excluído!`, { type: 'error' });
      navigate('/experimentos', { replace: true });
    } catch (error) {
      snackbar.show(errorMessage(error), { type: 'error' });
    }
  };

  return (
    <Page
      title={experiment.name}
      crumbs={crumbs}
      actions={
        <>
          <Button variant="text" className="danger" icon={<Trash size={18} />} onClick={onDelete}>
            Excluir
          </Button>
          <Button variant="outline" icon={<PencilSimple size={18} />} onClick={() => navigate(`/experimentos/${id}/editar`)}>
            Editar
          </Button>
          <Button variant="tonal" icon={<FileText size={18} />} disabled={!started} onClick={() => navigate(`/experimentos/${id}/resultados`)}>
            Resultados
          </Button>
          <Button icon={<FunctionIcon size={18} />} disabled={finished} onClick={() => navigate(`/experimentos/${id}/calculo`)}>
            Cálculo enzimático
          </Button>
        </>
      }
    >
      <div className="grid-main-side">
        <div className="stack">
          <section className="card hero">
            <PercentIndicator value={experiment.progress} radius={56} lineWidth={12} labelSize={22} />
            <div style={{ minWidth: 0 }}>
              <span className={`chip ${finished ? 'chip-done' : started ? 'chip-pending' : 'chip-neutral'}`}>
                {finished ? 'Concluído' : started ? 'Em andamento' : 'Não iniciado'}
              </span>
              <p style={{ marginTop: 10, fontSize: 15 }}>{experiment.description}</p>
              <div className="hero-meta">
                <span><CalendarBlank size={16} /> Criado em {formatDate(experiment.createdAt)}</span>
                <span><ClockCounterClockwise size={16} /> Modificado em {formatDate(experiment.updatedAt)}</span>
                <span><Repeat size={16} /> {experiment.repetitions} repetições por tratamento</span>
              </div>
            </div>
          </section>

          <Card title="Enzimas" icon={<Atom size={20} />} subtitle={`${experiment.enzymes.length} enzima(s) com as variáveis usadas no cálculo`} bodyless>
            <div className="table-wrap">
              <table className="table compact">
                <thead>
                  <tr>
                    <th>Enzima</th>
                    <th className="num">Var. A</th>
                    <th className="num">Var. B</th>
                    <th className="num">Tempo (h)</th>
                    <th className="num">Volume</th>
                    <th className="num">Peso (g)</th>
                    <th className="num">F. correção</th>
                  </tr>
                </thead>
                <tbody>
                  {experiment.experimentEnzymes.map((ee) => (
                    <tr key={ee.id}>
                      <td>
                        <div className="cell-title">{ee.enzyme.name}</div>
                        <div style={{ fontSize: 12 }}><EnzymeTypeBadge type={ee.enzyme.type} /></div>
                      </td>
                      <td className="num">{formatNumber(ee.variableA)}</td>
                      <td className="num">{formatNumber(ee.variableB)}</td>
                      <td className="num">{formatNumber(ee.duration)}</td>
                      <td className="num">{formatNumber(ee.size)}</td>
                      <td className="num">{formatNumber(ee.weightSample)}</td>
                      <td className="num">{formatNumber(ee.weightGround)}</td>
                    </tr>
                  ))}
                  {experiment.experimentEnzymes.length === 0 && (
                    <tr><td colSpan={7} className="muted">Sem dados!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="stack">
          <Card title="Próximos passos" bodyless>
            <button className="action-tile" disabled={finished} onClick={() => navigate(`/experimentos/${id}/calculo`)}>
              <span className="stat-icon"><FunctionIcon size={22} /></span>
              <span style={{ flex: 1 }}>
                <span className="action-tile-title">Cálculo enzimático</span>
                <br />
                <span className="action-tile-sub">{finished ? 'Todas as repetições foram preenchidas' : 'Inserir amostras das repetições pendentes'}</span>
              </span>
              <CaretRight size={18} />
            </button>
            <button className="action-tile" disabled={!started} onClick={() => navigate(`/experimentos/${id}/resultados`)}>
              <span className="stat-icon secondary"><FileText size={22} /></span>
              <span style={{ flex: 1 }}>
                <span className="action-tile-title">Resultados</span>
                <br />
                <span className="action-tile-sub">{started ? 'Ver tabela e exportar planilha' : 'Disponível após a primeira repetição'}</span>
              </span>
              <CaretRight size={18} />
            </button>
          </Card>

          <Card title="Tratamentos" icon={<TestTube size={20} />} subtitle={`${experiment.processes.length} tratamento(s)`} bodyless>
            <ul className="list-plain">
              {experiment.processes.map((t) => (
                <li key={t.id}>
                  <div style={{ minWidth: 0 }}>
                    <div className="cell-title">{t.name}</div>
                    {t.description && <div className="cell-sub" style={{ whiteSpace: 'normal' }}>{t.description}</div>}
                  </div>
                </li>
              ))}
              {experiment.processes.length === 0 && <li className="muted">Sem dados!</li>}
            </ul>
          </Card>
        </div>
      </div>
    </Page>
  );
}
