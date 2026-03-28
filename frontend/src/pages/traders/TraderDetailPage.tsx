import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Users, Briefcase, FileCheck, CreditCard, Loader2, Archive, Download, FileUp, Trash2, Building2 } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const statusVariant = (s: string) => {
  if (s === 'active') return 'default';
  if (s === 'draft') return 'secondary';
  if (s === 'suspended' || s === 'closed') return 'destructive';
  return 'outline';
};

export default function TraderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [trader, setTrader] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('id_copy');
  const [docName, setDocName] = useState('');
  const canUpload = hasPermission('documents.create');
  const canDelete = hasPermission('documents.delete');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.traders
      .get(id)
      .then(setTrader)
      .catch((e) => toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!trader) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/traders')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">Trader not found</p>
      </div>
    );
  }

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString() : '-';

  const refresh = async () => {
    if (!id) return;
    const t = await api.traders.get(id);
    setTrader(t);
  };

  const downloadTraderDoc = async (docId: string, suggestedName?: string) => {
    try {
      // reuse api base + token via Archive pattern (simple fetch with auth header)
      const base = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:3003';
      const token = localStorage.getItem('chiro_trade_token');
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
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const downloadBusinessDoc = async (docId: string, suggestedName?: string) => {
    try {
      const base = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:3003';
      const token = localStorage.getItem('chiro_trade_token');
      const res = await fetch(`${base}/documents/business-doc/${docId}/download`, {
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
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const uploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !file) {
      toast({ title: 'Missing file', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      await api.documents.uploadTrader(id, { type: docType, name: docName || undefined, file });
      toast({ title: 'Uploaded', description: 'Document attached to trader.' });
      setUploadOpen(false);
      setFile(null);
      setDocName('');
      setDocType('id_copy');
      await refresh();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/traders')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              {trader.fullName}
            </CardTitle>
            <CardDescription>
              {trader.email} · {trader.phone}
            </CardDescription>
            <div className="flex gap-2 mt-2">
              <Badge variant={statusVariant(trader.status)}>{trader.status}</Badge>
              {trader.nationalId && (
                <Badge variant="outline">National ID: {trader.nationalId}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Gender</span>
              <p className="font-medium">{trader.gender ?? '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">DOB</span>
              <p className="font-medium">{formatDate(trader.dob)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created by</span>
              <p className="font-medium">{trader.createdBy?.name ?? '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Approved by</span>
              <p className="font-medium">{trader.approvedBy?.name ?? '-'}</p>
            </div>
            {(trader.woreda || trader.kebele) && (
              <>
                <div>
                  <span className="text-muted-foreground">Woreda</span>
                  <p className="font-medium">{trader.woreda ?? '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Kebele</span>
                  <p className="font-medium">{trader.kebele ?? '-'}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="businesses">
        <TabsList>
          <TabsTrigger value="businesses">
            <Briefcase className="h-4 w-4 mr-2" /> Businesses ({trader.businesses?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="licenses">
            Licenses (
            {trader.businesses?.reduce((n: number, b: any) => n + (b.licenses?.length ?? 0), 0) ?? 0}
            )
          </TabsTrigger>
          <TabsTrigger value="inspections">
            Inspections (
            {trader.businesses?.reduce((n: number, b: any) => n + (b.inspections?.length ?? 0), 0) ?? 0}
            )
          </TabsTrigger>
          <TabsTrigger value="payments">
            Payments (
            {trader.businesses?.reduce((n: number, b: any) => n + (b.payments?.length ?? 0), 0) ?? 0}
            )
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Archive className="h-4 w-4 mr-2" /> Documents ({trader.documents?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="businesses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Businesses</CardTitle>
              <CardDescription>Businesses linked to this trader</CardDescription>
            </CardHeader>
            <CardContent>
              {trader.businesses?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Woreda</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Licenses</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trader.businesses.map((b: any) => (
                      <TableRow
                        key={b.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/businesses?traderId=${trader.id}`)}
                      >
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>{b.category}</TableCell>
                        <TableCell>{b.type ?? '-'}</TableCell>
                        <TableCell>{b.woreda ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant={b.status === 'active' ? 'default' : 'secondary'}>
                            {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{b.licenses?.length ?? 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No businesses</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="licenses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Licenses</CardTitle>
              <CardDescription>Licenses across all businesses</CardDescription>
            </CardHeader>
            <CardContent>
              {trader.businesses?.some((b: any) => b.licenses?.length) ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>License #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trader.businesses?.flatMap((b: any) =>
                      (b.licenses ?? []).map((l: any) => (
                        <TableRow key={l.id}>
                          <TableCell>{b.name}</TableCell>
                          <TableCell>{l.licenseNo ?? l.licenseNumber ?? '-'}</TableCell>
                          <TableCell>{l.type ?? l.licenseType ?? '-'}</TableCell>
                          <TableCell>
                            <Badge variant={l.status === 'issued' ? 'default' : 'secondary'}>
                              {l.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(l.issueDate)}</TableCell>
                          <TableCell>{formatDate(l.expiryDate)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No licenses</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inspections" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inspections</CardTitle>
              <CardDescription>Inspection history across businesses</CardDescription>
            </CardHeader>
            <CardContent>
              {trader.businesses?.some((b: any) => b.inspections?.length) ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Violations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trader.businesses?.flatMap((b: any) =>
                      (b.inspections ?? []).map((i: any) => (
                        <TableRow key={i.id}>
                          <TableCell>{b.name}</TableCell>
                          <TableCell>{formatDate(i.scheduledAt)}</TableCell>
                          <TableCell>{i.inspector?.name ?? '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{i.status}</Badge>
                          </TableCell>
                          <TableCell>{i.violations?.length ?? 0}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No inspections</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
              <CardDescription>Payments across all businesses</CardDescription>
            </CardHeader>
            <CardContent>
              {trader.businesses?.some((b: any) => b.payments?.length) ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Tax type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trader.businesses?.flatMap((b: any) =>
                      (b.payments ?? []).map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell>{b.name}</TableCell>
                          <TableCell>{p.taxType?.name ?? '-'}</TableCell>
                          <TableCell>{p.amount?.toLocaleString?.() ?? p.amount}</TableCell>
                          <TableCell>{formatDate(p.paidAt)}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === 'paid' ? 'default' : 'secondary'}>
                              {p.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No payments</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Trader documents + business documents under this trader</CardDescription>
              </div>
              {canUpload && (
                <Button onClick={() => setUploadOpen(true)}>
                  <FileUp className="h-4 w-4 mr-2" /> Upload
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Archive className="h-4 w-4 text-muted-foreground" /> Trader documents ({trader.documents?.length ?? 0})
                  </div>
                  {trader.documents?.length ? (
                    <div className="space-y-2">
                      {trader.documents.map((d: any) => (
                        <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{d.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {d.type} · {formatDate(d.uploadedAt)}
                              {d.sizeBytes ? ` · ${(d.sizeBytes / 1024).toFixed(0)} KB` : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button variant="outline" size="icon" onClick={() => downloadTraderDoc(d.id, d.name)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            {canDelete && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={async () => {
                                  try {
                                    await api.documents.deleteTraderDoc(d.id);
                                    toast({ title: 'Deleted', description: 'Document removed.' });
                                    refresh();
                                  } catch (e) {
                                    toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No trader documents</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4 text-muted-foreground" /> Business documents
                  </div>
                  {trader.businesses?.some((b: any) => (b.documents?.length ?? 0) > 0) ? (
                    <div className="space-y-3">
                      {trader.businesses?.flatMap((b: any) =>
                        (b.documents ?? []).map((d: any) => (
                          <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{d.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {b.name} · {d.type} · {formatDate(d.uploadedAt)}
                                {d.sizeBytes ? ` · ${(d.sizeBytes / 1024).toFixed(0)} KB` : ''}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button variant="outline" size="icon" onClick={() => downloadBusinessDoc(d.id, d.name)}>
                                <Download className="h-4 w-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={async () => {
                                    try {
                                      await api.documents.deleteBusinessDoc(d.id);
                                      toast({ title: 'Deleted', description: 'Document removed.' });
                                      refresh();
                                    } catch (e) {
                                      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )),
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No business documents</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload document</DialogTitle>
                <DialogDescription>Attach a file to this trader profile.</DialogDescription>
              </DialogHeader>
              <form onSubmit={uploadDoc} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id_copy">ID copy</SelectItem>
                      <SelectItem value="photo">Photo</SelectItem>
                      <SelectItem value="license">License</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Display name</Label>
                  <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <Label>File *</Label>
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileUp className="h-4 w-4 mr-2" />}
                    Upload
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
