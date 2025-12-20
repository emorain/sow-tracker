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
import RecordExpenseModal from '@/components/RecordExpenseModal';
import { downloadCSV } from '@/lib/csv-export';

type ExpenseRecord = {
  id: string;
  expense_date: string;
  expense_category: string;
  amount: number;
  description: string;
  vendor: string | null;
  invoice_number: string | null;
  notes: string | null;
};

export default function ExpensesPage() {
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ExpenseRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchExpenseRecords();
    }
  }, [selectedOrganizationId]);

  useEffect(() => {
    filterRecords();
  }, [expenseRecords, searchTerm, filterCategory]);

  const fetchExpenseRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expense_records')
        .select('*')
        .eq('organization_id', selectedOrganizationId)
        .eq('is_deleted', false)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenseRecords(data || []);
    } catch (error: any) {
      console.error('Error fetching expense records:', error);
      toast.error('Failed to load expense records');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...expenseRecords];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(record => record.expense_category === filterCategory);
    }

    setFilteredRecords(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('expense_records')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Expense record deleted');
      fetchExpenseRecords();
    } catch (error: any) {
      console.error('Error deleting expense record:', error);
      toast.error('Failed to delete expense record');
    }
  };

  const handleExport = () => {
    const exportData = filteredRecords.map(record => ({
      Date: new Date(record.expense_date).toLocaleDateString(),
      Category: formatCategory(record.expense_category),
      Description: record.description,
      Vendor: record.vendor || '',
      'Invoice #': record.invoice_number || '',
      Amount: `$${record.amount.toFixed(2)}`,
      Notes: record.notes || '',
    }));

    if (exportData.length === 0) {
      toast.error('No data to export');
      return;
    }
    downloadCSV(exportData, 'expense-records', Object.keys(exportData[0]));
    toast.success('Expense records exported');
  };

  const formatCategory = (category: string) => {
    const categories: Record<string, string> = {
      feed: 'Feed',
      veterinary: 'Veterinary',
      facilities: 'Facilities',
      utilities: 'Utilities',
      labor: 'Labor',
      supplies: 'Supplies',
      breeding: 'Breeding',
      other: 'Other',
    };
    return categories[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      feed: 'bg-amber-100 text-amber-800',
      veterinary: 'bg-red-100 text-red-800',
      facilities: 'bg-blue-100 text-blue-800',
      utilities: 'bg-purple-100 text-purple-800',
      labor: 'bg-green-100 text-green-800',
      supplies: 'bg-pink-100 text-pink-800',
      breeding: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const totalExpenses = filteredRecords.reduce((sum, record) => sum + record.amount, 0);

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
                <h1 className="text-2xl font-bold text-gray-900">Expense Records</h1>
                <p className="text-sm text-gray-600">Track operating costs and expenses</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredRecords.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button size="sm" onClick={() => setShowModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Record Expense
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
                <CardTitle>Expense History</CardTitle>
                <CardDescription>
                  {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} | Total: ${totalExpenses.toFixed(2)}
                </CardDescription>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search description, vendor, invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Categories</option>
                <option value="feed">Feed</option>
                <option value="veterinary">Veterinary</option>
                <option value="facilities">Facilities</option>
                <option value="utilities">Utilities</option>
                <option value="labor">Labor</option>
                <option value="supplies">Supplies</option>
                <option value="breeding">Breeding</option>
                <option value="other">Other</option>
              </select>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading expense records...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No expense records found</p>
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Your First Expense
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(record.expense_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(record.expense_category)}`}>
                            {formatCategory(record.expense_category)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {record.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {record.vendor || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-red-600">
                          ${record.amount.toFixed(2)}
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
      <RecordExpenseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchExpenseRecords}
      />
    </div>
  );
}
