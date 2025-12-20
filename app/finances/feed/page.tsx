'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Download } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';
import RecordFeedModal from '@/components/RecordFeedModal';
import FinancialSummaryCard from '@/components/FinancialSummaryCard';
import FinancialChart from '@/components/FinancialChart';
import { PiggyBank } from 'lucide-react';
import { downloadCSV } from '@/lib/csv-export';

type FeedRecord = {
  id: string;
  record_date: string;
  feed_type: string;
  animal_group: string;
  quantity_lbs: number;
  cost_per_unit: number | null;
  total_cost: number;
  supplier: string | null;
  notes: string | null;
};

type AnimalGroup = 'gestation' | 'farrowing' | 'nursery' | 'boars' | 'other';

const ANIMAL_GROUPS = [
  { value: 'gestation', label: 'Gestation' },
  { value: 'farrowing', label: 'Farrowing' },
  { value: 'nursery', label: 'Nursery' },
  { value: 'boars', label: 'Boars' },
  { value: 'other', label: 'Other' },
];

export default function FeedPage() {
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<AnimalGroup>('gestation');
  const [modalGroup, setModalGroup] = useState<AnimalGroup>('gestation');

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchFeedRecords();
    }
  }, [selectedOrganizationId]);

  const fetchFeedRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('feed_records')
        .select('*')
        .eq('organization_id', selectedOrganizationId)
        .eq('is_deleted', false)
        .order('record_date', { ascending: false });

      if (error) throw error;
      setFeedRecords(data || []);
    } catch (error: any) {
      console.error('Error fetching feed records:', error);
      toast.error('Failed to load feed records');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feed record?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('feed_records')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Feed record deleted');
      fetchFeedRecords();
    } catch (error: any) {
      console.error('Error deleting feed record:', error);
      toast.error('Failed to delete feed record');
    }
  };

  const handleExport = () => {
    const filteredRecords = feedRecords.filter(r => r.animal_group === activeTab);
    const exportData = filteredRecords.map(record => ({
      Date: new Date(record.record_date).toLocaleDateString(),
      'Feed Type': record.feed_type,
      'Animal Group': ANIMAL_GROUPS.find(g => g.value === record.animal_group)?.label || record.animal_group,
      'Quantity (lbs)': record.quantity_lbs.toFixed(2),
      'Cost Per Lb': record.cost_per_unit ? `$${record.cost_per_unit.toFixed(2)}` : '',
      'Total Cost': `$${record.total_cost.toFixed(2)}`,
      Supplier: record.supplier || '',
      Notes: record.notes || '',
    }));

    if (exportData.length === 0) {
      toast.error('No data to export');
      return;
    }
    downloadCSV(exportData, `feed-records-${activeTab}`, Object.keys(exportData[0]));
    toast.success('Feed records exported');
  };

  const getGroupRecords = (group: AnimalGroup) => {
    return feedRecords.filter(r => r.animal_group === group);
  };

  const getGroupStats = (group: AnimalGroup) => {
    const records = getGroupRecords(group);
    const totalCost = records.reduce((sum, r) => sum + r.total_cost, 0);
    const totalQuantity = records.reduce((sum, r) => sum + r.quantity_lbs, 0);
    return { totalCost, totalQuantity, recordCount: records.length };
  };

  const getChartData = () => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const records = getGroupRecords(activeTab).filter(
      r => new Date(r.record_date) >= last30Days
    );

    // Group by week
    const weeklyData: Record<string, number> = {};
    records.forEach(record => {
      const date = new Date(record.record_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toLocaleDateString();

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = 0;
      }
      weeklyData[weekKey] += record.total_cost;
    });

    return Object.entries(weeklyData).map(([name, value]) => ({ name, value }));
  };

  const activeRecords = getGroupRecords(activeTab);
  const gestationStats = getGroupStats('gestation');
  const farrowingStats = getGroupStats('farrowing');
  const nurseryStats = getGroupStats('nursery');
  const boarsStats = getGroupStats('boars');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/finances">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Finances
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Feed Tracking</h1>
                <p className="text-sm text-gray-600">Track feed consumption and costs by animal group</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} disabled={activeRecords.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button size="sm" onClick={() => { setModalGroup(activeTab); setShowModal(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Record Feed
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FinancialSummaryCard
            title="Gestation Feed"
            amount={gestationStats.totalCost}
            icon={PiggyBank}
            colorScheme="blue"
            subtitle={`${gestationStats.recordCount} records`}
          />
          <FinancialSummaryCard
            title="Farrowing Feed"
            amount={farrowingStats.totalCost}
            icon={PiggyBank}
            colorScheme="green"
            subtitle={`${farrowingStats.recordCount} records`}
          />
          <FinancialSummaryCard
            title="Nursery Feed"
            amount={nurseryStats.totalCost}
            icon={PiggyBank}
            colorScheme="default"
            subtitle={`${nurseryStats.recordCount} records`}
          />
          <FinancialSummaryCard
            title="Boar Feed"
            amount={boarsStats.totalCost}
            icon={PiggyBank}
            colorScheme="blue"
            subtitle={`${boarsStats.recordCount} records`}
          />
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <div className="border-b">
              <nav className="flex gap-4 -mb-px">
                {ANIMAL_GROUPS.map(group => (
                  <button
                    key={group.value}
                    onClick={() => setActiveTab(group.value as AnimalGroup)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === group.value
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    {group.label}
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {getGroupRecords(group.value as AnimalGroup).length}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading feed records...</div>
            ) : activeRecords.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No feed records for {ANIMAL_GROUPS.find(g => g.value === activeTab)?.label}</p>
                <Button onClick={() => { setModalGroup(activeTab); setShowModal(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Feed
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Chart */}
                {getChartData().length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Last 30 Days (Weekly)</h3>
                    <FinancialChart
                      type="bar"
                      data={getChartData()}
                      dataKeys={['value']}
                      xAxisKey="name"
                      height={250}
                      colors={['#22c55e']}
                      showLegend={false}
                    />
                  </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feed Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity (lbs)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost/lb</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activeRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(record.record_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {record.feed_type}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {record.quantity_lbs.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {record.cost_per_unit ? `$${record.cost_per_unit.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-green-600">
                            ${record.total_cost.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {record.supplier || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(record.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal */}
      <RecordFeedModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchFeedRecords}
        defaultAnimalGroup={modalGroup}
      />
    </div>
  );
}
