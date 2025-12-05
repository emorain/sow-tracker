'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Edit2, Trash2, Check, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

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

type EventDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEventUpdated: () => void;
};

export default function EventDetailModal({
  isOpen,
  onClose,
  event,
  onEventUpdated,
}: EventDetailModalProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    all_day: true,
    start_time: '',
    end_time: '',
    priority: 'medium',
  });

  if (!isOpen || !event) return null;

  // Only custom events can be edited/deleted
  const isCustomEvent = event.type === 'customEvent';

  const handleEdit = async () => {
    // Fetch full event details from database
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', event.id.replace('custom-', ''))
      .single();

    if (error || !data) {
      toast.error('Failed to load event details');
      return;
    }

    setEditForm({
      title: data.title,
      description: data.description || '',
      all_day: data.all_day,
      start_time: data.start_time || '',
      end_time: data.end_time || '',
      priority: data.priority || 'medium',
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!editForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          all_day: editForm.all_day,
          start_time: !editForm.all_day && editForm.start_time ? editForm.start_time : null,
          end_time: !editForm.all_day && editForm.end_time ? editForm.end_time : null,
          priority: editForm.priority,
        })
        .eq('id', event.id.replace('custom-', ''));

      if (error) throw error;

      toast.success('Event updated successfully');
      setIsEditing(false);
      onEventUpdated();
      onClose();
    } catch (err) {
      console.error('Error updating event:', err);
      toast.error('Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', event.id.replace('custom-', ''));

      if (error) throw error;

      toast.success('Event deleted successfully');
      onEventUpdated();
      onClose();
    } catch (err) {
      console.error('Error deleting event:', err);
      toast.error('Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setLoading(true);

    try {
      // Handle custom events
      if (event.type === 'customEvent') {
        const { error } = await supabase
          .from('calendar_events')
          .update({
            completed: !event.completed,
            completed_at: !event.completed ? new Date().toISOString() : null,
          })
          .eq('id', event.id.replace('custom-', ''));

        if (error) throw error;
      }
      // Handle protocol tasks (pregnancy checks and other reminders)
      else if (event.type === 'pregnancyCheck' || event.type === 'protocolReminder') {
        const taskId = event.id.replace('scheduled-task-', '').replace('protocol-task-', '');
        const { error } = await supabase
          .from('scheduled_tasks')
          .update({
            is_completed: !event.completed,
            completed_at: !event.completed ? new Date().toISOString() : null,
          })
          .eq('id', taskId);

        if (error) throw error;
      }

      toast.success(event.completed ? 'Marked as incomplete' : 'Marked as complete');
      onEventUpdated();
    } catch (err) {
      console.error('Error toggling completion:', err);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-red-700" />
            <CardTitle>{isEditing ? 'Edit Event' : 'Event Details'}</CardTitle>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {!isEditing ? (
            /* View Mode */
            <div className="space-y-4">
              {/* Event Title */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${event.color}`}></span>
                  <span className="text-sm text-gray-600 capitalize">
                    {event.type.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Date</p>
                <p className="text-lg text-gray-900">{formatDate(event.date)}</p>
                {event.time && (
                  <p className="text-sm text-gray-600 mt-1">Time: {event.time}</p>
                )}
              </div>

              {/* Priority (for custom events) */}
              {event.priority && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Priority</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(event.priority)}`}>
                    {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)}
                  </span>
                </div>
              )}

              {/* Completion Status (for tasks) */}
              {(isCustomEvent || event.type === 'pregnancyCheck' || event.type === 'protocolReminder') && event.completed !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      event.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {event.completed ? 'Completed' : 'Pending'}
                    </span>
                    <Button
                      onClick={handleToggleComplete}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {event.completed ? 'Mark Incomplete' : 'Mark Complete'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {/* Related Animal Info */}
              {event.related_type && event.related_id && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Related {event.related_type}: ID {event.related_id}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {isCustomEvent && (
                  <>
                    <Button onClick={handleEdit} variant="outline" className="flex-1">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button onClick={handleDelete} variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
                {!isCustomEvent && event.type === 'protocolReminder' && (
                  <p className="text-sm text-gray-500 italic">
                    This is a protocol-generated task and cannot be edited or deleted. You can mark it as complete above.
                  </p>
                )}
                {!isCustomEvent && event.type === 'pregnancyCheck' && (
                  <p className="text-sm text-gray-500 italic">
                    This is a protocol-generated pregnancy check reminder. You can mark it as complete above.
                  </p>
                )}
                {!isCustomEvent && event.type !== 'protocolReminder' && event.type !== 'pregnancyCheck' && (
                  <p className="text-sm text-gray-500 italic">
                    This is a system-generated event and cannot be edited.
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="edit-title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Event title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-all-day"
                  checked={editForm.all_day}
                  onChange={(e) => setEditForm({ ...editForm, all_day: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-600"
                />
                <Label htmlFor="edit-all-day" className="cursor-pointer">
                  All-day event
                </Label>
              </div>

              {/* Time fields */}
              {!editForm.all_day && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-start-time">Start Time</Label>
                    <Input
                      id="edit-start-time"
                      type="time"
                      value={editForm.start_time}
                      onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-end-time">End Time</Label>
                    <Input
                      id="edit-end-time"
                      type="time"
                      value={editForm.end_time}
                      onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Priority */}
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <select
                  id="edit-priority"
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
