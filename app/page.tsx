'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, Calendar, Syringe, Bell, TrendingUp, ClipboardList, CheckCircle2, Building2 } from "lucide-react";
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';

export default function Home() {
  const { settings } = useSettings();
  const farmName = settings?.farm_name || 'Sow Tracker';
  const [stats, setStats] = useState({
    totalSows: 0,
    activeSows: 0,
    totalBoars: 0,
    activeBoars: 0,
    currentlyFarrowing: 0,
    pigletsNotWeaned: 0,
    weanedPiglets: 0,
    expectedHeatThisWeek: 0,
    bredSows: 0,
    pendingTasks: 0,
    overdueTasks: 0,
  });
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchUpcomingTasks();
  }, []);

  const fetchStats = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use optimized RPC function instead of 12 separate queries
      // Performance: 12 queries → 1 RPC call
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data) {
        setStats(prev => ({
          ...prev,
          totalSows: data.totalSows || 0,
          activeSows: data.activeSows || 0,
          totalBoars: data.totalBoars || 0,
          activeBoars: data.activeBoars || 0,
          currentlyFarrowing: data.currentlyFarrowing || 0,
          pigletsNotWeaned: data.nursingPiglets || 0,
          weanedPiglets: data.weanedPiglets || 0,
          expectedHeatThisWeek: data.expectedHeatThisWeek || 0,
          bredSows: data.bredSows || 0,
          pendingTasks: data.pendingTasks || 0,
          overdueTasks: data.overdueTasks || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchUpcomingTasks = async () => {
    try {
      const today = new Date();
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);

      // Fetch upcoming and overdue tasks (next 7 days)
      const { data: tasks, error } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .eq('is_completed', false)
        .lte('due_date', sevenDaysFromNow.toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(5);

      if (error) throw error;

      setUpcomingTasks(tasks || []);
    } catch (error) {
      console.error('Failed to fetch upcoming tasks:', error);
    }
  };

  return (
    <div className="min-h-screen bg-red-700">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to {farmName}</h2>
          <p className="text-gray-100">Monitor your farm operations in one place</p>
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

          <Link href="/boars" className="cursor-pointer">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Boars</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBoars}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.activeBoars} active breeding boars</p>
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

          <Link href="/piglets/nursing" className="cursor-pointer">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Piglets Nursing</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pigletsNotWeaned}</div>
                <p className="text-xs text-muted-foreground mt-1">Individual piglets tracked</p>
              </CardContent>
            </Card>
          </Link>

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

          <Link href="/breeding/bred-sows" className="cursor-pointer">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bred Sows</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.bredSows}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting pregnancy check</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tasks" className="cursor-pointer">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">From active protocols</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tasks" className="cursor-pointer">
            <Card className={`hover:shadow-lg transition-shadow ${stats.overdueTasks > 0 ? 'border-red-300 bg-red-50' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                <Bell className={`h-4 w-4 ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.overdueTasks > 0 ? 'text-red-600' : ''}`}>
                  {stats.overdueTasks}
                </div>
                <p className={`text-xs mt-1 ${stats.overdueTasks > 0 ? 'text-red-700' : 'text-muted-foreground'}`}>
                  {stats.overdueTasks > 0 ? 'Action required!' : 'All caught up!'}
                </p>
              </CardContent>
            </Card>
          </Link>
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
              <Link href="/sows" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <PiggyBank className="mr-2 h-4 w-4" />
                  Manage Sows
                </Button>
              </Link>
              <Link href="/boars" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <PiggyBank className="mr-2 h-4 w-4" />
                  Manage Boars
                </Button>
              </Link>
              <Link href="/farrowings/active" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Farrowing House
                </Button>
              </Link>
              <Link href="/piglets/weaned" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <PiggyBank className="mr-2 h-4 w-4" />
                  Manage Piglets
                </Button>
              </Link>
              <Link href="/matrix/batches" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Syringe className="mr-2 h-4 w-4" />
                  Matrix Batches
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
              <CardDescription>Tasks due in the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">No upcoming tasks in the next 7 days</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingTasks.map((task) => {
                    const dueDate = new Date(task.due_date);
                    const today = new Date();
                    const isOverdue = dueDate < today;
                    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    let dueDateText = '';
                    if (isOverdue) {
                      dueDateText = 'Overdue!';
                    } else if (daysUntilDue === 0) {
                      dueDateText = 'Due today';
                    } else if (daysUntilDue === 1) {
                      dueDateText = 'Due tomorrow';
                    } else {
                      dueDateText = `Due in ${daysUntilDue} days`;
                    }

                    return (
                      <div key={task.id} className="flex items-start space-x-3">
                        <div className={`rounded-full p-2 ${isOverdue ? 'bg-red-100' : 'bg-blue-100'}`}>
                          <ClipboardList className={`h-4 w-4 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.task_name}</p>
                          <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            {dueDateText}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {upcomingTasks.length >= 5 && (
                    <Link href="/tasks" className="block">
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        View All Tasks
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
