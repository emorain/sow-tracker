'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Bug, Lightbulb, Sparkles, MessageSquare } from 'lucide-react';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEEDBACK_TYPES = [
  {
    value: 'bug' as FeedbackType,
    label: 'Bug Report',
    icon: Bug,
    description: 'Something is broken or not working correctly',
    color: 'text-red-600 bg-red-50 border-red-200'
  },
  {
    value: 'feature' as FeedbackType,
    label: 'Feature Request',
    icon: Lightbulb,
    description: 'Suggest a new feature or capability',
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    value: 'improvement' as FeedbackType,
    label: 'Improvement',
    icon: Sparkles,
    description: 'Suggest an enhancement to existing functionality',
    color: 'text-purple-600 bg-purple-50 border-purple-200'
  },
  {
    value: 'other' as FeedbackType,
    label: 'Other',
    icon: MessageSquare,
    description: 'General feedback or questions',
    color: 'text-gray-600 bg-gray-50 border-gray-200'
  }
];

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to submit feedback');
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      // Get current organization
      const savedOrgId = localStorage.getItem('selectedOrganizationId');

      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        organization_id: savedOrgId,
        type,
        title: title.trim(),
        description: description.trim(),
        page_url: window.location.href
      });

      if (error) throw error;

      toast.success('Feedback submitted successfully! Thank you for your input.');
      setTitle('');
      setDescription('');
      setType('bug');
      onClose();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve by reporting bugs, suggesting features, or sharing your thoughts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Feedback Type Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">What type of feedback?</Label>
              <div className="grid grid-cols-2 gap-3">
                {FEEDBACK_TYPES.map((feedbackType) => {
                  const Icon = feedbackType.icon;
                  const isSelected = type === feedbackType.value;

                  return (
                    <button
                      key={feedbackType.value}
                      type="button"
                      onClick={() => setType(feedbackType.value)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? feedbackType.color + ' border-current'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? '' : 'text-gray-400'}`} />
                        <div>
                          <div className={`font-medium ${isSelected ? '' : 'text-gray-900'}`}>
                            {feedbackType.label}
                          </div>
                          <div className={`text-xs mt-0.5 ${isSelected ? 'opacity-75' : 'text-gray-500'}`}>
                            {feedbackType.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="feedback-title" className="text-sm font-medium mb-2 block">
                Title <span className="text-red-500">*</span>
              </Label>
              <input
                id="feedback-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === 'bug'
                    ? 'e.g., Cannot save breeding records'
                    : type === 'feature'
                    ? 'e.g., Add export to Excel feature'
                    : 'Brief summary of your feedback'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="feedback-description" className="text-sm font-medium mb-2 block">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="feedback-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === 'bug'
                    ? 'Please describe what happened, what you expected, and steps to reproduce the issue...'
                    : type === 'feature'
                    ? 'Please describe the feature you would like to see and how it would help you...'
                    : 'Please provide as much detail as possible...'
                }
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Current page: {typeof window !== 'undefined' ? window.location.pathname : ''}
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
