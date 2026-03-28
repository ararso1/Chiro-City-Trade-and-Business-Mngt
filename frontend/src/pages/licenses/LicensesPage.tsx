import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
import { FileText, Plus, Search, Loader2, MoreHorizontal, Eye, Pencil, Trash2, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const LICENSE_STATUSES = ['application', 'review', 'approval', 'issued', 'renew', 'expired'];

const statusVariant = (s: string) => {
  if (s === 'issued') return 'default';
  if (s === 'application' || s === 'review') return 'secondary';
  if (s === 'expired') return 'destructive';
  return 'outline';
};

const emptyForm = () => ({
  businessId: '',
  traderId: '',
  licenseNo: '',
  licenseType: '',
  issueDate: '',
  expiryDate: '',
  status: 'application',
});

export default function LicensesPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [traderFilter, setTraderFilter] = useState<string>('');
  const [businessFilter, setBusinessFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [traders, setTraders] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; no: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canCreate = hasPermission('licenses.create');
  const canUpdate = hasPermission('licenses.update');
  const canDelete = hasPermission('licenses.delete');
  const canRead = hasPermission('licenses.read');

  const showActions = useMemo(() => canRead || canUpdate || canDelete, [canDelete, canRead, canUpdate]);

  const load = async () => {
    setLoading(true);
    try {
      const [res, biz, tr] = await Promise.all([
        api.licenses.list({
          status: statusFilter || undefined,
          traderId: traderFilter || undefined,
          businessId: businessFilter || undefined,
          take: 50,
        }),
        api.businesses.list({ take: 200 }),
        api.traders.list({ take: 200 }),
      ]);
      setItems(res.items);
      setTotal(res.total);
      setBusinesses(biz.items);
      setTraders(tr.items);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter, traderFilter, businessFilter]);

  const onBusinessSelect = (businessId: string) => {
    const b = businesses.find((x) => x.id === businessId);
    setForm((f) => ({ ...f, businessId, traderId: b?.trader?.id ?? f.traderId }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessId || !form.traderId) {
      toast({ title: 'Business and Trader required', variant: 'destructive' });
      return;
    }
    try {
      const payload: Record<string, string> = {
        businessId: form.businessId,
        traderId: form.traderId,
        status: form.status,
      };
      if (form.licenseNo) payload.licenseNo = form.licenseNo;
      if (form.licenseType) payload.licenseType = form.licenseType;
      if (form.issueDate) payload.issueDate = form.issueDate;
      if (form.expiryDate) payload.expiryDate = form.expiryDate;
      await api.licenses.create(payload);
      toast({ title: 'License application created' });
      setOpen(false);
      setForm(emptyForm());
      load();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString() : '-';

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((l) => {
      const parts = [
        l.licenseNo,
        l.licenseType,
        l.status,
        l.business?.name,
        l.trader?.fullName,
      ]
        .filter(Boolean)
        .map((x: any) => String(x).toLowerCase());
      return parts.some((p: string) => p.includes(q));
    });
  }, [items, search]);

  const openEdit = (l: any) => {
    if (!canUpdate) return;
    setEdit({
      id: l.id,
      licenseNo: l.licenseNo ?? '',
      licenseType: l.licenseType ?? '',
      issueDate: l.issueDate ? String(l.issueDate).slice(0, 10) : '',
      expiryDate: l.expiryDate ? String(l.expiryDate).slice(0, 10) : '',
      status: l.status ?? 'application',
    });
    setEditOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit?.id) return;
    try {
      await api.licenses.update(edit.id, {
        licenseType: edit.licenseType || undefined,
        issueDate: edit.issueDate || undefined,
        expiryDate: edit.expiryDate || undefined,
        status: edit.status,
      });
      toast({ title: 'Updated', description: 'License updated.' });
      setEditOpen(false);
      setEdit(null);
      load();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.licenses.delete(deleteTarget.id);
      toast({ title: 'License removed', description: `${deleteTarget.no} was deleted.` });
      setDeleteTarget(null);
      load();
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
              <FileText className="h-5 w-5" />
            </span>
            <span className="truncate">Licenses</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            Business licenses workflow: Application → Review → Approval → Issued → Renew → Expired (RBAC protected).
          </p>
        </div>
        {canCreate && (
          <div className="flex shrink-0">
            <Button
              className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
              onClick={() => setOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> New application
            </Button>
          </div>
        )}
      </div>

      <Card className="app-flow-card mx-auto max-w-6xl overflow-hidden border-[hsl(var(--app-flow-border))]">
        <CardHeader className="border-b border-[hsl(var(--app-flow-border))] bg-muted/20 space-y-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-4 w-4 text-[hsl(var(--app-flow-accent))]" />
              All licenses
            </CardTitle>
            <CardDescription>Total: {total}</CardDescription>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search license, business, trader..."
                className="pl-9 border-[hsl(var(--app-flow-border))]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="border-[hsl(var(--app-flow-border))]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                {LICENSE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={traderFilter || '__all__'} onValueChange={(v) => setTraderFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="border-[hsl(var(--app-flow-border))]">
                <SelectValue placeholder="Trader" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All traders</SelectItem>
                {traders.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={businessFilter || '__all__'} onValueChange={(v) => setBusinessFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="border-[hsl(var(--app-flow-border))]">
                <SelectValue placeholder="Business" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All businesses</SelectItem>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsl(var(--app-flow-border))] hover:bg-transparent">
                    <TableHead>License #</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead className="hidden md:table-cell">Trader</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Issue</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Issued by</TableHead>
                    <TableHead className="w-[70px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((l) => (
                    <TableRow key={l.id} className="border-[hsl(var(--app-flow-border))]">
                      <TableCell className="font-medium whitespace-nowrap">{l.licenseNo}</TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">{l.business?.name ?? '—'}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[220px] truncate">
                        {l.trader?.id ? (
                          <Button variant="link" className="h-auto p-0" onClick={() => navigate(`/traders/${l.trader.id}`)}>
                            {l.trader?.fullName}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[170px] truncate">{l.licenseType ?? '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(l.issueDate)}</TableCell>
                      <TableCell>{formatDate(l.expiryDate)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(l.status)}>{l.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{l.issuedBy?.name ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        {showActions ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {l.trader?.id && (
                                <DropdownMenuItem onClick={() => navigate(`/traders/${l.trader.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View trader
                                </DropdownMenuItem>
                              )}
                              {canUpdate && (
                                <DropdownMenuItem onClick={() => openEdit(l)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteTarget({ id: l.id, no: l.licenseNo })}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && filteredItems.length === 0 && (
            <p className="text-center text-muted-foreground py-10 px-4">No licenses match your filters.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-[hsl(var(--app-flow-border))]">
          <DialogHeader>
            <DialogTitle>New license application</DialogTitle>
            <CardDescription>Create a license application (Application → Review → Approval → Issue)</CardDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Business *</Label>
              <Select
                value={form.businessId}
                onValueChange={onBusinessSelect}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.trader?.fullName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trader *</Label>
              <Select
                value={form.traderId}
                onValueChange={(v) => setForm((f) => ({ ...f, traderId: v }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trader" />
                </SelectTrigger>
                <SelectContent>
                  {traders.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>License # (optional, auto-generated)</Label>
                <Input
                  value={form.licenseNo}
                  onChange={(e) => setForm((f) => ({ ...f, licenseNo: e.target.value }))}
                  placeholder="Leave blank to auto-generate"
                />
              </div>
              <div className="space-y-2">
                <Label>License type</Label>
                <Input
                  placeholder="e.g. annual_trading"
                  value={form.licenseType}
                  onChange={(e) => setForm((f) => ({ ...f, licenseType: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue date</Label>
                <Input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry date</Label>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEdit(null); }}>
        <DialogContent className="max-w-md border-[hsl(var(--app-flow-border))]">
          <DialogHeader>
            <DialogTitle>Edit license</DialogTitle>
            <CardDescription>Update status and key dates. Issued-by is auto-set when status becomes issued.</CardDescription>
          </DialogHeader>
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={edit?.status ?? 'application'} onValueChange={(v) => setEdit((x: any) => ({ ...x, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>License type</Label>
              <Input value={edit?.licenseType ?? ''} onChange={(e) => setEdit((x: any) => ({ ...x, licenseType: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue date</Label>
                <Input type="date" value={edit?.issueDate ?? ''} onChange={(e) => setEdit((x: any) => ({ ...x, issueDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Expiry date</Label>
                <Input type="date" value={edit?.expiryDate ?? ''} onChange={(e) => setEdit((x: any) => ({ ...x, expiryDate: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete license?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-medium text-foreground">{deleteTarget?.no}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
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
