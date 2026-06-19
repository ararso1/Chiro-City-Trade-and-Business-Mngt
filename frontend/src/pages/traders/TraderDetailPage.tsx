import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  ArrowLeft,
  Users,
  Briefcase,
  Loader2,
  Archive,
  Download,
  FileUp,
  Trash2,
  Building2,
  Plus,
  CalendarDays,
  Clock,
  IdCard,
  Phone,
  MapPin,
  Car,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const statusVariant = (s: string) => {
  if (s === 'active') return 'default';
  if (s === 'draft') return 'secondary';
  if (s === 'suspended' || s === 'closed') return 'destructive';
  return 'outline';
};

const registrationTypeLabel = (value?: string | null) => {
  if (value === 'renewal') return 'Renewal';
  if (value === 'new_registration') return 'New Registration';
  return '-';
};

const expiryRemainingText = (expiry?: string | null) => {
  if (!expiry) return '-';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(expiry);
  expiryDate.setHours(0, 0, 0, 0);
  const days = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (days === 0) return 'Expires today';
  return `${days} day${days === 1 ? '' : 's'} remaining`;
};

const emptyBusinessForm = {
  name: '',
  type: '',
  businessArea: '',
  category: '',
  address: '',
  plateNumber: '',
  associationType: '',
};

function cleanOptionalString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

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
  const [businessOpen, setBusinessOpen] = useState(false);
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessForm, setBusinessForm] = useState(emptyBusinessForm);
  const [pausingLicense, setPausingLicense] = useState(false);
  const canUpdateTrader = hasPermission('traders.update');
  const canCreateBusiness = hasPermission('businesses.create');
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

  const businessLicenseCount =
    trader.businesses?.reduce((n: number, b: any) => n + Math.max(b.licenses?.length ?? 0, 1), 0) ?? 0;
  const traderDocumentCount = trader.documents?.length ?? 0;
  const businessDocumentCount =
    trader.businesses?.reduce((n: number, b: any) => n + (b.documents?.length ?? 0), 0) ?? 0;

  const refresh = async () => {
    if (!id) return;
    const t = await api.traders.get(id);
    setTrader(t);
  };

  const openBusinessDialog = () => {
    setBusinessForm({
      name: '',
      type: trader.typeOfJob ?? '',
      businessArea: trader.businessArea ?? '',
      category: trader.category ?? '',
      address: trader.address ?? '',
      plateNumber: trader.plateNumber ?? '',
      associationType: trader.associationType ?? '',
    });
    setBusinessOpen(true);
  };

  const createBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!businessForm.type.trim() || !businessForm.category.trim()) {
      toast({ title: 'Missing required fields', description: 'Business type and category are required.', variant: 'destructive' });
      return;
    }
    setBusinessSaving(true);
    try {
      await api.businesses.create({
        traderId: id,
        name: businessForm.name.trim() || trader.fullName,
        type: businessForm.type.trim(),
        category: businessForm.category.trim(),
        businessArea: cleanOptionalString(businessForm.businessArea),
        address: cleanOptionalString(businessForm.address),
        plateNumber: cleanOptionalString(businessForm.plateNumber),
        associationType: cleanOptionalString(businessForm.associationType),
        tin: trader.tin ?? undefined,
        phone: trader.phone ?? undefined,
        status: 'active',
      });
      toast({ title: 'Business license added', description: 'Licensed business was added to this trader.' });
      setBusinessOpen(false);
      await refresh();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setBusinessSaving(false);
    }
  };

  const setLicensePaused = async (paused: boolean) => {
    if (!id) return;
    setPausingLicense(true);
    try {
      await api.traders.update(id, { status: paused ? 'suspended' : 'active' });
      toast({
        title: paused ? 'License paused' : 'License reactivated',
        description: paused ? 'This trader is now marked as paused.' : 'This trader is now active again.',
      });
      await refresh();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setPausingLicense(false);
    }
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
    <div className="app-flow-page space-y-6 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/traders')} className="pl-0">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to traders
        </Button>

        <Card className="overflow-hidden border-[hsl(var(--app-flow-border))]">
          <div className="bg-gradient-to-r from-[hsl(var(--app-flow-accent))] to-emerald-600 p-6 text-[hsl(var(--app-flow-accent-foreground))]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <Users className="h-6 w-6" />
                  </span>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{trader.fullName}</h1>
                    <p className="text-sm text-white/80">
                      {[trader.phone, trader.tin].filter(Boolean).join(' · ') || 'Trader profile'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={statusVariant(trader.status)} className="bg-white/90 text-foreground hover:bg-white">
                    {trader.status}
                  </Badge>
                  {trader.tin && <Badge className="bg-white/15 text-white hover:bg-white/20">TIN: {trader.tin}</Badge>}
                  {trader.nationalId && <Badge className="bg-white/15 text-white hover:bg-white/20">National ID: {trader.nationalId}</Badge>}
                </div>
                {canUpdateTrader && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="bg-white/90 text-foreground hover:bg-white"
                    disabled={pausingLicense}
                    onClick={() => setLicensePaused(trader.status !== 'suspended')}
                  >
                    {pausingLicense ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : trader.status === 'suspended' ? (
                      <PlayCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <PauseCircle className="h-4 w-4 mr-2" />
                    )}
                    {trader.status === 'suspended' ? 'Reactivate license' : 'Pause license'}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/15 p-3">
                  <p className="text-xs text-white/75">Business licenses</p>
                  <p className="text-2xl font-bold">{businessLicenseCount}</p>
                </div>
                <div className="rounded-xl bg-white/15 p-3">
                  <p className="text-xs text-white/75">Documents</p>
                  <p className="text-2xl font-bold">{traderDocumentCount + businessDocumentCount}</p>
                </div>
                <div className="rounded-xl bg-white/15 p-3 col-span-2 sm:col-span-1">
                  <p className="text-xs text-white/75">Expiry</p>
                  <p className="text-sm font-semibold">{expiryRemainingText(trader.licenseExpiryDate)}</p>
                </div>
              </div>
            </div>
          </div>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
                <div className="mb-3 flex items-center gap-2 font-semibold text-blue-900">
                  <IdCard className="h-4 w-4" /> Trader Details
                </div>
                <div className="space-y-2 text-blue-950">
                  <div className="flex justify-between gap-3"><span className="text-blue-700">Gender</span><span className="font-medium">{displayValue(trader.gender)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-blue-700">Type of job</span><span className="font-medium">{displayValue(trader.typeOfJob)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-blue-700">Category</span><span className="font-medium">{displayValue(trader.category)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-blue-700">MESOB ref</span><span className="font-medium">{displayValue(trader.mesobRef)}</span></div>
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                <div className="mb-3 flex items-center gap-2 font-semibold text-emerald-900">
                  <Phone className="h-4 w-4" /> Contact & Location
                </div>
                <div className="space-y-2 text-emerald-950">
                  <div className="flex justify-between gap-3"><span className="text-emerald-700">Phone</span><span className="font-medium">{displayValue(trader.phone)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-emerald-700">Email</span><span className="font-medium">{displayValue(trader.email)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-emerald-700">Business area</span><span className="font-medium">{displayValue(trader.businessArea)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-emerald-700">Address</span><span className="font-medium">{displayValue(trader.address)}</span></div>
                </div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
                <div className="mb-3 flex items-center gap-2 font-semibold text-amber-900">
                  <Clock className="h-4 w-4" /> Registration Expiry
                </div>
                <div className="space-y-2 text-amber-950">
                  <div className="flex justify-between gap-3"><span className="text-amber-700">Type</span><span className="font-medium">{registrationTypeLabel(trader.licenseRegistrationType)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-amber-700">Registered</span><span className="font-medium">{formatDate(trader.licenseRegistrationDate)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-amber-700">Expiry</span><span className="font-medium">{formatDate(trader.licenseExpiryDate)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-amber-700">Remaining</span><span className="font-medium">{expiryRemainingText(trader.licenseExpiryDate)}</span></div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 rounded-xl border border-[hsl(var(--app-flow-border))] bg-muted/20 p-4 text-sm md:grid-cols-4">
              <div>
                <span className="text-muted-foreground">Created by</span>
                <p className="font-medium">{displayValue(trader.createdBy?.name)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Approved by</span>
                <p className="font-medium">{displayValue(trader.approvedBy?.name)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created at</span>
                <p className="font-medium">{formatDate(trader.createdAt)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Updated at</span>
                <p className="font-medium">{formatDate(trader.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

      <Tabs defaultValue="business-license">
        <TabsList>
          <TabsTrigger value="business-license">
            <Briefcase className="h-4 w-4 mr-2" /> Business License (
            {trader.businesses?.reduce((n: number, b: any) => n + Math.max(b.licenses?.length ?? 0, 1), 0) ?? 0}
            )
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Archive className="h-4 w-4 mr-2" /> Documents ({trader.documents?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="business-license" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Business License</CardTitle>
                <CardDescription>Business license information linked to this trader</CardDescription>
              </div>
              {canCreateBusiness && (
                <Button onClick={openBusinessDialog}>
                  <Plus className="h-4 w-4 mr-2" /> Add licensed business
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {trader.businesses?.length ? (
                <div className="grid gap-4">
                  {trader.businesses.map((b: any) => {
                    const licenses = b.licenses?.length ? b.licenses : [null];
                    return (
                      <div
                        key={b.id}
                        className="rounded-2xl border border-[hsl(var(--app-flow-border))] bg-gradient-to-br from-background to-muted/30 p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold">{b.name}</h3>
                              <Badge variant={b.status === 'active' ? 'default' : 'secondary'}>{b.status}</Badge>
                              {b.tin && <Badge variant="outline">TIN: {b.tin}</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{displayValue(b.tradeName || b.type)} · {displayValue(b.category)}</p>
                          </div>
                          {/* <Button variant="outline" size="sm" onClick={() => navigate(`/businesses?traderId=${trader.id}`)}>
                            View business
                          </Button> */}
                        </div>

                        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-xl bg-blue-50 p-3 text-blue-950">
                            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-blue-700">
                              <Briefcase className="h-3.5 w-3.5" /> Business
                            </div>
                            <p>Type: <span className="font-medium">{displayValue(b.type)}</span></p>
                            <p>Sub-category: <span className="font-medium">{displayValue(b.subCategory)}</span></p>
                            <p>Shop: <span className="font-medium">{displayValue(b.shopNo)}</span></p>
                          </div>
                          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-950">
                            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-emerald-700">
                              <MapPin className="h-3.5 w-3.5" /> Location
                            </div>
                            <p>Area: <span className="font-medium">{displayValue(b.businessArea)}</span></p>
                            <p>Address: <span className="font-medium">{displayValue(b.address)}</span></p>
                            <p>Woreda/Kebele: <span className="font-medium">{[b.woreda, b.kebele].filter(Boolean).join(' / ') || '-'}</span></p>
                          </div>
                          <div className="rounded-xl bg-orange-50 p-3 text-orange-950">
                            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-orange-700">
                              <Car className="h-3.5 w-3.5" /> Vehicle
                            </div>
                            <p>Plate: <span className="font-medium">{displayValue(b.plateNumber)}</span></p>
                            <p>Association: <span className="font-medium">{displayValue(b.associationType)}</span></p>
                            <p>Phone: <span className="font-medium">{displayValue(b.phone)}</span></p>
                          </div>
                          <div className="rounded-xl bg-purple-50 p-3 text-purple-950">
                            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-purple-700">
                              <CalendarDays className="h-3.5 w-3.5" /> Dates
                            </div>
                            <p>Start: <span className="font-medium">{formatDate(b.startDate)}</span></p>
                            <p>Created: <span className="font-medium">{formatDate(b.createdAt)}</span></p>
                            <p>Updated: <span className="font-medium">{formatDate(b.updatedAt)}</span></p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <ShieldCheck className="h-4 w-4 text-[hsl(var(--app-flow-accent))]" /> Licenses
                          </div>
                          <div className="grid gap-2 md:grid-cols-2">
                            {licenses.map((l: any, idx: number) => (
                              <div key={l?.id ?? `${b.id}-license-${idx}`} className="rounded-xl border bg-background p-3 text-sm">
                                {l ? (
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    <div>
                                      <span className="text-muted-foreground">License #</span>
                                      <p className="font-medium">{displayValue(l.licenseNo ?? l.licenseNumber)}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Status</span>
                                      <p><Badge variant={l.status === 'issued' ? 'default' : 'secondary'}>{l.status}</Badge></p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Type</span>
                                      <p className="font-medium">{displayValue(l.type ?? l.licenseType)}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Issue / Expiry</span>
                                      <p className="font-medium">{formatDate(l.issueDate)} - {formatDate(l.expiryDate)}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground">No license record attached yet.</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No business license found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <Dialog open={businessOpen} onOpenChange={(open) => !businessSaving && setBusinessOpen(open)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add licensed business</DialogTitle>
              <DialogDescription>
                Add another business license for this trader. Leave business name empty if it is the same as the trader name.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createBusiness} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Business name</Label>
                  <Input
                    value={businessForm.name}
                    placeholder={trader.fullName}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business type *</Label>
                  <Input
                    value={businessForm.type}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, type: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Input
                    value={businessForm.category}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business area</Label>
                  <Input
                    value={businessForm.businessArea}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, businessArea: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plate number (for cars)</Label>
                  <Input
                    value={businessForm.plateNumber}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, plateNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Association type (for cars)</Label>
                  <Input
                    value={businessForm.associationType}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, associationType: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setBusinessOpen(false)} disabled={businessSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={businessSaving}>
                  {businessSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add business
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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
    </div>
  );
}
