/** CSV template for bulk trader import (UTF-8). */
export const TRADER_CSV_TEMPLATE = `fullName,gender,nationalId,address,typeOfJob,phone,tin,plateNumber,associationType,businessArea,category
"Sample Trader",male,ET-1234567890,"Bole, Addis",Merchant,+251911000000,TIN-00001,AA-12345,Taxi Association,Transport,Urban Transport
`;

export const ANNUAL_TAX_CSV_TEMPLATE = `TIN,Amount,Year
TIN-00001,2500,2026
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

export type ParsedAnnualTaxRow = {
  tin: string;
  amount: number;
  year: number;
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

const TAX_HEADER_TO_FIELD: Record<string, keyof ParsedAnnualTaxRow> = {
  tin: 'tin',
  taxid: 'tin',
  amount: 'amount',
  annualtaxamount: 'amount',
  year: 'year',
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

export function parseAnnualTaxCsv(text: string): { rows: ParsedAnnualTaxRow[]; errors: { line: number; message: string }[] } {
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
  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const hasTin = headers.some((h) => TAX_HEADER_TO_FIELD[h] === 'tin');
  const hasAmount = headers.some((h) => TAX_HEADER_TO_FIELD[h] === 'amount');
  const hasYear = headers.some((h) => TAX_HEADER_TO_FIELD[h] === 'year');
  if (!hasTin || !hasAmount || !hasYear) {
    errors.push({ line: 1, message: 'Required columns are TIN, Amount, and Year' });
    return { rows: [], errors };
  }

  const rows: ParsedAnnualTaxRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const lineNo = i + 1;
    const cells = parseCsvLine(lines[i]);
    const obj: Partial<Record<keyof ParsedAnnualTaxRow, string>> = {};
    headers.forEach((h, idx) => {
      const field = TAX_HEADER_TO_FIELD[h];
      if (!field) return;
      const v = cells[idx]?.trim();
      if (v) obj[field] = v;
    });

    const tin = obj.tin?.replace(/\s+/g, '').trim() ?? '';
    const amount = Number(String(obj.amount ?? '').replace(/,/g, ''));
    const year = Number.parseInt(String(obj.year ?? ''), 10);
    if (!tin) {
      errors.push({ line: lineNo, message: 'Missing TIN' });
      continue;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      errors.push({ line: lineNo, message: 'Invalid amount' });
      continue;
    }
    if (!Number.isInteger(year) || year < 1900 || year > 2200) {
      errors.push({ line: lineNo, message: 'Invalid year' });
      continue;
    }
    rows.push({ tin, amount, year });
  }
  return { rows, errors };
}
