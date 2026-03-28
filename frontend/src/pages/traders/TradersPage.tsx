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
import { Users, Plus, Search, Loader2, MoreHorizontal, Eye, Pencil, Trash2, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const TRADER_STATUSES = ['draft', 'submitted', 'verified', 'active', 'suspended', 'closed'];

const statusVariant = (s: string) => {
  if (s === 'active') return 'default';
  if (s === 'draft') return 'secondary';
  if (s === 'suspended' || s === 'closed') return 'destructive';
  return 'outline';
};

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
          <div className="flex shrink-0">
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
