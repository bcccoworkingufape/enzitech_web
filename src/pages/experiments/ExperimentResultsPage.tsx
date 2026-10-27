import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DownloadSimple, ShareNetwork, TestTube } from '@phosphor-icons/react';
import { experimentsApi } from '@/api/endpoints';
import type { TotalResultData } from '@/api/types';
import { Page } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { Card, Tabs } from '@/components/Controls';
import { TableSkeleton } from '@/components/ListHelpers';
import { ErrorView, NotFoundView } from '@/components/StateViews';
import { useSnackbar } from '@/context/SnackbarContext';
import { enzymeColor, enzymeTypeLabel } from '@/lib/enzymes';
import { formatNumber } from '@/lib/format';
import { queryKeys, useExperiment } from '@/lib/queries';
import { buildResultsWorkbook, downloadBlob } from '@/lib/spreadsheet';

const COLUMNS: { label: string; title?: string; value: (r: TotalResultData) => string }[] = [
  { label: 'ID', value: (r) => String(r.repetitionId) },
  { label: 'Amostra', value: (r) => formatNumber(r.sample) },
  { label: 'Am. Branca', title: 'Amostra Branca', value: (r) => formatNumber(r.whiteSample) },
  { label: 'Diferença', value: (r) => formatNumber(r.differenceBetweenSamples) },
  { label: 'Var. A', title: 'Variável A', value: (r) => formatNumber(r.variableA) },
  { label: 'Var. B', title: 'Variável B', value: (r) => formatNumber(r.variableB) },
  { label: 'Curva', value: (r) => formatNumber(r.curve) },
  { label: 'F. Correção', title: 'Fator de correção', value: (r) => formatNumber(r.correctionFactor) },
  { label: 'Tempo (h)', value: (r) => String(r.time) },
  { label: 'Volume', value: (r) => formatNumber(r.volume) },
  { label: 'Peso Am.', title: 'Peso da Amostra', value: (r) => formatNumber(r.weightSample) },
  { label: 'Resultado', value: (r) => formatNumber(r.result) },
];

export function ExperimentResultsPage() {
  const { id = '' } = useParams();
  const snackbar = useSnackbar();
  const { data: experiment } = useExperiment(id);
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.results(id), queryFn: () => experimentsApi.results(id) });
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const results = data?.result ?? [];
  const current = results.find((r) => r.enzyme.id === selected) ?? results[0];
  const filename = `${(experiment?.name ?? 'experimento').replace(/\s+/g, '-')}.xlsx`;
  const canShare = typeof navigator.canShare === 'function';

  const exportFile = async (mode: 'download' | 'share') => {
    setBusy(true);
    try {
      const blob = await buildResultsWorkbook(results);
      if (mode === 'share') {
        const file = new File([blob], filename, { type: blob.type });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: `Resultados do experimento "${experiment?.name ?? ''}"` });
          return;
        }
      }
      downloadBlob(blob, filename);
      snackbar.show('Planilha salva com sucesso!', { type: 'success' });
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      snackbar.show(
        mode === 'share' ? 'Não foi possível compartilhar o arquivo, tente novamente.' : 'Não foi possível salvar a planilha, tente novamente.',
        { type: 'error', duration: 15000 },
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page
      title="Resultados"
      description={experiment ? `Experimento: ${experiment.name}` : undefined}
      crumbs={[
        { label: 'Experimentos', to: '/experimentos' },
        { label: experiment?.name ?? 'Experimento', to: `/experimentos/${id}` },
        { label: 'Resultados' },
      ]}
      actions={
        results.length > 0 && (
          <>
            {canShare && (
              <Button variant="outline" icon={<ShareNetwork size={18} />} disabled={busy} onClick={() => exportFile('share')}>
                Compartilhar
              </Button>
            )}
            <Button icon={<DownloadSimple size={18} />} loading={busy} onClick={() => exportFile('download')}>
              Baixar planilha (.xlsx)
            </Button>
          </>
        )
      }
    >
      {isLoading ? (
        <section className="card"><TableSkeleton /></section>
      ) : isError ? (
        <section className="card"><ErrorView message="⚠ Não foi possível obter os resultados." /></section>
      ) : !current ? (
        <section className="card"><NotFoundView message="Sem dados!" /></section>
      ) : (
        <div className="stack">
          <section className="card">
            <div style={{ padding: '0 8px' }}>
              <Tabs
                value={current.enzyme.id}
                onChange={setSelected}
                tabs={results.map((r) => ({
                  value: r.enzyme.id,
                  label: r.enzyme.name,
                  icon: <span className="color-dot" style={{ background: enzymeColor(r.enzyme.type) }} />,
                }))}
              />
            </div>
            <div className="card-body">
              <dl className="key-values" style={{ margin: 0 }}>
                <KeyValue label="Tipo" value={enzymeTypeLabel(current.enzyme.type)} />
                <KeyValue label="Fórmula" value={current.enzyme.formula ?? '—'} />
                <KeyValue label="Variável A" value={formatNumber(current.enzyme.variableA)} />
                <KeyValue label="Variável B" value={formatNumber(current.enzyme.variableB)} />
                <KeyValue label="Tempo (h)" value={formatNumber(current.enzyme.duration)} />
                <KeyValue label="Volume" value={formatNumber(current.enzyme.size)} />
              </dl>
            </div>
          </section>

          {current.processes.map(({ process, results: rows }) => {
            const mean = rows.length ? rows.reduce((s, r) => s + r.result, 0) / rows.length : null;
            return (
              <Card
                key={process.id}
                title={process.name}
                icon={<TestTube size={20} />}
                subtitle={`Tratamento · ${rows.length} repetição(ões)`}
                actions={
                  mean !== null && (
                    <div style={{ textAlign: 'right' }}>
                      <div className="label">Média do resultado</div>
                      <div className="stat-value" style={{ fontSize: 20, color: 'var(--primary)' }}>{formatNumber(mean)}</div>
                    </div>
                  )
                }
                bodyless
              >
                <div className="table-wrap">
                  <table className="table compact data-table">
                    <thead>
                      <tr>
                        {COLUMNS.map((c) => (
                          <th key={c.label} title={c.title} className="num">{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id}>
                          {COLUMNS.map((c) => (
                            <td key={c.label} className="num" style={c.label === 'Resultado' ? { fontWeight: 700 } : undefined}>
                              {c.value(row)}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {rows.length === 0 && (
                        <tr><td colSpan={COLUMNS.length} className="muted">Sem dados!</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="key-value">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
