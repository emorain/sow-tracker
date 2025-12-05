'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import Link from 'next/link';
import AddCalendarEventModal from '@/components/AddCalendarEventModal';
import EventDetailModal from '@/components/EventDetailModal';
import DayViewModal from '@/components/DayViewModal';

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
  protocolReminder: boolean;
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
  { key: 'protocolReminder', label: 'Protocol Reminders', color: 'bg-indigo-500' },
  { key: 'matrixTreatment', label: 'Matrix Treatments', color: 'bg-teal-500' },
  { key: 'healthRecord', label: 'Health Records', color: 'bg-red-500' },
  { key: 'housingMove', label: 'Housing Moves', color: 'bg-yellow-500' },
  { key: 'customEvent', label: 'Custom Events/Tasks', color: 'bg-gray-500' },
];

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showDayViewModal, setShowDayViewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Active filters (used for fetching data)
  const [appliedFilters, setAppliedFilters] = useState<EventFilter>({
    breeding: true,
    expectedFarrowing: true,
    actualFarrowing: true,
    weaning: true,
    pregnancyCheck: true,
    protocolReminder: true,
    matrixTreatment: true,
    healthRecord: true,
    housingMove: true,
    customEvent: true,
  });

  // Pending filters (user is editing)
  const [pendingFilters, setPendingFilters] = useState<EventFilter>({
    breeding: true,
    expectedFarrowing: true,
    actualFarrowing: true,
    weaning: true,
    pregnancyCheck: true,
    protocolReminder: true,
    matrixTreatment: true,
    healthRecord: true,
    housingMove: true,
    customEvent: true,
  });

  useEffect(() => {
    if (user) {
      fetchAllEvents();
    }
  }, [user, currentDate, appliedFilters]);

  const fetchAllEvents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const allEvents: CalendarEvent[] = [];

      // Get date range for current view
      const { startDate, endDate } = getDateRange();

      // Fetch breeding events
      if (appliedFilters.breeding) {
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
            time: b.scheduled_time || undefined,
            color: 'bg-blue-500',
            related_id: b.sow_id,
            related_type: 'sow',
          });
        });
      }

      // Fetch expected farrowing dates
      if (appliedFilters.expectedFarrowing) {
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
            time: f.scheduled_time || undefined,
            color: 'bg-purple-500',
            related_id: f.sow_id,
            related_type: 'sow',
          });
        });
      }

      // Fetch actual farrowing dates
      if (appliedFilters.actualFarrowing) {
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
      if (appliedFilters.weaning) {
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
      if (appliedFilters.pregnancyCheck) {
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

        // Also fetch scheduled pregnancy check tasks from protocols
        const { data: scheduledChecks } = await supabase
          .from('scheduled_tasks')
          .select('*, sows(ear_tag, name)')
          .eq('user_id', user.id)
          .gte('due_date', startDate)
          .lte('due_date', endDate)
          .ilike('task_name', '%pregnancy%');

        scheduledChecks?.forEach(task => {
          allEvents.push({
            id: `scheduled-task-${task.id}`,
            type: 'pregnancyCheck',
            title: `${task.task_name}${task.sows ? `: ${task.sows.name || task.sows.ear_tag}` : ''}`,
            date: task.due_date,
            color: 'bg-orange-500',
            related_id: task.sow_id,
            related_type: 'sow',
            description: task.description,
            completed: task.is_completed,
          });
        });
      }

      // Fetch matrix treatments
      if (appliedFilters.matrixTreatment) {
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
            time: mt.scheduled_time || undefined,
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
      if (appliedFilters.healthRecord) {
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
            time: hr.scheduled_time || undefined,
            color: 'bg-red-500',
            related_id: hr.sow_id || hr.boar_id,
            related_type: hr.sow_id ? 'sow' : 'boar',
          });
        });
      }

      // Fetch housing moves
      if (appliedFilters.housingMove) {
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
            time: hm.scheduled_time || undefined,
            color: 'bg-yellow-500',
            related_id: hm.sow_id,
            related_type: 'sow',
          });
        });
      }

      // Fetch custom events
      if (appliedFilters.customEvent) {
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

      // Fetch protocol reminders (scheduled tasks from breeding, farrowing, matrix, weaning protocols)
      if (appliedFilters.protocolReminder) {
        const { data: protocolTasks } = await supabase
          .from('scheduled_tasks')
          .select('*, sows(ear_tag, name)')
          .eq('user_id', user.id)
          .gte('due_date', startDate)
          .lte('due_date', endDate)
          .not('task_name', 'ilike', '%pregnancy%'); // Exclude pregnancy checks (shown under Pregnancy Check filter)

        protocolTasks?.forEach(task => {
          allEvents.push({
            id: `protocol-task-${task.id}`,
            type: 'protocolReminder',
            title: `${task.task_name}${task.sows ? `: ${task.sows.name || task.sows.ear_tag}` : ''}`,
            date: task.due_date,
            color: 'bg-indigo-500',
            related_id: task.sow_id,
            related_type: 'sow',
            description: task.description,
            completed: task.is_completed,
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
    setPendingFilters({ ...pendingFilters, [key]: !pendingFilters[key] });
  };

  const toggleAllFilters = (value: boolean) => {
    const newFilters = { ...pendingFilters };
    Object.keys(newFilters).forEach(key => {
      newFilters[key as keyof EventFilter] = value;
    });
    setPendingFilters(newFilters);
  };

  const applyFilters = () => {
    setAppliedFilters({ ...pendingFilters });
  };

  const formatMonthYear = () => {
    if (view === 'week') {
      return formatWeekRange();
    }
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
    setShowDayViewModal(true);
  };

  const handleAddEventFromDayView = () => {
    setShowDayViewModal(false);
    setShowAddEventModal(true);
  };

  const handleEventCreated = () => {
    fetchAllEvents();
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDayViewModal(false);
    setShowEventDetailModal(true);
  };

  const handleEventUpdated = () => {
    fetchAllEvents();
  };

  const handleEventTimeUpdate = async (event: CalendarEvent, newDate: Date, newHour: number | null) => {
    if (!user) return;

    try {
      const dateStr = newDate.toISOString().split('T')[0];
      const timeStr = newHour !== null ? `${newHour.toString().padStart(2, '0')}:00:00` : null;

      // Update the appropriate table based on event type
      if (event.type === 'customEvent') {
        const eventId = event.id.replace('custom-', '');
        const { error } = await supabase
          .from('calendar_events')
          .update({
            event_date: dateStr,
            start_time: timeStr,
          })
          .eq('id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else if (event.type === 'breeding') {
        const eventId = event.id.replace('breeding-', '');
        const { error } = await supabase
          .from('breeding_attempts')
          .update({
            breeding_date: dateStr,
            scheduled_time: timeStr,
          })
          .eq('id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else if (event.type === 'expectedFarrowing' || event.type === 'actualFarrowing') {
        const eventId = event.id.replace('expected-farrowing-', '').replace('actual-farrowing-', '');
        const { error} = await supabase
          .from('farrowings')
          .update({
            scheduled_time: timeStr,
          })
          .eq('id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else if (event.type === 'pregnancyCheck' && event.id.startsWith('scheduled-task-')) {
        const eventId = event.id.replace('scheduled-task-', '');
        const { error } = await supabase
          .from('scheduled_tasks')
          .update({
            due_date: timeStr ? `${dateStr}T${timeStr}` : `${dateStr}T00:00:00`,
          })
          .eq('id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else if (event.type === 'protocolReminder' && event.id.startsWith('protocol-task-')) {
        const eventId = event.id.replace('protocol-task-', '');
        const { error } = await supabase
          .from('scheduled_tasks')
          .update({
            due_date: timeStr ? `${dateStr}T${timeStr}` : `${dateStr}T00:00:00`,
          })
          .eq('id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else if (event.type === 'matrixTreatment') {
        const eventId = event.id.replace('matrix-start-', '').replace('matrix-end-', '').replace('matrix-heat-', '');
        const { error } = await supabase
          .from('matrix_treatments')
          .update({
            scheduled_time: timeStr,
          })
          .eq('id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else if (event.type === 'healthRecord') {
        const eventId = event.id.replace('health-', '');
        const { error } = await supabase
          .from('health_records')
          .update({
            scheduled_time: timeStr,
          })
          .eq('id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else if (event.type === 'housingMove') {
        const eventId = event.id.replace('housing-', '');
        const { error } = await supabase
          .from('sow_location_history')
          .update({
            scheduled_time: timeStr,
          })
          .eq('id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      toast.success(timeStr ? 'Event scheduled successfully' : 'Event moved to all-day');
      fetchAllEvents(); // Refresh the calendar
    } catch (error: any) {
      console.error('Failed to update event time:', error);
      toast.error(error.message || 'Failed to update event time');
    }
  };

  const getEventsForDate = (date: Date | null): CalendarEvent[] => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  const getWeekDays = () => {
    const dayOfWeek = currentDate.getDay();
    const weekDays = [];

    // Get Sunday of current week
    const sunday = new Date(currentDate);
    sunday.setDate(currentDate.getDate() - dayOfWeek);

    // Generate array of 7 days starting from Sunday
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      weekDays.push(day);
    }

    return weekDays;
  };

  const formatWeekRange = () => {
    const weekDays = getWeekDays();
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];

    const firstMonth = firstDay.toLocaleDateString('en-US', { month: 'short' });
    const lastMonth = lastDay.toLocaleDateString('en-US', { month: 'short' });
    const year = firstDay.getFullYear();

    if (firstMonth === lastMonth) {
      return `${firstMonth} ${firstDay.getDate()} - ${lastDay.getDate()}, ${year}`;
    } else {
      return `${firstMonth} ${firstDay.getDate()} - ${lastMonth} ${lastDay.getDate()}, ${year}`;
    }
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
                <Button
                  onClick={applyFilters}
                  size="sm"
                  className="bg-red-700 hover:bg-red-800"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => toggleFilter(key as keyof EventFilter)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    pendingFilters[key as keyof EventFilter]
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
                  className={`px-3 py-1.5 text-sm font-medium border ${
                    view === 'week'
                      ? 'bg-red-700 text-white border-red-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } rounded-r-md`}
                >
                  Week
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(event);
                                }}
                                className={`${event.color} text-white text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity`}
                                title={event.title}
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDateClick(date);
                                }}
                                className="text-xs text-blue-600 px-1 cursor-pointer hover:text-blue-800 hover:underline font-medium"
                              >
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

          {/* Week View */}
          {view === 'week' && (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10">
                <div className="p-3 text-center text-sm font-semibold text-gray-700 border-r">
                  Time
                </div>
                {getWeekDays().map((date, index) => {
                  const isCurrentDay = isToday(date);
                  return (
                    <div
                      key={index}
                      className={`p-3 text-center border-r last:border-r-0 ${
                        isCurrentDay ? 'bg-red-50' : ''
                      }`}
                    >
                      <div className={`text-xs ${isCurrentDay ? 'text-red-700 font-bold' : 'text-gray-600'}`}>
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-semibold ${isCurrentDay ? 'text-red-700' : 'text-gray-900'}`}>
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All-Day Events Section */}
              <div className="grid grid-cols-8 border-b bg-gray-50">
                <div className="p-2 text-xs font-semibold text-gray-700 border-r">
                  All-Day
                </div>
                {getWeekDays().map((date, dayIndex) => {
                  const dayEvents = getEventsForDate(date);
                  const allDayEvents = dayEvents.filter(event => !event.time);
                  const isCurrentDay = isToday(date);

                  return (
                    <div
                      key={dayIndex}
                      className={`min-h-[80px] p-1 border-r last:border-r-0 ${
                        isCurrentDay ? 'bg-red-50' : 'bg-gray-50'
                      }`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const eventData = e.dataTransfer.getData('event');
                        if (eventData) {
                          const event = JSON.parse(eventData);
                          handleEventTimeUpdate(event, date, null);
                        }
                      }}
                    >
                      <div className="space-y-1">
                        {allDayEvents.map(event => (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('event', JSON.stringify(event));
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                            className={`${event.color} text-white text-xs px-1.5 py-1 rounded truncate cursor-move hover:opacity-80 transition-opacity`}
                            title={event.title}
                          >
                            <div className="truncate">{event.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time slots and events */}
              <div className="grid grid-cols-8">
                {/* Generate time slots for full day (00:00 - 23:00) */}
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="contents">
                    {/* Time label */}
                    <div className="p-2 text-xs text-gray-600 border-r border-b text-right pr-3">
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </div>

                    {/* Day columns */}
                    {getWeekDays().map((date, dayIndex) => {
                      const dateStr = date.toISOString().split('T')[0];
                      const dayEvents = getEventsForDate(date);

                      // Filter events for this hour
                      const hourEvents = dayEvents.filter(event => {
                        if (!event.time) return false; // All-day events now in separate section
                        const eventHour = parseInt(event.time.split(':')[0]);
                        return eventHour === hour;
                      });

                      const isCurrentDay = isToday(date);

                      return (
                        <div
                          key={dayIndex}
                          data-hour={hour}
                          data-date={dateStr}
                          onClick={() => handleDateClick(date)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const eventData = e.dataTransfer.getData('event');
                            if (eventData) {
                              const event = JSON.parse(eventData);
                              handleEventTimeUpdate(event, date, hour);
                            }
                          }}
                          className={`min-h-[60px] p-1 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50 ${
                            isCurrentDay ? 'bg-red-50' : 'bg-white'
                          }`}
                        >
                          <div className="space-y-1">
                            {hourEvents.map(event => (
                              <div
                                key={event.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('event', JSON.stringify(event));
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(event);
                                }}
                                className={`${event.color} text-white text-xs px-1.5 py-1 rounded truncate cursor-move hover:opacity-80 transition-opacity`}
                                title={`${event.time ? event.time + ' - ' : ''}${event.title}`}
                              >
                                {event.time && <div className="font-semibold">{event.time}</div>}
                                <div className="truncate">{event.title}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Day View Modal */}
      <DayViewModal
        isOpen={showDayViewModal}
        onClose={() => setShowDayViewModal(false)}
        date={selectedDate}
        events={getEventsForDate(selectedDate)}
        onEventClick={handleEventClick}
        onAddEvent={handleAddEventFromDayView}
      />

      {/* Add Event Modal */}
      <AddCalendarEventModal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        selectedDate={selectedDate}
        onEventCreated={handleEventCreated}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={showEventDetailModal}
        onClose={() => setShowEventDetailModal(false)}
        event={selectedEvent}
        onEventUpdated={handleEventUpdated}
      />
    </div>
  );
}
