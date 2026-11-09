import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Archive,
  AlertTriangle,
  Building2,
  DollarSign,
  FileCheck,
  Filter,
  MessageSquare,
  RefreshCw,
  Shield,
  Users,
} from 'lucide-react';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from 'date-fns';
import { api } from '@/services/api';

type ModuleSummary = Awaited<ReturnType<typeof api.reports.summary>>;

type DatePreset =
  | 'this-week'
  | 'this-month'
  | 'last-30-days'
  | 'last-90-days'
  | 'this-year'
  | 'fiscal-year'
  | 'custom'
  | 'all-time';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
];

function toRecordEntries(record: Record<string, number> = {}) {
  return Object.entries(record)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function formatMoney(value: number, currency = 'ETB') {
  return `${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function resolvePresetRange(preset: DatePreset): { from?: Date; to?: Date } {
  const now = new Date();
  switch (preset) {
    case 'this-week':
      return { from: startOfWeek(now), to: endOfWeek(now) };
    case 'this-month':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'last-30-days':
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case 'last-90-days':
      return { from: startOfDay(subDays(now, 89)), to: endOfDay(now) };
    case 'this-year':
      return { from: startOfYear(now), to: endOfDay(now) };
    case 'all-time':
      return {};
    case 'fiscal-year':
    case 'custom':
    default:
      return {};
  }
}

function toIsoDate(value?: Date | null) {
  if (!value) return undefined;
  return format(value, 'yyyy-MM-dd');
}

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
}) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-2 text-2xl font-bold">{value}</div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const BreakdownList = ({
  title,
  items,
}: {
  title: string;
  items: { name: string; value: number }[];
}) => (
  <div className="space-y-3">
    <h4 className="text-sm font-medium">{title}</h4>
    {items.length === 0 ? (
      <p className="text-sm text-muted-foreground">No records in this period</p>
    ) : (
      <div className="space-y-2">
        {items.slice(0, 8).map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span className="capitalize text-muted-foreground">
              {item.name.replaceAll('_', ' ')}
            </span>
            <span className="font-medium">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const StatusChart = ({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: { name: string; value: number }[];
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No data for the selected period
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </CardContent>
  </Card>
);

export default function ReportsPage() {
  const [preset, setPreset] = useState<DatePreset>('fiscal-year');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [summary, setSummary] = useState<ModuleSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryRange = useMemo(() => {
    if (preset === 'all-time') {
      return { all: true as const };
    }
    if (preset === 'custom') {
      return {
        from: customFrom || undefined,
        to: customTo || undefined,
      };
    }
    if (preset === 'fiscal-year') {
      return {};
    }
    const range = resolvePresetRange(preset);
    return {
      from: toIsoDate(range.from),
      to: toIsoDate(range.to),
    };
  }, [preset, customFrom, customTo]);

  const loadSummary = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await api.reports.summary(queryRange);
        setSummary(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load report summary');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [queryRange],
  );

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const overviewBars = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Traders', value: summary.overview.traders },
      { name: 'Businesses', value: summary.overview.businesses },
      { name: 'Licenses', value: summary.overview.licenses },
      { name: 'Inspections', value: summary.overview.inspections },
      { name: 'Complaints', value: summary.overview.openComplaints },
      { name: 'Documents', value: summary.overview.documents },
    ];
  }, [summary]);

  const periodLabel = useMemo(() => {
    if (!summary) return 'Loading period…';
    if (preset === 'all-time') return 'All time';
    if (summary.period.from && summary.period.to) {
      return `${format(new Date(summary.period.from), 'MMM d, yyyy')} – ${format(
        new Date(summary.period.to),
        'MMM d, yyyy',
      )}`;
    }
    return summary.period.label || 'All time';
  }, [summary, preset]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <p className="font-medium">Could not load reports</p>
        <p className="text-sm">{error || 'Unknown error'}</p>
        <Button className="mt-3" variant="outline" onClick={() => void loadSummary()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Cross-module summary for Chiro City trade and business operations
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{periodLabel}</Badge>
            {summary.fiscalYear && preset === 'fiscal-year' && (
              <Badge variant="outline">
                Fiscal year: {summary.fiscalYear.label} ({summary.fiscalYear.calendarType})
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Updated {new Date(summary.generatedAt).toLocaleString()}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => void loadSummary(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Time filter
          </CardTitle>
          <CardDescription>
            Filter registrations, payments, inspections, complaints, and uploads by period
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Preset</Label>
            <Select
              value={preset}
              onValueChange={(value) => setPreset(value as DatePreset)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fiscal-year">Active fiscal year</SelectItem>
                <SelectItem value="this-week">This week</SelectItem>
                <SelectItem value="this-month">This month</SelectItem>
                <SelectItem value="last-30-days">Last 30 days</SelectItem>
                <SelectItem value="last-90-days">Last 90 days</SelectItem>
                <SelectItem value="this-year">This calendar year</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
                <SelectItem value="all-time">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="date"
              value={
                preset === 'custom'
                  ? customFrom
                  : 'from' in queryRange && queryRange.from
                    ? queryRange.from
                    : ''
              }
              disabled={preset !== 'custom'}
              onChange={(e) => {
                setPreset('custom');
                setCustomFrom(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="date"
              value={
                preset === 'custom'
                  ? customTo
                  : 'to' in queryRange && queryRange.to
                    ? queryRange.to
                    : ''
              }
              disabled={preset !== 'custom'}
              onChange={(e) => {
                setPreset('custom');
                setCustomTo(e.target.value);
              }}
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => void loadSummary()}>
              Apply filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Traders"
          value={summary.traders.total.toLocaleString()}
          description={`${summary.traders.active} active, ${summary.traders.submitted} submitted`}
          icon={Users}
        />
        <StatCard
          title="Businesses"
          value={summary.businesses.total.toLocaleString()}
          description={`${summary.businesses.active} active, ${summary.businesses.pending} pending`}
          icon={Building2}
        />
        <StatCard
          title="Revenue"
          value={formatMoney(summary.finance.revenue, summary.finance.currency)}
          description={`${summary.finance.paidCount} paid payments`}
          icon={DollarSign}
        />
        <StatCard
          title="Open issues"
          value={(
            summary.overview.openComplaints + summary.overview.openViolations
          ).toLocaleString()}
          description={`${summary.overview.openViolations} violations, ${summary.overview.openComplaints} complaints`}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Licenses"
          value={summary.licenses.total.toLocaleString()}
          description={`${summary.licenses.issuedInPeriod} issued, ${summary.licenses.expiringSoon} expiring soon`}
          icon={FileCheck}
        />
        <StatCard
          title="Inspections"
          value={summary.inspections.total.toLocaleString()}
          description={`${summary.inspections.conducted} conducted, ${summary.inspections.scheduled} scheduled`}
          icon={Shield}
        />
        <StatCard
          title="Complaints"
          value={summary.complaints.total.toLocaleString()}
          description={`${summary.complaints.open} open, ${summary.complaints.resolved} resolved`}
          icon={MessageSquare}
        />
        <StatCard
          title="Documents"
          value={summary.documents.total.toLocaleString()}
          description={`${summary.documents.traderDocuments} trader, ${summary.documents.businessDocuments} business`}
          icon={Archive}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module volume</CardTitle>
          <CardDescription>Activity counts across modules for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={overviewBars}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="traders" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="traders">Traders</TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="traders" className="grid gap-4 lg:grid-cols-2">
          <StatusChart
            title="Trader status"
            description="Registrations in the selected period by status"
            data={toRecordEntries(summary.traders.byStatus)}
          />
          <Card>
            <CardHeader>
              <CardTitle>Trader categories</CardTitle>
              <CardDescription>Top categories in this period</CardDescription>
            </CardHeader>
            <CardContent>
              <BreakdownList
                title="By category"
                items={toRecordEntries(summary.traders.byCategory)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="businesses" className="grid gap-4 lg:grid-cols-2">
          <StatusChart
            title="Business status"
            description="Business registrations by status"
            data={toRecordEntries(summary.businesses.byStatus)}
          />
          <Card>
            <CardHeader>
              <CardTitle>Business categories</CardTitle>
              <CardDescription>Top categories in this period</CardDescription>
            </CardHeader>
            <CardContent>
              <BreakdownList
                title="By category"
                items={toRecordEntries(summary.businesses.byCategory)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses" className="grid gap-4 lg:grid-cols-2">
          <StatusChart
            title="License health"
            description="Active, expired, and suspended licenses in period"
            data={[
              { name: 'active', value: summary.licenses.active },
              { name: 'expired', value: summary.licenses.expired },
              { name: 'suspended', value: summary.licenses.suspended },
              { name: 'expiring soon', value: summary.licenses.expiringSoon },
            ].filter((d) => d.value > 0)}
          />
          <Card>
            <CardHeader>
              <CardTitle>License summary</CardTitle>
              <CardDescription>Issuance and expiry outlook</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Total in period</p>
                <p className="text-xl font-semibold">{summary.licenses.total}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Issued in period</p>
                <p className="text-xl font-semibold">{summary.licenses.issuedInPeriod}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Expiring in 30 days</p>
                <p className="text-xl font-semibold">{summary.licenses.expiringSoon}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Suspended</p>
                <p className="text-xl font-semibold">{summary.licenses.suspended}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="grid gap-4 lg:grid-cols-2">
          <StatusChart
            title="Payment status"
            description="Payments created in the selected period"
            data={toRecordEntries(summary.finance.byStatus)}
          />
          <Card>
            <CardHeader>
              <CardTitle>Finance summary</CardTitle>
              <CardDescription>Revenue uses paidAt within the selected range</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-semibold">
                  {formatMoney(summary.finance.revenue, summary.finance.currency)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-xl font-semibold">{summary.finance.paidCount}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-semibold">{summary.finance.pending}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-xl font-semibold">{summary.finance.overdue}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections" className="grid gap-4 lg:grid-cols-2">
          <StatusChart
            title="Inspection status"
            description="Inspections scheduled in the selected period"
            data={toRecordEntries(summary.inspections.byStatus)}
          />
          <Card>
            <CardHeader>
              <CardTitle>Results & violations</CardTitle>
              <CardDescription>Outcomes and open findings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <BreakdownList
                title="By result"
                items={toRecordEntries(summary.inspections.byResult)}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Violations</p>
                  <p className="text-xl font-semibold">
                    {summary.inspections.violations.total}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Open</p>
                  <p className="text-xl font-semibold">
                    {summary.inspections.violations.open}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Resolved</p>
                  <p className="text-xl font-semibold">
                    {summary.inspections.violations.resolved}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints" className="grid gap-4 lg:grid-cols-2">
          <StatusChart
            title="Complaint status"
            description="Complaints opened in the selected period"
            data={toRecordEntries(summary.complaints.byStatus)}
          />
          <Card>
            <CardHeader>
              <CardTitle>Complaint categories</CardTitle>
              <CardDescription>Volume by category</CardDescription>
            </CardHeader>
            <CardContent>
              <BreakdownList
                title="By category"
                items={toRecordEntries(summary.complaints.byCategory)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Digital archive</CardTitle>
              <CardDescription>Documents uploaded in the selected period</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border p-4">
                <p className="text-xs text-muted-foreground">Total uploads</p>
                <p className="mt-1 text-2xl font-semibold">{summary.documents.total}</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-xs text-muted-foreground">Trader documents</p>
                <p className="mt-1 text-2xl font-semibold">
                  {summary.documents.traderDocuments}
                </p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-xs text-muted-foreground">Business documents</p>
                <p className="mt-1 text-2xl font-semibold">
                  {summary.documents.businessDocuments}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
