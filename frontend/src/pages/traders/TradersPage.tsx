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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, Plus, Search, Loader2, MoreHorizontal, Eye, Pencil, Trash2, Sparkles, Upload, Download } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { parseTradersCsv, TRADER_CSV_TEMPLATE, type ParsedTraderRow } from '@/lib/traderImportCsv';

const TRADER_STATUSES = ['draft', 'submitted', 'verified', 'active', 'suspended', 'closed'];

const statusVariant = (s: string) => {
  if (s === 'active') return 'default';
  if (s === 'draft') return 'secondary';
  if (s === 'suspended' || s === 'closed') return 'destructive';
  return 'outline';
};

const BULK_MAX = 500;

function traderRowToPayload(row: ParsedTraderRow) {
  const body: Record<string, string> = {
    fullName: row.fullName.trim(),
    phone: row.phone.trim(),
    email: row.email.trim(),
  };
  if (row.nationalId?.trim()) body.nationalId = row.nationalId.trim();
  if (row.gender?.trim()) body.gender = row.gender.trim();
  if (row.dob?.trim()) body.dob = row.dob.trim();
  if (row.address?.trim()) body.address = row.address.trim();
  if (row.woreda?.trim()) body.woreda = row.woreda.trim();
  if (row.kebele?.trim()) body.kebele = row.kebele.trim();
  return body;
}

export default function TradersPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
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

  const canCreate = hasPermission('traders.create');
  const canRead = hasPermission('traders.read');
  const canUpdate = hasPermission('traders.update');
  const canDelete = hasPermission('traders.delete');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.traders.list({
        search: search || undefined,
        status: statusFilter || undefined,
        take: 50,
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
  }, [search, statusFilter]);

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

  const downloadTraderTemplate = () => {
    const blob = new Blob([TRADER_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'traders-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const runBulkImport = async () => {
    if (bulkRows.length === 0) {
      toast({ title: 'Nothing to import', description: 'Add a CSV file or paste rows first.', variant: 'destructive' });
      return;
    }
    if (bulkRows.length > BULK_MAX) {
      toast({
        title: 'Too many rows',
        description: `Maximum ${BULK_MAX} traders per import. You have ${bulkRows.length}.`,
        variant: 'destructive',
      });
      return;
    }
    setBulkImporting(true);
    setBulkServerResult(null);
    try {
      const traders = bulkRows.map(traderRowToPayload);
      const res = await api.traders.bulkImport(traders);
      setBulkServerResult(res);
      const failMsg =
        res.failed.length > 0
          ? `${res.failed.length} row(s) failed (see details below).`
          : 'All rows were accepted.';
      toast({
        title: 'Bulk import finished',
        description: `Created ${res.created} of ${res.total}. ${failMsg}`,
        variant: res.failed.length > 0 && res.created === 0 ? 'destructive' : 'default',
      });
      await load();
    } catch (e) {
      toast({ title: 'Import failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setBulkImporting(false);
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
        {canCreate && (
          <div className="flex shrink-0 flex-wrap gap-2 justify-end">
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search name, email, phone..."
                  className="pl-9 w-full sm:w-64 border-[hsl(var(--app-flow-border))]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger className="w-full sm:w-40 border-[hsl(var(--app-flow-border))]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All statuses</SelectItem>
                  {TRADER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden md:table-cell">National ID</TableHead>
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
                        <TableCell className="max-w-[160px] truncate text-muted-foreground">{t.email}</TableCell>
                        <TableCell className="whitespace-nowrap">{t.phone}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{t.nationalId ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
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
              Upload a UTF-8 CSV with columns: fullName, phone, email (required); nationalId, gender, dob, address, woreda, kebele (optional). Up to 500
              rows per request.
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
                placeholder={'fullName,phone,email\nJane Doe,+251911000000,jane@example.com'}
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
                        <TableHead className="whitespace-nowrap">Email</TableHead>
                        <TableHead className="whitespace-nowrap hidden sm:table-cell">National ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkRows.slice(0, 25).map((r, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="max-w-[140px] truncate">{r.fullName}</TableCell>
                          <TableCell className="whitespace-nowrap">{r.phone}</TableCell>
                          <TableCell className="max-w-[160px] truncate text-muted-foreground">{r.email}</TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">{r.nationalId ?? '—'}</TableCell>
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
