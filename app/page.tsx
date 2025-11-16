'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, Calendar, Syringe, Bell, TrendingUp } from "lucide-react";
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user } = useAuth();
  const farmName = user?.user_metadata?.farm_name || 'Sow Tracker';
  const [stats, setStats] = useState({
    totalSows: 0,
    activeSows: 0,
    currentlyFarrowing: 0,
    pigletsNotWeaned: 0,
    weanedPiglets: 0,
    expectedHeatThisWeek: 0,
    upcomingVaccinations: 12,
    pendingReminders: 8,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total sows count
      const { count: totalCount } = await supabase
        .from('sows')
        .select('*', { count: 'exact', head: true });

      // Get active sows count
      const { count: activeCount } = await supabase
        .from('sows')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get piglets nursing (sum of live_piglets from active farrowings)
      const { data: nursingData } = await supabase
        .from('farrowings')
        .select('live_piglets')
        .not('actual_farrowing_date', 'is', null)
        .is('moved_out_of_farrowing_date', null);

      const pigletsCount = nursingData?.reduce((sum, f) => sum + (f.live_piglets || 0), 0) || 0;

      // Get weaned piglets
      const { count: weanedCount } = await supabase
        .from('piglets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'weaned');

      // Get currently farrowing sows (farrowed within last 21 days - typical nursing period, and not yet weaned)
      const today = new Date();
      const twentyOneDaysAgo = new Date(today);
      twentyOneDaysAgo.setDate(today.getDate() - 21);

      const { data: farrowingData } = await supabase
        .from('farrowings')
        .select('sow_id')
        .not('actual_farrowing_date', 'is', null)
        .is('moved_out_of_farrowing_date', null)
        .gte('actual_farrowing_date', twentyOneDaysAgo.toISOString().split('T')[0]);

      const currentlyFarrowingCount = farrowingData ? new Set(farrowingData.map(f => f.sow_id)).size : 0;

      // Get sows expected to come into heat this week (Matrix treatments)
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);

      const { data: matrixData } = await supabase
        .from('matrix_treatments')
        .select('sow_id')
        .gte('expected_heat_date', today.toISOString().split('T')[0])
        .lte('expected_heat_date', sevenDaysFromNow.toISOString().split('T')[0])
        .is('actual_heat_date', null);

      const expectedHeatCount = matrixData ? new Set(matrixData.map(m => m.sow_id)).size : 0;

      setStats(prev => ({
        ...prev,
        totalSows: totalCount || 0,
        activeSows: activeCount || 0,
        currentlyFarrowing: currentlyFarrowingCount,
        pigletsNotWeaned: pigletsCount || 0,
        weanedPiglets: weanedCount || 0,
        expectedHeatThisWeek: expectedHeatCount,
      }));
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to {farmName}</h2>
          <p className="text-gray-600">Monitor your farm operations in one place</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/sows" className="cursor-pointer">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sows</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSows}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.activeSows} active in herd</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/farrowings/active" className="cursor-pointer">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Currently Farrowing</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.currentlyFarrowing}</div>
                <p className="text-xs text-muted-foreground mt-1">Nursing litters (last 21 days)</p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Piglets Nursing</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pigletsNotWeaned}</div>
              <p className="text-xs text-muted-foreground mt-1">From active litters</p>
            </CardContent>
          </Card>

          <Link href="/piglets/weaned" className="cursor-pointer">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weaned Piglets</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.weanedPiglets}</div>
                <p className="text-xs text-muted-foreground mt-1">Successfully weaned</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/matrix/batches" className="cursor-pointer">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expected Heat This Week</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.expectedHeatThisWeek}</div>
                <p className="text-xs text-muted-foreground mt-1">Matrix synchronized sows</p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vaccinations Due</CardTitle>
              <Syringe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingVaccinations}</div>
              <p className="text-xs text-muted-foreground mt-1">Next 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reminders</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReminders}</div>
              <p className="text-xs text-muted-foreground mt-1">Action required</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks at your fingertips</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/sows/new" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <PiggyBank className="mr-2 h-4 w-4" />
                  Register New Sow
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Record Farrowing
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Syringe className="mr-2 h-4 w-4" />
                Log Vaccination
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your farm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <PiggyBank className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Sow #247 farrowed</p>
                    <p className="text-xs text-muted-foreground">10 live piglets - 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Syringe className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Batch vaccination completed</p>
                    <p className="text-xs text-muted-foreground">15 sows vaccinated - 5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 rounded-full p-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Breeding cycle started</p>
                    <p className="text-xs text-muted-foreground">Sow #183 - Yesterday</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Info */}
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">🚀 Getting Started</CardTitle>
            <CardDescription className="text-green-700">
              This is your Sow Tracker dashboard. Here&apos;s what to do next:
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-green-900 space-y-2">
            <p><strong>1. Set up Supabase:</strong> Follow the README to configure your database</p>
            <p><strong>2. Add your first sow:</strong> Click &quot;Add New Sow&quot; to start tracking</p>
            <p><strong>3. Install as PWA:</strong> On mobile, tap &quot;Add to Home Screen&quot; for app-like experience</p>
            <p><strong>4. Explore features:</strong> Check out vaccinations, farrowings, and reminders</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
