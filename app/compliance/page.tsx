'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { ArrowLeft, AlertCircle, CheckCircle2, FileText, Download, Calendar, MapPin } from "lucide-react";
import Link from 'next/link';

type ComplianceStatus = {
  sow_id: string;
  ear_tag: string;
  name: string | null;
  is_compliant: boolean;
  confinement_hours_24h: number;
  confinement_hours_30d: number;
  current_housing: string | null;
  floor_space: number | null;
  location_history_count: number;
};

type LocationHistory = {
  id: string;
  housing_unit_id: string;
  housing_unit_name: string;
  moved_in_date: string;
  moved_out_date: string | null;
  reason: string | null;
  notes: string | null;
};

export default function CompliancePage() {
  const [complianceData, setComplianceData] = useState<ComplianceStatus[]>([]);
  const [selectedSow, setSelectedSow] = useState<ComplianceStatus | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      // Get all sows with compliance data
      const { data: sows, error: sowsError } = await supabase
        .from('sows')
        .select(`
          id,
          ear_tag,
          name,
          status,
          housing_unit_id,
          housing_units (
            name,
            floor_space_sqft
          )
        `)
        .eq('status', 'active');

      if (sowsError) throw sowsError;

      // Calculate compliance for each sow
      const compliancePromises = (sows || []).map(async (sow: any) => {
        // Get confinement hours
        const { data: hours24h } = await supabase
          .rpc('get_confinement_hours_24h', { p_sow_id: sow.id });

        const { data: hours30d } = await supabase
          .rpc('get_confinement_hours_30d', { p_sow_id: sow.id });

        // Get location history count
        const { count: historyCount } = await supabase
          .from('location_history')
          .select('*', { count: 'exact', head: true })
          .eq('sow_id', sow.id);

        // Check compliance
        const { data: isCompliant } = await supabase
          .rpc('is_sow_compliant', { p_sow_id: sow.id });

        return {
          sow_id: sow.id,
          ear_tag: sow.ear_tag,
          name: sow.name,
          is_compliant: isCompliant || false,
          confinement_hours_24h: hours24h || 0,
          confinement_hours_30d: hours30d || 0,
          current_housing: sow.housing_units?.name || null,
          floor_space: sow.housing_units?.floor_space_sqft || null,
          location_history_count: historyCount || 0,
        };
      });

      const complianceResults = await Promise.all(compliancePromises);
      setComplianceData(complianceResults);
    } catch (err: any) {
      console.error('Error fetching compliance data:', err);
      setError(err.message || 'Failed to fetch compliance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationHistory = async (sowId: string) => {
    try {
      const { data, error } = await supabase
        .from('location_history')
        .select(`
          id,
          housing_unit_id,
          moved_in_date,
          moved_out_date,
          reason,
          notes,
          housing_units (
            name
          )
        `)
        .eq('sow_id', sowId)
        .order('moved_in_date', { ascending: false });

      if (error) throw error;

      const formattedHistory = (data || []).map((entry: any) => ({
        id: entry.id,
        housing_unit_id: entry.housing_unit_id,
        housing_unit_name: entry.housing_units?.name || 'Unknown',
        moved_in_date: entry.moved_in_date,
        moved_out_date: entry.moved_out_date,
        reason: entry.reason,
        notes: entry.notes,
      }));

      setLocationHistory(formattedHistory);
    } catch (err: any) {
      console.error('Error fetching location history:', err);
    }
  };

  const handleSowSelect = async (sow: ComplianceStatus) => {
    setSelectedSow(sow);
    await fetchLocationHistory(sow.sow_id);
  };

  const exportAuditTrail = async (sow: ComplianceStatus) => {
    // Generate audit trail report
    const report = `
CALIFORNIA PROPOSITION 12 COMPLIANCE AUDIT TRAIL
================================================

Sow Information:
- Ear Tag: ${sow.ear_tag}
- Name: ${sow.name || 'N/A'}
- Compliance Status: ${sow.is_compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
- Current Housing: ${sow.current_housing || 'Not Assigned'}
- Floor Space: ${sow.floor_space ? sow.floor_space + ' sq ft' : 'Not Specified'}

Confinement Hours:
- Last 24 hours: ${sow.confinement_hours_24h.toFixed(2)} hours (Limit: 6 hours)
- Last 30 days: ${sow.confinement_hours_30d.toFixed(2)} hours (Limit: 24 hours)

Location History (${locationHistory.length} entries):
${locationHistory.map((entry, idx) => `
${idx + 1}. ${entry.housing_unit_name}
   Moved In: ${new Date(entry.moved_in_date).toLocaleString()}
   Moved Out: ${entry.moved_out_date ? new Date(entry.moved_out_date).toLocaleString() : 'Current Location'}
   Reason: ${entry.reason || 'N/A'}
   Notes: ${entry.notes || 'N/A'}
`).join('\n')}

Report Generated: ${new Date().toLocaleString()}
This report satisfies California Proposition 12 record-keeping requirements
for a 2-year audit trail.
    `.trim();

    // Download as text file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prop12-audit-${sow.ear_tag}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getComplianceStats = () => {
    const total = complianceData.length;
    const compliant = complianceData.filter(s => s.is_compliant).length;
    const nonCompliant = total - compliant;
    const atRisk = complianceData.filter(s =>
      s.confinement_hours_24h > 4 || s.confinement_hours_30d > 20 || !s.floor_space
    ).length;

    return { total, compliant, nonCompliant, atRisk };
  };

  const filteredData = complianceData.filter(sow =>
    sow.ear_tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sow.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = getComplianceStats();

  return (
    <div className="min-h-screen bg-red-700">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Prop 12 Compliance</h1>
                <p className="text-sm text-muted-foreground">California Proposition 12 compliance monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sows</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Active breeding sows</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliant</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.compliant}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? ((stats.compliant / stats.total) * 100).toFixed(1) : 0}% compliant
              </p>
            </CardContent>
          </Card>

          <Card className={stats.nonCompliant > 0 ? 'border-red-300' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
              <AlertCircle className={`h-4 w-4 ${stats.nonCompliant > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.nonCompliant > 0 ? 'text-red-600' : ''}`}>
                {stats.nonCompliant}
              </div>
              <p className={`text-xs mt-1 ${stats.nonCompliant > 0 ? 'text-red-700' : 'text-muted-foreground'}`}>
                {stats.nonCompliant > 0 ? 'Action required' : 'All compliant'}
              </p>
            </CardContent>
          </Card>

          <Card className={stats.atRisk > 0 ? 'border-yellow-300' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <AlertCircle className={`h-4 w-4 ${stats.atRisk > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.atRisk > 0 ? 'text-yellow-600' : ''}`}>
                {stats.atRisk}
              </div>
              <p className={`text-xs mt-1 ${stats.atRisk > 0 ? 'text-yellow-700' : 'text-muted-foreground'}`}>
                Approaching limits
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sow Compliance Status</CardTitle>
              <CardDescription>
                Click a sow to view detailed audit trail
              </CardDescription>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Search by ear tag or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading compliance data...
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sows found
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredData.map((sow) => (
                    <div
                      key={sow.sow_id}
                      onClick={() => handleSowSelect(sow)}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedSow?.sow_id === sow.sow_id ? 'bg-gray-100 border-red-500' : ''
                      } ${
                        !sow.is_compliant ? 'border-red-300 bg-red-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{sow.ear_tag}</span>
                            {sow.name && (
                              <span className="text-sm text-gray-600">({sow.name})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                            <MapPin className="h-3 w-3" />
                            {sow.current_housing || 'No housing assigned'}
                            {sow.floor_space && (
                              <span className="ml-2">• {sow.floor_space} sq ft</span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${
                              sow.confinement_hours_24h > 6
                                ? 'bg-red-100 text-red-800'
                                : sow.confinement_hours_24h > 4
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              24h: {sow.confinement_hours_24h.toFixed(1)}h
                            </span>
                            <span className={`px-2 py-0.5 rounded-full ${
                              sow.confinement_hours_30d > 24
                                ? 'bg-red-100 text-red-800'
                                : sow.confinement_hours_30d > 20
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              30d: {sow.confinement_hours_30d.toFixed(1)}h
                            </span>
                          </div>
                        </div>
                        <div>
                          {sow.is_compliant ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <AlertCircle className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location History */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedSow ? `Audit Trail: ${selectedSow.ear_tag}` : 'Select a Sow'}
              </CardTitle>
              <CardDescription>
                Complete location history for Prop 12 compliance
              </CardDescription>
              {selectedSow && (
                <Button
                  onClick={() => exportAuditTrail(selectedSow)}
                  size="sm"
                  className="mt-2"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Audit Trail
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!selectedSow ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Select a sow to view location history</p>
                </div>
              ) : locationHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No location history recorded
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {locationHistory.map((entry, idx) => {
                    const movedIn = new Date(entry.moved_in_date);
                    const movedOut = entry.moved_out_date ? new Date(entry.moved_out_date) : null;
                    const duration = movedOut
                      ? Math.floor((movedOut.getTime() - movedIn.getTime()) / (1000 * 60 * 60 * 24))
                      : Math.floor((new Date().getTime() - movedIn.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <div key={entry.id} className="p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              idx === 0 ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              <MapPin className={`h-4 w-4 ${
                                idx === 0 ? 'text-green-600' : 'text-gray-600'
                              }`} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              {entry.housing_unit_name}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Moved in: {movedIn.toLocaleDateString()} at {movedIn.toLocaleTimeString()}
                              </div>
                              {movedOut ? (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Calendar className="h-3 w-3" />
                                  Moved out: {movedOut.toLocaleDateString()} at {movedOut.toLocaleTimeString()}
                                </div>
                              ) : (
                                <div className="text-green-600 font-medium mt-0.5">
                                  Current Location
                                </div>
                              )}
                              <div className="mt-0.5">
                                Duration: {duration} days
                              </div>
                            </div>
                            {entry.reason && (
                              <div className="text-xs text-gray-500 mt-2">
                                Reason: {entry.reason}
                              </div>
                            )}
                            {entry.notes && (
                              <div className="text-xs text-gray-500 mt-1">
                                Notes: {entry.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Proposition 12 Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-blue-900">Space Requirement</div>
                <div className="text-xs text-blue-700 mt-1">24 sq ft minimum per breeding sow</div>
                <div className="text-xs text-blue-600 mt-1">Must turn around, stand, stretch freely</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-yellow-900">Confinement Limits</div>
                <div className="text-xs text-yellow-700 mt-1">Maximum 6 hours per 24-hour period</div>
                <div className="text-xs text-yellow-600 mt-1">Maximum 24 hours per 30-day period</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-purple-900">Record Retention</div>
                <div className="text-xs text-purple-700 mt-1">2-year audit trail required</div>
                <div className="text-xs text-purple-600 mt-1">Complete location history needed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
