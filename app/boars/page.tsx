'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { PiggyBank, ArrowLeft, Plus } from "lucide-react";
import Link from 'next/link';
import BoarDetailModal from '@/components/BoarDetailModal';

type Boar = {
  id: string;
  ear_tag: string;
  name: string | null;
  birth_date: string;
  breed: string;
  status: 'active' | 'culled' | 'sold';
  photo_url: string | null;
  right_ear_notch: number | null;
  left_ear_notch: number | null;
  registration_number: string | null;
  notes: string | null;
  created_at: string;
  sire_id: string | null;
  dam_id: string | null;
};

type FilterType = 'all' | 'active' | 'culled' | 'sold';

export default function BoarsListPage() {
  const [boars, setBoars] = useState<Boar[]>([]);
  const [filteredBoars, setFilteredBoars] = useState<Boar[]>([]);
  const [breedingCounts, setBreedingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedBoar, setSelectedBoar] = useState<Boar | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBoars();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [boars, activeFilter]);

  const fetchBoars = async () => {
    try {
      const { data, error } = await supabase
        .from('boars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBoars(data || []);

      // Fetch breeding counts
      if (data) {
        const counts: Record<string, number> = {};
        for (const boar of data) {
          const { count } = await supabase
            .from('farrowings')
            .select('*', { count: 'exact', head: true })
            .eq('boar_id', boar.id);
          counts[boar.id] = count || 0;
        }
        setBreedingCounts(counts);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch boars');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...boars];

    switch (activeFilter) {
      case 'active':
        filtered = boars.filter(boar => boar.status === 'active');
        break;
      case 'culled':
        filtered = boars.filter(boar => boar.status === 'culled');
        break;
      case 'sold':
        filtered = boars.filter(boar => boar.status === 'sold');
        break;
      case 'all':
      default:
        break;
    }

    setFilteredBoars(filtered);
  };

  const getFilterCounts = () => {
    return {
      all: boars.length,
      active: boars.filter(b => b.status === 'active').length,
      culled: boars.filter(b => b.status === 'culled').length,
      sold: boars.filter(b => b.status === 'sold').length,
    };
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMonths = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;

    if (years > 0) {
      return `${years}y ${months}m`;
    }
    return `${months}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'culled':
        return 'bg-red-100 text-red-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <PiggyBank className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Boar Management</h1>
            </div>
            <Link href="/boars/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Boar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Boars</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${filteredBoars.length} boar${filteredBoars.length !== 1 ? 's' : ''} ${activeFilter !== 'all' ? `(${activeFilter})` : 'in your herd'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter Tabs */}
            {!loading && (
              <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b">
                {(['all', 'active', 'culled', 'sold'] as FilterType[]).map((filter) => {
                  const counts = getFilterCounts();
                  const count = counts[filter];
                  const isActive = activeFilter === filter;

                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading boars...
              </div>
            ) : filteredBoars.length === 0 ? (
              <div className="text-center py-12">
                <PiggyBank className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No boars found</h3>
                <p className="text-gray-600 mb-4">
                  {activeFilter !== 'all'
                    ? `No ${activeFilter} boars in your herd`
                    : 'Get started by adding your first boar'}
                </p>
                {activeFilter === 'all' && (
                  <Link href="/boars/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Boar
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBoars.map((boar) => {
                  const breedingCount = breedingCounts[boar.id] || 0;
                  return (
                    <div
                      key={boar.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Top row on mobile: Photo, Name & Badges */}
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Boar Photo */}
                        <div className="flex-shrink-0">
                          {boar.photo_url ? (
                            <img
                              src={boar.photo_url}
                              alt={boar.name || boar.ear_tag}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center">
                              <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Boar Name & Badges - Mobile only */}
                        <div className="flex-1 min-w-0 sm:hidden">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {boar.name || boar.ear_tag}
                          </h3>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(boar.status)}`}>
                              {boar.status}
                            </span>
                            {breedingCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {breedingCount} breeding{breedingCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Boar Info - Desktop and mobile details */}
                      <div className="flex-1 min-w-0">
                        {/* Desktop name & badges */}
                        <div className="hidden sm:flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {boar.name || boar.ear_tag}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(boar.status)}`}>
                            {boar.status}
                          </span>
                          {breedingCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {breedingCount} breeding{breedingCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Ear Tag:</span> {boar.ear_tag}
                          </div>
                          <div>
                            <span className="font-medium">Breed:</span> {boar.breed}
                          </div>
                          <div>
                            <span className="font-medium">Age:</span> {calculateAge(boar.birth_date)}
                          </div>
                          {(boar.right_ear_notch !== null || boar.left_ear_notch !== null) && (
                            <div>
                              <span className="font-medium">Notches:</span> R:{boar.right_ear_notch || '-'} L:{boar.left_ear_notch || '-'}
                            </div>
                          )}
                          {boar.registration_number && (
                            <div className="sm:col-span-2">
                              <span className="font-medium">Registration:</span> {boar.registration_number}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions - Stack on mobile */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBoar(boar);
                            setIsModalOpen(true);
                          }}
                          className="w-full sm:w-auto"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Boar Detail Modal */}
      <BoarDetailModal
        boar={selectedBoar}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBoar(null);
        }}
        onUpdate={fetchBoars}
      />
    </div>
  );
}
