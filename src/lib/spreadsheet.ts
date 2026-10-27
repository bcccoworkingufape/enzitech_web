import type { TotalResultExperiment } from '@/api/types';

const HEADERS = [
  'Id',
  'Abs. Amostra',
  'Abs. Branco',
  'Diferença',
  'Variável A',
  'Variável B',
  'Cálc. Curva',
  'Fator Correção',
  'Tempo (h)',
  'Volume',
  'Peso Amostra (g)',
  'Resultado',
];

const fill = (argb: string) => ({ type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb } });

export async function buildResultsWorkbook(results: TotalResultExperiment[]): Promise<Blob> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Enzitech';
  const usedNames = new Set<string>();

  for (const { enzyme, processes } of results) {
    let sheetName = enzyme.name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Enzima';
    for (let i = 2; usedNames.has(sheetName); i++) sheetName = `${sheetName.slice(0, 28)} ${i}`;
    usedNames.add(sheetName);
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = HEADERS.map(() => ({ width: 16 }));

    const styleRow = (row: ReturnType<typeof sheet.addRow>, bg: string, color: string) => {
      for (let c = 1; c <= HEADERS.length; c++) {
        const cell = row.getCell(c);
        cell.fill = fill(bg);
        cell.font = { name: 'Calibri', color: { argb: color } };
      }
    };

    for (const { process, results: rows } of processes) {
      styleRow(sheet.addRow(['Tratamento:', process.name]), 'FF67252B', 'FFFFFFFF');
      styleRow(sheet.addRow(HEADERS), 'FF9B7276', 'FFFFFFFF');
      for (const r of rows) {
        sheet.addRow([
          r.repetitionId,
          r.sample,
          r.whiteSample,
          r.differenceBetweenSamples,
          r.variableA,
          r.variableB,
          r.curve,
          r.correctionFactor,
          r.time,
          r.volume,
          r.weightSample,
          r.result,
        ]);
      }
      sheet.addRow([]);
      sheet.addRow([]);
      const footer = sheet.addRow([
        'Desenvolvido por:',
        'ENZITECH',
        '',
        '👨🏻‍💻 SAIBA MAIS:',
        'http://bcccoworking.ufape.edu.br/show.project?idProject=6',
      ]);
      styleRow(footer, 'FFC2F7CF', 'FF1B1B1B');
      sheet.addRow([]);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
