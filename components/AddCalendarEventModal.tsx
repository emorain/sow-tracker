'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { useOrganization } from '@/lib/organization-context';

type AddCalendarEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onEventCreated: () => void;
};

export default function AddCalendarEventModal({
  isOpen,
  onClose,
  selectedDate,
  onEventCreated,
}: AddCalendarEventModalProps) {
  const { user } = useAuth();
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    event_type: 'custom',
    title: '',
    description: '',
    all_day: true,
    start_time: '',
    end_time: '',
    priority: 'medium',
  });

  // Reset form when modal opens with new date
  useEffect(() => {
    if (isOpen) {
      setFormData({
        event_type: 'custom',
        title: '',
        description: '',
        all_day: true,
        start_time: '',
        end_time: '',
        priority: 'medium',
      });
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter an event title');
      return;
    }

    setLoading(true);

    try {
      const eventDate = selectedDate.toISOString().split('T')[0];

      const { error } = await supabase.from('calendar_events').insert({
        user_id: user.id,
        organization_id: selectedOrganizationId,
        event_type: formData.event_type,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        event_date: eventDate,
        all_day: formData.all_day,
        start_time: !formData.all_day && formData.start_time ? formData.start_time : null,
        end_time: !formData.all_day && formData.end_time ? formData.end_time : null,
        priority: formData.priority,
        completed: false,
      });

      if (error) throw error;

      toast.success('Event created successfully');
      onEventCreated();
      onClose();
    } catch (err) {
      console.error('Error creating event:', err);
      toast.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-red-700" />
            <CardTitle>Add Event or Task</CardTitle>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selected Date Display */}
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm font-medium text-blue-900">{formatDate(selectedDate)}</p>
            </div>

            {/* Event Type */}
            <div>
              <Label htmlFor="event_type">Event Type</Label>
              <select
                id="event_type"
                name="event_type"
                value={formData.event_type}
                onChange={handleChange}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="custom">Custom Event</option>
                <option value="task">Task</option>
                <option value="reminder">Reminder</option>
                <option value="note">Note</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Feed delivery, Vet visit, Equipment maintenance"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Additional details..."
                rows={3}
              />
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="all_day"
                name="all_day"
                checked={formData.all_day}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-600"
              />
              <Label htmlFor="all_day" className="cursor-pointer">
                All-day event
              </Label>
            </div>

            {/* Time fields (only show if not all-day) */}
            {!formData.all_day && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* Priority (for tasks and reminders) */}
            {(formData.event_type === 'task' || formData.event_type === 'reminder') && (
              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4 border-t">
              <Button type="button" onClick={onClose} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
