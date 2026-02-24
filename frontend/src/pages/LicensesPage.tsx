import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Search, Loader2 } from 'lucide-react';
import { api } from '@/services/api';

export default function LicensesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.licenses.list({ status: status || undefined, take: 50 });
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-8 w-8" /> Licenses</h1>
        <p className="text-muted-foreground">Business licenses and renewals</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Licenses</CardTitle><CardDescription>Total: {total}</CardDescription></div>
          <Input placeholder="Filter by status" className="w-48" value={status} onChange={(e) => setStatus(e.target.value)} />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License #</TableHead><TableHead>Type</TableHead><TableHead>Business</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.licenseNumber}</TableCell>
                    <TableCell>{l.licenseType}</TableCell>
                    <TableCell>{l.business?.name ?? '-'}</TableCell>
                    <TableCell>{l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : '-'}</TableCell>
                    <TableCell><Badge variant={l.status === 'active' ? 'default' : 'destructive'}>{l.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && items.length === 0 && <p className="text-center text-muted-foreground py-8">No licenses found</p>}
        </CardContent>
      </Card>
    </div>
  );
}
