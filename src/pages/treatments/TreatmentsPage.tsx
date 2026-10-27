import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, TestTube, Trash } from '@phosphor-icons/react';
import { errorMessage } from '@/api/client';
import { treatmentsApi } from '@/api/endpoints';
import type { Treatment } from '@/api/types';
import { Page } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { SortHeader, type SortState } from '@/components/Controls';
import { Dialog } from '@/components/Dialog';
import { SearchBox, TableSkeleton } from '@/components/ListHelpers';
import { ErrorView, NotFoundView } from '@/components/StateViews';
import { TextField } from '@/components/TextField';
import { useField } from '@/components/useField';
import { useSnackbar } from '@/context/SnackbarContext';
import { formatDate } from '@/lib/format';
import { queryKeys, useTreatments } from '@/lib/queries';
import { useUndoableDelete } from '@/lib/useUndoableDelete';
import { rules } from '@/lib/validators';

type SortKey = 'name' | 'createdAt';

export function TreatmentsPage() {
  const { data: treatments = [], isLoading, isError, refetch } = useTreatments();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState<SortKey>>(null);
  const [creating, setCreating] = useState(false);

  const deleteTreatment = useUndoableDelete<Treatment>({
    queryKey: queryKeys.treatments,
    remove: treatmentsApi.remove,
    confirmTitle: 'Excluir o tratamento?',
    confirmContent: 'Você tem certeza que deseja excluir este tratamento?',
    deletedMessage: (t) => `${t.name} excluído!`,
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q
      ? treatments.filter((t) => t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
      : treatments;
    if (sort) {
      const dir = sort.dir === 'desc' ? -1 : 1;
      list = [...list].sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key]), 'pt-BR') * dir);
    }
    return list;
  }, [treatments, search, sort]);

  return (
    <Page
      title="Tratamentos"
      description="Tratamentos aplicados ao solo nos seus experimentos."
      crumbs={[{ label: 'Início', to: '/experimentos' }, { label: 'Tratamentos' }]}
      actions={
        <Button icon={<Plus size={18} weight="bold" />} onClick={() => setCreating(true)}>
          Novo tratamento
        </Button>
      }
    >
      <section className="card">
        <div className="toolbar">
          <SearchBox value={search} onChange={setSearch} placeholder="Filtrar tratamentos" />
          {!isLoading && <span className="muted" style={{ fontSize: 13 }}>🧪 {rows.length} tratamento(s)</span>}
        </div>
        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorView message="Erro ao carregar tratamentos" action={<Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>} />
        ) : rows.length === 0 ? (
          <NotFoundView
            message={treatments.length ? 'Nenhum tratamento encontrado com esse filtro.' : 'Tratamentos não encontrados'}
            action={!treatments.length && <Button icon={<Plus size={18} />} onClick={() => setCreating(true)}>Novo tratamento</Button>}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th><SortHeader label="Nome" sortKey="name" sort={sort} onSort={setSort} /></th>
                  <th>Descrição</th>
                  <th><SortHeader label="Criado em" sortKey="createdAt" sort={sort} onSort={setSort} /></th>
                  <th className="actions"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="cell-title" style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <TestTube size={18} color="var(--primary)" />
                        {t.name}
                      </span>
                    </td>
                    <td className="muted">{t.description || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(t.createdAt)}</td>
                    <td className="actions">
                      <button className="icon-btn sm danger" title="Excluir" aria-label={`Excluir ${t.name}`} onClick={() => deleteTreatment(t)}>
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
      {creating && <CreateTreatmentDialog onClose={() => setCreating(false)} />}
    </Page>
  );
}

function CreateTreatmentDialog({ onClose }: { onClose: () => void }) {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const name = useField('', [rules.required()]);
  const description = useField('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    name.touch();
    if (!name.valid) return;
    setLoading(true);
    try {
      await treatmentsApi.create(name.value.trim(), description.value.trim());
      await queryClient.invalidateQueries({ queryKey: queryKeys.treatments });
      snackbar.show('Tratamento criado com sucesso!', { type: 'success' });
      onClose();
    } catch (error) {
      snackbar.show(errorMessage(error), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      title="Novo tratamento"
      onClose={onClose}
      onSubmit={submit}
      actions={
        <>
          <Button variant="text" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading} disabled={!name.valid}>Criar tratamento</Button>
        </>
      }
    >
      <TextField label="Nome" autoFocus {...name.props} />
      <TextField label="Descrição (opcional)" multiline {...description.props} />
    </Dialog>
  );
}
