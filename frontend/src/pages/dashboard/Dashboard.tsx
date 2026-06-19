import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Briefcase,
  FileCheck,
  DollarSign,
  AlertTriangle,
  Building2,
  Clock,
  RefreshCw,
  Archive,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/services/api';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardStats {
  totalTraders: number;
  activeTraders: number;
  submittedTraders: number;
  totalBusinesses: number;
  activeBusinesses: number;
  pendingBusinesses: number;
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  pendingLicenses: number;
  renewalLicenses: number;
  licensesExpiringSoon: number;
  totalRevenue: number;
  totalViolations: number;
  openComplaints: number;
  scheduledInspections: number;
  completedInspections: number;
  pendingPayments: number;
  overduePayments: number;
  paidPayments: number;
  totalDocuments: number;
  traderDocuments: number;
  businessDocuments: number;
  recentTraders: { id: string; fullName: string; tin?: string | null; status: string; createdAt: string }[];
  recentBusinesses: { id: string; name: string; category: string; status: string; createdAt: string; trader?: { fullName: string } }[];
  generatedAt: string;
  fiscalYear?: { label: string; calendarType: string } | null;
}

const statusVariant = (status: string) => {
  if (status === 'active' || status === 'issued') return 'default';
  if (status === 'suspended' || status === 'closed' || status === 'expired') return 'destructive';
  return 'secondary';
};

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  tone: string;
}) => (
  <Card className="overflow-hidden border-[hsl(var(--app-flow-border))]">
    <CardContent className="p-0">
      <div className={`h-1 ${tone}`} />
      <div className="p-5">
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
      </div>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await api.reports.dashboard();
      setStats(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.reports.dashboard();
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = window.setInterval(() => loadDashboard(true), 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <p className="font-medium">Could not load dashboard</p>
        <p className="text-sm">{error || 'Unknown error'}. Ensure the backend is running and you are logged in.</p>
      </div>
    );
  }

  const chartData = [
    { name: 'Traders', value: stats.totalTraders, color: 'hsl(var(--chart-1))' },
    { name: 'Businesses', value: stats.totalBusinesses, color: 'hsl(var(--chart-2))' },
    { name: 'Licenses', value: stats.totalLicenses, color: 'hsl(var(--chart-3))' },
    { name: 'Documents', value: stats.totalDocuments, color: 'hsl(var(--chart-4))' },
    { name: 'Open Issues', value: stats.totalViolations + stats.openComplaints, color: 'hsl(var(--destructive))' },
  ].filter((d) => d.value > 0);

  const totalLicenses = stats.activeLicenses + stats.expiredLicenses;
  const activePercent = totalLicenses ? (stats.activeLicenses / totalLicenses) * 100 : 0;
  const traderActivationPercent = stats.totalTraders ? (stats.activeTraders / stats.totalTraders) * 100 : 0;
  const businessActivationPercent = stats.totalBusinesses ? (stats.activeBusinesses / stats.totalBusinesses) * 100 : 0;
  const paymentRisk = stats.pendingPayments + stats.overduePayments;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-cyan-600 to-emerald-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {getGreeting()}, {user?.name}!
            </h1>
            <p className="text-blue-50">
              Live Chiro City trade operations dashboard with real-time database metrics.
            </p>
            {stats.fiscalYear ? (
              <p className="text-blue-100/90 text-sm mt-2">
                Viewing fiscal year: <strong>{stats.fiscalYear.label}</strong> ({stats.fiscalYear.calendarType})
              </p>
            ) : (
              <p className="text-blue-100/90 text-sm mt-2">Viewing: All time (no fiscal year filter)</p>
            )}
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <Badge className="bg-white/15 text-white hover:bg-white/20">
              Last updated: {new Date(stats.generatedAt).toLocaleTimeString()}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="bg-white/90 text-blue-900 hover:bg-white"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Registered Traders"
          value={stats.totalTraders.toLocaleString()}
          description={`${stats.activeTraders} active, ${stats.submittedTraders} submitted`}
          icon={Users}
          tone="bg-blue-500"
        />
        <StatCard
          title="Licensed Businesses"
          value={stats.totalBusinesses.toLocaleString()}
          description={`${stats.activeBusinesses} active, ${stats.pendingBusinesses} pending`}
          icon={Building2}
          tone="bg-emerald-500"
        />
        <StatCard
          title="Total Revenue"
          value={`${Number(stats.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 0 })} ETB`}
          description={`${stats.paidPayments} paid payments`}
          icon={DollarSign}
          tone="bg-amber-500"
        />
        <StatCard
          title="Open Service Issues"
          value={(stats.totalViolations + stats.openComplaints).toLocaleString()}
          description={`${stats.totalViolations} violations, ${stats.openComplaints} complaints`}
          icon={AlertTriangle}
          tone="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* <StatCard
          title="Licenses"
          value={stats.totalLicenses.toLocaleString()}
          description={`${stats.activeLicenses} active, ${stats.expiredLicenses} expired`}
          icon={FileCheck}
          tone="bg-indigo-500"
        /> */}
        <StatCard
          title="Expiring Soon"
          value={stats.licensesExpiringSoon.toLocaleString()}
          description="Issued licenses expiring within 30 days"
          icon={Clock}
          tone="bg-orange-500"
        />
        <StatCard
          title="Payments In Risk"
          value={paymentRisk.toLocaleString()}
          description={`${stats.pendingPayments} pending, ${stats.overduePayments} overdue`}
          icon={Wallet}
          tone="bg-purple-500"
        />
        <StatCard
          title="Digital Archive"
          value={stats.totalDocuments.toLocaleString()}
          description={`${stats.traderDocuments} trader docs, ${stats.businessDocuments} business docs`}
          icon={Archive}
          tone="bg-slate-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Key metrics distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data to display yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational Health</CardTitle>
            <CardDescription>Status breakdowns from live records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="rounded-xl border bg-blue-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-blue-900">
                    <Users className="h-5 w-5" />
                    Trader activation
                  </div>
                  <span className="text-sm font-semibold text-blue-900">{traderActivationPercent.toFixed(0)}%</span>
                </div>
                <Progress value={traderActivationPercent} />
                <p className="mt-2 text-xs text-blue-700">{stats.activeTraders} active out of {stats.totalTraders} registered traders</p>
              </div>
              <div className="rounded-xl border bg-emerald-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-emerald-900">
                    <Briefcase className="h-5 w-5" />
                    Business activation
                  </div>
                  <span className="text-sm font-semibold text-emerald-900">{businessActivationPercent.toFixed(0)}%</span>
                </div>
                <Progress value={businessActivationPercent} />
                <p className="mt-2 text-xs text-emerald-700">{stats.activeBusinesses} active, {stats.pendingBusinesses} pending businesses</p>
              </div>
              <div className="rounded-xl border bg-indigo-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-indigo-900">
                    <ShieldCheck className="h-5 w-5" />
                    License health
                  </div>
                  <span className="text-sm font-semibold text-indigo-900">{activePercent.toFixed(0)}%</span>
                </div>
                <Progress value={activePercent} />
                <p className="mt-2 text-xs text-indigo-700">
                  {stats.activeLicenses} issued, {stats.pendingLicenses} pending, {stats.renewalLicenses} in renewal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Recent Traders
            </CardTitle>
            <CardDescription>Latest trader registrations in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentTraders.length ? stats.recentTraders.map((trader) => (
                <div key={trader.id} className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{trader.fullName}</p>
                    <p className="text-xs text-muted-foreground">TIN: {trader.tin || '-'} · {new Date(trader.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={statusVariant(trader.status)}>{trader.status}</Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No recent trader registrations.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Recent Businesses
            </CardTitle>
            <CardDescription>Latest licensed businesses linked to traders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentBusinesses.length ? stats.recentBusinesses.map((business) => (
                <div key={business.id} className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{business.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {business.category || '-'} · {business.trader?.fullName || 'No trader'} · {new Date(business.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={business.status === 'active' ? 'default' : 'secondary'}>{business.status}</Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No recent business records.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
