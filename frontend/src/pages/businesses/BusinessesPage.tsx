import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Briefcase, Plus, Search, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const BUSINESS_STATUSES = ['draft', 'pending', 'active', 'suspended', 'closed'];

const emptyForm = () => ({
  traderId: '',
  name: '',
  category: '',
  type: '',
  woreda: '',
  kebele: '',
  shopNo: '',
  startDate: '',
  address: '',
  phone: '',
  tin: '',
  status: 'pending',
});

export default function BusinessesPage() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [traders, setTraders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const canCreate = hasPermission('businesses.create') || hasPermission('*');

  const load = async () => {
    setLoading(true);
    try {
      const [res, tr] = await Promise.all([
        api.businesses.list({ search: search || undefined, take: 50 }),
        api.traders.list({ take: 200 }),
      ]);
      setItems(res.items);
      setTotal(res.total);
      setTraders(tr.items);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.traderId || !form.name || !form.category) {
      toast({ title: 'Missing required fields', variant: 'destructive' });
      return;
    }
    try {
      const payload: Record<string, string> = {
        traderId: form.traderId,
        name: form.name,
        category: form.category,
      };
      if (form.type) payload.type = form.type;
      if (form.woreda) payload.woreda = form.woreda;
      if (form.kebele) payload.kebele = form.kebele;
      if (form.shopNo) payload.shopNo = form.shopNo;
      if (form.startDate) payload.startDate = form.startDate;
      if (form.address) payload.address = form.address;
      if (form.phone) payload.phone = form.phone;
      if (form.tin) payload.tin = form.tin;
      if (form.status) payload.status = form.status;
      await api.businesses.create(payload);
      toast({ title: 'Business registered' });
      setOpen(false);
      setForm(emptyForm());
      load();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-8 w-8" />
          Businesses
        </h1>
        <p className="text-muted-foreground">Manage business licenses and profiles</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All businesses</CardTitle>
            <CardDescription>Total: {total}</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {canCreate && (
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add business
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Trader</TableHead>
                  <TableHead>Woreda</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.category}</TableCell>
                    <TableCell>{b.type ?? '-'}</TableCell>
                    <TableCell>{b.trader?.fullName ?? '-'}</TableCell>
                    <TableCell>{b.woreda ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant={b.status === 'active' ? 'default' : 'secondary'}>
                        {b.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && items.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No businesses found</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Register business</DialogTitle>
            <CardDescription>Link a business to a trader</CardDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
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
                      {t.fullName} ({t.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Business name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Input
                  placeholder="e.g. Retail, Food, Services"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Input
                  placeholder="e.g. retail, wholesale"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Woreda</Label>
                <Input
                  value={form.woreda}
                  onChange={(e) => setForm((f) => ({ ...f, woreda: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Kebele</Label>
                <Input
                  value={form.kebele}
                  onChange={(e) => setForm((f) => ({ ...f, kebele: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shop number</Label>
                <Input
                  value={form.shopNo}
                  onChange={(e) => setForm((f) => ({ ...f, shopNo: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>TIN</Label>
                <Input
                  value={form.tin}
                  onChange={(e) => setForm((f) => ({ ...f, tin: e.target.value }))}
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
                  {BUSINESS_STATUSES.map((s) => (
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
              <Button type="submit">Register</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
