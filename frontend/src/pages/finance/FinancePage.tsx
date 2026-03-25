import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Loader2 } from 'lucide-react';
import { api } from '@/services/api';

export default function FinancePage() {
  const [revenue, setRevenue] = useState<{ totalRevenue: number; paymentCount: number; year: number } | null>(null);
  const [payments, setPayments] = useState<{ items: any[]; total: number }>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rev, pay] = await Promise.all([api.finance.revenue(), api.finance.payments({ take: 20 })]);
        setRevenue(rev);
        setPayments(pay);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-8 w-8" /> Finance & Tax</h1>
        <p className="text-muted-foreground">Tax and fee management, payment records</p>
      </div>
      {revenue && (
        <Card>
          <CardHeader><CardTitle>Revenue summary</CardTitle><CardDescription>Year {revenue.year}</CardDescription></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(revenue.totalRevenue).toLocaleString()} ETB</div>
            <p className="text-sm text-muted-foreground">{revenue.paymentCount} payments</p>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>Recent payments</CardTitle><CardDescription>Total: {payments.total}</CardDescription></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead><TableHead>Amount</TableHead><TableHead>Year</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.business?.name ?? '-'}</TableCell>
                    <TableCell>{Number(p.amount).toLocaleString()} ETB</TableCell>
                    <TableCell>{p.year}</TableCell>
                    <TableCell><Badge>{p.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
