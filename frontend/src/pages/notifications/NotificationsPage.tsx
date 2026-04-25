import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  BellOff,
  Mail,
  Smartphone,
  Slack,
  Info,
  Settings,
  Send,
  Filter,
  Loader2,
  Receipt,
  FileCheck,
  Calendar,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { format } from "date-fns";
import { api } from "@/services/api";
import { toast } from "@/hooks/use-toast";

export type AnnouncementType =
  | "tax_reminder"
  | "license_expiry"
  | "meeting"
  | "announcement";

const ANNOUNCEMENT_TYPES: { value: AnnouncementType; label: string }[] = [
  { value: "tax_reminder", label: "Tax Reminder (Annual)" },
  { value: "license_expiry", label: "License Expiry" },
  { value: "meeting", label: "Random Meeting" },
  { value: "announcement", label: "Announcement" },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<string>("__all__");
  const [readFilter, setReadFilter] = useState<string>("__all__");
  const [sendDialog, setSendDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: "announcement" as AnnouncementType,
    title: "",
    message: "",
    expiryDate: "",
    channels: { inApp: true, email: false, sms: false },
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      enabled: true,
      frequency: "immediate",
      types: {
        taxReminders: true,
        licenseExpiry: true,
        meetings: true,
        announcements: true,
      },
    },
    sms: {
      enabled: false,
      types: {
        taxReminders: true,
        licenseExpiry: true,
        meetings: false,
        announcements: false,
      },
    },
    slack: {
      enabled: false,
      webhook: "",
      types: {
        taxReminders: false,
        licenseExpiry: false,
        meetings: false,
        announcements: false,
      },
    },
  });

  const loadInbox = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { take: "50" };
      if (readFilter === "read") params.read = "true";
      else if (readFilter === "unread") params.read = "false";
      if (filter !== "__all__") params.type = filter;
      const res = await api.notifications.list(params);
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      toast({
        title: "Error",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, [filter, readFilter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
      );
    } catch (e) {
      toast({
        title: "Error",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleSendBulk = async () => {
    if (!form.title.trim()) {
      toast({ title: "Enter a title", variant: "destructive" });
      return;
    }
    if (!form.channels.inApp && !form.channels.sms && !form.channels.email) {
      toast({ title: "Select at least one delivery method", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const body: Parameters<typeof api.notifications.bulkSend>[0] = {
        type: form.type,
        title: form.title.trim(),
        body: form.message.trim() || undefined,
        channels: {
          inApp: form.channels.inApp,
          email: form.channels.email,
          sms: form.channels.sms,
        },
      };
      if (form.type === "license_expiry" && form.expiryDate) {
        body.expiryDate = form.expiryDate;
      }
      const res = await api.notifications.bulkSend(body);
      const smsSummary =
        form.channels.sms
          ? ` SMS: ${res.smsSent ?? 0} sent, ${res.smsFailed ?? 0} failed.`
          : "";
      toast({
        title: "Sent",
        description: `General notification sent to ${res.tradersCount} traders (${res.created} delivery entries). In-app${form.channels.email ? " + email" : ""}${form.channels.sms ? " + SMS" : ""}.${smsSummary}`,
        variant:
          form.channels.sms && (res.smsSent ?? 0) === 0 && (res.smsFailed ?? 0) > 0
            ? "destructive"
            : "default",
      });
      setSendDialog(false);
      setForm({
        type: "announcement",
        title: "",
        message: "",
        expiryDate: "",
        channels: { inApp: true, email: false, sms: false },
      });
      loadInbox();
    } catch (e) {
      toast({
        title: "Error",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const isDraft = (n: any) => Boolean(n?.metadata?.draft);

  const handleSaveDraft = async () => {
    if (!form.title.trim()) {
      toast({ title: "Enter a title", variant: "destructive" });
      return;
    }
    if (!form.channels.inApp && !form.channels.sms && !form.channels.email) {
      toast({ title: "Select at least one delivery method", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await api.notifications.saveDraft({
        type: form.type,
        title: form.title.trim(),
        body: form.message.trim() || undefined,
        channels: {
          inApp: form.channels.inApp,
          sms: form.channels.sms,
          email: form.channels.email,
        },
        deadline: form.expiryDate || undefined,
      });
      toast({
        title: "Draft saved",
        description: `Draft saved with channels:${form.channels.inApp ? " in-app" : ""}${form.channels.sms ? " SMS" : ""}${form.channels.email ? " Email" : ""}. Publish later from card actions.`,
      });
      setSendDialog(false);
      await loadInbox();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleUpdateNotification = async () => {
    if (!editing?.id) return;
    if (!editing?.channels?.inApp && !editing?.channels?.sms && !editing?.channels?.email) {
      toast({ title: "Select at least one delivery method", variant: "destructive" });
      return;
    }
    setSavingEdit(true);
    try {
      const channel = editing.channels?.sms
        ? "sms"
        : editing.channels?.email
        ? "email"
        : "in_app";
      await api.notifications.update(editing.id, {
        title: editing.title,
        body: editing.body ?? null,
        channel,
        channels: {
          inApp: Boolean(editing.channels?.inApp),
          sms: Boolean(editing.channels?.sms),
          email: Boolean(editing.channels?.email),
        },
        deadline: editing.deadline || null,
      });
      toast({ title: "Updated", description: "Notification updated." });
      setEditing(null);
      await loadInbox();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteNotification = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await api.notifications.delete(deleteTarget.id);
      toast({ title: "Deleted", description: "Notification removed." });
      setDeleteTarget(null);
      await loadInbox();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handlePublishDraft = async (id: string) => {
    setPublishingId(id);
    try {
      await api.notifications.publishDraft(id);
      toast({ title: "Published", description: "Draft is now published." });
      await loadInbox();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setPublishingId(null);
    }
  };

  const unreadCount = items.filter((n) => !n.readAt).length;
  const stats = {
    total,
    unread: unreadCount,
    today: items.filter(
      (n) =>
        format(new Date(n.createdAt), "yyyy-MM-dd") ===
        format(new Date(), "yyyy-MM-dd")
    ).length,
    thisWeek: items.filter((n) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(n.createdAt) >= weekAgo;
    }).length,
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tax_reminder":
        return <Receipt className="h-4 w-4 text-amber-500" />;
      case "license_expiry":
        return <FileCheck className="h-4 w-4 text-orange-500" />;
      case "meeting":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "announcement":
        return <Megaphone className="h-4 w-4 text-violet-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) =>
    ANNOUNCEMENT_TYPES.find((t) => t.value === type)?.label ?? type;

  const getTypeBorder = (type: string) => {
    switch (type) {
      case "tax_reminder":
        return "border-l-amber-500";
      case "license_expiry":
        return "border-l-orange-500";
      case "meeting":
        return "border-l-blue-500";
      case "announcement":
        return "border-l-violet-500";
      default:
        return "border-l-gray-400";
    }
  };

  const getChannels = (n: any) => {
    const fromMeta = n?.metadata?.channels;
    if (fromMeta && typeof fromMeta === "object") {
      return {
        inApp: Boolean(fromMeta.inApp),
        sms: Boolean(fromMeta.sms),
        email: Boolean(fromMeta.email),
      };
    }
    if (n?.metadata && typeof n.metadata === "object") {
      return {
        inApp: n?.channel === "in_app" || Boolean(n.metadata.sendInApp),
        sms: Boolean(n.metadata.sendSms) || n?.channel === "sms",
        email: Boolean(n.metadata.sendEmail) || n?.channel === "email",
      };
    }
    return {
      inApp: n?.channel === "in_app",
      sms: n?.channel === "sms",
      email: n?.channel === "email",
    };
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Notifications &amp; Announcements
          </h1>
          <p className="text-muted-foreground">
            Send bulk SMS and email to all traders (tax reminders, license
            expiry, meetings, announcements)
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={sendDialog} onOpenChange={setSendDialog}>
            <DialogTrigger asChild>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Send Announcement
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.unread}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.today}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Bell className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.thisWeek}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>Notification Inbox</CardTitle>
              <CardDescription>
                Notifications for the current user
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger className="w-44">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All types</SelectItem>
                  {ANNOUNCEMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={readFilter}
                onValueChange={setReadFilter}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Read" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BellOff className="h-12 w-12 mx-auto mb-4" />
              <p>No notifications found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={`border-l-4 rounded-xl border border-[hsl(var(--app-flow-border))] p-4 transition-all hover:shadow-md hover:-translate-y-[1px] cursor-pointer ${getTypeBorder(n.type)} ${
                    !n.readAt ? "bg-blue-50/70 dark:bg-blue-950/15" : "bg-card/90"
                  }`}
                  onClick={() => !n.readAt && handleMarkAsRead(n.id)}
                >
                  <div className="flex items-start gap-3">
                    {getTypeIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium">{n.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(n.type)}
                        </Badge>
                        {isDraft(n) && <Badge variant="secondary" className="text-xs">Draft</Badge>}
                        {!n.readAt && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      {n.body && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {n.body}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {format(
                            new Date(n.createdAt),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </span>
                        {getChannels(n).inApp && <Badge variant="outline" className="text-[10px]">In-app</Badge>}
                        {getChannels(n).sms && <Badge variant="outline" className="text-[10px]">SMS</Badge>}
                        {getChannels(n).email && <Badge variant="outline" className="text-[10px]">Email</Badge>}
                        {n?.metadata?.deadline && <span>Deadline: {String(n.metadata.deadline)}</span>}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing({
                                id: n.id,
                                title: n.title ?? "",
                                body: n.body ?? "",
                                channels: getChannels(n),
                                deadline: n?.metadata?.deadline ?? "",
                              });
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {isDraft(n) && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePublishDraft(n.id);
                              }}
                              disabled={publishingId === n.id}
                            >
                              <UploadCloud className="mr-2 h-4 w-4" />
                              {publishingId === n.id ? "Publishing..." : "Publish draft"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(n);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit notification</DialogTitle>
            <DialogDescription>Update message text, deadline and delivery method.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={editing?.title ?? ""} onChange={(e) => setEditing((p: any) => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={editing?.body ?? ""} onChange={(e) => setEditing((p: any) => ({ ...p, body: e.target.value }))} rows={3} />
            </div>
            <div>
              <Label>Delivery methods</Label>
              <div className="space-y-2 mt-2 rounded-lg border border-[hsl(var(--app-flow-border))] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">In-app</span>
                  <Switch
                    checked={Boolean(editing?.channels?.inApp)}
                    onCheckedChange={(checked) =>
                      setEditing((p: any) => ({
                        ...p,
                        channels: { ...(p?.channels ?? {}), inApp: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SMS</span>
                  <Switch
                    checked={Boolean(editing?.channels?.sms)}
                    onCheckedChange={(checked) =>
                      setEditing((p: any) => ({
                        ...p,
                        channels: { ...(p?.channels ?? {}), sms: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email</span>
                  <Switch
                    checked={Boolean(editing?.channels?.email)}
                    onCheckedChange={(checked) =>
                      setEditing((p: any) => ({
                        ...p,
                        channels: { ...(p?.channels ?? {}), email: checked },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Deadline</Label>
              <Input type="date" value={editing?.deadline ?? ""} onChange={(e) => setEditing((p: any) => ({ ...p, deadline: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>Cancel</Button>
            <Button onClick={handleUpdateNotification} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notification?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteNotification();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* General notification dialog */}
      <Dialog open={sendDialog} onOpenChange={setSendDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>
              Bulk SMS and email: annual tax payment, license expiry, random
              meetings, or general announcements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, type: v as AnnouncementType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANNOUNCEMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.type === "license_expiry" && (
              <div>
                <Label>Expiry date</Label>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, expiryDate: e.target.value }))
                  }
                />
              </div>
            )}
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g. Annual tax payment reminder"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={form.message}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Body of the notification"
                rows={3}
              />
            </div>
            <div>
              <Label>Channels (bulk SMS &amp; email to all traders)</Label>
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">In-app notification</span>
                  <Switch
                    checked={form.channels.inApp}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, inApp: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Email</span>
                  </div>
                  <Switch
                    checked={form.channels.email}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, email: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm">SMS</span>
                  </div>
                  <Switch
                    checked={form.channels.sms}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, sms: checked },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSendDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleSaveDraft} disabled={sending}>
                Save draft
              </Button>
              <Button onClick={handleSendBulk} disabled={sending}>
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Announcement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification settings</DialogTitle>
            <DialogDescription>
              Preferences for tax reminders, license expiry, meetings, and
              announcements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  <h3 className="font-medium">Email</h3>
                </div>
                <Switch
                  checked={notificationSettings.email.enabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      email: { ...prev.email, enabled: checked },
                    }))
                  }
                />
              </div>
              {notificationSettings.email.enabled && (
                <div className="space-y-2 pl-7">
                  <Label>Frequency</Label>
                  <Select
                    value={notificationSettings.email.frequency}
                    onValueChange={(value) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        email: { ...prev.email, frequency: value },
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily digest</SelectItem>
                      <SelectItem value="weekly">Weekly digest</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label className="pt-2 block">Types</Label>
                  <div className="space-y-2">
                    {Object.entries(notificationSettings.email.types).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm capitalize">
                            {key.replace(/([A-Z])/g, " $1")}
                          </span>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) =>
                              setNotificationSettings((prev) => ({
                                ...prev,
                                email: {
                                  ...prev.email,
                                  types: {
                                    ...prev.email.types,
                                    [key]: checked,
                                  },
                                },
                              }))
                            }
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  <h3 className="font-medium">SMS</h3>
                </div>
                <Switch
                  checked={notificationSettings.sms.enabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      sms: { ...prev.sms, enabled: checked },
                    }))
                  }
                />
              </div>
              {notificationSettings.sms.enabled && (
                <div className="space-y-2 pl-7">
                  {Object.entries(notificationSettings.sms.types).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, " $1")}
                        </span>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              sms: {
                                ...prev.sms,
                                types: { ...prev.sms.types, [key]: checked },
                              },
                            }))
                          }
                        />
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Slack className="h-5 w-5" />
                  <h3 className="font-medium">Slack</h3>
                </div>
                <Switch
                  checked={notificationSettings.slack.enabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      slack: { ...prev.slack, enabled: checked },
                    }))
                  }
                />
              </div>
              {notificationSettings.slack.enabled && (
                <div className="space-y-3 pl-7">
                  <div>
                    <Label>Webhook URL</Label>
                    <Input
                      value={notificationSettings.slack.webhook}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          slack: {
                            ...prev.slack,
                            webhook: e.target.value,
                          },
                        }))
                      }
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSettingsDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  toast({
                    title: "Settings saved",
                    description:
                      "Notification preferences updated",
                  });
                  setSettingsDialog(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
