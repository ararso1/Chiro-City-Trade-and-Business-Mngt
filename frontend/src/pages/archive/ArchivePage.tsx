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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Archive,
  Check,
  ChevronsUpDown,
  Download,
  Eye,
  FileUp,
  Loader2,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import { api, getApiBase, getAuthToken } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  DOCUMENT_TYPE_OPTIONS,
  documentTypeLabel,
  formatFileSize,
} from '@/lib/documentTypes';

function formatUploadedAt(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export default function ArchivePage() {
  const { hasPermission } = useAuth();
  const canUpload = hasPermission('documents.create');
  const canUpdate = hasPermission('documents.update');
  const canDelete = hasPermission('documents.delete');

  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [scope, setScope] = useState<'trader' | 'business'>('trader');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [traders, setTraders] = useState<any[]>([]);
  const [traderSearch, setTraderSearch] = useState('');
  const [traderPickerOpen, setTraderPickerOpen] = useState(false);
  const [traderSearchLoading, setTraderSearchLoading] = useState(false);
  const [selectedTrader, setSelectedTrader] = useState<{
    id: string;
    fullName: string;
    tin?: string | null;
  } | null>(null);
  const [upload, setUpload] = useState<{
    traderId: string;
    type: string;
    name: string;
    file: File | null;
  }>({
    traderId: '',
    type: 'id_copy',
    name: '',
    file: null,
  });

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<{
    scope: 'trader' | 'business';
    id: string;
    name: string;
    type: string;
    ownerLabel: string;
    tin?: string | null;
    uploadedAt?: string | null;
    sizeBytes?: number | null;
    file: File | null;
  } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [listLoading, setListLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!uploadOpen) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setTraderSearchLoading(true);
      api.traders
        .list({
          search: traderSearch.trim() || undefined,
          take: 50,
        })
        .then((r) => {
          if (!cancelled) setTraders(r.items);
        })
        .catch(() => {
          if (!cancelled) setTraders([]);
        })
        .finally(() => {
          if (!cancelled) setTraderSearchLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [uploadOpen, traderSearch]);

  const fetchDocumentBlob = async (
    kind: 'trader' | 'business',
    docId: string,
    mode: 'view' | 'download',
  ) => {
    const base = getApiBase();
    const token = await getAuthToken();
    if (!token) {
      throw new Error('A valid Chiro Auth access token is required. Sign out and sign in again.');
    }
    const path =
      kind === 'trader'
        ? `/documents/trader-doc/${docId}/${mode}`
        : `/documents/business-doc/${docId}/${mode}`;
    const res = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401) window.dispatchEvent(new Event('cctbm:unauthorized'));
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(
        (Array.isArray(err.message) ? err.message.join('\n') : err.message) ||
          `HTTP ${res.status}`,
      );
    }
    return res.blob();
  };

  const viewDocument = async (kind: 'trader' | 'business', docId: string) => {
    try {
      const blob = await fetchDocumentBlob(kind, docId, 'view');
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        URL.revokeObjectURL(url);
        throw new Error('Popup blocked. Allow popups for this site, or use Download.');
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      toast({
        title: 'Unable to open file',
        description: (e as Error).message,
        variant: 'destructive',
      });
    }
  };

  const downloadDocument = async (
    kind: 'trader' | 'business',
    docId: string,
    suggestedName?: string,
  ) => {
    try {
      const blob = await fetchDocumentBlob(kind, docId, 'download');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = suggestedName || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const resetUploadForm = () => {
    setUpload({ traderId: '', type: 'id_copy', name: '', file: null });
    setSelectedTrader(null);
    setTraderSearch('');
    setTraderPickerOpen(false);
  };

  const doUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (!upload.traderId || !upload.type || !upload.name.trim() || !upload.file) {
        toast({
          title: 'Missing fields',
          description: 'Trader, document type, document name, and file are required.',
          variant: 'destructive',
        });
        return;
      }
      await api.documents.uploadTrader(upload.traderId, {
        type: upload.type,
        name: upload.name.trim(),
        file: upload.file,
      });
      toast({ title: 'Document added', description: 'Document was attached to the trader.' });
      setUploadOpen(false);
      resetUploadForm();
      if (scope === 'trader') await loadList();
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
    void loadList();
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
    const ownerLabel =
      scope === 'trader'
        ? d.trader?.fullName || 'Trader'
        : d.business?.name || d.business?.trader?.fullName || 'Business';
    const tin = scope === 'trader' ? d.trader?.tin : d.business?.trader?.tin;
    setEdit({
      scope,
      id: d.id,
      name: d.name ?? '',
      type: d.type ?? 'other',
      ownerLabel,
      tin: tin ?? null,
      uploadedAt: d.uploadedAt ?? null,
      sizeBytes: d.sizeBytes ?? null,
      file: null,
    });
    setEditOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    if (!edit.name.trim() || !edit.type) {
      toast({
        title: 'Missing fields',
        description: 'Document type and document name are required.',
        variant: 'destructive',
      });
      return;
    }
    setSavingEdit(true);
    try {
      const payload = {
        name: edit.name.trim(),
        type: edit.type,
        file: edit.file,
      };
      if (edit.scope === 'trader') {
        await api.documents.updateTraderDoc(edit.id, payload);
      } else {
        await api.documents.updateBusinessDoc(edit.id, payload);
      }
      toast({
        title: 'Updated',
        description: edit.file
          ? 'Document details and file were saved.'
          : 'Document details were saved.',
      });
      setEditOpen(false);
      setEdit(null);
      await loadList();
    } catch (e2) {
      toast({ title: 'Error', description: (e2 as Error).message, variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  const applySearch = () => setQuery(searchInput.trim());

  const tableRows = useMemo(() => items, [items]);

  return (
    <div className="app-flow-page space-y-6 p-4 sm:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))]">
              <Archive className="h-5 w-5" />
            </span>
            <span className="truncate">Digital Archive</span>
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Search and manage trader documents by document name or trader TIN.
          </p>
        </div>
        {canUpload && (
          <Button
            className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
            onClick={() => setUploadOpen(true)}
          >
            <FileUp className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        )}
      </div>

      <Card className="app-flow-card mx-auto max-w-6xl overflow-hidden border-[hsl(var(--app-flow-border))]">
        <CardHeader className="border-b border-[hsl(var(--app-flow-border))] bg-muted/20">
          <CardTitle className="text-lg">Search documents</CardTitle>
          <CardDescription>
            Search by document name, trader name, or TIN. Filter by type and scope.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-12 sm:p-5">
          <div className="sm:col-span-5">
            <Label className="sr-only">Search</Label>
            <Input
              placeholder="Search by document name, trader, or TIN..."
              value={searchInput}
              className="border-[hsl(var(--app-flow-border))]"
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            />
          </div>
          <div className="sm:col-span-2">
            <Select
              value={typeFilter || '__all__'}
              onValueChange={(v) => setTypeFilter(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="border-[hsl(var(--app-flow-border))]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All types</SelectItem>
                {DOCUMENT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-3">
            <Select value={scope} onValueChange={(v) => setScope(v as 'trader' | 'business')}>
              <SelectTrigger className="border-[hsl(var(--app-flow-border))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trader">Trader documents</SelectItem>
                <SelectItem value="business">Business documents</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button
              className="w-full bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
              onClick={applySearch}
              disabled={listLoading}
            >
              {listLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Search</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="app-flow-card mx-auto max-w-6xl overflow-hidden border-[hsl(var(--app-flow-border))]">
        <CardHeader className="border-b border-[hsl(var(--app-flow-border))] bg-muted/20">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Document list</CardTitle>
              <CardDescription>
                Showing {tableRows.length} of {total} {scope} documents
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {listLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tableRows.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              No documents found for the current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document name</TableHead>
                    <TableHead>{scope === 'trader' ? 'Trader' : 'Business / Trader'}</TableHead>
                    <TableHead>TIN</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((d) => {
                    const traderName =
                      scope === 'trader'
                        ? d.trader?.fullName
                        : d.business?.trader?.fullName || d.business?.name;
                    const tin =
                      scope === 'trader' ? d.trader?.tin : d.business?.trader?.tin;
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="max-w-[220px] truncate font-medium">
                          {d.name}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate font-medium">{traderName || '—'}</div>
                          {scope === 'business' && d.business?.name && (
                            <div className="truncate text-xs text-muted-foreground">
                              {d.business.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {tin || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{documentTypeLabel(d.type)}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatUploadedAt(d.uploadedAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatFileSize(d.sizeBytes)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[hsl(var(--app-flow-border))]"
                              onClick={() => viewDocument(scope, d.id)}
                            >
                              <Eye className="mr-1 h-4 w-4" /> View
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-[hsl(var(--app-flow-border))]"
                              onClick={() => downloadDocument(scope, d.id, d.name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {canUpdate && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-[hsl(var(--app-flow-border))]"
                                onClick={() => openEdit(d)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-[hsl(var(--app-flow-border))] text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget({ id: d.id, name: d.name })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) resetUploadForm();
        }}
      >
        <DialogContent className="max-w-lg border-[hsl(var(--app-flow-border))]">
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
            <DialogDescription>
              Select a trader, choose a document type, and attach the file.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={doUpload} className="space-y-4">
            <div className="space-y-2">
              <Label>Trader *</Label>
              <Popover modal open={traderPickerOpen} onOpenChange={setTraderPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={traderPickerOpen}
                    className="w-full justify-between border-[hsl(var(--app-flow-border))] font-normal"
                  >
                    <span className="truncate">
                      {selectedTrader
                        ? `${selectedTrader.fullName}${
                            selectedTrader.tin ? ` · TIN ${selectedTrader.tin}` : ''
                          }`
                        : 'Search trader by name or TIN'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="z-[80] w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search by name or TIN..."
                      value={traderSearch}
                      onValueChange={setTraderSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {traderSearchLoading ? 'Searching traders…' : 'No trader found.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {traders.map((t) => (
                          <CommandItem
                            key={t.id}
                            value={`${t.fullName} ${t.tin ?? ''}`}
                            onSelect={() => {
                              setUpload((u) => ({ ...u, traderId: t.id }));
                              setSelectedTrader({
                                id: t.id,
                                fullName: t.fullName,
                                tin: t.tin,
                              });
                              setTraderPickerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                upload.traderId === t.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <div className="min-w-0">
                              <div className="truncate font-medium">{t.fullName}</div>
                              <div className="truncate text-xs text-muted-foreground">
                                {t.tin ? `TIN ${t.tin}` : 'No TIN'}
                                {t.phone ? ` · ${t.phone}` : ''}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Document type *</Label>
              <Select
                value={upload.type}
                onValueChange={(v) => setUpload((u) => ({ ...u, type: v }))}
              >
                <SelectTrigger className="border-[hsl(var(--app-flow-border))]">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Document name *</Label>
              <Input
                value={upload.name}
                className="border-[hsl(var(--app-flow-border))]"
                onChange={(e) => setUpload((u) => ({ ...u, name: e.target.value }))}
                placeholder="Enter document name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>File *</Label>
              <Input
                type="file"
                className="border-[hsl(var(--app-flow-border))]"
                onChange={(e) =>
                  setUpload((u) => ({ ...u, file: e.target.files?.[0] ?? null }))
                }
                required
              />
              <p className="text-xs text-muted-foreground">Max size: 25MB</p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading}
                className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileUp className="mr-2 h-4 w-4" />
                )}
                Add Document
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setEdit(null);
        }}
      >
        <DialogContent className="max-w-lg border-[hsl(var(--app-flow-border))]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update the document type and name. Previous values are loaded below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>{edit?.scope === 'business' ? 'Business' : 'Trader'}</Label>
              <Input
                value={
                  edit
                    ? `${edit.ownerLabel}${edit.tin ? ` · TIN ${edit.tin}` : ''}`
                    : ''
                }
                disabled
                className="border-[hsl(var(--app-flow-border))] bg-muted/40"
              />
            </div>

            <div className="space-y-2">
              <Label>Document type *</Label>
              <Select
                value={edit?.type ?? 'other'}
                onValueChange={(v) => setEdit((x) => (x ? { ...x, type: v } : x))}
              >
                <SelectTrigger className="border-[hsl(var(--app-flow-border))]">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Document name *</Label>
              <Input
                value={edit?.name ?? ''}
                className="border-[hsl(var(--app-flow-border))]"
                onChange={(e) => setEdit((x) => (x ? { ...x, name: e.target.value } : x))}
                placeholder="Enter document name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>File</Label>
              <div className="rounded-md border border-[hsl(var(--app-flow-border))] bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Current file: uploaded {formatUploadedAt(edit?.uploadedAt)} ·{' '}
                {formatFileSize(edit?.sizeBytes)}
              </div>
              <Input
                type="file"
                className="border-[hsl(var(--app-flow-border))]"
                onChange={(e) =>
                  setEdit((x) =>
                    x ? { ...x, file: e.target.files?.[0] ?? null } : x,
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                {edit?.file
                  ? `New file selected: ${edit.file.name}`
                  : 'Optional. Choose a file to replace the current upload (max 25MB).'}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={savingEdit}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingEdit || !edit?.name.trim()}
                className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
              >
                {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && !deleting && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{' '}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
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
