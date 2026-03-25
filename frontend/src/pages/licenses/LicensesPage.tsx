import React, { useState, useEffect } from 'react';
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
import { FileText, Plus, Search, Loader2 } from 'lucide-react';
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
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [traders, setTraders] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm());
  const canCreate = hasPermission('licenses.create') || hasPermission('*');

  const load = async () => {
    setLoading(true);
    try {
      const [res, biz, tr] = await Promise.all([
        api.licenses.list({ status: statusFilter || undefined, take: 50 }),
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
  }, [statusFilter]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" /> Licenses
        </h1>
        <p className="text-muted-foreground">Business licenses – Application → Review → Approval → Issue → Renew → Expire</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All licenses</CardTitle>
            <CardDescription>Total: {total}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select
              value={statusFilter || '__all__'}
              onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {LICENSE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canCreate && (
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> New application
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
                  <TableHead>License #</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Trader</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.licenseNo}</TableCell>
                    <TableCell>{l.business?.name ?? '-'}</TableCell>
                    <TableCell>{l.trader?.fullName ?? '-'}</TableCell>
                    <TableCell>{l.licenseType ?? '-'}</TableCell>
                    <TableCell>{formatDate(l.issueDate)}</TableCell>
                    <TableCell>{formatDate(l.expiryDate)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(l.status)}>{l.status}</Badge>
                    </TableCell>
                    <TableCell>{l.issuedBy?.name ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && items.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No licenses found</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
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
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
