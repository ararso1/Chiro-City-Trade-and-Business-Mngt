import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, Plus, Search, Loader2, MoreHorizontal, Eye, Pencil, Trash2, Sparkles, Upload, Download } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import {
  ANNUAL_TAX_CSV_TEMPLATE,
  parseAnnualTaxCsv,
  parseTradersCsv,
  TRADER_CSV_TEMPLATE,
  type ParsedAnnualTaxRow,
  type ParsedTraderRow,
} from '@/lib/traderImportCsv';

const LICENSE_STATUS_FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'expiring_soon', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
  { value: 'suspended', label: 'Suspended' },
];

const statusVariant = (s: string) => {
  if (s === 'Active' || s === 'active') return 'default';
  if (s === 'Expiring Soon' || s === 'draft') return 'secondary';
  if (s === 'Suspended' || s === 'Expired' || s === 'suspended' || s === 'closed') return 'destructive';
  return 'outline';
};

const statusBadgeClass = (s: string) => {
  if (s === 'Active' || s === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50';
  if (s === 'Expiring Soon') return 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50';
  if (s === 'Expired') return 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50';
  if (s === 'Suspended' || s === 'suspended') return 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100';
  return '';
};

const BULK_BATCH_SIZE = 100;
const PAGE_SIZE_OPTIONS = [25, 50, 100];

type TraderFilterOptions = {
  typeOfJobs: string[];
  categories: string[];
  addresses: string[];
};

function MultiSelectFilter({
  label,
  values,
  selected,
  onChange,
}: {
  label: string;
  values: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="justify-between border-[hsl(var(--app-flow-border))]">
          <span className="truncate">
            {selected.length ? `${label}: ${selected.length}` : label}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 max-h-72 overflow-y-auto">
        {selected.length > 0 && (
          <>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onChange([]); }}>
              Clear {label.toLowerCase()}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {values.length ? (
          values.map((value) => (
            <DropdownMenuCheckboxItem
              key={value}
              checked={selected.includes(value)}
              onCheckedChange={() => toggle(value)}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="truncate">{value}</span>
            </DropdownMenuCheckboxItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No options</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function traderRowToPayload(row: ParsedTraderRow) {
  const body: Record<string, string> = {
    fullName: row.fullName.trim(),
    tin: row.tin.replace(/\s+/g, ''),
  };
  if (row.phone?.trim()) body.phone = row.phone.replace(/\s+/g, '');
  if (row.nationalId?.trim()) body.nationalId = row.nationalId.trim();
  if (row.gender?.trim()) body.gender = row.gender.trim();
  if (row.address?.trim()) body.address = row.address.trim();
  if (row.typeOfJob?.trim()) body.typeOfJob = row.typeOfJob.trim();
  if (row.plateNumber?.trim()) body.plateNumber = row.plateNumber.trim();
  if (row.associationType?.trim()) body.associationType = row.associationType.trim();
  if (row.businessArea?.trim()) body.businessArea = row.businessArea.trim();
  if (row.category?.trim()) body.category = row.category.trim();
  return body;
}

function summarizeBulkImportResult(result: { created: number; failed: { error: string }[]; total: number }, batches: number) {
  const duplicateFailures = result.failed.filter((f) =>
    /TIN already exists|Phone number already exists/i.test(f.error),
  ).length;
  const duplicateOnly = result.failed.length > 0 && duplicateFailures === result.failed.length;
  if (duplicateOnly) {
    return {
      title: result.created > 0 ? 'Bulk import finished with duplicates' : 'Bulk import skipped duplicates',
      description:
        result.created > 0
          ? `Created ${result.created} new trader(s). Skipped ${duplicateFailures} duplicate row(s) across ${batches} batch(es).`
          : `No new traders were created because all ${duplicateFailures} row(s) already exist by TIN or phone.`,
      variant: 'default' as const,
    };
  }

  const failMsg =
    result.failed.length > 0
      ? `${result.failed.length} row(s) failed (see details below).`
      : 'All rows were accepted.';
  return {
    title: 'Bulk import finished',
    description: `Created ${result.created} of ${result.total} across ${batches} batch(es). ${failMsg}`,
    variant: result.failed.length > 0 && result.created === 0 ? ('destructive' as const) : ('default' as const),
  };
}

function formatCurrency(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function TradersPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [filterOptions, setFilterOptions] = useState<TraderFilterOptions>({ typeOfJobs: [], categories: [], addresses: [] });
  const [typeOfJobFilter, setTypeOfJobFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [addressFilter, setAddressFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<ParsedTraderRow[]>([]);
  const [bulkParseErrors, setBulkParseErrors] = useState<{ line: number; message: string }[]>([]);
  const [bulkPaste, setBulkPaste] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkServerResult, setBulkServerResult] = useState<{
    created: number;
    failed: { index: number; error: string }[];
    total: number;
  } | null>(null);
  const [taxBulkOpen, setTaxBulkOpen] = useState(false);
  const [taxRows, setTaxRows] = useState<ParsedAnnualTaxRow[]>([]);
  const [taxParseErrors, setTaxParseErrors] = useState<{ line: number; message: string }[]>([]);
  const [taxPaste, setTaxPaste] = useState('');
  const [taxImporting, setTaxImporting] = useState(false);
  const [taxServerResult, setTaxServerResult] = useState<{
    imported: number;
    updated: number;
    failed: { index: number; tin?: string; error: string }[];
    total: number;
  } | null>(null);

  const canCreate = hasPermission('traders.create');
  const canImportAnnualTax = hasPermission('payments.create') || hasPermission('finance.write');
  const canRead = hasPermission('traders.read');
  const canUpdate = hasPermission('traders.update');
  const canDelete = hasPermission('traders.delete');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(total, page * pageSize);
  const visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.traders.list({
        search: search || undefined,
        status: statusFilter || undefined,
        typeOfJob: typeOfJobFilter.length ? typeOfJobFilter.join(',') : undefined,
        category: categoryFilter.length ? categoryFilter.join(',') : undefined,
        address: addressFilter.length ? addressFilter.join(',') : undefined,
        licenseState: statusFilter || undefined,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, statusFilter, typeOfJobFilter, categoryFilter, addressFilter, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeOfJobFilter, categoryFilter, addressFilter, pageSize]);

  useEffect(() => {
    api.traders.filterOptions()
      .then(setFilterOptions)
      .catch((e) => toast({ title: 'Could not load filters', description: (e as Error).message, variant: 'destructive' }));
  }, []);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetBulkImport = () => {
    setBulkRows([]);
    setBulkParseErrors([]);
    setBulkPaste('');
    setBulkServerResult(null);
  };

  const applyParsedCsv = (text: string) => {
    const { rows, errors } = parseTradersCsv(text);
    setBulkRows(rows);
    setBulkParseErrors(errors);
    setBulkServerResult(null);
  };

  const resetTaxBulkImport = () => {
    setTaxRows([]);
    setTaxParseErrors([]);
    setTaxPaste('');
    setTaxServerResult(null);
  };

  const applyParsedTaxCsv = (text: string) => {
    const { rows, errors } = parseAnnualTaxCsv(text);
    setTaxRows(rows);
    setTaxParseErrors(errors);
    setTaxServerResult(null);
  };

  const downloadTraderTemplate = () => {
    const blob = new Blob([TRADER_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'traders-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAnnualTaxTemplate = () => {
    const blob = new Blob([ANNUAL_TAX_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annual-tax-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const runBulkImport = async () => {
    if (bulkRows.length === 0) {
      toast({ title: 'Nothing to import', description: 'Add a CSV file or paste rows first.', variant: 'destructive' });
      return;
    }
    setBulkImporting(true);
    setBulkServerResult(null);
    try {
      const traders = bulkRows.map(traderRowToPayload);
      const batches: object[][] = [];
      for (let i = 0; i < traders.length; i += BULK_BATCH_SIZE) {
        batches.push(traders.slice(i, i + BULK_BATCH_SIZE));
      }

      const combined = {
        created: 0,
        failed: [] as { index: number; error: string }[],
        total: traders.length,
      };
      for (let i = 0; i < batches.length; i++) {
        const startIndex = i * BULK_BATCH_SIZE;
        const res = await api.traders.bulkImport(batches[i]);
        combined.created += res.created;
        combined.failed.push(
          ...res.failed.map((failure) => ({
            index: startIndex + failure.index,
            error: failure.error,
          })),
        );
      }

      setBulkServerResult(combined);
      toast(summarizeBulkImportResult(combined, batches.length));
      await load();
    } catch (e) {
      toast({ title: 'Import failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setBulkImporting(false);
    }
  };

  const runTaxBulkImport = async () => {
    if (taxRows.length === 0) {
      toast({ title: 'Nothing to import', description: 'Add an annual tax CSV file or paste rows first.', variant: 'destructive' });
      return;
    }
    setTaxImporting(true);
    setTaxServerResult(null);
    try {
      const result = await api.traders.bulkImportAnnualTax(taxRows);
      setTaxServerResult(result);
      toast({
        title: 'Annual tax import finished',
        description: `${result.imported} imported, ${result.updated} updated, ${result.failed.length} failed.`,
        variant: result.failed.length > 0 && result.imported === 0 && result.updated === 0 ? 'destructive' : 'default',
      });
      await load();
    } catch (e) {
      toast({ title: 'Annual tax import failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setTaxImporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.traders.delete(deleteTarget.id);
      toast({ title: 'Trader removed', description: `${deleteTarget.name} was deleted.` });
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="app-flow-page space-y-6 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))]">
              <Users className="h-5 w-5" />
            </span>
            <span className="truncate">Traders</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
            Register and manage traders. Row actions use permissions (view, update, delete).
          </p>
        </div>
        {(canCreate || canImportAnnualTax) && (
          <div className="flex shrink-0 flex-wrap gap-2 justify-end">
            {canImportAnnualTax && (
              <Button
                variant="outline"
                className="border-[hsl(var(--app-flow-border))]"
                onClick={() => {
                  resetTaxBulkImport();
                  setTaxBulkOpen(true);
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import annual tax
              </Button>
            )}
            {canCreate && (
              <>
                <Button
                  variant="outline"
                  className="border-[hsl(var(--app-flow-border))]"
                  onClick={() => {
                    resetBulkImport();
                    setBulkOpen(true);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk import
                </Button>
                <Button
                  className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
                  onClick={() => navigate('/traders/register')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Register trader
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <Card className="app-flow-card mx-auto max-w-6xl overflow-hidden border-[hsl(var(--app-flow-border))]">
        <CardHeader className="border-b border-[hsl(var(--app-flow-border))] bg-muted/20 space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-4 w-4 text-[hsl(var(--app-flow-accent))]" />
                All traders
              </CardTitle>
              <CardDescription>Total: {total}</CardDescription>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search name, TIN, phone..."
                  className="pl-9 w-full border-[hsl(var(--app-flow-border))] lg:col-span-2"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <MultiSelectFilter
                label="Job type"
                values={filterOptions.typeOfJobs}
                selected={typeOfJobFilter}
                onChange={setTypeOfJobFilter}
              />
              <MultiSelectFilter
                label="Category"
                values={filterOptions.categories}
                selected={categoryFilter}
                onChange={setCategoryFilter}
              />
              <MultiSelectFilter
                label="Address"
                values={filterOptions.addresses}
                selected={addressFilter}
                onChange={setAddressFilter}
              />
              <Select value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger className="w-full border-[hsl(var(--app-flow-border))]">
                  <SelectValue placeholder="License status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All license statuses</SelectItem>
                  {LICENSE_STATUS_FILTERS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(search || statusFilter || typeOfJobFilter.length > 0 || categoryFilter.length > 0 || addressFilter.length > 0) && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-[hsl(var(--app-flow-border))]"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setTypeOfJobFilter([]);
                    setCategoryFilter([]);
                    setAddressFilter([]);
                  }}
                >
                  Reset filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsl(var(--app-flow-border))] hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>TIN</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">Type of job</TableHead>
                    <TableHead className="hidden lg:table-cell">Category</TableHead>
                    <TableHead className="hidden xl:table-cell">Address</TableHead>
                    <TableHead className="hidden lg:table-cell">Annual Tax Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Businesses</TableHead>
                    <TableHead className="w-[70px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((t) => {
                    const showActionsMenu = canRead || canUpdate || canDelete;
                    return (
                      <TableRow key={t.id} className="border-[hsl(var(--app-flow-border))]">
                        <TableCell className="font-medium max-w-[140px] truncate">{t.fullName}</TableCell>
                        <TableCell className="max-w-[160px] truncate text-muted-foreground">{t.tin ?? '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">{t.phone}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{t.typeOfJob ?? '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{t.category ?? '—'}</TableCell>
                        <TableCell className="hidden xl:table-cell max-w-[180px] truncate text-muted-foreground">{t.address ?? '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell whitespace-nowrap">
                          {t.annualTaxAmount != null ? (
                            <div>
                              <p className="font-medium">{formatCurrency(t.annualTaxAmount)}</p>
                              <p className="text-xs text-muted-foreground">{t.annualTaxYear}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusVariant(t.licenseStatus ?? t.status)}
                            className={statusBadgeClass(t.licenseStatus ?? t.status)}
                          >
                            {t.licenseStatus ?? t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{t.businesses?.length ?? 0}</TableCell>
                        <TableCell className="text-right">
                          {showActionsMenu ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open actions">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                {canRead && (
                                  <DropdownMenuItem onClick={() => navigate(`/traders/${t.id}`)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                )}
                                {canUpdate && (
                                  <DropdownMenuItem onClick={() => navigate(`/traders/${t.id}/edit`)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <>
                                    {(canRead || canUpdate) && <DropdownMenuSeparator />}
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => setDeleteTarget({ id: t.id, name: t.fullName })}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && items.length === 0 && (
            <p className="text-center text-muted-foreground py-10 px-4">No traders match your filters.</p>
          )}
          <div className="flex flex-col gap-4 border-t border-[hsl(var(--app-flow-border))] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
              <span>
                Showing <span className="font-medium text-foreground">{pageStart}</span>-<span className="font-medium text-foreground">{pageEnd}</span> of{' '}
                <span className="font-medium text-foreground">{total}</span> traders
              </span>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="h-9 w-32 border-[hsl(var(--app-flow-border))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={page === 1}
                    className={page === 1 ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                  />
                </PaginationItem>
                {visiblePages.map((p, idx) => {
                  const previous = visiblePages[idx - 1];
                  return (
                    <React.Fragment key={p}>
                      {previous && p - previous > 1 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          isActive={p === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(p);
                          }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    </React.Fragment>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={page === totalPages}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={bulkOpen}
        onOpenChange={(open) => {
          setBulkOpen(open);
          if (!open) resetBulkImport();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden border-[hsl(var(--app-flow-border))]">
          <DialogHeader className="p-6 pb-2 space-y-2 border-b border-[hsl(var(--app-flow-border))] bg-muted/15">
            <DialogTitle>Bulk import traders</DialogTitle>
            <DialogDescription>
              Upload a UTF-8 CSV with columns: fullName, tin (required); gender, nationalId, address, typeOfJob, phone, plateNumber, associationType,
              businessArea, category (optional). Phone and TIN are unique. Large files are imported automatically in {BULK_BATCH_SIZE}-row batches.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="border-[hsl(var(--app-flow-border))]" onClick={downloadTraderTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download template
              </Button>
              <label className="inline-flex">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (!f) return;
                    try {
                      const text = await f.text();
                      applyParsedCsv(text);
                    } catch (err) {
                      toast({ title: 'Could not read file', description: (err as Error).message, variant: 'destructive' });
                    }
                  }}
                />
                <Button type="button" variant="secondary" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose CSV
                  </span>
                </Button>
              </label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-csv-paste">Or paste CSV</Label>
              <Textarea
                id="bulk-csv-paste"
                placeholder={'fullName,tin,phone\nJane Doe,TIN-00001,+251911000000'}
                className="min-h-[100px] font-mono text-sm border-[hsl(var(--app-flow-border))]"
                value={bulkPaste}
                onChange={(e) => setBulkPaste(e.target.value)}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => applyParsedCsv(bulkPaste)}>
                Parse pasted text
              </Button>
            </div>
            {bulkParseErrors.length > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <p className="font-medium text-destructive mb-1">Skipped rows (fix and re-import)</p>
                <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground max-h-28 overflow-y-auto">
                  {bulkParseErrors.map((err, i) => (
                    <li key={i}>
                      Line {err.line}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {bulkRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Preview: {bulkRows.length} row{bulkRows.length !== 1 ? 's' : ''}
                  {bulkRows.length > 25 ? ' (showing first 25)' : ''}
                </p>
                <div className="rounded-md border border-[hsl(var(--app-flow-border))] overflow-x-auto max-h-48 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="whitespace-nowrap">Name</TableHead>
                        <TableHead className="whitespace-nowrap">Phone</TableHead>
                        <TableHead className="whitespace-nowrap">TIN</TableHead>
                        <TableHead className="whitespace-nowrap hidden sm:table-cell">Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkRows.slice(0, 25).map((r, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="max-w-[140px] truncate">{r.fullName}</TableCell>
                          <TableCell className="whitespace-nowrap">{r.phone}</TableCell>
                          <TableCell className="max-w-[160px] truncate text-muted-foreground">{r.tin}</TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">{r.category ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            {bulkServerResult && (
              <div className="rounded-md border border-[hsl(var(--app-flow-border))] bg-muted/20 p-3 text-sm space-y-2">
                <p>
                  <span className="font-medium text-foreground">{bulkServerResult.created}</span> created,{' '}
                  <span className="font-medium text-destructive">{bulkServerResult.failed.length}</span> failed (of {bulkServerResult.total}).
                </p>
                {bulkServerResult.failed.length > 0 && (
                  <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground max-h-32 overflow-y-auto">
                    {bulkServerResult.failed.map((f, i) => (
                      <li key={i}>
                        Row {f.index + 1}: {f.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="p-6 pt-2 border-t border-[hsl(var(--app-flow-border))] bg-muted/10 sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => setBulkOpen(false)}>
              Close
            </Button>
            <Button
              type="button"
              disabled={bulkRows.length === 0 || bulkImporting}
              className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
              onClick={runBulkImport}
            >
              {bulkImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing…
                </>
              ) : (
                `Import ${bulkRows.length} trader${bulkRows.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={taxBulkOpen}
        onOpenChange={(open) => {
          setTaxBulkOpen(open);
          if (!open) resetTaxBulkImport();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden border-[hsl(var(--app-flow-border))]">
          <DialogHeader className="p-6 pb-2 space-y-2 border-b border-[hsl(var(--app-flow-border))] bg-muted/15">
            <DialogTitle>Bulk import annual tax</DialogTitle>
            <DialogDescription>
              Upload a UTF-8 CSV with columns: TIN, Amount, Year. Records are matched by TIN and annual tax records for the same year are updated.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="border-[hsl(var(--app-flow-border))]" onClick={downloadAnnualTaxTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download template
              </Button>
              <label className="inline-flex">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (!f) return;
                    try {
                      const text = await f.text();
                      applyParsedTaxCsv(text);
                    } catch (err) {
                      toast({ title: 'Could not read file', description: (err as Error).message, variant: 'destructive' });
                    }
                  }}
                />
                <Button type="button" variant="secondary" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose CSV
                  </span>
                </Button>
              </label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual-tax-csv-paste">Or paste CSV</Label>
              <Textarea
                id="annual-tax-csv-paste"
                placeholder={'TIN,Amount,Year\nTIN-00001,2500,2026'}
                className="min-h-[100px] font-mono text-sm border-[hsl(var(--app-flow-border))]"
                value={taxPaste}
                onChange={(e) => setTaxPaste(e.target.value)}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => applyParsedTaxCsv(taxPaste)}>
                Parse pasted text
              </Button>
            </div>
            {taxParseErrors.length > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <p className="font-medium text-destructive mb-1">Skipped rows (fix and re-import)</p>
                <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground max-h-28 overflow-y-auto">
                  {taxParseErrors.map((err, i) => (
                    <li key={i}>
                      Line {err.line}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {taxRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Preview: {taxRows.length} row{taxRows.length !== 1 ? 's' : ''}
                  {taxRows.length > 25 ? ' (showing first 25)' : ''}
                </p>
                <div className="rounded-md border border-[hsl(var(--app-flow-border))] overflow-x-auto max-h-48 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="whitespace-nowrap">TIN</TableHead>
                        <TableHead className="whitespace-nowrap">Amount</TableHead>
                        <TableHead className="whitespace-nowrap">Year</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxRows.slice(0, 25).map((r, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="max-w-[180px] truncate">{r.tin}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatCurrency(r.amount)}</TableCell>
                          <TableCell className="text-muted-foreground">{r.year}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            {taxServerResult && (
              <div className="rounded-md border border-[hsl(var(--app-flow-border))] bg-muted/20 p-3 text-sm space-y-2">
                <p>
                  <span className="font-medium text-foreground">{taxServerResult.imported}</span> imported,{' '}
                  <span className="font-medium text-foreground">{taxServerResult.updated}</span> updated,{' '}
                  <span className="font-medium text-destructive">{taxServerResult.failed.length}</span> failed (of {taxServerResult.total}).
                </p>
                {taxServerResult.failed.length > 0 && (
                  <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground max-h-32 overflow-y-auto">
                    {taxServerResult.failed.map((f, i) => (
                      <li key={i}>
                        Row {f.index + 1}{f.tin ? ` (${f.tin})` : ''}: {f.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="p-6 pt-2 border-t border-[hsl(var(--app-flow-border))] bg-muted/10 sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => setTaxBulkOpen(false)}>
              Close
            </Button>
            <Button
              type="button"
              disabled={taxRows.length === 0 || taxImporting}
              className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
              onClick={runTaxBulkImport}
            >
              {taxImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing…
                </>
              ) : (
                `Import ${taxRows.length} tax row${taxRows.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete trader?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-medium text-foreground">{deleteTarget?.name}</span> and related businesses
              and licenses (cascade). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
