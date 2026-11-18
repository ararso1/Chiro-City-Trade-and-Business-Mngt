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
  Eye,
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
  Pencil,
} from 'lucide-react';
import { api, getApiBase, getAuthToken } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import {
  DOCUMENT_TYPE_OPTIONS,
  documentTypeLabel,
  formatFileSize,
} from '@/lib/documentTypes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

const licenseLifecycleStatus = (license: any, traderStatus?: string | null) => {
  if (traderStatus === 'suspended' || license?.status === 'suspended' || license?.status === 'Suspended') return 'Suspended';
  if (!license?.expiryDate) return license?.status === 'active' || license?.status === 'issued' || license?.status === 'Active' ? 'Active' : 'Expired';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(license.expiryDate);
  expiryDate.setHours(0, 0, 0, 0);
  if (expiryDate < today) return 'Expired';
  const days = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return days <= 30 ? 'Expiring Soon' : 'Active';
};

const licenseStatusVariant = (status: string) => {
  if (status === 'Active') return 'default';
  if (status === 'Suspended' || status === 'Expired') return 'destructive';
  return 'secondary';
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
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [edit, setEdit] = useState<{
    scope: 'trader' | 'business';
    id: string;
    name: string;
    type: string;
    ownerLabel: string;
    uploadedAt?: string | null;
    sizeBytes?: number | null;
    file: File | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    scope: 'trader' | 'business';
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessForm, setBusinessForm] = useState(emptyBusinessForm);
  const [businessEditTarget, setBusinessEditTarget] = useState<any | null>(null);
  const [pausingLicense, setPausingLicense] = useState(false);
  const [renewTarget, setRenewTarget] = useState<any | null>(null);
  const [renewalYear, setRenewalYear] = useState(String(new Date().getFullYear()));
  const [renewingLicense, setRenewingLicense] = useState(false);
  const canUpdateTrader = hasPermission('traders.update');
  const canUpdateLicense = hasPermission('licenses.update');
  const canCreateBusiness = hasPermission('businesses.create');
  const canUpdateBusiness = hasPermission('businesses.update');
  const canUpload = hasPermission('documents.create');
  const canUpdateDocument = hasPermission('documents.update');
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

  const businessLicenseCount = trader.businesses?.length ?? 0;
  const traderDocumentCount = trader.documents?.length ?? 0;
  const businessDocumentCount =
    trader.businesses?.reduce((n: number, b: any) => n + (b.documents?.length ?? 0), 0) ?? 0;

  const refresh = async () => {
    if (!id) return;
    const t = await api.traders.get(id);
    setTrader(t);
  };

  const openBusinessDialog = () => {
    setBusinessEditTarget(null);
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

  const openEditBusinessDialog = (business: any) => {
    setBusinessEditTarget(business);
    setBusinessForm({
      name: business.name ?? '',
      type: business.type ?? '',
      businessArea: business.businessArea ?? '',
      category: business.category ?? '',
      address: business.address ?? '',
      plateNumber: business.plateNumber ?? '',
      associationType: business.associationType ?? '',
    });
    setBusinessOpen(true);
  };

  const saveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!businessForm.type.trim() || !businessForm.category.trim()) {
      toast({ title: 'Missing required fields', description: 'Business type and category are required.', variant: 'destructive' });
      return;
    }
    setBusinessSaving(true);
    try {
      const payload = {
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
      };
      if (businessEditTarget?.id) {
        await api.businesses.update(businessEditTarget.id, payload);
      } else {
        await api.businesses.create(payload);
      }
      toast({
        title: businessEditTarget ? 'Business updated' : 'Business added',
        description: businessEditTarget ? 'Business details were updated.' : 'A business was added and its license was generated automatically.',
      });
      setBusinessOpen(false);
      setBusinessEditTarget(null);
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

  const defaultRenewalYearFor = (license: any) => {
    const currentYear = new Date().getFullYear();
    const expiryYear = license?.expiryDate ? new Date(license.expiryDate).getFullYear() : currentYear;
    const isCurrentYearActive = licenseLifecycleStatus(license, trader.status) === 'Active' && expiryYear === currentYear;
    return String(isCurrentYearActive ? currentYear + 1 : currentYear);
  };

  const openRenewDialog = (license: any) => {
    setRenewTarget(license);
    setRenewalYear(defaultRenewalYearFor(license));
  };

  const renewLicense = async () => {
    if (!renewTarget?.id) return;
    const year = Number.parseInt(renewalYear, 10);
    if (!Number.isInteger(year) || year < 1900 || year > 2200) {
      toast({ title: 'Invalid renewal year', description: 'Enter a valid year between 1900 and 2200.', variant: 'destructive' });
      return;
    }
    setRenewingLicense(true);
    try {
      await api.licenses.renew(renewTarget.id, year);
      toast({ title: 'License renewed', description: `The license was renewed for ${year} and set to Active.` });
      setRenewTarget(null);
      await refresh();
    } catch (err) {
      toast({ title: 'Renewal failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setRenewingLicense(false);
    }
  };

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

  const resetUploadForm = () => {
    setFile(null);
    setDocName('');
    setDocType('id_copy');
  };

  const openEditDocument = (
    scope: 'trader' | 'business',
    doc: any,
    ownerLabel: string,
  ) => {
    if (!canUpdateDocument) return;
    setEdit({
      scope,
      id: doc.id,
      name: doc.name ?? '',
      type: doc.type ?? 'other',
      ownerLabel,
      uploadedAt: doc.uploadedAt ?? null,
      sizeBytes: doc.sizeBytes ?? null,
      file: null,
    });
    setEditOpen(true);
  };

  const saveEditDocument = async (e: React.FormEvent) => {
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
      await refresh();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteDocument = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.scope === 'trader') {
        await api.documents.deleteTraderDoc(deleteTarget.id);
      } else {
        await api.documents.deleteBusinessDoc(deleteTarget.id);
      }
      toast({ title: 'Deleted', description: 'Document removed.' });
      setDeleteTarget(null);
      await refresh();
    } catch (e) {
      toast({
        title: 'Error',
        description: (e as Error).message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const uploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !file || !docName.trim() || !docType) {
      toast({
        title: 'Missing fields',
        description: 'Document type, document name, and file are required.',
        variant: 'destructive',
      });
      return;
    }
    setUploading(true);
    try {
      await api.documents.uploadTrader(id, {
        type: docType,
        name: docName.trim(),
        file,
      });
      toast({ title: 'Document added', description: 'Document attached to trader.' });
      setUploadOpen(false);
      resetUploadForm();
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
            {trader.businesses?.length ?? 0}
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
                  <Plus className="h-4 w-4 mr-2" /> Add business
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {trader.businesses?.length ? (
                <div className="grid gap-4">
                  {trader.businesses.map((b: any) => {
                    const license = b.licenses?.[0] ?? null;
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
                          {(canUpdateBusiness || canUpdateLicense) && (
                            <Button variant="outline" size="sm" onClick={() => openEditBusinessDialog(b)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit business
                            </Button>
                          )}
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
                            <ShieldCheck className="h-4 w-4 text-[hsl(var(--app-flow-accent))]" /> License
                          </div>
                          <div className="grid gap-2 md:grid-cols-2">
                            <div className="rounded-xl border bg-background p-3 text-sm md:col-span-2">
                              {license ? (
                                <div className="space-y-3">
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    <div>
                                      <span className="text-muted-foreground">License #</span>
                                      <p className="font-medium">{displayValue(license.licenseNo ?? license.licenseNumber)}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Status</span>
                                      <p><Badge variant={licenseStatusVariant(licenseLifecycleStatus(license, trader.status))}>{licenseLifecycleStatus(license, trader.status)}</Badge></p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Type</span>
                                      <p className="font-medium">{displayValue(license.type ?? license.licenseType)}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Issue / Expiry</span>
                                      <p className="font-medium">{formatDate(license.issueDate)} - {formatDate(license.expiryDate)}</p>
                                    </div>
                                  </div>
                                  {canUpdateLicense && (
                                    <Button type="button" variant="outline" size="sm" onClick={() => openRenewDialog(license)}>
                                      <ShieldCheck className="h-4 w-4 mr-2" />
                                      Renew License
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <p className="text-muted-foreground">
                                  No license record attached yet. Missing licenses are created automatically during data migration or when this business is saved.
                                </p>
                              )}
                            </div>
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

        <Dialog
          open={businessOpen}
          onOpenChange={(open) => {
            if (businessSaving) return;
            setBusinessOpen(open);
            if (!open) setBusinessEditTarget(null);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{businessEditTarget ? 'Edit business' : 'Add business'}</DialogTitle>
              <DialogDescription>
                Manage business details from the trader profile. A license is generated and attached automatically.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={saveBusiness} className="space-y-4">
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
                  {businessSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : businessEditTarget ? <Pencil className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {businessEditTarget ? 'Save changes' : 'Add business'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Trader and business documents linked to this profile
                </CardDescription>
              </div>
              {canUpload && (
                <Button onClick={() => setUploadOpen(true)}>
                  <FileUp className="h-4 w-4 mr-2" /> Add Document
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  Trader documents ({trader.documents?.length ?? 0})
                </div>
                {trader.documents?.length ? (
                  <div className="overflow-hidden rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trader.documents.map((d: any) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium max-w-[220px] truncate">
                              {d.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{documentTypeLabel(d.type)}</Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {formatDate(d.uploadedAt)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatFileSize(d.sizeBytes)}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => viewDocument('trader', d.id)}
                                >
                                  <Eye className="h-4 w-4 mr-1" /> View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => downloadDocument('trader', d.id, d.name)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                {canUpdateDocument && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      openEditDocument(
                                        'trader',
                                        d,
                                        trader.fullName || 'Trader',
                                      )
                                    }
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() =>
                                      setDeleteTarget({
                                        scope: 'trader',
                                        id: d.id,
                                        name: d.name,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    No trader documents yet
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Business documents
                </div>
                {trader.businesses?.some((b: any) => (b.documents?.length ?? 0) > 0) ? (
                  <div className="overflow-hidden rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document name</TableHead>
                          <TableHead>Business</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trader.businesses?.flatMap((b: any) =>
                          (b.documents ?? []).map((d: any) => (
                            <TableRow key={d.id}>
                              <TableCell className="font-medium max-w-[200px] truncate">
                                {d.name}
                              </TableCell>
                              <TableCell className="max-w-[160px] truncate">{b.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{documentTypeLabel(d.type)}</Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-muted-foreground">
                                {formatDate(d.uploadedAt)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatFileSize(d.sizeBytes)}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => viewDocument('business', d.id)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" /> View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => downloadDocument('business', d.id, d.name)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  {canUpdateDocument && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() =>
                                        openEditDocument('business', d, b.name || 'Business')
                                      }
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {canDelete && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() =>
                                        setDeleteTarget({
                                          scope: 'business',
                                          id: d.id,
                                          name: d.name,
                                        })
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    No business documents yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Dialog
            open={uploadOpen}
            onOpenChange={(open) => {
              setUploadOpen(open);
              if (!open) resetUploadForm();
            }}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Document</DialogTitle>
                <DialogDescription>
                  Select a document type and attach a file to this trader profile.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={uploadDoc} className="space-y-4">
                <div className="space-y-2">
                  <Label>Document type *</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger>
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
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="Enter document name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>File *</Label>
                  <Input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
                  <Button type="submit" disabled={uploading}>
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileUp className="h-4 w-4 mr-2" />
                    )}
                    Add Document
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog
            open={editOpen}
            onOpenChange={(open) => {
              setEditOpen(open);
              if (!open) setEdit(null);
            }}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Document</DialogTitle>
                <DialogDescription>
                  Update the document type and name. Previous values are loaded below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={saveEditDocument} className="space-y-4">
                <div className="space-y-2">
                  <Label>{edit?.scope === 'business' ? 'Business' : 'Trader'}</Label>
                  <Input
                    value={
                      edit
                        ? `${edit.ownerLabel}${
                            edit.scope === 'trader' && trader?.tin
                              ? ` · TIN ${trader.tin}`
                              : ''
                          }`
                        : ''
                    }
                    disabled
                    className="bg-muted/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Document type *</Label>
                  <Select
                    value={edit?.type ?? 'other'}
                    onValueChange={(v) => setEdit((x) => (x ? { ...x, type: v } : x))}
                  >
                    <SelectTrigger>
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
                    value={edit?.name ?? ''}
                    onChange={(e) =>
                      setEdit((x) => (x ? { ...x, name: e.target.value } : x))
                    }
                    placeholder="Enter document name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>File</Label>
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    Current file: uploaded {formatDate(edit?.uploadedAt)} ·{' '}
                    {formatFileSize(edit?.sizeBytes)}
                  </div>
                  <Input
                    type="file"
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
                  >
                    {savingEdit ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Pencil className="h-4 w-4 mr-2" />
                    )}
                    Save changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog
            open={!!deleteTarget}
            onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete document?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove{' '}
                  <span className="font-medium text-foreground">
                    {deleteTarget?.name}
                  </span>
                  . This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={(e) => {
                    e.preventDefault();
                    void confirmDeleteDocument();
                  }}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
      <Dialog open={!!renewTarget} onOpenChange={(open) => !open && !renewingLicense && setRenewTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Renew License</DialogTitle>
            <DialogDescription>
              Confirm the renewal year for license {displayValue(renewTarget?.licenseNo ?? renewTarget?.licenseNumber)}. The license will be set to Active.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="renewal-year">Renewal year</Label>
            <Input
              id="renewal-year"
              type="number"
              min={1900}
              max={2200}
              value={renewalYear}
              onChange={(e) => setRenewalYear(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenewTarget(null)} disabled={renewingLicense}>
              Cancel
            </Button>
            <Button type="button" onClick={renewLicense} disabled={renewingLicense}>
              {renewingLicense && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm renewal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
