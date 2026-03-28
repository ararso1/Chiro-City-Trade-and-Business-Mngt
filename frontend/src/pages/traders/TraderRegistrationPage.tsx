import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  FileText,
  Loader2,
  Plus,
  Trash2,
  User,
  Users,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const TRADER_STATUSES_PREVIEW = {
  initial: 'submitted',
} as const;

const BUSINESS_STATUSES_PREVIEW = {
  initial: 'pending',
} as const;

const LICENSE_STATUSES_PREVIEW = {
  initial: 'application',
} as const;

/** Radix Select requires non-empty values; map this to optional string fields. */
const SELECT_UNSET = '__unset__' as const;

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: SELECT_UNSET, label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const BUSINESS_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: SELECT_UNSET, label: 'Select category *' },
  { value: 'general_trade', label: 'General trade' },
  { value: 'retail', label: 'Retail' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'food_beverage', label: 'Food & beverage' },
  { value: 'services', label: 'Services' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'transport', label: 'Transport & logistics' },
  { value: 'construction', label: 'Construction' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'other', label: 'Other' },
];

const BUSINESS_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: SELECT_UNSET, label: 'Not specified' },
  { value: 'retail', label: 'Retail' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'service', label: 'Service' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'other', label: 'Other' },
];

const LICENSE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: SELECT_UNSET, label: 'Select license type *' },
  { value: 'annual_trading', label: 'Annual trading' },
  { value: 'trading_permit', label: 'Trading permit' },
  { value: 'business_registration', label: 'Business registration' },
  { value: 'hawker', label: 'Hawker' },
  { value: 'mobile_vending', label: 'Mobile vending' },
  { value: 'special_event', label: 'Special event' },
  { value: 'other', label: 'Other' },
];

type TraderForm = {
  fullName: string;
  gender: string;
  dob: string;
  phone: string;
  email: string;
  nationalId: string;
  address: string;
  woreda: string;
  kebele: string;
};

type LicenseDraft = {
  id: string;
  licenseNo: string;
  licenseType: string;
  issueDate: string;
  expiryDate: string;
  qrCode: string;
};

type BusinessDraft = {
  id: string;
  name: string;
  category: string;
  type: string;
  woreda: string;
  kebele: string;
  shopNo: string;
  startDate: string;
  address: string;
  phone: string;
  tin: string;
  licenses: LicenseDraft[];
};

type StepKey = 'trader' | 'businesses' | 'licenses' | 'review';

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function emptyTraderForm(): TraderForm {
  return {
    fullName: '',
    gender: '',
    dob: '',
    phone: '',
    email: '',
    nationalId: '',
    address: '',
    woreda: '',
    kebele: '',
  };
}

function emptyLicenseDraft(): LicenseDraft {
  return {
    id: uid('lic'),
    licenseNo: '',
    licenseType: '',
    issueDate: '',
    expiryDate: '',
    qrCode: '',
  };
}

function emptyBusinessDraft(): BusinessDraft {
  return {
    id: uid('biz'),
    name: '',
    category: '',
    type: '',
    woreda: '',
    kebele: '',
    shopNo: '',
    startDate: '',
    address: '',
    phone: '',
    tin: '',
    licenses: [emptyLicenseDraft()],
  };
}

const stepOrder: StepKey[] = ['trader', 'businesses', 'licenses', 'review'];
const stepLabels: { key: StepKey; title: string; subtitle: string; icon: React.ReactNode }[] = [
  { key: 'trader', title: 'Trader', subtitle: 'Personal info', icon: <User className="h-4 w-4" /> },
  { key: 'businesses', title: 'Businesses', subtitle: 'Add 1+ profiles', icon: <Briefcase className="h-4 w-4" /> },
  { key: 'licenses', title: 'Licenses', subtitle: 'Add applications', icon: <FileText className="h-4 w-4" /> },
  { key: 'review', title: 'Review', subtitle: 'Confirm & submit', icon: <Users className="h-4 w-4" /> },
];

function cleanOptionalString(v: string | undefined | null) {
  const s = (v ?? '').trim();
  return s ? s : undefined;
}

function selectToStored(v: string) {
  return v === SELECT_UNSET ? '' : v;
}

function storedToSelect(v: string) {
  return v || SELECT_UNSET;
}

function labelForOption(options: { value: string; label: string }[], value: string) {
  if (!value) return '—';
  const found = options.find((o) => o.value === value);
  return found?.label ?? value;
}

function formatGender(g: string) {
  if (!g) return '—';
  const map: Record<string, string> = { male: 'Male', female: 'Female', other: 'Other' };
  return map[g] ?? g;
}

function ReviewRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-0.5 sm:grid-cols-[minmax(0,7.5rem)_1fr] sm:gap-x-4 sm:items-baseline text-sm',
        className,
      )}
    >
      <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</dt>
      <dd className="font-medium text-foreground break-words">{value ?? '—'}</dd>
    </div>
  );
}

export default function TraderRegistrationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepKey>('trader');
  const [submitting, setSubmitting] = useState(false);

  const [trader, setTrader] = useState<TraderForm>(emptyTraderForm());
  const [businesses, setBusinesses] = useState<BusinessDraft[]>([emptyBusinessDraft()]);
  const [note, setNote] = useState('');

  useEffect(() => {
    setStep('trader');
    setSubmitting(false);
    setTrader(emptyTraderForm());
    setBusinesses([emptyBusinessDraft()]);
    setNote('');
  }, []);

  const currentStepIdx = stepOrder.indexOf(step);
  const progress = useMemo(() => ((currentStepIdx + 1) / stepOrder.length) * 100, [currentStepIdx]);

  const canGoNext = useMemo(() => {
    if (step === 'trader') {
      return (
        trader.fullName.trim() &&
        trader.phone.trim() &&
        trader.email.trim() &&
        trader.nationalId.trim()
      );
    }
    if (step === 'businesses') {
      return (
        businesses.length >= 1 &&
        businesses.every((b) => b.name.trim() && b.category.trim() && b.category !== SELECT_UNSET)
      );
    }
    if (step === 'licenses') {
      return (
        businesses.length >= 1 &&
        businesses.every(
          (b) =>
            b.licenses.length >= 1 &&
            b.licenses.every(
              (l) => l.licenseType.trim() && l.licenseType !== SELECT_UNSET && l.expiryDate.trim(),
            ),
        )
      );
    }
    return true;
  }, [businesses, step, trader]);

  const goNext = () => {
    if (!canGoNext) {
      toast({
        title: 'Missing required fields',
        description:
          step === 'trader'
            ? 'Full name, phone, email and National ID are required.'
            : step === 'businesses'
              ? 'Each business needs a name and category.'
              : 'Each license needs a type and expiry date.',
        variant: 'destructive',
      });
      return;
    }
    setStep(stepOrder[Math.min(stepOrder.length - 1, currentStepIdx + 1)]);
  };

  const goBack = () => setStep(stepOrder[Math.max(0, currentStepIdx - 1)]);

  const addBusiness = () => {
    setBusinesses((prev) => (prev.length >= 10 ? prev : [...prev, emptyBusinessDraft()]));
  };

  const removeBusiness = (businessId: string) => {
    setBusinesses((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((b) => b.id !== businessId);
    });
  };

  const updateBusiness = (businessId: string, patch: Partial<BusinessDraft>) => {
    setBusinesses((prev) => prev.map((b) => (b.id === businessId ? { ...b, ...patch } : b)));
  };

  const addLicense = (businessId: string) => {
    setBusinesses((prev) =>
      prev.map((b) => (b.id === businessId ? { ...b, licenses: [...b.licenses, emptyLicenseDraft()] } : b)),
    );
  };

  const removeLicense = (businessId: string, licenseId: string) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id !== businessId) return b;
        if (b.licenses.length <= 1) return b;
        return { ...b, licenses: b.licenses.filter((l) => l.id !== licenseId) };
      }),
    );
  };

  const updateLicense = (businessId: string, licenseId: string, patch: Partial<LicenseDraft>) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id !== businessId) return b;
        return { ...b, licenses: b.licenses.map((l) => (l.id === licenseId ? { ...l, ...patch } : l)) };
      }),
    );
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const traderPayload: Record<string, any> = {
        fullName: trader.fullName.trim(),
        phone: trader.phone.trim(),
        email: trader.email.trim(),
        gender: cleanOptionalString(trader.gender),
        dob: cleanOptionalString(trader.dob),
        nationalId: cleanOptionalString(trader.nationalId),
        address: cleanOptionalString(trader.address),
        woreda: cleanOptionalString(trader.woreda),
        kebele: cleanOptionalString(trader.kebele),
      };

      const createdTrader = await api.traders.create(traderPayload);
      const traderId = createdTrader.id as string;

      for (const b of businesses) {
        const businessPayload: Record<string, any> = {
          traderId,
          name: b.name.trim(),
          category: b.category.trim(),
          type: cleanOptionalString(b.type),
          woreda: cleanOptionalString(b.woreda),
          kebele: cleanOptionalString(b.kebele),
          shopNo: cleanOptionalString(b.shopNo),
          startDate: cleanOptionalString(b.startDate),
          address: cleanOptionalString(b.address),
          phone: cleanOptionalString(b.phone),
          tin: cleanOptionalString(b.tin),
        };
        const createdBusiness = await api.businesses.create(businessPayload);
        const businessId = createdBusiness.id as string;

        for (const l of b.licenses) {
          const licensePayload: Record<string, any> = {
            businessId,
            traderId,
            licenseNo: cleanOptionalString(l.licenseNo),
            licenseType: cleanOptionalString(l.licenseType),
            issueDate: cleanOptionalString(l.issueDate),
            expiryDate: cleanOptionalString(l.expiryDate),
            qrCode: cleanOptionalString(l.qrCode),
          };
          await api.licenses.create(licensePayload);
        }
      }

      toast({ title: 'Registration submitted', description: 'Trader, businesses, and license applications were created.' });
      navigate(`/traders/${createdTrader.id}`);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-flow-page space-y-6 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl flex items-center justify-between gap-4 flex-wrap">
        <Button variant="outline" className="border-[hsl(var(--app-flow-border))] bg-background/80 backdrop-blur-sm" onClick={() => navigate('/traders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to traders
        </Button>
        <Badge variant="secondary" className="gap-1 border border-[hsl(var(--app-flow-border))] bg-background/80">
          <Sparkles className="h-3 w-3 text-[hsl(var(--app-flow-accent))]" />
          Registration workflow
        </Badge>
      </div>

      <Card className="app-flow-card mx-auto max-w-4xl overflow-hidden">
        <CardHeader className="space-y-1 border-b border-[hsl(var(--app-flow-border))] bg-muted/25 pb-6">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))]">
              <Users className="h-5 w-5" />
            </span>
            Unified Trader Registration
          </CardTitle>
          <CardDescription className="text-base">
            Create a trader, multiple businesses, and their license applications in one guided flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          <div className="space-y-4">
            <Progress value={progress} className="h-2 bg-muted" />
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {stepLabels.map((s, idx) => {
                const done = idx < currentStepIdx;
                const current = idx === currentStepIdx;
                return (
                  <div
                    key={s.key}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors',
                      current && 'app-flow-step-ring border-[hsl(var(--app-flow-accent)/0.45)] bg-[hsl(var(--app-flow-muted))]',
                      done && 'border-[hsl(var(--app-flow-border))] bg-muted/40',
                      !done && !current && 'border-border/60 bg-background/50 opacity-80',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                        current && 'border-transparent bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))]',
                        done && !current && 'border-[hsl(var(--app-flow-border))] bg-background text-foreground',
                        !done && !current && 'bg-muted text-muted-foreground',
                      )}
                    >
                      {done ? '✓' : idx + 1}
                    </div>
                    <div className="hidden sm:flex sm:items-center sm:gap-2 min-w-0">
                      <span className="text-muted-foreground">{s.icon}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-tight">{s.title}</div>
                        <div className="text-xs text-muted-foreground leading-tight">{s.subtitle}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {step === 'trader' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-[hsl(var(--app-flow-accent))] pl-3">
                <User className="h-4 w-4 text-[hsl(var(--app-flow-accent))]" />
                <div className="font-semibold">Trader (personal)</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full name *</Label>
                  <Input value={trader.fullName} onChange={(e) => setTrader((t) => ({ ...t, fullName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>National ID *</Label>
                  <Input value={trader.nationalId} onChange={(e) => setTrader((t) => ({ ...t, nationalId: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={storedToSelect(trader.gender)}
                    onValueChange={(v) => setTrader((t) => ({ ...t, gender: selectToStored(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of birth</Label>
                  <Input type="date" value={trader.dob} onChange={(e) => setTrader((t) => ({ ...t, dob: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={trader.phone} onChange={(e) => setTrader((t) => ({ ...t, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={trader.email} onChange={(e) => setTrader((t) => ({ ...t, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Woreda</Label>
                  <Input value={trader.woreda} onChange={(e) => setTrader((t) => ({ ...t, woreda: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Kebele</Label>
                  <Input value={trader.kebele} onChange={(e) => setTrader((t) => ({ ...t, kebele: e.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Input value={trader.address} onChange={(e) => setTrader((t) => ({ ...t, address: e.target.value }))} />
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3 rounded-lg border border-dashed border-[hsl(var(--app-flow-border))] bg-muted/20 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Trader status will be set automatically to{' '}
                  <span className="font-medium text-foreground">{TRADER_STATUSES_PREVIEW.initial}</span>.
                </p>
                <Badge variant="secondary">{TRADER_STATUSES_PREVIEW.initial}</Badge>
              </div>
            </div>
          )}

          {step === 'businesses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 border-l-4 border-[hsl(var(--app-flow-accent))] pl-3">
                  <Briefcase className="h-4 w-4 text-[hsl(var(--app-flow-accent))]" />
                  <div className="font-semibold">Businesses</div>
                </div>
                <Button type="button" variant="outline" className="border-[hsl(var(--app-flow-border))]" onClick={addBusiness} disabled={businesses.length >= 10}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add business
                </Button>
              </div>

              <div className="space-y-4">
                {businesses.map((b, idx) => (
                  <Card key={b.id} className="border-[hsl(var(--app-flow-border))] shadow-none bg-muted/10">
                    <CardContent className="p-4 sm:p-5 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold">Business {idx + 1}</div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Created as status <span className="font-medium text-foreground">{BUSINESS_STATUSES_PREVIEW.initial}</span>.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary">{BUSINESS_STATUSES_PREVIEW.initial}</Badge>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeBusiness(b.id)} disabled={businesses.length <= 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Business name *</Label>
                          <Input value={b.name} onChange={(e) => updateBusiness(b.id, { name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Category *</Label>
                          <Select
                            value={storedToSelect(b.category)}
                            onValueChange={(v) => updateBusiness(b.id, { category: selectToStored(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {BUSINESS_CATEGORY_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={storedToSelect(b.type)}
                            onValueChange={(v) => updateBusiness(b.id, { type: selectToStored(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Business type" />
                            </SelectTrigger>
                            <SelectContent>
                              {BUSINESS_TYPE_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Woreda</Label>
                          <Input value={b.woreda} onChange={(e) => updateBusiness(b.id, { woreda: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Kebele</Label>
                          <Input value={b.kebele} onChange={(e) => updateBusiness(b.id, { kebele: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Shop number</Label>
                          <Input value={b.shopNo} onChange={(e) => updateBusiness(b.id, { shopNo: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Start date</Label>
                          <Input type="date" value={b.startDate} onChange={(e) => updateBusiness(b.id, { startDate: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input value={b.phone} onChange={(e) => updateBusiness(b.id, { phone: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>TIN</Label>
                          <Input value={b.tin} onChange={(e) => updateBusiness(b.id, { tin: e.target.value })} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Address</Label>
                          <Input value={b.address} onChange={(e) => updateBusiness(b.id, { address: e.target.value })} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 'licenses' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-[hsl(var(--app-flow-accent))] pl-3">
                <FileText className="h-4 w-4 text-[hsl(var(--app-flow-accent))]" />
                <div className="font-semibold">License applications</div>
              </div>

              <div className="space-y-4">
                {businesses.map((b) => (
                  <Card key={b.id} className="border-[hsl(var(--app-flow-border))] shadow-none bg-muted/10">
                    <CardContent className="p-4 sm:p-5 space-y-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="font-semibold">{b.name || 'Business'}</div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Each license starts as <span className="font-medium text-foreground">{LICENSE_STATUSES_PREVIEW.initial}</span>.
                          </p>
                        </div>
                        <Button type="button" variant="outline" size="sm" className="border-[hsl(var(--app-flow-border))]" onClick={() => addLicense(b.id)}>
                          <Plus className="h-4 w-4 mr-2" /> Add license
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {b.licenses.map((l, idx) => (
                          <div
                            key={l.id}
                            className="rounded-xl border border-[hsl(var(--app-flow-border))] bg-background/60 p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-sm font-semibold">License {idx + 1}</div>
                                <p className="text-xs text-muted-foreground">Application → review → approval → issue</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="secondary">{LICENSE_STATUSES_PREVIEW.initial}</Badge>
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeLicense(b.id, l.id)} disabled={b.licenses.length <= 1}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>License type *</Label>
                                <Select
                                  value={storedToSelect(l.licenseType)}
                                  onValueChange={(v) => updateLicense(b.id, l.id, { licenseType: selectToStored(v) })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {LICENSE_TYPE_OPTIONS.map((o) => (
                                      <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>License # (optional)</Label>
                                <Input value={l.licenseNo} onChange={(e) => updateLicense(b.id, l.id, { licenseNo: e.target.value })} placeholder="Auto if blank" />
                              </div>
                              <div className="space-y-2">
                                <Label>Issue date</Label>
                                <Input type="date" value={l.issueDate} onChange={(e) => updateLicense(b.id, l.id, { issueDate: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>Expiry date *</Label>
                                <Input type="date" value={l.expiryDate} onChange={(e) => updateLicense(b.id, l.id, { expiryDate: e.target.value })} />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label>QR code (optional)</Label>
                                <Input value={l.qrCode} onChange={(e) => updateLicense(b.id, l.id, { qrCode: e.target.value })} placeholder="URL or data" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 border-l-4 border-[hsl(var(--app-flow-accent))] pl-3">
                  <h2 className="text-lg font-semibold tracking-tight">Review & submit</h2>
                  <p className="text-sm text-muted-foreground max-w-xl">
                    Confirm details below. Status values are assigned automatically when you submit.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="border-[hsl(var(--app-flow-border))]" onClick={() => setStep('trader')}>
                    Edit trader
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="border-[hsl(var(--app-flow-border))]" onClick={() => setStep('businesses')}>
                    Edit businesses
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="border-[hsl(var(--app-flow-border))]" onClick={() => setStep('licenses')}>
                    Edit licenses
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-[hsl(var(--app-flow-border))] bg-gradient-to-br from-[hsl(var(--app-flow-muted))]/80 to-background overflow-hidden shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--app-flow-border))] bg-background/60 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 shrink-0 text-[hsl(var(--app-flow-accent))]" />
                    <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Trader</span>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {TRADER_STATUSES_PREVIEW.initial}
                  </Badge>
                </div>
                <div className="p-4 sm:p-5">
                  <dl className="grid gap-3 sm:gap-x-8 sm:gap-y-2 sm:grid-cols-2">
                    <ReviewRow label="Full name" value={trader.fullName || '—'} />
                    <ReviewRow label="National ID" value={trader.nationalId || '—'} />
                    <ReviewRow label="Gender" value={formatGender(trader.gender)} />
                    <ReviewRow label="Date of birth" value={trader.dob || '—'} />
                    <ReviewRow label="Phone" value={trader.phone || '—'} />
                    <ReviewRow label="Email" value={trader.email || '—'} />
                    <ReviewRow label="Woreda / Kebele" value={[trader.woreda, trader.kebele].filter(Boolean).join(' · ') || '—'} />
                    <ReviewRow label="Address" value={trader.address || '—'} />
                  </dl>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground px-0.5">
                  <Briefcase className="h-4 w-4 text-[hsl(var(--app-flow-accent))]" />
                  Businesses & licenses
                </div>
                {businesses.map((b, bi) => (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-[hsl(var(--app-flow-border))] bg-card overflow-hidden shadow-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[hsl(var(--app-flow-border))] bg-muted/20 px-4 py-3 sm:px-5">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{b.name || `Business ${bi + 1}`}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {labelForOption(BUSINESS_CATEGORY_OPTIONS, b.category)}
                          {b.type ? ` · ${labelForOption(BUSINESS_TYPE_OPTIONS, b.type)}` : ''}
                        </div>
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        {BUSINESS_STATUSES_PREVIEW.initial}
                      </Badge>
                    </div>
                    <div className="p-4 sm:p-5 space-y-4">
                      <dl className="grid gap-3 sm:grid-cols-2 sm:gap-x-8">
                        <ReviewRow label="Shop no." value={b.shopNo || '—'} />
                        <ReviewRow label="Start date" value={b.startDate || '—'} />
                        <ReviewRow label="Location" value={[b.woreda, b.kebele].filter(Boolean).join(' · ') || '—'} />
                        <ReviewRow label="Phone" value={b.phone || '—'} />
                        <ReviewRow label="TIN" value={b.tin || '—'} />
                        <ReviewRow label="Address" value={b.address || '—'} className="sm:col-span-2" />
                      </dl>
                      <Separator className="bg-[hsl(var(--app-flow-border))]" />
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Licenses</div>
                        <ul className="grid gap-2 sm:grid-cols-2">
                          {b.licenses.map((l) => (
                            <li
                              key={l.id}
                              className="flex items-start justify-between gap-3 rounded-lg border border-[hsl(var(--app-flow-border))] bg-muted/15 px-3 py-2.5"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {labelForOption(LICENSE_TYPE_OPTIONS, l.licenseType)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Expires {l.expiryDate || '—'}
                                  {l.issueDate ? ` · Issued ${l.issueDate}` : ''}
                                  {l.licenseNo ? ` · #${l.licenseNo}` : ''}
                                </div>
                              </div>
                              <Badge variant="outline" className="shrink-0 text-[10px]">
                                {LICENSE_STATUSES_PREVIEW.initial}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Optional note (saved nowhere yet)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any special note for review..."
                  rows={3}
                  className="border-[hsl(var(--app-flow-border))] bg-background/80 resize-y min-h-[5rem]"
                />
              </div>
            </div>
          )}

          <Separator className="bg-[hsl(var(--app-flow-border))]" />

          <div className="flex items-center justify-between gap-3 flex-wrap pt-0">
            {step !== 'trader' ? (
              <Button type="button" variant="outline" className="border-[hsl(var(--app-flow-border))]" onClick={goBack} disabled={submitting}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {step !== 'review' ? (
              <Button
                type="button"
                className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
                onClick={goNext}
                disabled={submitting || !canGoNext}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
                onClick={submit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit registration'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
