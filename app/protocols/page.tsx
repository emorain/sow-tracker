'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ClipboardList, Plus, Edit, Trash2, Calendar, CheckCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface Protocol {
  id: string;
  name: string;
  description: string;
  trigger_event: string;
  is_active: boolean;
  created_at: string;
  scheduled_task_count?: number;
}

interface ProtocolTask {
  id: string;
  protocol_id: string;
  task_name: string;
  description: string;
  days_offset: number;
  is_required: boolean;
  task_order: number;
}

export default function ProtocolsPage() {
  const { user } = useAuth();
  const farmName = user?.user_metadata?.farm_name || 'Sow Tracker';
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [protocolTasks, setProtocolTasks] = useState<ProtocolTask[]>([]);
  const [showNewProtocol, setShowNewProtocol] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingProtocolId, setDeletingProtocolId] = useState<string | null>(null);
  const [confirmDeleteProtocol, setConfirmDeleteProtocol] = useState<{ show: boolean; protocol: Protocol | null }>({ show: false, protocol: null });
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<{ show: boolean; taskId: string | null; taskName: string }>({ show: false, taskId: null, taskName: '' });
  const [errorDialog, setErrorDialog] = useState<{ show: boolean; title: string; message: string }>({ show: false, title: '', message: '' });

  const [newProtocol, setNewProtocol] = useState({
    name: '',
    description: '',
    trigger_event: 'farrowing',
    is_active: true
  });

  const [newTask, setNewTask] = useState({
    task_name: '',
    description: '',
    days_offset: 0,
    is_required: true,
    task_order: 0
  });

  const [editTask, setEditTask] = useState({
    task_name: '',
    description: '',
    days_offset: 0,
    is_required: true,
  });

  useEffect(() => {
    fetchProtocols();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProtocol) {
      fetchProtocolTasks(selectedProtocol.id);
    }
  }, [selectedProtocol]);

  const fetchProtocols = async () => {
    try {
      const { data, error } = await supabase
        .from('protocols')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get scheduled task counts for each protocol
      const protocolsWithCounts = await Promise.all(
        (data || []).map(async (protocol) => {
          const { count } = await supabase
            .from('scheduled_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('protocol_id', protocol.id);

          return {
            ...protocol,
            scheduled_task_count: count || 0
          };
        })
      );

      setProtocols(protocolsWithCounts);

      // Update selected protocol with the new counts if it exists
      if (selectedProtocol && protocolsWithCounts) {
        const updatedSelected = protocolsWithCounts.find(p => p.id === selectedProtocol.id);
        if (updatedSelected) {
          setSelectedProtocol(updatedSelected);
        }
      } else if (protocolsWithCounts && protocolsWithCounts.length > 0 && !selectedProtocol) {
        setSelectedProtocol(protocolsWithCounts[0]);
      }
    } catch (error) {
      console.error('Error fetching protocols:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProtocolTasks = async (protocolId: string) => {
    try {
      const { data, error } = await supabase
        .from('protocol_tasks')
        .select('*')
        .eq('protocol_id', protocolId)
        .order('days_offset', { ascending: true });

      if (error) throw error;
      setProtocolTasks(data || []);
    } catch (error) {
      console.error('Error fetching protocol tasks:', error);
    }
  };

  const handleCreateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create a protocol');
        return;
      }

      const { data, error } = await supabase
        .from('protocols')
        .insert([{
          user_id: user.id,
          ...newProtocol
        }])
        .select()
        .single();

      if (error) throw error;

      setProtocols([data, ...protocols]);
      setSelectedProtocol(data);
      setNewProtocol({ name: '', description: '', trigger_event: 'farrowing', is_active: true });
      setShowNewProtocol(false);
    } catch (error) {
      console.error('Error creating protocol:', error);
      toast.error('Failed to create protocol');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProtocol) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create a task');
        return;
      }

      const { data, error } = await supabase
        .from('protocol_tasks')
        .insert([{
          user_id: user.id,
          ...newTask,
          protocol_id: selectedProtocol.id
        }])
        .select()
        .single();

      if (error) throw error;

      setProtocolTasks([...protocolTasks, data]);
      setNewTask({ task_name: '', description: '', days_offset: 0, is_required: true, task_order: 0 });
      setShowNewTask(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleDeleteTaskClick = (taskId: string, taskName: string) => {
    setConfirmDeleteTask({ show: true, taskId, taskName });
  };

  const confirmDeleteTaskAction = async () => {
    if (!confirmDeleteTask.taskId) return;

    const taskId = confirmDeleteTask.taskId;
    setConfirmDeleteTask({ show: false, taskId: null, taskName: '' });

    try {
      const { error } = await supabase
        .from('protocol_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      setProtocolTasks(protocolTasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleEditTask = (task: ProtocolTask) => {
    setEditingTaskId(task.id);
    setEditTask({
      task_name: task.task_name,
      description: task.description || '',
      days_offset: task.days_offset,
      is_required: task.is_required,
    });
  };

  const handleUpdateTask = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('protocol_tasks')
        .update(editTask)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      setProtocolTasks(protocolTasks.map(t => t.id === taskId ? data : t));
      setEditingTaskId(null);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTask({
      task_name: '',
      description: '',
      days_offset: 0,
      is_required: true,
    });
  };

  const handleToggleProtocol = async (protocol: Protocol) => {
    try {
      const { error } = await supabase
        .from('protocols')
        .update({ is_active: !protocol.is_active })
        .eq('id', protocol.id);

      if (error) throw error;

      setProtocols(protocols.map(p =>
        p.id === protocol.id ? { ...p, is_active: !p.is_active } : p
      ));
      if (selectedProtocol?.id === protocol.id) {
        setSelectedProtocol({ ...protocol, is_active: !protocol.is_active });
      }
    } catch (error) {
      console.error('Error toggling protocol:', error);
    }
  };

  const handleDeleteProtocolClick = (protocol: Protocol) => {
    setConfirmDeleteProtocol({ show: true, protocol });
  };

  const confirmDeleteProtocolAction = async () => {
    if (!confirmDeleteProtocol.protocol) return;

    const protocol = confirmDeleteProtocol.protocol;

    // Check if protocol has scheduled tasks BEFORE closing dialog
    if (protocol.scheduled_task_count && protocol.scheduled_task_count > 0) {
      setConfirmDeleteProtocol({ show: false, protocol: null });
      // Show error dialog
      setErrorDialog({
        show: true,
        title: 'Cannot Delete Protocol',
        message: `"${protocol.name}" has ${protocol.scheduled_task_count} scheduled task${protocol.scheduled_task_count !== 1 ? 's' : ''} and cannot be deleted.\n\nDeactivate the protocol instead to prevent it from being applied to new events.`
      });
      return;
    }

    setConfirmDeleteProtocol({ show: false, protocol: null });

    setDeletingProtocolId(protocol.id);
    try {
      // Delete protocol (cascade will delete tasks)
      const { error } = await supabase
        .from('protocols')
        .delete()
        .eq('id', protocol.id);

      if (error) throw error;

      // Update local state
      setProtocols(protocols.filter(p => p.id !== protocol.id));
      if (selectedProtocol?.id === protocol.id) {
        setSelectedProtocol(protocols[0] || null);
      }
    } catch (error) {
      console.error('Error deleting protocol:', error);
      toast.error('Failed to delete protocol');
    } finally {
      setDeletingProtocolId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Protocol Management</h1>
              <p className="text-sm text-muted-foreground">Create and manage automated task protocols</p>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Protocols List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Protocols</CardTitle>
                <Button size="sm" onClick={() => setShowNewProtocol(!showNewProtocol)}>
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showNewProtocol && (
                <form onSubmit={handleCreateProtocol} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div>
                    <Label>Protocol Name</Label>
                    <Input
                      value={newProtocol.name}
                      onChange={(e) => setNewProtocol({ ...newProtocol, name: e.target.value })}
                      placeholder="e.g., Standard Piglet Care"
                      required
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newProtocol.description}
                      onChange={(e) => setNewProtocol({ ...newProtocol, description: e.target.value })}
                      placeholder="What is this protocol for?"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Trigger Event</Label>
                    <Select
                      value={newProtocol.trigger_event}
                      onChange={(e) => setNewProtocol({ ...newProtocol, trigger_event: e.target.value })}
                    >
                      <option value="farrowing">Farrowing</option>
                      <option value="breeding">Breeding</option>
                      <option value="weaning">Weaning (Coming Soon)</option>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Farrowing and Breeding protocols auto-apply
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Create</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowNewProtocol(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {loading ? (
                  <p className="text-sm text-gray-500">Loading protocols...</p>
                ) : protocols.length === 0 ? (
                  <p className="text-sm text-gray-500">No protocols yet. Create one to get started!</p>
                ) : (
                  protocols.map((protocol) => (
                    <div
                      key={protocol.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedProtocol?.id === protocol.id
                          ? 'bg-red-100 border-2 border-red-600'
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedProtocol(protocol)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{protocol.name}</h3>
                          <p className="text-xs text-gray-500 capitalize">{protocol.trigger_event}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {protocol.is_active ? (
                            <CheckCircle className="h-4 w-4 text-red-700" />
                          ) : (
                            <span className="text-xs text-gray-400">Inactive</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Protocol Details & Tasks */}
          <Card className="lg:col-span-2">
            <CardHeader>
              {selectedProtocol ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle>{selectedProtocol.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={selectedProtocol.is_active ? "outline" : "default"}
                        onClick={() => handleToggleProtocol(selectedProtocol)}
                      >
                        {selectedProtocol.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" onClick={() => setShowNewTask(!showNewTask)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Task
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{selectedProtocol.description || 'No description provided'}</CardDescription>
                  <p className="text-xs text-gray-500 mt-2 capitalize">
                    Triggered by: {selectedProtocol.trigger_event} events
                  </p>
                </div>
              ) : (
                <div>
                  <CardTitle>Select a Protocol</CardTitle>
                  <CardDescription>Choose a protocol from the list to view and manage its tasks</CardDescription>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selectedProtocol && (
                <>
                  {showNewTask && (
                    <form onSubmit={handleCreateTask} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label>Task Name</Label>
                          <Input
                            value={newTask.task_name}
                            onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
                            placeholder="e.g., Iron Injection"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Description</Label>
                          <Textarea
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            placeholder="Additional instructions..."
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Days After Event</Label>
                          <Input
                            type="number"
                            value={newTask.days_offset}
                            onChange={(e) => setNewTask({ ...newTask, days_offset: parseInt(e.target.value) || 0 })}
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <Label>Required?</Label>
                          <Select
                            value={newTask.is_required.toString()}
                            onChange={(e) => setNewTask({ ...newTask, is_required: e.target.value === 'true' })}
                          >
                            <option value="true">Required</option>
                            <option value="false">Optional</option>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">Add Task</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setShowNewTask(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    <h3 className="font-medium text-sm text-gray-700">Protocol Tasks</h3>
                    {protocolTasks.length === 0 ? (
                      <p className="text-sm text-gray-500">No tasks yet. Add tasks to define what should be done.</p>
                    ) : (
                      protocolTasks.map((task) => (
                        <div key={task.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                          {editingTaskId === task.id ? (
                            // Edit Form
                            <div className="space-y-3">
                              <div>
                                <Label>Task Name</Label>
                                <Input
                                  value={editTask.task_name}
                                  onChange={(e) => setEditTask({ ...editTask, task_name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Description</Label>
                                <Textarea
                                  value={editTask.description}
                                  onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                                  rows={2}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>Days After Event</Label>
                                  <Input
                                    type="number"
                                    value={editTask.days_offset}
                                    onChange={(e) => setEditTask({ ...editTask, days_offset: parseInt(e.target.value) || 0 })}
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <Label>Required?</Label>
                                  <Select
                                    value={editTask.is_required.toString()}
                                    onChange={(e) => setEditTask({ ...editTask, is_required: e.target.value === 'true' })}
                                  >
                                    <option value="true">Required</option>
                                    <option value="false">Optional</option>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleUpdateTask(task.id)}>
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // Display View
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{task.task_name}</h4>
                                  {!task.is_required && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Optional</span>
                                  )}
                                </div>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Calendar className="h-4 w-4" />
                                  <span>Day {task.days_offset} after {selectedProtocol.trigger_event}</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditTask(task)}
                                >
                                  <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteTaskClick(task.id, task.task_name)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Delete Protocol Button */}
                  <div className="mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProtocolClick(selectedProtocol)}
                      disabled={deletingProtocolId === selectedProtocol.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deletingProtocolId === selectedProtocol.id ? 'Deleting...' : 'Delete Protocol'}
                    </Button>
                    {selectedProtocol.scheduled_task_count !== undefined && selectedProtocol.scheduled_task_count > 0 && (
                      <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        This protocol has {selectedProtocol.scheduled_task_count} scheduled task{selectedProtocol.scheduled_task_count !== 1 ? 's' : ''} and cannot be deleted. Deactivate it instead.
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Delete Protocol Confirmation Dialog */}
      {confirmDeleteProtocol.show && confirmDeleteProtocol.protocol && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-semibold">{farmName}</h3>
              </div>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-700 text-base">
                Delete protocol <span className="font-bold text-red-700">&ldquo;{confirmDeleteProtocol.protocol.name}&rdquo;</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently delete the protocol and all its tasks.
              </p>
              {confirmDeleteProtocol.protocol.scheduled_task_count !== undefined && confirmDeleteProtocol.protocol.scheduled_task_count > 0 && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800 font-medium">
                    Warning: This protocol has {confirmDeleteProtocol.protocol.scheduled_task_count} scheduled task{confirmDeleteProtocol.protocol.scheduled_task_count !== 1 ? 's' : ''} and cannot be deleted.
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteProtocol({ show: false, protocol: null })}
                className="min-w-24"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteProtocolAction}
                className="min-w-24 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Dialog */}
      {confirmDeleteTask.show && confirmDeleteTask.taskId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-semibold">{farmName}</h3>
              </div>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-700 text-base">
                Delete task <span className="font-bold text-red-700">&ldquo;{confirmDeleteTask.taskName}&rdquo;</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently remove this task from the protocol.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteTask({ show: false, taskId: null, taskName: '' })}
                className="min-w-24"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteTaskAction}
                className="min-w-24 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Dialog */}
      {errorDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-semibold">{errorDialog.title}</h3>
              </div>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-700 text-base whitespace-pre-line">
                {errorDialog.message}
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
              <Button
                onClick={() => setErrorDialog({ show: false, title: '', message: '' })}
                className="min-w-24 bg-red-700 hover:bg-red-800"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
