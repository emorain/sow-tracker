'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';
import { downloadCSV } from '@/lib/csv-export';
import AnimalProfitLossModal from '@/components/AnimalProfitLossModal';

type AnimalPL = {
  id: string;
  ear_tag: string;
  name: string | null;
  status: string;
  total_revenue: number;
  total_costs: number;
  profit_loss: number;
  roi_percent: number;
};

type AnimalType = 'sows' | 'boars' | 'piglets';

export default function AnimalPLPage() {
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AnimalType>('sows');
  const [animals, setAnimals] = useState<AnimalPL[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState<{ type: AnimalType; id: string } | null>(null);
  const [sortField, setSortField] = useState<keyof AnimalPL>('profit_loss');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchAnimalPL();
    }
  }, [selectedOrganizationId, activeTab]);

  const fetchAnimalPL = async () => {
    try {
      setLoading(true);

      // Fetch animals based on active tab
      let animalQuery;
      if (activeTab === 'sows') {
        animalQuery = supabase
          .from('sows')
          .select('id, ear_tag, name, status')
          .eq('organization_id', selectedOrganizationId)
          .eq('is_deleted', false);
      } else if (activeTab === 'boars') {
        animalQuery = supabase
          .from('boars')
          .select('id, ear_tag, name, status')
          .eq('organization_id', selectedOrganizationId)
          .eq('is_deleted', false);
      } else {
        animalQuery = supabase
          .from('piglets')
          .select('id, ear_tag, name, status')
          .eq('organization_id', selectedOrganizationId)
          .eq('is_deleted', false);
      }

      const { data: animalData, error: animalError } = await animalQuery;
      if (animalError) throw animalError;

      // For each animal, calculate P&L
      const plPromises = (animalData || []).map(async (animal) => {
        const { data: plData, error: plError } = await supabase
          .rpc('calculate_animal_profit_loss', {
            p_animal_type: activeTab,
            p_animal_id: animal.id,
            p_organization_id: selectedOrganizationId,
          });

        if (plError) {
          console.error(`Error calculating P&L for ${animal.ear_tag}:`, plError);
          return {
            id: animal.id,
            ear_tag: animal.ear_tag,
            name: animal.name,
            status: animal.status,
            total_revenue: 0,
            total_costs: 0,
            profit_loss: 0,
            roi_percent: 0,
          };
        }

        const pl = plData && plData.length > 0 ? plData[0] : null;
        const totalRevenue = pl?.total_revenue || 0;
        const totalCosts = pl?.total_costs || 0;
        const profitLoss = pl?.profit_loss || 0;
        const roiPercent = totalCosts > 0 ? (profitLoss / totalCosts) * 100 : 0;

        return {
          id: animal.id,
          ear_tag: animal.ear_tag,
          name: animal.name,
          status: animal.status,
          total_revenue: totalRevenue,
          total_costs: totalCosts,
          profit_loss: profitLoss,
          roi_percent: roiPercent,
        };
      });

      const plResults = await Promise.all(plPromises);
      setAnimals(plResults);
    } catch (error: any) {
      console.error('Error fetching animal P&L:', error);
      toast.error('Failed to load animal profitability data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof AnimalPL) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAnimals = animals
    .filter(animal => {
      const searchLower = searchTerm.toLowerCase();
      return (
        animal.ear_tag.toLowerCase().includes(searchLower) ||
        (animal.name && animal.name.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

  const handleExport = () => {
    const exportData = filteredAnimals.map(animal => ({
      'Ear Tag': animal.ear_tag,
      'Name': animal.name || '',
      'Status': animal.status,
      'Total Revenue': `$${animal.total_revenue.toFixed(2)}`,
      'Total Costs': `$${animal.total_costs.toFixed(2)}`,
      'Profit/Loss': `$${animal.profit_loss.toFixed(2)}`,
      'ROI %': `${animal.roi_percent.toFixed(1)}%`,
    }));

    if (exportData.length === 0) {
      toast.error('No data to export');
      return;
    }
    downloadCSV(exportData, `animal-pl-${activeTab}`, Object.keys(exportData[0]));
    toast.success('Animal P&L exported');
  };

  const getTotals = () => {
    return filteredAnimals.reduce(
      (acc, animal) => ({
        revenue: acc.revenue + animal.total_revenue,
        costs: acc.costs + animal.total_costs,
        profit: acc.profit + animal.profit_loss,
      }),
      { revenue: 0, costs: 0, profit: 0 }
    );
  };

  const totals = getTotals();
  const avgROI = filteredAnimals.length > 0
    ? filteredAnimals.reduce((sum, a) => sum + a.roi_percent, 0) / filteredAnimals.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            <Link href="/finances" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-1">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Finances
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Animal P&L</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Track profit & loss per animal</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredAnimals.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Revenue</div>
              <div className="text-2xl font-bold text-ok">
                ${totals.revenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Costs</div>
              <div className="text-2xl font-bold text-due">
                ${totals.costs.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Net Profit/Loss</div>
              <div className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-ok' : 'text-due'}`}>
                ${totals.profit.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Average ROI</div>
              <div className={`text-2xl font-bold ${avgROI >= 0 ? 'text-ok' : 'text-due'}`}>
                {avgROI.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Table */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              {/* Tabs */}
              <div className="border-b">
                <nav className="flex gap-4 -mb-px">
                  <button
                    onClick={() => setActiveTab('sows')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'sows'
                        ? 'border-brand text-brand'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    Sows
                    <span className="ml-2 px-2 py-0.5 bg-secondary text-muted-foreground rounded-full text-xs">
                      {activeTab === 'sows' ? animals.length : 0}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('boars')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'boars'
                        ? 'border-brand text-brand'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    Boars
                    <span className="ml-2 px-2 py-0.5 bg-secondary text-muted-foreground rounded-full text-xs">
                      {activeTab === 'boars' ? animals.length : 0}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('piglets')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'piglets'
                        ? 'border-brand text-brand'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    Piglets
                    <span className="ml-2 px-2 py-0.5 bg-secondary text-muted-foreground rounded-full text-xs">
                      {activeTab === 'piglets' ? animals.length : 0}
                    </span>
                  </button>
                </nav>
              </div>

              {/* Search */}
              <div className="flex gap-4">
                <Input
                  placeholder="Search by ear tag or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading profitability data...</div>
            ) : filteredAnimals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No {activeTab} found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary border-b">
                    <tr>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:bg-secondary"
                        onClick={() => handleSort('ear_tag')}
                      >
                        Ear Tag {sortField === 'ear_tag' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:bg-secondary"
                        onClick={() => handleSort('name')}
                      >
                        Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:bg-secondary"
                        onClick={() => handleSort('status')}
                      >
                        Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:bg-secondary"
                        onClick={() => handleSort('total_revenue')}
                      >
                        Revenue {sortField === 'total_revenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:bg-secondary"
                        onClick={() => handleSort('total_costs')}
                      >
                        Costs {sortField === 'total_costs' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:bg-secondary"
                        onClick={() => handleSort('profit_loss')}
                      >
                        Profit/Loss {sortField === 'profit_loss' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:bg-secondary"
                        onClick={() => handleSort('roi_percent')}
                      >
                        ROI % {sortField === 'roi_percent' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAnimals.map((animal) => (
                      <tr key={animal.id} className="hover:bg-secondary">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          {animal.ear_tag}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {animal.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            animal.status === 'active' ? 'bg-green-100 text-green-800' :
                            animal.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                            animal.status === 'deceased' ? 'bg-red-100 text-red-800' :
                            'bg-secondary text-muted-foreground'
                          }`}>
                            {animal.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-ok font-medium">
                          ${animal.total_revenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-due font-medium">
                          ${animal.total_costs.toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-bold ${
                          animal.profit_loss >= 0 ? 'text-ok' : 'text-due'
                        }`}>
                          ${animal.profit_loss.toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-medium ${
                          animal.roi_percent >= 0 ? 'text-ok' : 'text-due'
                        }`}>
                          {animal.roi_percent.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAnimal({ type: activeTab, id: animal.id })}
                            className="text-brand hover:text-brand/80"
                          >
                            Details
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

      {/* Detail Modal */}
      {selectedAnimal && (
        <AnimalProfitLossModal
          isOpen={true}
          onClose={() => setSelectedAnimal(null)}
          animalType={selectedAnimal.type}
          animalId={selectedAnimal.id}
        />
      )}
    </div>
  );
}
