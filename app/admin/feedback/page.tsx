'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Bug, Lightbulb, Sparkles, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type Feedback = {
  id: string;
  user_id: string;
  organization_id: string | null;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  title: string;
  description: string;
  page_url: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

const TYPE_ICONS = {
  bug: Bug,
  feature: Lightbulb,
  improvement: Sparkles,
  other: MessageSquare
};

const TYPE_COLORS = {
  bug: 'text-red-600 bg-red-50',
  feature: 'text-blue-600 bg-blue-50',
  improvement: 'text-purple-600 bg-purple-50',
  other: 'text-gray-600 bg-gray-50'
};

const STATUS_COLORS = {
  open: 'text-orange-700 bg-orange-50',
  in_progress: 'text-blue-700 bg-blue-50',
  resolved: 'text-green-700 bg-green-50',
  closed: 'text-gray-700 bg-gray-50'
};

const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-50',
  medium: 'text-blue-600 bg-blue-50',
  high: 'text-orange-600 bg-orange-50',
  urgent: 'text-red-600 bg-red-50'
};

export default function AdminFeedbackPage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Restrict access to developer only
  useEffect(() => {
    if (user) {
      const authorized = user.email === 'emorain@gmail.com';
      setIsAuthorized(authorized);
      if (authorized) {
        fetchFeedback();
      }
    }
  }, [user, filter]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedback(data || []);
    } catch (error: any) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status: newStatus })
        .eq('id', feedbackId);

      if (error) throw error;

      toast.success('Status updated');
      fetchFeedback();
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback({ ...selectedFeedback, status: newStatus as any });
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const updatePriority = async (feedbackId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ priority: newPriority })
        .eq('id', feedbackId);

      if (error) throw error;

      toast.success('Priority updated');
      fetchFeedback();
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback({ ...selectedFeedback, priority: newPriority as any });
      }
    } catch (error: any) {
      console.error('Error updating priority:', error);
      toast.error('Failed to update priority');
    }
  };

  const stats = {
    total: feedback.length,
    open: feedback.filter(f => f.status === 'open').length,
    inProgress: feedback.filter(f => f.status === 'in_progress').length,
    resolved: feedback.filter(f => f.status === 'resolved').length
  };

  // Show access denied if not authorized
  if (!loading && !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              This page is restricted to developer access only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              You do not have permission to view this page.
            </p>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-red-700" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
                <p className="text-sm text-gray-600">User feedback, bug reports, and feature requests</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Open</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{stats.open}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'open' ? 'default' : 'outline'}
            onClick={() => setFilter('open')}
          >
            Open ({stats.open})
          </Button>
          <Button
            variant={filter === 'in_progress' ? 'default' : 'outline'}
            onClick={() => setFilter('in_progress')}
          >
            In Progress ({stats.inProgress})
          </Button>
          <Button
            variant={filter === 'resolved' ? 'default' : 'outline'}
            onClick={() => setFilter('resolved')}
          >
            Resolved ({stats.resolved})
          </Button>
        </div>

        {/* Feedback List */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback Submissions</CardTitle>
            <CardDescription>
              Click on any item to view details and manage status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading feedback...</div>
            ) : feedback.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h3>
                <p className="text-gray-600">
                  When users submit feedback, it will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedback.map((item) => {
                  const TypeIcon = TYPE_ICONS[item.type];

                  return (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedFeedback(item)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${TYPE_COLORS[item.type]}`}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                              {item.page_url && (
                                <>
                                  <span>•</span>
                                  <span>{new URL(item.page_url).pathname}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
                            {item.priority}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Modal */}
        {selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${TYPE_COLORS[selectedFeedback.type]}`}>
                      {(() => {
                        const Icon = TYPE_ICONS[selectedFeedback.type];
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedFeedback.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Submitted {new Date(selectedFeedback.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
                    Close
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedFeedback.description}</p>
                  </div>

                  {selectedFeedback.page_url && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Page URL</label>
                      <p className="mt-1 text-sm text-gray-600">{selectedFeedback.page_url}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Status</label>
                      <select
                        value={selectedFeedback.status}
                        onChange={(e) => updateStatus(selectedFeedback.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Priority</label>
                      <select
                        value={selectedFeedback.priority}
                        onChange={(e) => updatePriority(selectedFeedback.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
