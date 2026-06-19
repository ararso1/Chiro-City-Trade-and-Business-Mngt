import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Sparkles, Users } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: '__unset__', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
function cleanOptionalString(v: string) {
  const s = (v ?? '').trim();
  return s ? s : undefined;
}

function todayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function TraderRegistrationPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [trader, setTrader] = useState({
    fullName: '',
    gender: '',
    nationalId: '',
    address: '',
    typeOfJob: '',
    phone: '',
    tin: '',
    plateNumber: '',
    associationType: '',
    businessArea: '',
    category: '',
    licenseRegistrationType: 'new_registration',
    licenseRegistrationDate: todayDateValue(),
  });

  const submit = async () => {
    if (!trader.fullName.trim() || !trader.tin.trim()) {
      toast({ title: 'Missing required fields', description: 'Full name and TIN are required.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const traderPayload: Record<string, any> = {
        fullName: trader.fullName.trim(),
        tin: trader.tin.trim(),
        gender: cleanOptionalString(trader.gender),
        nationalId: cleanOptionalString(trader.nationalId),
        address: cleanOptionalString(trader.address),
        phone: cleanOptionalString(trader.phone),
        typeOfJob: cleanOptionalString(trader.typeOfJob),
        plateNumber: cleanOptionalString(trader.plateNumber),
        associationType: cleanOptionalString(trader.associationType),
        businessArea: cleanOptionalString(trader.businessArea),
        category: cleanOptionalString(trader.category),
        licenseRegistrationType: trader.licenseRegistrationType,
        licenseRegistrationDate: trader.licenseRegistrationDate,
      };

      const createdTrader = await api.traders.create(traderPayload);
      toast({ title: 'Registration submitted', description: 'Trader profile created with registration expiry tracking.' });
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
          Trader-only registration
        </Badge>
      </div>

      <Card className="app-flow-card mx-auto max-w-4xl overflow-hidden">
        <CardHeader className="space-y-1 border-b border-[hsl(var(--app-flow-border))] bg-muted/25 pb-6">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))]">
              <Users className="h-5 w-5" />
            </span>
            Trader Registration
          </CardTitle>
          <CardDescription className="text-base">
            Create trader profile and registration expiry status in one step.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full name *</Label>
                  <Input value={trader.fullName} onChange={(e) => setTrader((t) => ({ ...t, fullName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>TIN *</Label>
                  <Input value={trader.tin} onChange={(e) => setTrader((t) => ({ ...t, tin: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={trader.gender || '__unset__'}
                    onValueChange={(v) => setTrader((t) => ({ ...t, gender: v === '__unset__' ? '' : v }))}
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
                  <Label>National ID</Label>
                  <Input value={trader.nationalId} onChange={(e) => setTrader((t) => ({ ...t, nationalId: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Phone (unique)</Label>
                  <Input value={trader.phone} onChange={(e) => setTrader((t) => ({ ...t, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Type of job</Label>
                  <Input value={trader.typeOfJob} onChange={(e) => setTrader((t) => ({ ...t, typeOfJob: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Plate number (for cars)</Label>
                  <Input value={trader.plateNumber} onChange={(e) => setTrader((t) => ({ ...t, plateNumber: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Type of association (for cars)</Label>
                  <Input value={trader.associationType} onChange={(e) => setTrader((t) => ({ ...t, associationType: e.target.value }))} />
                </div>
                {/* <div className="space-y-2">
                  <Label>Area of business</Label>
                  <Input value={trader.businessArea} onChange={(e) => setTrader((t) => ({ ...t, businessArea: e.target.value }))} />
                </div> */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={trader.category} onChange={(e) => setTrader((t) => ({ ...t, category: e.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Input value={trader.address} onChange={(e) => setTrader((t) => ({ ...t, address: e.target.value }))} />
                </div>
              </div>
            <div className="rounded-md border border-[hsl(var(--app-flow-border))] p-4">
              <p className="text-sm font-medium mb-3">Registration expiry tracking</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-md border border-[hsl(var(--app-flow-border))] p-3 md:col-span-2">
                  <Label className="mb-3 block">Registration status</Label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={trader.licenseRegistrationType === 'new_registration'}
                        onCheckedChange={(checked) =>
                          checked && setTrader((t) => ({ ...t, licenseRegistrationType: 'new_registration' }))
                        }
                      />
                      New Registration
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={trader.licenseRegistrationType === 'renewal'}
                        onCheckedChange={(checked) =>
                          checked && setTrader((t) => ({ ...t, licenseRegistrationType: 'renewal' }))
                        }
                      />
                      Renewal
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Registration date</Label>
                  <Input
                    type="date"
                    value={trader.licenseRegistrationDate}
                    onChange={(e) => setTrader((t) => ({ ...t, licenseRegistrationDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
