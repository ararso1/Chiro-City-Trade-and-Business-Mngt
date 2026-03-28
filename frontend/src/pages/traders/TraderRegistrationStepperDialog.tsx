import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Briefcase, FileText, Plus, Trash2, User, Users } from 'lucide-react';

const TRADER_STATUSES = ['draft', 'submitted', 'verified', 'active', 'suspended', 'closed'] as const;
const BUSINESS_STATUSES = ['draft', 'pending', 'active', 'suspended', 'closed'] as const;
const LICENSE_STATUSES = ['application', 'review', 'approval', 'issued', 'renew', 'expired'] as const;

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
  status: (typeof TRADER_STATUSES)[number];
};

type LicenseDraft = {
  id: string;
  licenseNo: string;
  licenseType: string;
  issueDate: string;
  expiryDate: string;
  status: (typeof LICENSE_STATUSES)[number];
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
  status: (typeof BUSINESS_STATUSES)[number];
  licenses: LicenseDraft[];
};

type StepKey = 'trader' | 'businesses' | 'licenses' | 'review';

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const emptyTraderForm = (): TraderForm => ({
  fullName: '',
  gender: '',
  dob: '',
  phone: '',
  email: '',
  nationalId: '',
  address: '',
  woreda: '',
  kebele: '',
  status: 'draft',
});

const emptyLicenseDraft = (): LicenseDraft => ({
  id: uid('lic'),
  licenseNo: '',
  licenseType: '',
  issueDate: '',
  expiryDate: '',
  status: 'application',
  qrCode: '',
});

const emptyBusinessDraft = (): BusinessDraft => ({
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
  status: 'pending',
  licenses: [emptyLicenseDraft()],
});

function stepIndex(step: StepKey) {
  const order: StepKey[] = ['trader', 'businesses', 'licenses', 'review'];
  return order.indexOf(step);
}

const stepLabels: { key: StepKey; title: string; subtitle: string; icon: React.ReactNode }[] = [
  { key: 'trader', title: 'Trader', subtitle: 'Personal & status', icon: <User className="h-4 w-4" /> },
  {
    key: 'businesses',
    title: 'Businesses',
    subtitle: 'Add business profiles',
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    key: 'licenses',
    title: 'Licenses',
    subtitle: 'Applications per business',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    key: 'review',
    title: 'Review',
    subtitle: 'Confirm & submit',
    icon: <Users className="h-4 w-4" />,
  },
];

function cleanOptionalString(v: string | undefined | null) {
  const s = (v ?? '').trim();
  return s ? s : undefined;
}

export default function TraderRegistrationStepperDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (traderId: string) => void;
}) {
  const { open, onOpenChange, onCreated } = props;

  const [step, setStep] = useState<StepKey>('trader');
  const [submitting, setSubmitting] = useState(false);

  const [trader, setTrader] = useState<TraderForm>(emptyTraderForm());
  const [businesses, setBusinesses] = useState<BusinessDraft[]>([emptyBusinessDraft()]);

  useEffect(() => {
    if (!open) return;
    setStep('trader');
    setSubmitting(false);
    setTrader(emptyTraderForm());
    setBusinesses([emptyBusinessDraft()]);
  }, [open]);

  const currentStepIdx = stepIndex(step);
  const progress = useMemo(() => {
    return ((currentStepIdx + 1) / stepLabels.length) * 100;
  }, [currentStepIdx]);

  const canGoNext = useMemo(() => {
    if (step === 'trader') {
      return Boolean(trader.fullName.trim() && trader.phone.trim() && trader.email.trim() && trader.nationalId.trim());
    }
    if (step === 'businesses') {
      return (
        businesses.length > 0 &&
        businesses.every((b) => b.name.trim() && b.category.trim())
      );
    }
    if (step === 'licenses') {
      return businesses.every((b) => b.licenses.length > 0 && b.licenses.every((l) => l.licenseType.trim() && l.expiryDate.trim()));
    }
    return true;
  }, [businesses, step, trader]);

  const goNext = () => {
    if (!canGoNext) {
      toast({
        title: 'Missing required fields',
        description: step === 'trader'
          ? 'Full name, phone, email and National ID are required.'
          : step === 'businesses'
            ? 'Each business needs a name and category.'
            : 'Each business needs at least one license with license type and expiry date.',
        variant: 'destructive',
      });
      return;
    }
    const order: StepKey[] = ['trader', 'businesses', 'licenses', 'review'];
    const idx = order.indexOf(step);
    setStep(order[Math.min(order.length - 1, idx + 1)]);
  };

  const goBack = () => {
    const order: StepKey[] = ['trader', 'businesses', 'licenses', 'review'];
    const idx = order.indexOf(step);
    setStep(order[Math.max(0, idx - 1)]);
  };

  const addBusiness = () => {
    setBusinesses((prev) => [...prev, emptyBusinessDraft()]);
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
        return {
          ...b,
          licenses: b.licenses.map((l) => (l.id === licenseId ? { ...l, ...patch } : l)),
        };
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
        status: trader.status,
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
          status: b.status,
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
            status: l.status,
            qrCode: cleanOptionalString(l.qrCode),
          };
          await api.licenses.create(licensePayload);
        }
      }

      toast({ title: 'Trader registered', description: 'Businesses and license applications have been created.' });
      onOpenChange(false);
      onCreated(createdTrader.id as string);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const headerTitle =
    step === 'trader'
      ? 'Register Trader'
      : step === 'businesses'
        ? 'Add Businesses'
        : step === 'licenses'
          ? 'Add Licenses'
          : 'Review & Submit';

  return (
    <Dialog open={open} onOpenChange={(v) => onOpenChange(v)}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> {headerTitle}
          </DialogTitle>
          <DialogDescription>
            One stepper flow for trader registration, multiple businesses, and their license applications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Progress value={progress} />
          <div className="flex flex-wrap gap-3">
            {stepLabels.map((s, idx) => {
              const active = idx <= currentStepIdx;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center border ${
                      active ? 'bg-primary text-primary-foreground' : 'bg-background'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{s.subtitle}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {step === 'trader' && (
            <Card>
              <CardContent className="p-5 space-y-5">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="font-medium">Personal</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <Input value={trader.gender} onChange={(e) => setTrader((t) => ({ ...t, gender: e.target.value }))} placeholder="male/female/other" />
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={trader.address} onChange={(e) => setTrader((t) => ({ ...t, address: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Woreda</Label>
                    <Input value={trader.woreda} onChange={(e) => setTrader((t) => ({ ...t, woreda: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Kebele</Label>
                    <Input value={trader.kebele} onChange={(e) => setTrader((t) => ({ ...t, kebele: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>System status</Label>
                    <Select
                      value={trader.status}
                      onValueChange={(v) => setTrader((t) => ({ ...t, status: v as TraderForm['status'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRADER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'businesses' && (
            <Card>
              <CardContent className="p-5 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div className="font-medium">Businesses</div>
                  </div>
                  <Button type="button" variant="outline" onClick={addBusiness} disabled={businesses.length >= 10}>
                    <Plus className="h-4 w-4 mr-2" /> Add business
                  </Button>
                </div>

                <div className="space-y-4">
                  {businesses.map((b, idx) => (
                    <Card key={b.id} className="shadow-none border-dashed">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-medium">Business {idx + 1}</div>
                            <div className="text-xs text-muted-foreground">Add details and status</div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBusiness(b.id)}
                            disabled={businesses.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Business name *</Label>
                            <Input value={b.name} onChange={(e) => updateBusiness(b.id, { name: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Category *</Label>
                            <Input value={b.category} onChange={(e) => updateBusiness(b.id, { category: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Input value={b.type} onChange={(e) => updateBusiness(b.id, { type: e.target.value })} placeholder="retail/wholesale" />
                          </div>
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                              value={b.status}
                              onValueChange={(v) => updateBusiness(b.id, { status: v as BusinessDraft['status'] })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BUSINESS_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {s}
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Address</Label>
                            <Input value={b.address} onChange={(e) => updateBusiness(b.id, { address: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input value={b.phone} onChange={(e) => updateBusiness(b.id, { phone: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>TIN</Label>
                            <Input value={b.tin} onChange={(e) => updateBusiness(b.id, { tin: e.target.value })} />
                          </div>
                          <div className="space-y-2 flex items-center gap-2">
                            <Badge variant="secondary">{b.licenses.length} license(s)</Badge>
                            <span className="text-xs text-muted-foreground">Will edit in next step</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'licenses' && (
            <Card>
              <CardContent className="p-5 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="font-medium">Licenses</div>
                  </div>
                  <div className="text-sm text-muted-foreground">Add license applications per business</div>
                </div>

                <div className="space-y-4">
                  {businesses.map((b) => (
                    <Card key={b.id} className="shadow-none border-dashed">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-medium">{b.name || 'Business'}</div>
                            <div className="text-xs text-muted-foreground">Licenses attached to this business</div>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={() => addLicense(b.id)}>
                            <Plus className="h-4 w-4 mr-2" /> Add license
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {b.licenses.map((l, idx) => (
                            <div key={l.id} className="rounded-lg border p-3 space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="text-sm font-medium">License {idx + 1}</div>
                                  <div className="text-xs text-muted-foreground">Application workflow</div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLicense(b.id, l.id)}
                                  disabled={b.licenses.length <= 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>License type *</Label>
                                  <Input value={l.licenseType} onChange={(e) => updateLicense(b.id, l.id, { licenseType: e.target.value })} placeholder="annual_trading" />
                                </div>
                                <div className="space-y-2">
                                  <Label>Status</Label>
                                  <Select
                                    value={l.status}
                                    onValueChange={(v) =>
                                      updateLicense(b.id, l.id, { status: v as LicenseDraft['status'] })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {LICENSE_STATUSES.map((s) => (
                                        <SelectItem key={s} value={s}>
                                          {s}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>License # (optional)</Label>
                                  <Input value={l.licenseNo} onChange={(e) => updateLicense(b.id, l.id, { licenseNo: e.target.value })} placeholder="auto if empty" />
                                </div>
                                <div className="space-y-2">
                                  <Label>QR code (optional)</Label>
                                  <Input value={l.qrCode} onChange={(e) => updateLicense(b.id, l.id, { qrCode: e.target.value })} placeholder="url or data" />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Issue date</Label>
                                  <Input type="date" value={l.issueDate} onChange={(e) => updateLicense(b.id, l.id, { issueDate: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Expiry date *</Label>
                                  <Input type="date" value={l.expiryDate} onChange={(e) => updateLicense(b.id, l.id, { expiryDate: e.target.value })} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'review' && (
            <Card>
              <CardContent className="p-5 space-y-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-lg font-semibold">Preview</div>
                    <div className="text-sm text-muted-foreground">
                      Trader, businesses, and license applications that will be created.
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button type="button" variant="outline" onClick={() => setStep('trader')}>Edit trader</Button>
                    <Button type="button" variant="outline" onClick={() => setStep('businesses')}>Edit businesses</Button>
                    <Button type="button" variant="outline" onClick={() => setStep('licenses')}>Edit licenses</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="shadow-none">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-medium">Trader</div>
                        <Badge variant={trader.status === 'active' ? 'default' : 'secondary'}>{trader.status}</Badge>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{trader.fullName || '-'}</div>
                        <div className="text-muted-foreground">{trader.email || '-'} · {trader.phone || '-'}</div>
                        <div className="text-muted-foreground">National ID: {trader.nationalId || '-'}</div>
                        <div className="text-muted-foreground">{trader.woreda || '-'} / {trader.kebele || '-'}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-none">
                    <CardContent className="p-4 space-y-2">
                      <div className="font-medium">Totals</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Businesses</div>
                          <div className="font-semibold">{businesses.length}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Licenses</div>
                          <div className="font-semibold">
                            {businesses.reduce((n, b) => n + (b.licenses?.length ?? 0), 0)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pt-2">
                        License workflow will start at the selected license status (default: application).
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  {businesses.map((b) => (
                    <Card key={b.id} className="shadow-none">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-medium">{b.name || '-'}</div>
                            <div className="text-sm text-muted-foreground">
                              {b.category || '-'} · {b.type || '—'} · {b.woreda || '-'} / {b.kebele || '-'}
                            </div>
                          </div>
                          <Badge variant={b.status === 'active' ? 'default' : 'secondary'}>{b.status}</Badge>
                        </div>

                        <div className="space-y-2">
                          {b.licenses.map((l) => (
                            <div key={l.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{l.licenseType || 'License'}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  #{l.licenseNo || 'auto'} · Exp: {l.expiryDate || '-'}
                                </div>
                              </div>
                              <Badge variant={l.status === 'issued' ? 'default' : 'secondary'}>{l.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="mt-2">
          {step !== 'trader' && (
            <Button type="button" variant="outline" onClick={goBack} disabled={submitting}>
              Back
            </Button>
          )}
          {step !== 'review' && (
            <Button type="button" onClick={goNext} disabled={submitting || !canGoNext}>
              Next
            </Button>
          )}
          {step === 'review' && (
            <Button type="button" onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit registration'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
