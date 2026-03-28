import React, { useEffect, useMemo, useState } from 'react';
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
import { Briefcase, Eye, Loader2, MoreHorizontal, Pencil, Search, Sparkles, Trash2, Users } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const BUSINESS_STATUSES = ['draft', 'pending', 'active', 'suspended', 'closed'];

const statusVariant = (s: string) => {
  if (s === 'active') return 'default';
  if (s === 'pending' || s === 'draft') return 'secondary';
  if (s === 'suspended' || s === 'closed') return 'destructive';
  return 'outline';
};

export default function BusinessesPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canRead = hasPermission('businesses.read');
  const canUpdate = hasPermission('businesses.update');
  const canDelete = hasPermission('businesses.delete');

  const showActions = useMemo(() => canRead || canUpdate || canDelete, [canDelete, canRead, canUpdate]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.businesses.list({
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
      await api.businesses.delete(deleteTarget.id);
      toast({ title: 'Business removed', description: `${deleteTarget.name} was deleted.` });
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
              <Briefcase className="h-5 w-5" />
            </span>
            <span className="truncate">Businesses</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
            View and manage business profiles created during trader registration (RBAC protected).
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" className="border-[hsl(var(--app-flow-border))]" onClick={() => navigate('/traders')}>
            <Users className="h-4 w-4 mr-2" />
            Traders
          </Button>
        </div>
      </div>

      <Card className="app-flow-card mx-auto max-w-6xl overflow-hidden border-[hsl(var(--app-flow-border))]">
        <CardHeader className="border-b border-[hsl(var(--app-flow-border))] bg-muted/20 space-y-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-4 w-4 text-[hsl(var(--app-flow-accent))]" />
              All businesses
            </CardTitle>
            <CardDescription>Total: {total}</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, category..."
                className="pl-9 w-full sm:w-72 border-[hsl(var(--app-flow-border))]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-44 border-[hsl(var(--app-flow-border))]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                {BUSINESS_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
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
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Trader</TableHead>
                    <TableHead className="hidden md:table-cell">Woreda</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((b) => (
                    <TableRow key={b.id} className="border-[hsl(var(--app-flow-border))]">
                      <TableCell className="font-medium max-w-[220px] truncate">{b.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[180px] truncate">{b.category}</TableCell>
                      <TableCell className="hidden md:table-cell">{b.type ?? '—'}</TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {b.trader?.id ? (
                          <Button variant="link" className="h-auto p-0" onClick={() => navigate(`/traders/${b.trader.id}`)}>
                            {b.trader?.fullName}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{b.woreda ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {showActions ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {b.trader?.id && (
                                <DropdownMenuItem onClick={() => navigate(`/traders/${b.trader.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View trader
                                </DropdownMenuItem>
                              )}
                              {canUpdate && (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      await api.businesses.update(b.id, { status: b.status === 'active' ? 'suspended' : 'active' });
                                      toast({ title: 'Updated', description: 'Business status updated.' });
                                      load();
                                    } catch (e) {
                                      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                                    }
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Toggle status
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteTarget({ id: b.id, name: b.name })}
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
          {!loading && items.length === 0 && (
            <p className="text-center text-muted-foreground py-10 px-4">No businesses match your filters.</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete business?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-medium text-foreground">{deleteTarget?.name}</span> and its licenses (cascade).
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
