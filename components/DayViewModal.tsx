'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';

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

type DayViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: () => void;
};

export default function DayViewModal({
  isOpen,
  onClose,
  date,
  events,
  onEventClick,
  onAddEvent,
}: DayViewModalProps) {
  if (!isOpen || !date) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return null;
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  // Sort events by time (all-day first, then by time)
  const sortedEvents = [...events].sort((a, b) => {
    if (!a.time && b.time) return -1;
    if (a.time && !b.time) return 1;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 sticky top-0 bg-white z-10">
          <div>
            <CardTitle className="text-2xl">{formatDate(date)}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {events.length} {events.length === 1 ? 'event' : 'events'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onAddEvent} size="sm" className="bg-red-700 hover:bg-red-800">
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm" className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No events scheduled for this day</p>
              <Button onClick={onAddEvent} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-200"
                >
                  {/* Color indicator */}
                  <div className={`w-1 h-full min-h-[60px] ${event.color} rounded-full flex-shrink-0`}></div>

                  {/* Event details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{event.title}</h4>
                        <p className="text-sm text-gray-600 capitalize">
                          {event.type.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                      </div>
                      {event.time && (
                        <span className="text-sm font-medium text-gray-700 flex-shrink-0">
                          {formatTime(event.time)}
                        </span>
                      )}
                    </div>

                    {/* Description preview */}
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    {/* Status badges */}
                    <div className="flex items-center gap-2 mt-2">
                      {event.completed !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            event.completed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {event.completed ? 'Completed' : 'Pending'}
                        </span>
                      )}
                      {event.priority && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            event.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : event.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
