'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ClipboardList, Plus, Edit, Trash2, Calendar, CheckCircle } from "lucide-react";
import { supabase } from '@/lib/supabase';

interface Protocol {
  id: string;
  name: string;
  description: string;
  trigger_event: string;
  is_active: boolean;
  created_at: string;
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
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [protocolTasks, setProtocolTasks] = useState<ProtocolTask[]>([]);
  const [showNewProtocol, setShowNewProtocol] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchProtocols();
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
      setProtocols(data || []);
      if (data && data.length > 0 && !selectedProtocol) {
        setSelectedProtocol(data[0]);
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
      const { data, error } = await supabase
        .from('protocols')
        .insert([newProtocol])
        .select()
        .single();

      if (error) throw error;

      setProtocols([data, ...protocols]);
      setSelectedProtocol(data);
      setNewProtocol({ name: '', description: '', trigger_event: 'farrowing', is_active: true });
      setShowNewProtocol(false);
    } catch (error) {
      console.error('Error creating protocol:', error);
      alert('Failed to create protocol');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProtocol) return;

    try {
      const { data, error } = await supabase
        .from('protocol_tasks')
        .insert([{
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
      alert('Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('protocol_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      setProtocolTasks(protocolTasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Protocol Management</h1>
          <p className="text-gray-600">Create and manage automated task protocols for farm events</p>
        </div>

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
                      <option value="weaning">Weaning</option>
                      <option value="custom">Custom</option>
                    </Select>
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
                          ? 'bg-green-100 border-2 border-green-500'
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
                            <CheckCircle className="h-4 w-4 text-green-600" />
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
