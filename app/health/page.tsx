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
          <p className="text-gray-600">Loading health dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-8 w-8 text-green-600" />
            Health Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Monitor herd health, track upcoming tasks, and manage alerts
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Records This Month</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total_records_this_month}</p>
              </div>
              <Calendar className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Health Costs</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">${stats.total_cost_this_month.toFixed(2)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Tasks</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.upcoming_tasks}</p>
                <p className="text-xs text-gray-500 mt-1">Next 14 days</p>
              </div>
              <Clock className="h-12 w-12 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Body Condition</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.average_body_condition ? stats.average_body_condition.toFixed(1) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">1-5 scale</p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Alerts */}
          <div className="bg-white rounded-lg shadow">
            <div className="bg-red-50 border-b border-red-200 px-6 py-4 rounded-t-lg">
              <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Overdue ({overdueAlerts.length})
              </h2>
            </div>
            <div className="p-6">
              {overdueAlerts.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No overdue items</p>
              ) : (
                <div className="space-y-3">
                  {overdueAlerts.map((alert) => (
                    <div key={alert.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {alert.animal_name} ({alert.animal_type})
                          </p>
                          <p className="text-xs text-red-600 mt-1 font-medium">
                            {Math.abs(alert.days_until_due)} days overdue
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
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
          <div className="bg-white rounded-lg shadow">
            <div className="bg-orange-50 border-b border-orange-200 px-6 py-4 rounded-t-lg">
              <h2 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Due Soon ({dueSoonAlerts.length})
              </h2>
            </div>
            <div className="p-6">
              {dueSoonAlerts.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No upcoming items</p>
              ) : (
                <div className="space-y-3">
                  {dueSoonAlerts.map((alert) => (
                    <div key={alert.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {alert.animal_name} ({alert.animal_type})
                          </p>
                          <p className="text-xs text-orange-600 mt-1 font-medium">
                            Due {alert.days_until_due === 0 ? 'today' : `in ${alert.days_until_due} days`}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
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
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/sows"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Activity className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">View Sows</p>
                <p className="text-sm text-gray-600">Manage sow health records</p>
              </div>
            </Link>
            <Link
              href="/boars"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Activity className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">View Boars</p>
                <p className="text-sm text-gray-600">Manage boar health records</p>
              </div>
            </Link>
            <Link
              href="/calendar"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">View Calendar</p>
                <p className="text-sm text-gray-600">See scheduled health tasks</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
