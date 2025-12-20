'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';
import BudgetProgressBar from '@/components/BudgetProgressBar';
import CurrencyInput from '@/components/CurrencyInput';

type Budget = {
  id: string;
  budget_name: string;
  start_date: string;
  end_date: string;
  feed_budget: number;
  veterinary_budget: number;
  facilities_budget: number;
  utilities_budget: number;
  other_budget: number;
  revenue_target: number;
  status: string;
  notes: string | null;
};

type ExpenseSummary = {
  feed: number;
  veterinary: number;
  facilities: number;
  utilities: number;
  other: number;
};

export default function BudgetsPage() {
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null);
  const [actualExpenses, setActualExpenses] = useState<ExpenseSummary>({
    feed: 0,
    veterinary: 0,
    facilities: 0,
    utilities: 0,
    other: 0,
  });
  const [actualRevenue, setActualRevenue] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    budget_name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    feed_budget: '',
    veterinary_budget: '',
    facilities_budget: '',
    utilities_budget: '',
    other_budget: '',
    revenue_target: '',
    notes: '',
  });

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchBudgets();
    }
  }, [selectedOrganizationId]);

  useEffect(() => {
    if (activeBudget) {
      fetchActualData(activeBudget);
    }
  }, [activeBudget]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('organization_id', selectedOrganizationId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      const budgetList = data || [];
      setBudgets(budgetList);

      // Set active budget (first active one, or most recent)
      const active = budgetList.find(b => b.status === 'active') || budgetList[0];
      setActiveBudget(active || null);
    } catch (error: any) {
      console.error('Error fetching budgets:', error);
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const fetchActualData = async (budget: Budget) => {
    try {
      // Fetch actual expenses
      const { data: expenseData, error: expenseError } = await supabase
        .from('expense_records')
        .select('expense_category, amount')
        .eq('organization_id', selectedOrganizationId)
        .gte('expense_date', budget.start_date)
        .lte('expense_date', budget.end_date)
        .eq('is_deleted', false);

      if (expenseError) throw expenseError;

      const expenses: ExpenseSummary = {
        feed: 0,
        veterinary: 0,
        facilities: 0,
        utilities: 0,
        other: 0,
      };

      (expenseData || []).forEach(record => {
        if (record.expense_category in expenses) {
          expenses[record.expense_category as keyof ExpenseSummary] += record.amount;
        }
      });

      setActualExpenses(expenses);

      // Fetch actual revenue
      const { data: incomeData, error: incomeError } = await supabase
        .from('income_records')
        .select('total_amount')
        .eq('organization_id', selectedOrganizationId)
        .gte('income_date', budget.start_date)
        .lte('income_date', budget.end_date)
        .eq('is_deleted', false);

      if (incomeError) throw incomeError;

      const revenue = (incomeData || []).reduce((sum, r) => sum + r.total_amount, 0);
      setActualRevenue(revenue);
    } catch (error: any) {
      console.error('Error fetching actual data:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      if (!formData.budget_name.trim()) {
        toast.error('Please enter a budget name');
        return;
      }

      const budgetRecord = {
        user_id: user.id,
        organization_id: selectedOrganizationId,
        budget_name: formData.budget_name.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        feed_budget: parseFloat(formData.feed_budget) || 0,
        veterinary_budget: parseFloat(formData.veterinary_budget) || 0,
        facilities_budget: parseFloat(formData.facilities_budget) || 0,
        utilities_budget: parseFloat(formData.utilities_budget) || 0,
        other_budget: parseFloat(formData.other_budget) || 0,
        revenue_target: parseFloat(formData.revenue_target) || 0,
        status: 'active',
        notes: formData.notes || null,
      };

      if (editingBudget) {
        // Update existing budget
        const { error } = await supabase
          .from('budgets')
          .update(budgetRecord)
          .eq('id', editingBudget.id);

        if (error) throw error;
        toast.success('Budget updated successfully');
      } else {
        // Create new budget
        const { error } = await supabase
          .from('budgets')
          .insert(budgetRecord);

        if (error) throw error;
        toast.success('Budget created successfully');
      }

      // Reset form
      setFormData({
        budget_name: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        feed_budget: '',
        veterinary_budget: '',
        facilities_budget: '',
        utilities_budget: '',
        other_budget: '',
        revenue_target: '',
        notes: '',
      });
      setShowCreateForm(false);
      setEditingBudget(null);
      fetchBudgets();
    } catch (error: any) {
      console.error('Error saving budget:', error);
      toast.error(error.message || 'Failed to save budget');
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      budget_name: budget.budget_name,
      start_date: budget.start_date,
      end_date: budget.end_date,
      feed_budget: budget.feed_budget.toString(),
      veterinary_budget: budget.veterinary_budget.toString(),
      facilities_budget: budget.facilities_budget.toString(),
      utilities_budget: budget.utilities_budget.toString(),
      other_budget: budget.other_budget.toString(),
      revenue_target: budget.revenue_target.toString(),
      notes: budget.notes || '',
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Budget deleted');
      fetchBudgets();
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };

  const getTotalBudget = () => {
    if (!activeBudget) return 0;
    return (
      activeBudget.feed_budget +
      activeBudget.veterinary_budget +
      activeBudget.facilities_budget +
      activeBudget.utilities_budget +
      activeBudget.other_budget
    );
  };

  const getTotalActual = () => {
    return (
      actualExpenses.feed +
      actualExpenses.veterinary +
      actualExpenses.facilities +
      actualExpenses.utilities +
      actualExpenses.other
    );
  };

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
                <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
                <p className="text-sm text-gray-600">Plan and monitor your farm budget</p>
              </div>
            </div>
            <Button size="sm" onClick={() => { setShowCreateForm(true); setEditingBudget(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingBudget ? 'Edit Budget' : 'Create New Budget'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Budget Name */}
                <div className="space-y-2">
                  <Label htmlFor="budget_name">
                    Budget Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="budget_name"
                    name="budget_name"
                    value={formData.budget_name}
                    onChange={handleChange}
                    placeholder="Q1 2025 Budget"
                    required
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Budget Categories */}
                <div className="grid grid-cols-2 gap-4">
                  <CurrencyInput
                    name="feed_budget"
                    value={formData.feed_budget}
                    onChange={(value) => setFormData({ ...formData, feed_budget: value })}
                    label="Feed Budget"
                  />
                  <CurrencyInput
                    name="veterinary_budget"
                    value={formData.veterinary_budget}
                    onChange={(value) => setFormData({ ...formData, veterinary_budget: value })}
                    label="Veterinary Budget"
                  />
                  <CurrencyInput
                    name="facilities_budget"
                    value={formData.facilities_budget}
                    onChange={(value) => setFormData({ ...formData, facilities_budget: value })}
                    label="Facilities Budget"
                  />
                  <CurrencyInput
                    name="utilities_budget"
                    value={formData.utilities_budget}
                    onChange={(value) => setFormData({ ...formData, utilities_budget: value })}
                    label="Utilities Budget"
                  />
                  <CurrencyInput
                    name="other_budget"
                    value={formData.other_budget}
                    onChange={(value) => setFormData({ ...formData, other_budget: value })}
                    label="Other Budget"
                  />
                  <CurrencyInput
                    name="revenue_target"
                    value={formData.revenue_target}
                    onChange={(value) => setFormData({ ...formData, revenue_target: value })}
                    label="Revenue Target"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit">
                    {editingBudget ? 'Update Budget' : 'Create Budget'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingBudget(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">Loading budgets...</div>
        ) : activeBudget ? (
          <>
            {/* Active Budget Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{activeBudget.budget_name}</CardTitle>
                    <CardDescription>
                      {new Date(activeBudget.start_date).toLocaleDateString()} - {new Date(activeBudget.end_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(activeBudget)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Overall Budget</h3>
                    <span className="text-sm text-gray-600">
                      ${getTotalActual().toFixed(2)} / ${getTotalBudget().toFixed(2)}
                    </span>
                  </div>
                  <BudgetProgressBar
                    category="Total Expenses"
                    budgeted={getTotalBudget()}
                    actual={getTotalActual()}
                  />
                </div>

                {/* Category Progress */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">By Category</h3>
                  <BudgetProgressBar
                    category="Feed"
                    budgeted={activeBudget.feed_budget}
                    actual={actualExpenses.feed}
                  />
                  <BudgetProgressBar
                    category="Veterinary"
                    budgeted={activeBudget.veterinary_budget}
                    actual={actualExpenses.veterinary}
                  />
                  <BudgetProgressBar
                    category="Facilities"
                    budgeted={activeBudget.facilities_budget}
                    actual={actualExpenses.facilities}
                  />
                  <BudgetProgressBar
                    category="Utilities"
                    budgeted={activeBudget.utilities_budget}
                    actual={actualExpenses.utilities}
                  />
                  <BudgetProgressBar
                    category="Other"
                    budgeted={activeBudget.other_budget}
                    actual={actualExpenses.other}
                  />
                </div>

                {/* Revenue Progress */}
                {activeBudget.revenue_target > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Revenue Target</h3>
                    <BudgetProgressBar
                      category="Revenue"
                      budgeted={activeBudget.revenue_target}
                      actual={actualRevenue}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Budgets List */}
            <Card>
              <CardHeader>
                <CardTitle>All Budgets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {budgets.map(budget => (
                    <div
                      key={budget.id}
                      className={`p-4 border rounded-lg ${
                        budget.id === activeBudget?.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{budget.budget_name}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {budget.id !== activeBudget?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveBudget(budget)}
                            >
                              View
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(budget)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(budget.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600 mb-4">No budgets created yet</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Budget
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
