import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Archive, Search, Loader2 } from 'lucide-react';
import { api } from '@/services/api';

export default function ArchivePage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ traderDocuments: any[]; businessDocuments: any[] } | null>(null);

  const search = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.documents.search(query || undefined);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Archive className="h-8 w-8" /> Digital Archive</h1>
        <p className="text-muted-foreground">Searchable document storage attached to traders and businesses</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Search archive</CardTitle><CardDescription>By document name or type</CardDescription></CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
          <Button onClick={search} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader><CardTitle>Results</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {result.traderDocuments?.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Trader documents</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {result.traderDocuments.map((d) => (
                    <li key={d.id}>{d.name} ({d.type}) — {d.trader?.fullName}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.businessDocuments?.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Business documents</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {result.businessDocuments.map((d) => (
                    <li key={d.id}>{d.name} ({d.type}) — {d.business?.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {(!result.traderDocuments?.length && !result.businessDocuments?.length) && (
              <p className="text-muted-foreground">No documents found</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
