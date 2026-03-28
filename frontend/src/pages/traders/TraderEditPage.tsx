import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, UserPen } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const TRADER_STATUSES = ['draft', 'submitted', 'verified', 'active', 'suspended', 'closed'] as const;

const SELECT_UNSET = '__unset__';

const GENDER_OPTIONS = [
  { value: SELECT_UNSET, label: 'Not set' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

function dobToInput(d: string | null | undefined) {
  if (!d) return '';
  return String(d).slice(0, 10);
}

export default function TraderEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, isLoading: authLoading } = useAuth();
  const canUpdate = hasPermission('traders.update');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [woreda, setWoreda] = useState('');
  const [kebele, setKebele] = useState('');
  const [status, setStatus] = useState<string>('draft');

  useEffect(() => {
    if (!id || authLoading) return;
    if (!canUpdate) {
      toast({ title: 'Access denied', description: 'You do not have permission to edit traders.', variant: 'destructive' });
      navigate(`/traders/${id}`);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.traders
      .get(id)
      .then((t) => {
        setFullName(t.fullName ?? '');
        setEmail(t.email ?? '');
        setPhone(t.phone ?? '');
        setNationalId(t.nationalId ?? '');
        setGender(t.gender ?? '');
        setDob(dobToInput(t.dob));
        setAddress(t.address ?? '');
        setWoreda(t.woreda ?? '');
        setKebele(t.kebele ?? '');
        setStatus(t.status ?? 'draft');
      })
      .catch((e) => toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [id, canUpdate, navigate, authLoading]);

  const save = async () => {
    if (!id || !canUpdate) return;
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast({ title: 'Missing fields', description: 'Full name, email, and phone are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.traders.update(id, {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        nationalId: nationalId.trim() || undefined,
        gender: gender || undefined,
        dob: dob || undefined,
        address: address.trim() || undefined,
        woreda: woreda.trim() || undefined,
        kebele: kebele.trim() || undefined,
        status,
      });
      toast({ title: 'Saved', description: 'Trader profile was updated.' });
      navigate(`/traders/${id}`);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return null;
  }

  if (authLoading) {
    return (
      <div className="app-flow-page flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-flow-page flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="app-flow-page space-y-6 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl flex items-center gap-3">
        <Button variant="outline" size="sm" className="border-[hsl(var(--app-flow-border))]" onClick={() => navigate(`/traders/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="app-flow-card mx-auto max-w-2xl overflow-hidden">
        <CardHeader className="border-b border-[hsl(var(--app-flow-border))] bg-muted/25">
          <CardTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))]">
              <UserPen className="h-5 w-5" />
            </span>
            Edit trader
          </CardTitle>
          <CardDescription>Update profile and status. Changes are saved to the server immediately.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Full name *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>National ID</Label>
              <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender ? gender : SELECT_UNSET} onValueChange={(v) => setGender(v === SELECT_UNSET ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Gender" />
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
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
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
            <div className="space-y-2">
              <Label>Woreda</Label>
              <Input value={woreda} onChange={(e) => setWoreda(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kebele</Label>
              <Input value={kebele} onChange={(e) => setKebele(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" className="border-[hsl(var(--app-flow-border))]" onClick={() => navigate(`/traders/${id}`)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[hsl(var(--app-flow-accent))] text-[hsl(var(--app-flow-accent-foreground))] hover:bg-[hsl(var(--app-flow-accent)/0.92)]"
              onClick={save}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
