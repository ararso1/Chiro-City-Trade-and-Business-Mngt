import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { api } from '@/services/api';

export default function InspectionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.inspections.list({ take: 50 });
        setItems(res.items);
        setTotal(res.total);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck className="h-8 w-8" /> Inspections</h1>
        <p className="text-muted-foreground">Business inspections and compliance</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Inspections</CardTitle><CardDescription>Total: {total}</CardDescription></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead><TableHead>Scheduled</TableHead><TableHead>Inspector</TableHead><TableHead>Status</TableHead><TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.business?.name ?? '-'}</TableCell>
                    <TableCell>{i.scheduledAt ? new Date(i.scheduledAt).toLocaleString() : '-'}</TableCell>
                    <TableCell>{i.inspector?.name ?? '-'}</TableCell>
                    <TableCell><Badge>{i.status}</Badge></TableCell>
                    <TableCell>{i.result ?? '-'}</TableCell>
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
