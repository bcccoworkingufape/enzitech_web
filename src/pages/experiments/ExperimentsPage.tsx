import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChartPieSlice, CheckCircle, ClockClockwise, Flask, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { experimentsApi } from '@/api/endpoints';
import type { Experiment, ExperimentList } from '@/api/types';
import { Page } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { ProgressBar, SortHeader, StatCard, Tabs, type SortState } from '@/components/Controls';
import { ErrorView, NotFoundView } from '@/components/StateViews';
import { formatDate, toPercent } from '@/lib/format';
import { queryKeys, useAllExperiments } from '@/lib/queries';
import { SearchBox, TableSkeleton } from '@/components/ListHelpers';
import { useUndoableDelete } from '@/lib/useUndoableDelete';

type Tab = 'todos' | 'andamento' | 'concluidos';
type SortKey = 'name' | 'progress' | 'updatedAt' | 'createdAt';

const isFinished = (e: Experiment) => e.progress >= 1;

export function ExperimentsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('aba') as Tab) || 'andamento';
  const search = params.get('busca') ?? '';
  const sort: SortState<SortKey> = params.get('ordenar')
    ? { key: params.get('ordenar') as SortKey, dir: params.get('ordem') === 'desc' ? 'desc' : 'asc' }
    : null;
  const { data, isLoading, isError, refetch } = useAllExperiments();
  const all = data?.experiments ?? [];

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const counts = {
    todos: all.length,
    andamento: all.filter((e) => !isFinished(e)).length,
    concluidos: all.filter(isFinished).length,
  };
  const avgProgress = all.length ? all.reduce((sum, e) => sum + e.progress, 0) / all.length : 0;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = all.filter((e) => (tab === 'todos' ? true : tab === 'concluidos' ? isFinished(e) : !isFinished(e)));
    if (q) list = list.filter((e) => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    if (sort) {
      const dir = sort.dir === 'desc' ? -1 : 1;
      list = [...list].sort((a, b) => {
        const x = a[sort.key];
        const y = b[sort.key];
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR')) * dir;
      });
    }
    return list;
  }, [all, tab, search, sort]);

  const deleteExperiment = useUndoableDelete<Experiment>({
    queryKey: queryKeys.experiments(),
    getList: (d) => (d as ExperimentList).experiments,
    setList: (_, list) => ({ total: list.length, experiments: list }),
    remove: experimentsApi.remove,
    confirmTitle: 'Excluir o experimento?',
    confirmContent: 'Você tem certeza que deseja excluir este experimento?',
    deletedMessage: (e) => `${e.name} excluído!`,
  });

  const sortHeader = (label: string, key: SortKey) => (
    <SortHeader
      label={label}
      sortKey={key}
      sort={sort}
      onSort={(s) => update({ ordenar: s?.key ?? null, ordem: s?.dir ?? null })}
    />
  );

  return (
    <Page
      title="Experimentos"
      description="Acompanhe o andamento dos seus experimentos de atividade enzimática do solo."
      crumbs={[{ label: 'Início', to: '/experimentos' }, { label: 'Experimentos' }]}
      actions={
        <Button icon={<Plus size={18} weight="bold" />} onClick={() => navigate('/experimentos/novo')}>
          Novo experimento
        </Button>
      }
    >
      <div className="stats">
        <StatCard icon={<Flask size={22} />} value={isLoading ? '–' : counts.todos} label="Experimentos" />
        <StatCard icon={<ClockClockwise size={22} />} value={isLoading ? '–' : counts.andamento} label="Em andamento" tone="tertiary" />
        <StatCard icon={<CheckCircle size={22} />} value={isLoading ? '–' : counts.concluidos} label="Concluídos" tone="secondary" />
        <StatCard icon={<ChartPieSlice size={22} />} value={isLoading ? '–' : toPercent(avgProgress)} label="Progresso médio" />
      </div>

      <section className="card">
        <div style={{ padding: '0 8px' }}>
          <Tabs<Tab>
            value={tab}
            onChange={(t) => update({ aba: t === 'andamento' ? null : t })}
            tabs={[
              { value: 'andamento', label: 'Em andamento', count: counts.andamento },
              { value: 'concluidos', label: 'Concluídos', count: counts.concluidos },
              { value: 'todos', label: 'Todos', count: counts.todos },
            ]}
          />
        </div>
        <div className="toolbar">
          <SearchBox value={search} onChange={(v) => update({ busca: v || null })} placeholder="Filtrar por nome ou descrição" />
          {!isLoading && <span className="muted" style={{ fontSize: 13 }}>🔬 {rows.length} de {all.length} experimento(s)</span>}
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorView
            message="Erro ao carregar experimentos"
            action={<Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>}
          />
        ) : rows.length === 0 ? (
          <NotFoundView
            message={all.length === 0 ? 'Você ainda não tem experimentos. Que tal cadastrar o primeiro?' : 'Nenhum experimento encontrado com esses filtros.'}
            action={
              all.length === 0 && (
                <Button icon={<Plus size={18} />} onClick={() => navigate('/experimentos/novo')}>
                  Novo experimento
                </Button>
              )
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{sortHeader('Experimento', 'name')}</th>
                  <th>{sortHeader('Progresso', 'progress')}</th>
                  <th>Composição</th>
                  <th>{sortHeader('Atualizado', 'updatedAt')}</th>
                  <th className="actions"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="clickable" onClick={() => navigate(`/experimentos/${e.id}`)}>
                    <td>
                      <Link to={`/experimentos/${e.id}`} className="cell-title" style={{ textDecoration: 'none' }} onClick={(ev) => ev.stopPropagation()}>
                        {e.name}
                      </Link>
                      <div className="cell-sub">{e.description}</div>
                    </td>
                    <td>
                      <ProgressBar value={e.progress} />
                    </td>
                    <td className="muted" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                      {e.processes.length} trat. · {e.enzymes.length} enz. · {e.repetitions} rep.
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(e.updatedAt)}</td>
                    <td className="actions" onClick={(ev) => ev.stopPropagation()}>
                      <button className="icon-btn sm" title="Editar" aria-label={`Editar ${e.name}`} onClick={() => navigate(`/experimentos/${e.id}/editar`)}>
                        <PencilSimple size={18} />
                      </button>
                      <button className="icon-btn sm danger" title="Excluir" aria-label={`Excluir ${e.name}`} onClick={() => deleteExperiment(e)}>
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Page>
  );
}
