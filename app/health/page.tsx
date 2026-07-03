'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useOrganization } from '@/lib/organization-context';
import { supabase } from '@/lib/supabase';
import { Activity, AlertTriangle, Clock, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';

type HealthAlert = {
  id: string;
  animal_type: 'sow' | 'boar' | 'piglet';
  animal_id: string;
  animal_name: string;
  record_type: string;
  title: string;
  next_due_date: string;
  days_until_due: number;
};

type HealthStats = {
  total_records_this_month: number;
  total_cost_this_month: number;
  animals_needing_attention: number;
  upcoming_tasks: number;
  average_body_condition: number | null;
};

export default function HealthDashboard() {
  const { user } = useAuth();
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState<HealthAlert[]>([]);
  const [dueSoonAlerts, setDueSoonAlerts] = useState<HealthAlert[]>([]);
  const [stats, setStats] = useState<HealthStats>({
    total_records_this_month: 0,
    total_cost_this_month: 0,
    animals_needing_attention: 0,
    upcoming_tasks: 0,
    average_body_condition: null,
  });

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchHealthData();
    }
  }, [selectedOrganizationId]);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAlerts(),
        fetchStats(),
      ]);
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    if (!selectedOrganizationId) return;

    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Fetch health records with upcoming due dates
    const { data: records, error } = await supabase
      .from('health_records')
      .select(`
        id,
        animal_type,
        sow_id,
        boar_id,
        piglet_id,
        record_type,
        title,
        next_due_date,
        sows(id, ear_tag, name),
        boars(id, ear_tag, name),
        piglets(id, ear_tag)
      `)
      .eq('organization_id', selectedOrganizationId)
      .not('next_due_date', 'is', null)
      .order('next_due_date', { ascending: true });

    if (error) {
      console.error('Error fetching alerts:', error);
      return;
    }

    const alerts: HealthAlert[] = (records || []).map((record: any) => {
      const dueDate = new Date(record.next_due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let animalName = '';
      let animalId = '';

      if (record.animal_type === 'sow' && record.sows) {
        animalName = record.sows.name || record.sows.ear_tag;
        animalId = record.sows.id;
      } else if (record.animal_type === 'boar' && record.boars) {
        animalName = record.boars.name || record.boars.ear_tag;
        animalId = record.boars.id;
      } else if (record.animal_type === 'piglet' && record.piglets) {
        animalName = record.piglets.ear_tag;
        animalId = record.piglets.id;
      }

      return {
        id: record.id,
        animal_type: record.animal_type,
        animal_id: animalId,
        animal_name: animalName,
        record_type: record.record_type,
        title: record.title,
        next_due_date: record.next_due_date,
        days_until_due: daysUntilDue,
      };
    });

    setOverdueAlerts(alerts.filter(a => a.days_until_due < 0));
    setDueSoonAlerts(alerts.filter(a => a.days_until_due >= 0 && a.days_until_due <= 7));
  };

  const fetchStats = async () => {
    if (!selectedOrganizationId) return;

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get records from this month
    const { data: monthRecords, error: monthError } = await supabase
      .from('health_records')
      .select('cost, body_condition_score')
      .eq('organization_id', selectedOrganizationId)
      .gte('record_date', firstDayOfMonth.toISOString().split('T')[0]);

    if (monthError) {
      console.error('Error fetching month stats:', monthError);
      return;
    }

    const totalCost = (monthRecords || []).reduce((sum, r) => sum + (r.cost || 0), 0);
    const scores = (monthRecords || []).filter(r => r.body_condition_score).map(r => r.body_condition_score);
    const avgBCS = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;

    // Get upcoming tasks count (next 14 days)
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(today.getDate() + 14);

    const { count: upcomingCount } = await supabase
      .from('health_records')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', selectedOrganizationId)
      .not('next_due_date', 'is', null)
      .gte('next_due_date', today.toISOString().split('T')[0])
      .lte('next_due_date', fourteenDaysFromNow.toISOString().split('T')[0]);

    setStats({
      total_records_this_month: monthRecords?.length || 0,
      total_cost_this_month: totalCost,
      animals_needing_attention: overdueAlerts.length + dueSoonAlerts.length,
      upcoming_tasks: upcomingCount || 0,
      average_body_condition: avgBCS,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-green-600 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading health dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Health</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Monitor herd health, track upcoming tasks, and manage alerts
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Records This Month</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.total_records_this_month}</p>
              </div>
              <Calendar className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Costs</p>
                <p className="mt-2 text-3xl font-bold text-foreground">${stats.total_cost_this_month.toFixed(2)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Tasks</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.upcoming_tasks}</p>
                <p className="text-xs text-muted-foreground mt-1">Next 14 days</p>
              </div>
              <Clock className="h-12 w-12 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Body Condition</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {stats.average_body_condition ? stats.average_body_condition.toFixed(1) : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">1-5 scale</p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Alerts */}
          <div className="bg-card rounded-lg shadow">
            <div className="bg-due-bg border-b border-due/30 px-6 py-4 rounded-t-lg">
              <h2 className="text-lg font-bold text-due flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Overdue ({overdueAlerts.length})
              </h2>
            </div>
            <div className="p-6">
              {overdueAlerts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No overdue items</p>
              ) : (
                <div className="space-y-3">
                  {overdueAlerts.map((alert) => (
                    <div key={alert.id} className="border border-due/30 rounded-lg p-4 bg-due-bg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{alert.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.animal_name} ({alert.animal_type})
                          </p>
                          <p className="text-xs text-due mt-1 font-medium">
                            {Math.abs(alert.days_until_due)} days overdue
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-due-bg text-due text-xs font-medium rounded">
                          {alert.record_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Due Soon Alerts */}
          <div className="bg-card rounded-lg shadow">
            <div className="bg-soon-bg border-b border-soon/30 px-6 py-4 rounded-t-lg">
              <h2 className="text-lg font-bold text-soon flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Due Soon ({dueSoonAlerts.length})
              </h2>
            </div>
            <div className="p-6">
              {dueSoonAlerts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No upcoming items</p>
              ) : (
                <div className="space-y-3">
                  {dueSoonAlerts.map((alert) => (
                    <div key={alert.id} className="border border-soon/30 rounded-lg p-4 bg-soon-bg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{alert.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.animal_name} ({alert.animal_type})
                          </p>
                          <p className="text-xs text-soon mt-1 font-medium">
                            Due {alert.days_until_due === 0 ? 'today' : `in ${alert.days_until_due} days`}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-soon-bg text-soon text-xs font-medium rounded">
                          {alert.record_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/sows"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-secondary transition-colors"
            >
              <Activity className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-foreground">View Sows</p>
                <p className="text-sm text-muted-foreground">Manage sow health records</p>
              </div>
            </Link>
            <Link
              href="/boars"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-secondary transition-colors"
            >
              <Activity className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-foreground">View Boars</p>
                <p className="text-sm text-muted-foreground">Manage boar health records</p>
              </div>
            </Link>
            <Link
              href="/calendar"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-secondary transition-colors"
            >
              <Calendar className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-medium text-foreground">View Calendar</p>
                <p className="text-sm text-muted-foreground">See scheduled health tasks</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
