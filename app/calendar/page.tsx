'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import Link from 'next/link';
import AddCalendarEventModal from '@/components/AddCalendarEventModal';

type CalendarEvent = {
  id: string;
  type: string;
  title: string;
  date: string;
  time?: string;
  color: string;
  related_id?: string;
  related_type?: string;
  description?: string;
  completed?: boolean;
  priority?: string;
};

type EventFilter = {
  breeding: boolean;
  expectedFarrowing: boolean;
  actualFarrowing: boolean;
  weaning: boolean;
  pregnancyCheck: boolean;
  matrixTreatment: boolean;
  healthRecord: boolean;
  housingMove: boolean;
  customEvent: boolean;
};

const EVENT_TYPES = [
  { key: 'breeding', label: 'Breeding Events', color: 'bg-blue-500' },
  { key: 'expectedFarrowing', label: 'Expected Farrowing', color: 'bg-purple-500' },
  { key: 'actualFarrowing', label: 'Actual Farrowing', color: 'bg-pink-500' },
  { key: 'weaning', label: 'Weaning Dates', color: 'bg-green-500' },
  { key: 'pregnancyCheck', label: 'Pregnancy Checks', color: 'bg-orange-500' },
  { key: 'matrixTreatment', label: 'Matrix Treatments', color: 'bg-teal-500' },
  { key: 'healthRecord', label: 'Health Records', color: 'bg-red-500' },
  { key: 'housingMove', label: 'Housing Moves', color: 'bg-yellow-500' },
  { key: 'customEvent', label: 'Custom Events/Tasks', color: 'bg-gray-500' },
];

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState<EventFilter>({
    breeding: true,
    expectedFarrowing: true,
    actualFarrowing: true,
    weaning: true,
    pregnancyCheck: true,
    matrixTreatment: true,
    healthRecord: true,
    housingMove: true,
    customEvent: true,
  });

  useEffect(() => {
    if (user) {
      fetchAllEvents();
    }
  }, [user, currentDate, filters]);

  const fetchAllEvents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const allEvents: CalendarEvent[] = [];

      // Get date range for current view
      const { startDate, endDate } = getDateRange();

      // Fetch breeding events
      if (filters.breeding) {
        const { data: breedings } = await supabase
          .from('breeding_attempts')
          .select('*, sows(ear_tag, name)')
          .eq('user_id', user.id)
          .gte('breeding_date', startDate)
          .lte('breeding_date', endDate);

        breedings?.forEach(b => {
          allEvents.push({
            id: `breeding-${b.id}`,
            type: 'breeding',
            title: `Breeding: ${b.sows?.name || b.sows?.ear_tag}`,
            date: b.breeding_date,
            color: 'bg-blue-500',
            related_id: b.sow_id,
            related_type: 'sow',
          });
        });
      }

      // Fetch expected farrowing dates
      if (filters.expectedFarrowing) {
        const { data: farrowings } = await supabase
          .from('farrowings')
          .select('*, sows(ear_tag, name)')
          .eq('user_id', user.id)
          .is('actual_farrowing_date', null)
          .gte('expected_farrowing_date', startDate)
          .lte('expected_farrowing_date', endDate);

        farrowings?.forEach(f => {
          allEvents.push({
            id: `expected-farrowing-${f.id}`,
            type: 'expectedFarrowing',
            title: `Expected: ${f.sows?.name || f.sows?.ear_tag}`,
            date: f.expected_farrowing_date,
            color: 'bg-purple-500',
            related_id: f.sow_id,
            related_type: 'sow',
          });
        });
      }

      // Fetch actual farrowing dates
      if (filters.actualFarrowing) {
        const { data: actualFarrowings } = await supabase
          .from('farrowings')
          .select('*, sows(ear_tag, name)')
          .eq('user_id', user.id)
          .not('actual_farrowing_date', 'is', null)
          .gte('actual_farrowing_date', startDate)
          .lte('actual_farrowing_date', endDate);

        actualFarrowings?.forEach(f => {
          allEvents.push({
            id: `actual-farrowing-${f.id}`,
            type: 'actualFarrowing',
            title: `Farrowed: ${f.sows?.name || f.sows?.ear_tag} (${f.live_piglets || 0} live)`,
            date: f.actual_farrowing_date,
            color: 'bg-pink-500',
            related_id: f.sow_id,
            related_type: 'sow',
          });
        });
      }

      // Fetch weaning dates
      if (filters.weaning) {
        const { data: weanings } = await supabase
          .from('farrowings')
          .select('*, sows(ear_tag, name)')
          .eq('user_id', user.id)
          .not('weaning_date', 'is', null)
          .gte('weaning_date', startDate)
          .lte('weaning_date', endDate);

        weanings?.forEach(w => {
          allEvents.push({
            id: `weaning-${w.id}`,
            type: 'weaning',
            title: `Weaning: ${w.sows?.name || w.sows?.ear_tag} (${w.piglets_weaned || 0} weaned)`,
            date: w.weaning_date,
            color: 'bg-green-500',
            related_id: w.sow_id,
            related_type: 'sow',
          });
        });
      }

      // Fetch pregnancy checks (breeding attempts marked for pregnancy check)
      if (filters.pregnancyCheck) {
        const { data: pregnancyChecks } = await supabase
          .from('breeding_attempts')
          .select('*, sows(ear_tag, name)')
          .eq('user_id', user.id)
          .eq('result', 'pending')
          .not('pregnancy_check_date', 'is', null)
          .gte('pregnancy_check_date', startDate)
          .lte('pregnancy_check_date', endDate);

        pregnancyChecks?.forEach(pc => {
          allEvents.push({
            id: `pregnancy-check-${pc.id}`,
            type: 'pregnancyCheck',
            title: `Pregnancy Check: ${pc.sows?.name || pc.sows?.ear_tag}`,
            date: pc.pregnancy_check_date,
            color: 'bg-orange-500',
            related_id: pc.sow_id,
            related_type: 'sow',
          });
        });
      }

      // Fetch matrix treatments
      if (filters.matrixTreatment) {
        const { data: matrixTreatments } = await supabase
          .from('matrix_treatments')
          .select('*, sows(ear_tag, name)')
          .eq('user_id', user.id)
          .gte('start_date', startDate)
          .lte('start_date', endDate);

        matrixTreatments?.forEach(mt => {
          // Add start date event
          allEvents.push({
            id: `matrix-start-${mt.id}`,
            type: 'matrixTreatment',
            title: `Matrix Start: ${mt.sows?.name || mt.sows?.ear_tag}`,
            date: mt.start_date,
            color: 'bg-teal-500',
            related_id: mt.sow_id,
            related_type: 'sow',
          });
        });

        // Also fetch end dates
        const { data: matrixEnds } = await supabase
          .from('matrix_treatments')
          .select('*, sows(ear_tag, name)')
          .eq('user_id', user.id)
          .not('end_date', 'is', null)
          .gte('end_date', startDate)
          .lte('end_date', endDate);

        matrixEnds?.forEach(mt => {
          allEvents.push({
            id: `matrix-end-${mt.id}`,
            type: 'matrixTreatment',
            title: `Matrix End: ${mt.sows?.name || mt.sows?.ear_tag}`,
            date: mt.end_date,
            color: 'bg-teal-500',
            related_id: mt.sow_id,
            related_type: 'sow',
          });
        });

        // Fetch expected heat dates
        const { data: matrixHeat } = await supabase
          .from('matrix_treatments')
          .select('*, sows(ear_tag, name)')
          .eq('user_id', user.id)
          .not('expected_heat_date', 'is', null)
          .gte('expected_heat_date', startDate)
          .lte('expected_heat_date', endDate);

        matrixHeat?.forEach(mt => {
          allEvents.push({
            id: `matrix-heat-${mt.id}`,
            type: 'matrixTreatment',
            title: `Expected Heat: ${mt.sows?.name || mt.sows?.ear_tag}`,
            date: mt.expected_heat_date,
            color: 'bg-teal-500',
            related_id: mt.sow_id,
            related_type: 'sow',
          });
        });
      }

      // Fetch health records with next due dates
      if (filters.healthRecord) {
        const { data: healthRecords } = await supabase
          .from('health_records')
          .select('*, sows(ear_tag, name), boars(ear_tag, name)')
          .eq('user_id', user.id)
          .not('next_due_date', 'is', null)
          .gte('next_due_date', startDate)
          .lte('next_due_date', endDate);

        healthRecords?.forEach(hr => {
          const animalName = hr.sows
            ? hr.sows.name || hr.sows.ear_tag
            : hr.boars
            ? hr.boars.name || hr.boars.ear_tag
            : 'Unknown';

          allEvents.push({
            id: `health-${hr.id}`,
            type: 'healthRecord',
            title: `${hr.treatment_type || 'Health'}: ${animalName}`,
            date: hr.next_due_date,
            color: 'bg-red-500',
            related_id: hr.sow_id || hr.boar_id,
            related_type: hr.sow_id ? 'sow' : 'boar',
          });
        });
      }

      // Fetch housing moves
      if (filters.housingMove) {
        const { data: housingMoves } = await supabase
          .from('sow_location_history')
          .select('*, sows(ear_tag, name), housing_units(name)')
          .eq('user_id', user.id)
          .not('move_date', 'is', null)
          .gte('move_date', startDate)
          .lte('move_date', endDate);

        housingMoves?.forEach(hm => {
          allEvents.push({
            id: `housing-${hm.id}`,
            type: 'housingMove',
            title: `Housing: ${hm.sows?.name || hm.sows?.ear_tag} → ${hm.housing_units?.name || 'Unit'}`,
            date: hm.move_date,
            color: 'bg-yellow-500',
            related_id: hm.sow_id,
            related_type: 'sow',
          });
        });
      }

      // Fetch custom events
      if (filters.customEvent) {
        const { data: customEvents } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', user.id)
          .gte('event_date', startDate)
          .lte('event_date', endDate);

        customEvents?.forEach(e => {
          allEvents.push({
            id: `custom-${e.id}`,
            type: 'customEvent',
            title: e.title,
            date: e.event_date,
            time: e.start_time,
            color: 'bg-gray-500',
            description: e.description,
            completed: e.completed,
            priority: e.priority,
          });
        });
      }

      // Sort events by date
      allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setEvents(allEvents);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (view === 'month') {
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      return { startDate, endDate };
    } else if (view === 'week') {
      // Get start of week (Sunday)
      const dayOfWeek = currentDate.getDay();
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - dayOfWeek);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };
    } else {
      // Day view
      const startDate = currentDate.toISOString().split('T')[0];
      return { startDate, endDate: startDate };
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  const previousPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleFilter = (key: keyof EventFilter) => {
    setFilters({ ...filters, [key]: !filters[key] });
  };

  const toggleAllFilters = (value: boolean) => {
    const newFilters = { ...filters };
    Object.keys(newFilters).forEach(key => {
      newFilters[key as keyof EventFilter] = value;
    });
    setFilters(newFilters);
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    setShowAddEventModal(true);
  };

  const handleEventCreated = () => {
    fetchAllEvents();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-red-700 flex items-center justify-center">
        <div className="text-white text-lg">Loading calendar...</div>
      </div>
    );
  }

  const days = getDaysInMonth();

  return (
    <div className="min-h-screen bg-red-700">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-8 w-8 text-red-700" />
              <h1 className="text-2xl font-bold text-gray-900">Farm Calendar</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Link href="/">
                <Button variant="outline" size="sm">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Event Filters</h3>
              <div className="flex space-x-2">
                <Button
                  onClick={() => toggleAllFilters(true)}
                  variant="outline"
                  size="sm"
                >
                  Select All
                </Button>
                <Button
                  onClick={() => toggleAllFilters(false)}
                  variant="outline"
                  size="sm"
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => toggleFilter(key as keyof EventFilter)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    filters[key as keyof EventFilter]
                      ? `${color} text-white`
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Controls */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={previousPeriod} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                {formatMonthYear()}
              </h2>
              <Button onClick={nextPeriod} variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button onClick={goToToday} variant="outline" size="sm">
                Today
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setView('month')}
                  className={`px-3 py-1.5 text-sm font-medium border ${
                    view === 'month'
                      ? 'bg-red-700 text-white border-red-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } rounded-l-md`}
                >
                  Month
                </button>
                <button
                  onClick={() => setView('week')}
                  className={`px-3 py-1.5 text-sm font-medium border-t border-b ${
                    view === 'week'
                      ? 'bg-red-700 text-white border-red-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setView('day')}
                  className={`px-3 py-1.5 text-sm font-medium border ${
                    view === 'day'
                      ? 'bg-red-700 text-white border-red-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } rounded-r-md`}
                >
                  Day
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          {/* Month View */}
          {view === 'month' && (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div
                    key={day}
                    className="p-3 text-center text-sm font-semibold text-gray-700 border-r last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7">
                {days.map((date, index) => {
                  const dayEvents = getEventsForDate(date);
                  const today = isToday(date);

                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className={`min-h-[120px] border-r border-b last:border-r-0 p-2 ${
                        date ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
                      } ${today ? 'ring-2 ring-red-500 ring-inset' : ''}`}
                    >
                      {date && (
                        <>
                          <div className={`text-sm font-medium mb-1 ${
                            today ? 'text-red-700 font-bold' : 'text-gray-700'
                          }`}>
                            {date.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map(event => (
                              <div
                                key={event.id}
                                className={`${event.color} text-white text-xs px-1 py-0.5 rounded truncate`}
                                title={event.title}
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-xs text-gray-600 px-1">
                                +{dayEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Week and Day views - placeholder for now */}
          {view !== 'month' && (
            <div className="p-8 text-center text-gray-500">
              {view === 'week' ? 'Week' : 'Day'} view coming soon...
            </div>
          )}
        </div>
      </main>

      {/* Add Event Modal */}
      <AddCalendarEventModal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        selectedDate={selectedDate}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}
