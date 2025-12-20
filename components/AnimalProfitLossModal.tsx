'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';

type AnimalProfitLossModalProps = {
  isOpen: boolean;
  onClose: () => void;
  animalType: 'sows' | 'boars' | 'piglets';
  animalId: string;
};

type AnimalInfo = {
  ear_tag: string;
  name: string | null;
  status: string;
};

type RevenueItem = {
  id: string;
  income_date: string;
  income_type: string;
  amount: number;
  description: string | null;
};

type CostItem = {
  id: string;
  allocation_date: string;
  allocation_type: string;
  amount: number;
  description: string | null;
};

export default function AnimalProfitLossModal({
  isOpen,
  onClose,
  animalType,
  animalId,
}: AnimalProfitLossModalProps) {
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [animalInfo, setAnimalInfo] = useState<AnimalInfo | null>(null);
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([]);
  const [costItems, setCostItems] = useState<CostItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchDetailedPL();
    }
  }, [isOpen, animalId, animalType]);

  const fetchDetailedPL = async () => {
    try {
      setLoading(true);

      // Fetch animal info
      const tableName = animalType;
      const { data: animal, error: animalError } = await supabase
        .from(tableName)
        .select('ear_tag, name, status')
        .eq('id', animalId)
        .single();

      if (animalError) throw animalError;
      setAnimalInfo(animal);

      // Fetch revenue items (income records associated with this animal)
      let incomeQuery = supabase
        .from('income_records')
        .select('id, income_date, income_type, total_amount, description')
        .eq('organization_id', selectedOrganizationId)
        .eq('is_deleted', false);

      // Apply array contains filter based on animal type
      if (animalType === 'sows') {
        incomeQuery = incomeQuery.contains('sow_ids', [animalId]);
      } else if (animalType === 'boars') {
        incomeQuery = incomeQuery.contains('boar_ids', [animalId]);
      } else {
        incomeQuery = incomeQuery.contains('piglet_ids', [animalId]);
      }

      const { data: incomeData, error: incomeError } = await incomeQuery
        .order('income_date', { ascending: false });

      if (incomeError) throw incomeError;

      setRevenueItems((incomeData || []).map(item => ({
        id: item.id,
        income_date: item.income_date,
        income_type: item.income_type,
        amount: item.total_amount,
        description: item.description,
      })));

      // Fetch cost items (cost allocations for this animal)
      const columnName = animalType === 'sows' ? 'sow_id' : animalType === 'boars' ? 'boar_id' : 'piglet_id';
      const { data: costData, error: costError } = await supabase
        .from('cost_allocations')
        .select('id, allocation_date, allocation_type, amount, description')
        .eq('organization_id', selectedOrganizationId)
        .eq(columnName, animalId)
        .order('allocation_date', { ascending: false });

      if (costError) throw costError;

      setCostItems((costData || []).map(item => ({
        id: item.id,
        allocation_date: item.allocation_date,
        allocation_type: item.allocation_type,
        amount: item.amount,
        description: item.description,
      })));
    } catch (error: any) {
      console.error('Error fetching detailed P&L:', error);
      toast.error('Failed to load detailed profitability data');
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = revenueItems.reduce((sum, item) => sum + item.amount, 0);
  const totalCosts = costItems.reduce((sum, item) => sum + item.amount, 0);
  const profitLoss = totalRevenue - totalCosts;

  const formatIncomeType = (type: string) => {
    const types: Record<string, string> = {
      'piglet_sale': 'Piglet Sale',
      'cull_sow_sale': 'Cull Sow Sale',
      'breeding_stock_sale': 'Breeding Stock Sale',
      'boar_sale': 'Boar Sale',
      'other': 'Other',
    };
    return types[type] || type;
  };

  const formatCostType = (type: string) => {
    const types: Record<string, string> = {
      'feed': 'Feed',
      'veterinary': 'Veterinary',
      'breeding': 'Breeding',
      'facilities': 'Facilities',
      'labor': 'Labor',
      'other': 'Other',
    };
    return types[type] || type;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {animalInfo ? `${animalInfo.ear_tag}${animalInfo.name ? ` - ${animalInfo.name}` : ''}` : 'Loading...'}
            </h2>
            <p className="text-sm text-gray-600">
              Detailed Profit & Loss Analysis
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 pb-6 border-b">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Total Revenue</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${totalRevenue.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Total Costs</div>
                  <div className="text-2xl font-bold text-red-600">
                    ${totalCosts.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Profit/Loss</div>
                  <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${profitLoss.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Revenue Breakdown</h3>
                {revenueItems.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">No revenue recorded</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {revenueItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {new Date(item.income_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {formatIncomeType(item.income_type)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {item.description || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-medium text-green-600">
                              ${item.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-900 text-right">
                            Total Revenue:
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-green-600">
                            ${totalRevenue.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Cost Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Cost Breakdown</h3>
                {costItems.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">No costs allocated</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {costItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {new Date(item.allocation_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {formatCostType(item.allocation_type)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {item.description || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-medium text-red-600">
                              ${item.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-900 text-right">
                            Total Costs:
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-red-600">
                            ${totalCosts.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
