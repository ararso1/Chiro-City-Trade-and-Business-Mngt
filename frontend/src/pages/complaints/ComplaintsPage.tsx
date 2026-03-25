import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

export default function ComplaintsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ submittedBy: '', contactPhone: '', contactEmail: '', subject: '', description: '', category: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.complaints.list({ take: 50 });
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.complaints.create(form);
      toast({ title: 'Complaint submitted' });
      setOpen(false);
      setForm({ submittedBy: '', contactPhone: '', contactEmail: '', subject: '', description: '', category: '' });
      load();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-8 w-8" /> Complaints</h1>
        <p className="text-muted-foreground">Citizen complaints and follow-up</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Complaints</CardTitle><CardDescription>Total: {total}</CardDescription></div>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Submit complaint</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead><TableHead>Submitted by</TableHead><TableHead>Contact</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.subject}</TableCell>
                    <TableCell>{c.submittedBy}</TableCell>
                    <TableCell>{c.contactPhone || c.contactEmail || '-'}</TableCell>
                    <TableCell><Badge variant={c.status === 'resolved' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit complaint</DialogTitle><CardDescription>Citizen complaint</CardDescription></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Your name *</Label><Input value={form.submittedBy} onChange={(e) => setForm((f) => ({ ...f, submittedBy: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Description *</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. service, license" /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Submit</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
