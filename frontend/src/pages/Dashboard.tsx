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
  FileX,
  DollarSign,
  AlertTriangle,
  MessageSquare,
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
  activeLicenses: number;
  expiredLicenses: number;
  totalRevenue: number;
  totalViolations: number;
  openComplaints: number;
  fiscalYear?: { label: string; calendarType: string } | null;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.reports.dashboard();
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
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
    { name: 'Active Licenses', value: stats.activeLicenses, color: 'hsl(var(--chart-2))' },
    { name: 'Expired', value: stats.expiredLicenses, color: 'hsl(var(--destructive))' },
    { name: 'Violations', value: stats.totalViolations, color: 'hsl(var(--chart-4))' },
    { name: 'Open Complaints', value: stats.openComplaints, color: 'hsl(var(--chart-5))' },
  ].filter((d) => d.value > 0);

  const totalLicenses = stats.activeLicenses + stats.expiredLicenses;
  const activePercent = totalLicenses ? (stats.activeLicenses / totalLicenses) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {getGreeting()}, {user?.name}!
        </h1>
        <p className="text-blue-100">
          Chiro City Trader & Business Management — overview and performance indicators
        </p>
        {stats.fiscalYear ? (
          <p className="text-blue-100/90 text-sm mt-2">
            Viewing fiscal year: <strong>{stats.fiscalYear.label}</strong> ({stats.fiscalYear.calendarType})
          </p>
        ) : (
          <p className="text-blue-100/90 text-sm mt-2">Viewing: All time (no fiscal year filter)</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Traders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTraders}</div>
            <p className="text-xs text-muted-foreground">Active traders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLicenses}</div>
            <p className="text-xs text-muted-foreground">{stats.expiredLicenses} expired</p>
            <Progress value={activePercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(stats.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 0 })} ETB
            </div>
            <p className="text-xs text-muted-foreground">Paid collections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Violations / Complaints</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViolations} / {stats.openComplaints}</div>
            <p className="text-xs text-muted-foreground">Unresolved</p>
          </CardContent>
        </Card>
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
            <CardTitle>Quick stats</CardTitle>
            <CardDescription>Counts by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Businesses</span>
                </div>
                <Badge variant="secondary">See Businesses</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <FileX className="h-5 w-5 text-amber-600" />
                  <span className="font-medium">Expired licenses</span>
                </div>
                <span className="font-bold">{stats.expiredLicenses}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Open complaints</span>
                </div>
                <span className="font-bold">{stats.openComplaints}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
