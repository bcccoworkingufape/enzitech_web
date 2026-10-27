import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash } from '@phosphor-icons/react';
import { errorMessage } from '@/api/client';
import { enzymesApi } from '@/api/endpoints';
import type { Enzyme } from '@/api/types';
import { Page } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { SortHeader, type SortState } from '@/components/Controls';
import { Dialog } from '@/components/Dialog';
import { SearchBox, TableSkeleton } from '@/components/ListHelpers';
import { ErrorView, NotFoundView } from '@/components/StateViews';
import { SelectField, TextField } from '@/components/TextField';
import { useField } from '@/components/useField';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { ENZYME_TYPES, enzymeColor, enzymeTypeLabel } from '@/lib/enzymes';
import { formatDate, formatNumber, parseDecimal, sanitizeDecimal } from '@/lib/format';
import { queryKeys, useEnzymes } from '@/lib/queries';
import { useUndoableDelete } from '@/lib/useUndoableDelete';
import { rules } from '@/lib/validators';

type SortKey = 'name' | 'type' | 'createdAt';

export function EnzymeTypeBadge({ type }: { type: string }) {
  return (
    <span className="enzyme-type">
      <span className="color-dot" style={{ background: enzymeColor(type) }} />
      {enzymeTypeLabel(type)}
    </span>
  );
}

export function EnzymesPage() {
  const { isAdmin } = useAuth();
  const { data: enzymes = [], isLoading, isError, refetch } = useEnzymes();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState<SortKey>>(null);
  const [creating, setCreating] = useState(false);

  const deleteEnzyme = useUndoableDelete<Enzyme>({
    queryKey: queryKeys.enzymes,
    remove: enzymesApi.remove,
    confirmTitle: 'Excluir a enzima?',
    confirmContent: 'Você tem certeza que deseja excluir esta enzima?',
    deletedMessage: (e) => `${e.name} excluído!`,
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = enzymes.filter(
      (e) => (!typeFilter || e.type === typeFilter) && (!q || e.name.toLowerCase().includes(q) || (e.formula ?? '').toLowerCase().includes(q)),
    );
    if (sort) {
      const dir = sort.dir === 'desc' ? -1 : 1;
      list = [...list].sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key]), 'pt-BR') * dir);
    }
    return list;
  }, [enzymes, search, typeFilter, sort]);

  return (
    <Page
      title="Enzimas"
      description={
        isAdmin
          ? 'Enzimas disponíveis para os experimentos de todos os usuários.'
          : 'Enzimas disponíveis para os seus experimentos. Precisa de uma nova? Fale com o administrador.'
      }
      crumbs={[{ label: 'Início', to: '/experimentos' }, { label: 'Enzimas' }]}
      actions={
        isAdmin && (
          <Button icon={<Plus size={18} weight="bold" />} onClick={() => setCreating(true)}>
            Nova enzima
          </Button>
        )
      }
    >
      <section className="card">
        <div className="toolbar">
          <SearchBox value={search} onChange={setSearch} placeholder="Filtrar por nome ou fórmula" />
          <div className="summary-chips" role="group" aria-label="Filtrar por tipo">
            {ENZYME_TYPES.map((t) => {
              const count = enzymes.filter((e) => e.type === t.key).length;
              if (!count) return null;
              const active = typeFilter === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  className={`chip ${active ? 'chip-done' : 'chip-outline'}`}
                  style={{ cursor: 'pointer', background: active ? undefined : 'transparent' }}
                  aria-pressed={active}
                  onClick={() => setTypeFilter(active ? null : t.key)}
                >
                  <span className="color-dot" style={{ background: t.color }} />
                  {t.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorView message="Erro ao carregar enzimas" action={<Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>} />
        ) : rows.length === 0 ? (
          <NotFoundView
            message={
              enzymes.length
                ? 'Nenhuma enzima encontrada com esses filtros.'
                : isAdmin
                  ? 'Nenhuma enzima cadastrada.'
                  : 'Nenhuma enzima cadastrada, entre em contato com o seu Administrador para solucionar este problema.'
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th><SortHeader label="Nome" sortKey="name" sort={sort} onSort={setSort} /></th>
                  <th><SortHeader label="Tipo" sortKey="type" sort={sort} onSort={setSort} /></th>
                  <th>Fórmula</th>
                  <th className="num">Variável A</th>
                  <th className="num">Variável B</th>
                  <th><SortHeader label="Criada em" sortKey="createdAt" sort={sort} onSort={setSort} /></th>
                  {isAdmin && <th className="actions"><span className="sr-only">Ações</span></th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td className="cell-title">{e.name}</td>
                    <td><EnzymeTypeBadge type={e.type} /></td>
                    <td className="muted">{e.formula ?? '—'}</td>
                    <td className="num">{formatNumber(e.variableA)}</td>
                    <td className="num">{formatNumber(e.variableB)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(e.createdAt)}</td>
                    {isAdmin && (
                      <td className="actions">
                        <button className="icon-btn sm danger" title="Excluir" aria-label={`Excluir ${e.name}`} onClick={() => deleteEnzyme(e)}>
                          <Trash size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {creating && <CreateEnzymeDialog onClose={() => setCreating(false)} />}
    </Page>
  );
}

function CreateEnzymeDialog({ onClose }: { onClose: () => void }) {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const name = useField('', [rules.required(), rules.name()]);
  const variableA = useField('', [rules.required(), rules.numeric()]);
  const variableB = useField('', [rules.required(), rules.numeric()]);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);
  const valid = name.valid && variableA.valid && variableB.valid && !!type;

  const submit = async () => {
    [name, variableA, variableB].forEach((f) => f.touch());
    if (!valid) return;
    setLoading(true);
    try {
      await enzymesApi.create({
        name: name.value.trim(),
        variableA: parseDecimal(variableA.value),
        variableB: parseDecimal(variableB.value),
        type,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.enzymes });
      snackbar.show('Enzima criada com sucesso!', { type: 'success' });
      onClose();
    } catch (error) {
      snackbar.show(errorMessage(error), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      title="Nova enzima"
      wide
      onClose={onClose}
      onSubmit={submit}
      actions={
        <>
          <Button variant="text" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading} disabled={!valid}>Criar enzima</Button>
        </>
      }
    >
      <div className="form-grid">
        <TextField label="Nome" autoFocus {...name.props} />
        <SelectField
          label="Tipo da enzima"
          placeholder="Escolha o tipo da enzima"
          value={type}
          onChange={setType}
          options={ENZYME_TYPES.map((t) => ({ value: t.key, label: t.label }))}
        />
        <TextField
          label="Variável a"
          hint="Coeficiente angular da curva"
          inputMode="decimal"
          {...variableA.props}
          onChange={(v) => variableA.props.onChange(sanitizeDecimal(v))}
        />
        <TextField
          label="Variável b"
          hint="Constante da equação da curva"
          inputMode="decimal"
          {...variableB.props}
          onChange={(v) => variableB.props.onChange(sanitizeDecimal(v))}
        />
      </div>
    </Dialog>
  );
}
