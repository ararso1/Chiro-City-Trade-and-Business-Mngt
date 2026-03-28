import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Archive, Download, FileUp, Loader2, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { api, getApiBase, getAuthToken } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const DOC_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'id_copy', label: 'ID copy' },
  { value: 'photo', label: 'Photo' },
  { value: 'license', label: 'License' },
  { value: 'contract', label: 'Contract' },
  { value: 'tax_document', label: 'Tax document' },
  { value: 'annual_tax_payment', label: 'Annual tax payment' },
  { value: 'penalty_payment', label: 'Penalty payment' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'other', label: 'Other' },
];

export default function ArchivePage() {
  const { hasPermission } = useAuth();
  const canUpload = hasPermission('documents.create');
  const canUpdate = hasPermission('documents.update');
  const canDelete = hasPermission('documents.delete');

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ traderDocuments: any[]; businessDocuments: any[] } | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [traders, setTraders] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [scope, setScope] = useState<'trader' | 'business'>('trader');
  const [upload, setUpload] = useState<{ traderId: string; type: string; name: string; file: File | null }>({
    traderId: '',
    type: 'id_copy',
    name: '',
    file: null,
  });
  const [uploadBiz, setUploadBiz] = useState<{ businessId: string; type: string; name: string; file: File | null }>({
    businessId: '',
    type: 'id_copy',
    name: '',
    file: null,
  });

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<{ scope: 'trader' | 'business'; id: string; name: string; type: string } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [listLoading, setListLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const search = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.documents.search(query || undefined, typeFilter || undefined);
      setResult(res);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // preload traders list for uploads (small)
    api.traders.list({ take: 200 }).then((r) => setTraders(r.items)).catch(() => {});
    api.businesses.list({ take: 200 }).then((r) => setBusinesses(r.items)).catch(() => {});
  }, []);

  const traderDocs = useMemo(() => result?.traderDocuments ?? [], [result]);

  const downloadTraderDoc = async (docId: string, suggestedName?: string) => {
    const base = getApiBase();
    const token = getAuthToken();
    const res = await fetch(`${base}/documents/trader-doc/${docId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName || 'document';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const doUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (scope === 'trader') {
        if (!upload.traderId || !upload.type || !upload.file) {
          toast({ title: 'Missing fields', description: 'Trader, type and file are required.', variant: 'destructive' });
          return;
        }
        await api.documents.uploadTrader(upload.traderId, {
          type: upload.type,
          name: upload.name || undefined,
          file: upload.file,
        });
      } else {
        if (!uploadBiz.businessId || !uploadBiz.type || !uploadBiz.file) {
          toast({ title: 'Missing fields', description: 'Business, type and file are required.', variant: 'destructive' });
          return;
        }
        await api.documents.uploadBusiness(uploadBiz.businessId, {
          type: uploadBiz.type,
          name: uploadBiz.name || undefined,
          file: uploadBiz.file,
        });
      }
      toast({ title: 'Uploaded', description: `Document was attached to the ${scope}.` });
      setUploadOpen(false);
      setUpload({ traderId: '', type: 'id_copy', name: '', file: null });
      setUploadBiz({ businessId: '', type: 'id_copy', name: '', file: null });
      await search();
    } catch (e2) {
      toast({ title: 'Error', description: (e2 as Error).message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const loadList = async () => {
    setListLoading(true);
    try {
      const res = await api.documents.list({
        scope,
        query: query || undefined,
        type: typeFilter || undefined,
        take: 50,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, [scope, query, typeFilter]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (scope === 'trader') {
        await api.documents.deleteTraderDoc(deleteTarget.id);
      } else {
        await api.documents.deleteBusinessDoc(deleteTarget.id);
      }
      toast({ title: 'Deleted', description: 'Document removed.' });
      setDeleteTarget(null);
      await loadList();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (d: any) => {
    if (!canUpdate) return;
    setEdit({ scope, id: d.id, name: d.name ?? '', type: d.type ?? 'other' });
    setEditOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setSavingEdit(true);
    try {
      if (edit.scope === 'trader') {
        await api.documents.updateTraderDoc(edit.id, { name: edit.name, type: edit.type });
      } else {
        await api.documents.updateBusinessDoc(edit.id, { name: edit.name, type: edit.type });
      }
      toast({ title: 'Updated', description: 'Document metadata updated.' });
      setEditOpen(false);
      setEdit(null);
      await loadList();
    } catch (e2) {
      toast({ title: 'Error', description: (e2 as Error).message, variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="app-flow-page space-y-6 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))]">
              <Archive className="h-5 w-5" />
            </span>
            <span className="truncate">Digital Archive</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            Secure document storage linked to traders (searchable, filterable, auditable).
          </p>
        </div>
        {canUpload && (
          <div className="flex shrink-0">
            <Button
              className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
              onClick={() => setUploadOpen(true)}
            >
              <FileUp className="h-4 w-4 mr-2" />
              Upload document
            </Button>
          </div>
        )}
      </div>

      <Card className="app-flow-card mx-auto max-w-6xl overflow-hidden border-[hsl(var(--app-flow-border))]">
        <CardHeader className="border-b border-[hsl(var(--app-flow-border))] bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-4 w-4 text-[hsl(var(--app-flow-accent))]" />
            Search & filter
          </CardTitle>
          <CardDescription>Search by document name and optionally filter by document type.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-5 p-4 sm:p-5">
          <div className="sm:col-span-3">
            <Label className="sr-only">Query</Label>
            <Input
              placeholder="Search documents..."
              value={query}
              className="border-[hsl(var(--app-flow-border))]"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
          </div>
          <div className="sm:col-span-1">
            <Label className="sr-only">Type</Label>
            <Select value={typeFilter || '__all__'} onValueChange={(v) => setTypeFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="border-[hsl(var(--app-flow-border))]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All types</SelectItem>
                {DOC_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-1 flex justify-end">
            <Button
              className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
              onClick={search}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">Search</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="app-flow-card mx-auto max-w-6xl overflow-hidden border-[hsl(var(--app-flow-border))]">
          <CardHeader className="border-b border-[hsl(var(--app-flow-border))] bg-muted/20">
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Trader documents: <span className="font-medium text-foreground">{traderDocs.length}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3">
            {traderDocs.length === 0 ? (
              <p className="text-muted-foreground">No documents found.</p>
            ) : (
              <div className="space-y-2">
                {traderDocs.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--app-flow-border))] bg-background/70 px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{d.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {d.trader?.fullName ? `${d.trader.fullName} · ` : ''}{d.type}
                        {d.sizeBytes ? ` · ${(d.sizeBytes / 1024).toFixed(0)} KB` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline">{d.type}</Badge>
                      <Button
                        variant="outline"
                        className="border-[hsl(var(--app-flow-border))]"
                        onClick={async () => {
                          try {
                            await downloadTraderDoc(d.id, d.name);
                          } catch (e) {
                            toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="outline"
                          className="border-[hsl(var(--app-flow-border))] text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget({ id: d.id, name: d.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="app-flow-card mx-auto max-w-6xl overflow-hidden border-[hsl(var(--app-flow-border))]">
        <CardHeader className="border-b border-[hsl(var(--app-flow-border))] bg-muted/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Document list</CardTitle>
              <CardDescription>
                Scope: <span className="font-medium text-foreground">{scope}</span> · Total: <span className="font-medium text-foreground">{total}</span>
              </CardDescription>
            </div>
            <Select value={scope} onValueChange={(v) => setScope(v as any)}>
              <SelectTrigger className="w-full sm:w-48 border-[hsl(var(--app-flow-border))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trader">Trader documents</SelectItem>
                <SelectItem value="business">Business documents</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-2">
          {listLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">No documents.</p>
          ) : (
            <div className="space-y-2">
              {items.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--app-flow-border))] bg-background/70 px-3 py-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {scope === 'trader' ? d.trader?.fullName : d.business?.name} · {d.type}
                      {d.sizeBytes ? ` · ${(d.sizeBytes / 1024).toFixed(0)} KB` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{d.type}</Badge>
                    <Button
                      variant="outline"
                      className="border-[hsl(var(--app-flow-border))]"
                      onClick={() => {
                        const base = getApiBase();
                        const url =
                          scope === 'trader'
                            ? `${base}/documents/trader-doc/${d.id}/view`
                            : `${base}/documents/business-doc/${d.id}/view`;
                        toast({
                          title: 'Open to view',
                          description: 'Use Download if your browser blocks opening protected files in a new tab.',
                        });
                        window.open(url, '_blank');
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[hsl(var(--app-flow-border))]"
                      onClick={async () => {
                        try {
                          if (scope === 'trader') await downloadTraderDoc(d.id, d.name);
                          else {
                            const base = getApiBase();
                            const token = getAuthToken();
                            const res = await fetch(`${base}/documents/business-doc/${d.id}/download`, {
                              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                            });
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({ message: res.statusText }));
                              throw new Error(err.message || `HTTP ${res.status}`);
                            }
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = d.name || 'document';
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                          }
                        } catch (e) {
                          toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canUpdate && (
                      <Button variant="outline" className="border-[hsl(var(--app-flow-border))]" onClick={() => openEdit(d)}>
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="outline"
                        className="border-[hsl(var(--app-flow-border))] text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ id: d.id, name: d.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg border-[hsl(var(--app-flow-border))]">
          <DialogHeader>
            <DialogTitle>Upload trader document</DialogTitle>
            <DialogDescription>Attach a document to a trader profile. Files are stored securely on the server.</DialogDescription>
          </DialogHeader>
          <form onSubmit={doUpload} className="space-y-4">
            <div className="space-y-2">
              <Label>Attach to *</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as any)}>
                <SelectTrigger className="border-[hsl(var(--app-flow-border))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trader">Trader</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{scope === 'trader' ? 'Trader *' : 'Business *'}</Label>
              {scope === 'trader' ? (
                <Select value={upload.traderId} onValueChange={(v) => setUpload((u) => ({ ...u, traderId: v }))}>
                  <SelectTrigger className="border-[hsl(var(--app-flow-border))]">
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
              ) : (
                <Select value={uploadBiz.businessId} onValueChange={(v) => setUploadBiz((u) => ({ ...u, businessId: v }))}>
                  <SelectTrigger className="border-[hsl(var(--app-flow-border))]">
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={scope === 'trader' ? upload.type : uploadBiz.type}
                  onValueChange={(v) =>
                    scope === 'trader'
                      ? setUpload((u) => ({ ...u, type: v }))
                      : setUploadBiz((u) => ({ ...u, type: v }))
                  }
                >
                  <SelectTrigger className="border-[hsl(var(--app-flow-border))]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Display name</Label>
                <Input
                  value={scope === 'trader' ? upload.name : uploadBiz.name}
                  className="border-[hsl(var(--app-flow-border))]"
                  onChange={(e) =>
                    scope === 'trader'
                      ? setUpload((u) => ({ ...u, name: e.target.value }))
                      : setUploadBiz((u) => ({ ...u, name: e.target.value }))
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>File *</Label>
              <Input
                type="file"
                className="border-[hsl(var(--app-flow-border))]"
                onChange={(e) =>
                  scope === 'trader'
                    ? setUpload((u) => ({ ...u, file: e.target.files?.[0] ?? null }))
                    : setUploadBiz((u) => ({ ...u, file: e.target.files?.[0] ?? null }))
                }
              />
              <p className="text-xs text-muted-foreground">Max size: 25MB</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading}
                className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
              >
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileUp className="h-4 w-4 mr-2" />}
                Upload
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEdit(null); }}>
        <DialogContent className="max-w-md border-[hsl(var(--app-flow-border))]">
          <DialogHeader>
            <DialogTitle>Edit document</DialogTitle>
            <DialogDescription>Update name and type. Changes are audited.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={edit?.name ?? ''} onChange={(e) => setEdit((x) => (x ? { ...x, name: e.target.value } : x))} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={edit?.type ?? 'other'} onValueChange={(v) => setEdit((x) => (x ? { ...x, type: v } : x))}>
                <SelectTrigger className="border-[hsl(var(--app-flow-border))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingEdit}
                className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
              >
                {savingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-medium text-foreground">{deleteTarget?.name}</span>.
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
