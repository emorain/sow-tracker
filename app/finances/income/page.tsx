'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Download, Search } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';
import RecordIncomeModal from '@/components/RecordIncomeModal';
import { downloadCSV } from '@/lib/csv-export';

type IncomeRecord = {
  id: string;
  income_date: string;
  income_type: string;
  quantity: number | null;
  price_per_unit: number | null;
  total_amount: number;
  buyer_name: string | null;
  invoice_number: string | null;
  payment_status: string;
  description: string | null;
};

export default function IncomePage() {
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<IncomeRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchIncomeRecords();
    }
  }, [selectedOrganizationId]);

  useEffect(() => {
    filterRecords();
  }, [incomeRecords, searchTerm, filterType, filterStatus]);

  const fetchIncomeRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('income_records')
        .select('*')
        .eq('organization_id', selectedOrganizationId)
        .eq('is_deleted', false)
        .order('income_date', { ascending: false });

      if (error) throw error;
      setIncomeRecords(data || []);
    } catch (error: any) {
      console.error('Error fetching income records:', error);
      toast.error('Failed to load income records');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...incomeRecords];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(record => record.income_type === filterType);
    }

    // Filter by payment status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(record => record.payment_status === filterStatus);
    }

    setFilteredRecords(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('income_records')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Income record deleted');
      fetchIncomeRecords();
    } catch (error: any) {
      console.error('Error deleting income record:', error);
      toast.error('Failed to delete income record');
    }
  };

  const handleExport = () => {
    const exportData = filteredRecords.map(record => ({
      Date: new Date(record.income_date).toLocaleDateString(),
      Type: formatIncomeType(record.income_type),
      Quantity: record.quantity || '',
      'Price Per Unit': record.price_per_unit ? `$${record.price_per_unit.toFixed(2)}` : '',
      'Total Amount': `$${record.total_amount.toFixed(2)}`,
      Buyer: record.buyer_name || '',
      'Invoice #': record.invoice_number || '',
      'Payment Status': formatPaymentStatus(record.payment_status),
      Description: record.description || '',
    }));

    if (exportData.length === 0) {
      toast.error('No data to export');
      return;
    }
    downloadCSV(exportData, 'income-records', Object.keys(exportData[0]));
    toast.success('Income records exported');
  };

  const formatIncomeType = (type: string) => {
    const types: Record<string, string> = {
      piglet_sale: 'Piglet Sale',
      cull_sow_sale: 'Cull Sow Sale',
      breeding_stock_sale: 'Breeding Stock Sale',
      boar_sale: 'Boar Sale',
      other: 'Other',
    };
    return types[type] || type;
  };

  const formatPaymentStatus = (status: string) => {
    const statuses: Record<string, string> = {
      pending: 'Pending',
      paid: 'Paid',
      partial: 'Partial',
      overdue: 'Overdue',
    };
    return statuses[status] || status;
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const totalIncome = filteredRecords.reduce((sum, record) => sum + record.total_amount, 0);

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
                <h1 className="text-2xl font-bold text-gray-900">Income Records</h1>
                <p className="text-sm text-gray-600">Track revenue from sales and other sources</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredRecords.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button size="sm" onClick={() => setShowModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Record Income
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Income History</CardTitle>
                <CardDescription>
                  {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} | Total: ${totalIncome.toFixed(2)}
                </CardDescription>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search buyer, invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Types</option>
                <option value="piglet_sale">Piglet Sale</option>
                <option value="cull_sow_sale">Cull Sow Sale</option>
                <option value="breeding_stock_sale">Breeding Stock Sale</option>
                <option value="boar_sale">Boar Sale</option>
                <option value="other">Other</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading income records...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No income records found</p>
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Your First Income
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(record.income_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatIncomeType(record.income_type)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {record.quantity || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">
                          ${record.total_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {record.buyer_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(record.payment_status)}`}>
                            {formatPaymentStatus(record.payment_status)}
                          </span>
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
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal */}
      <RecordIncomeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchIncomeRecords}
      />
    </div>
  );
}
