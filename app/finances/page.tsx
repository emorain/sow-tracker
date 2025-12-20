'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, Plus, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';
import FinancialSummaryCard from '@/components/FinancialSummaryCard';
import FinancialChart from '@/components/FinancialChart';
import DateRangeFilter from '@/components/DateRangeFilter';

type FinancialSummary = {
  total_revenue: number;
  total_expenses: number;
  net_profit_loss: number;
  feed_costs: number;
  veterinary_costs: number;
  facilities_costs: number;
  utilities_costs: number;
  other_costs: number;
  piglet_sales: number;
  cull_sales: number;
  breeding_stock_sales: number;
  other_income: number;
};

export default function FinancesPage() {
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchFinancialSummary();
    }
  }, [selectedOrganizationId, startDate, endDate]);

  const fetchFinancialSummary = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_financial_summary', {
          p_organization_id: selectedOrganizationId,
          p_start_date: startDate,
          p_end_date: endDate,
        });

      if (error) throw error;

      if (data && data.length > 0) {
        setSummary(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching financial summary:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const getRevenueChartData = () => {
    if (!summary) return [];
    return [
      { name: 'Piglet Sales', value: summary.piglet_sales },
      { name: 'Cull Sales', value: summary.cull_sales },
      { name: 'Breeding Stock', value: summary.breeding_stock_sales },
      { name: 'Other', value: summary.other_income },
    ].filter(item => item.value > 0);
  };

  const getExpenseChartData = () => {
    if (!summary) return [];
    return [
      { name: 'Feed', value: summary.feed_costs },
      { name: 'Veterinary', value: summary.veterinary_costs },
      { name: 'Facilities', value: summary.facilities_costs },
      { name: 'Utilities', value: summary.utilities_costs },
      { name: 'Other', value: summary.other_costs },
    ].filter(item => item.value > 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="text-sm text-gray-600">Track revenue, expenses, and profitability</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading financial data...</div>
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FinancialSummaryCard
                title="Total Revenue"
                amount={summary.total_revenue}
                icon={TrendingUp}
                colorScheme="green"
                subtitle="All income sources"
              />
              <FinancialSummaryCard
                title="Total Expenses"
                amount={summary.total_expenses}
                icon={TrendingDown}
                colorScheme="red"
                subtitle="All operating costs"
              />
              <FinancialSummaryCard
                title="Net Profit/Loss"
                amount={summary.net_profit_loss}
                icon={DollarSign}
                colorScheme={summary.net_profit_loss >= 0 ? 'green' : 'red'}
                subtitle={summary.net_profit_loss >= 0 ? 'Profitable' : 'Loss'}
              />
              <FinancialSummaryCard
                title="Feed Costs"
                amount={summary.feed_costs}
                icon={PiggyBank}
                colorScheme="blue"
                subtitle="Largest expense"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {getRevenueChartData().length > 0 ? (
                    <FinancialChart
                      type="pie"
                      data={getRevenueChartData()}
                      dataKeys={['value']}
                      height={300}
                      colors={['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6']}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No revenue data for this period
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expense Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {getExpenseChartData().length > 0 ? (
                    <FinancialChart
                      type="pie"
                      data={getExpenseChartData()}
                      dataKeys={['value']}
                      height={300}
                      colors={['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899']}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No expense data for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link href="/finances/income" className="w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="mr-2 h-4 w-4" />
                      Record Income
                    </Button>
                  </Link>
                  <Link href="/finances/expenses" className="w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="mr-2 h-4 w-4" />
                      Record Expense
                    </Button>
                  </Link>
                  <Link href="/finances/feed" className="w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="mr-2 h-4 w-4" />
                      Record Feed
                    </Button>
                  </Link>
                  <Link href="/finances/animals" className="w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Animal P&L
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Piglet Sales</span>
                      <span className="text-sm font-medium text-green-600">
                        ${summary.piglet_sales.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cull Sow Sales</span>
                      <span className="text-sm font-medium text-green-600">
                        ${summary.cull_sales.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Breeding Stock Sales</span>
                      <span className="text-sm font-medium text-green-600">
                        ${summary.breeding_stock_sales.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Other Income</span>
                      <span className="text-sm font-medium text-green-600">
                        ${summary.other_income.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Feed</span>
                      <span className="text-sm font-medium text-red-600">
                        ${summary.feed_costs.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Veterinary</span>
                      <span className="text-sm font-medium text-red-600">
                        ${summary.veterinary_costs.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Facilities</span>
                      <span className="text-sm font-medium text-red-600">
                        ${summary.facilities_costs.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Utilities</span>
                      <span className="text-sm font-medium text-red-600">
                        ${summary.utilities_costs.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Other</span>
                      <span className="text-sm font-medium text-red-600">
                        ${summary.other_costs.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No financial data available</p>
            <div className="space-x-2">
              <Link href="/finances/income">
                <Button>Record Income</Button>
              </Link>
              <Link href="/finances/expenses">
                <Button variant="outline">Record Expense</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
