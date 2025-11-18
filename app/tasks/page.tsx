'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Circle, Calendar, AlertCircle, ClipboardCheck } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ScheduledTask {
  id: string;
  task_name: string;
  description: string;
  due_date: string;
  is_completed: boolean;
  completed_at: string | null;
  completed_notes: string | null;
  farrowing_id: string | null;
  sow_id: string | null;
  sow?: {
    ear_tag: string;
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('pending');
  const [loading, setLoading] = useState(true);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .select(`
          *,
          sow:sows(ear_tag)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_tasks')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          completed_notes: completionNotes || null
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(t =>
        t.id === taskId
          ? { ...t, is_completed: true, completed_at: new Date().toISOString(), completed_notes: completionNotes }
          : t
      ));
      setCompletingTaskId(null);
      setCompletionNotes('');
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  const handleUncompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_tasks')
        .update({
          is_completed: false,
          completed_at: null,
          completed_notes: null
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(t =>
        t.id === taskId
          ? { ...t, is_completed: false, completed_at: null, completed_notes: null }
          : t
      ));
    } catch (error) {
      console.error('Error uncompleting task:', error);
      toast.error('Failed to uncomplete task');
    }
  };

  const getFilteredTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'pending':
        return tasks.filter(t => !t.is_completed);
      case 'overdue':
        return tasks.filter(t => {
          const dueDate = new Date(t.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return !t.is_completed && dueDate < today;
        });
      case 'completed':
        return tasks.filter(t => t.is_completed);
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  const getTaskStatus = (task: ScheduledTask) => {
    if (task.is_completed) return 'completed';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) return 'overdue';
    if (dueDate.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-red-100 border-green-300 text-red-900';
      case 'overdue': return 'bg-red-100 border-red-300 text-red-800';
      case 'today': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'overdue': return 'Overdue';
      case 'today': return 'Due Today';
      default: return 'Upcoming';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => !t.is_completed).length,
    overdue: tasks.filter(t => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return !t.is_completed && dueDate < today;
    }).length,
    completed: tasks.filter(t => t.is_completed).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 py-8">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Dashboard</h1>
          <p className="text-gray-600">Manage and track all scheduled tasks from your protocols</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <ClipboardCheck className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('pending')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
                </div>
                <Circle className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('overdue')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('completed')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-red-700">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {filter === 'all' && 'All Tasks'}
                  {filter === 'pending' && 'Pending Tasks'}
                  {filter === 'overdue' && 'Overdue Tasks'}
                  {filter === 'completed' && 'Completed Tasks'}
                </CardTitle>
                <CardDescription>
                  {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              {filter !== 'all' && (
                <Button variant="outline" size="sm" onClick={() => setFilter('all')}>
                  Show All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-gray-500">Loading tasks...</p>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600">
                  {filter === 'pending' && 'Great job! No pending tasks.'}
                  {filter === 'overdue' && 'No overdue tasks. Keep up the good work!'}
                  {filter === 'completed' && 'No completed tasks yet.'}
                  {filter === 'all' && 'Tasks will appear here when farrowings are recorded.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const status = getTaskStatus(task);
                  const isCompleting = completingTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`p-4 border-2 rounded-lg transition-all ${getStatusColor(status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => task.is_completed ? handleUncompleteTask(task.id) : setCompletingTaskId(task.id)}
                            className="mt-1"
                          >
                            {task.is_completed ? (
                              <CheckCircle className="h-5 w-5 text-red-700" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400 hover:text-red-700" />
                            )}
                          </button>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{task.task_name}</h3>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <div className="flex items-center gap-1 text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span>Due: {formatDate(task.due_date)}</span>
                              </div>
                              {task.sow && (
                                <span className="text-gray-600">Sow #{task.sow.ear_tag}</span>
                              )}
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(status)}`}>
                                {getStatusLabel(status)}
                              </span>
                            </div>
                            {task.is_completed && task.completed_at && (
                              <p className="text-xs text-gray-500 mt-2">
                                Completed on {formatDate(task.completed_at)}
                                {task.completed_notes && ` - ${task.completed_notes}`}
                              </p>
                            )}
                            {isCompleting && (
                              <div className="mt-3 p-3 bg-white rounded border border-gray-300">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Completion Notes (optional)
                                </label>
                                <Textarea
                                  value={completionNotes}
                                  onChange={(e) => setCompletionNotes(e.target.value)}
                                  placeholder="Any notes about completing this task..."
                                  rows={2}
                                  className="mb-2"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleCompleteTask(task.id)}>
                                    Mark Complete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setCompletingTaskId(null);
                                      setCompletionNotes('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
