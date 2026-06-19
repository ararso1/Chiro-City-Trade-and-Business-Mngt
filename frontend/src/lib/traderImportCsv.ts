/** CSV template for bulk trader import (UTF-8). */
export const TRADER_CSV_TEMPLATE = `fullName,gender,nationalId,address,typeOfJob,phone,tin,plateNumber,associationType,businessArea,category
"Sample Trader",male,ET-1234567890,"Bole, Addis",Merchant,+251911000000,TIN-00001,AA-12345,Taxi Association,Transport,Urban Transport
`;

export type ParsedTraderRow = {
  fullName: string;
  tin: string;
  phone?: string;
  nationalId?: string;
  gender?: string;
  address?: string;
  typeOfJob?: string;
  plateNumber?: string;
  associationType?: string;
  businessArea?: string;
  category?: string;
};

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/[\s_]+/g, '');
}

/** Map normalized header -> CreateTrader JSON field */
const HEADER_TO_FIELD: Record<string, keyof ParsedTraderRow> = {
  fullname: 'fullName',
  name: 'fullName',
  tin: 'tin',
  phone: 'phone',
  nationalid: 'nationalId',
  idnumber: 'nationalId',
  gender: 'gender',
  address: 'address',
  typeofjob: 'typeOfJob',
  job: 'typeOfJob',
  platenumber: 'plateNumber',
  plate: 'plateNumber',
  associationtype: 'associationType',
  businesstypeassociation: 'associationType',
  areaofbusiness: 'businessArea',
  businessarea: 'businessArea',
  category: 'category',
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      q = !q;
      continue;
    }
    if (!q && c === ',') {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

export function parseTradersCsv(text: string): { rows: ParsedTraderRow[]; errors: { line: number; message: string }[] } {
  const errors: { line: number; message: string }[] = [];
  const raw = text.replace(/^\uFEFF/, '').trim();
  if (!raw) {
    errors.push({ line: 0, message: 'File is empty' });
    return { rows: [], errors };
  }
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    errors.push({ line: 1, message: 'Need a header row and at least one data row' });
    return { rows: [], errors };
  }
  const headerCells = parseCsvLine(lines[0]);
  const headers = headerCells.map(normalizeHeader);
  const rows: ParsedTraderRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const lineNo = i + 1;
    const cells = parseCsvLine(lines[i]);
    const obj: Partial<ParsedTraderRow> = {};
    headers.forEach((h, idx) => {
      const field = HEADER_TO_FIELD[h];
      if (!field) return;
      const v = cells[idx]?.trim();
      if (v) (obj as any)[field] = v;
    });
    if (!obj.fullName?.trim() || !obj.tin?.trim()) {
      errors.push({
        line: lineNo,
        message: 'Missing required fullName or tin',
      });
      continue;
    }
    rows.push(obj as ParsedTraderRow);
  }
  return { rows, errors };
}
