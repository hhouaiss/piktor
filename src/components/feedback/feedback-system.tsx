"use client";

import { useState } from "react";
import { MessageSquare, Star, ThumbsUp, ThumbsDown, AlertTriangle, Lightbulb, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeedbackData {
  id?: string;
  type: 'rating' | 'bug_report' | 'feature_request' | 'general';
  rating?: number;
  message: string;
  context?: {
    page: string;
    action?: string;
    imageId?: string;
    generationSettings?: Record<string, unknown>;
  };
  userEmail?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'reviewed' | 'implemented' | 'dismissed';
  timestamp: string;
}

interface QuickFeedbackProps {
  context?: {
    page: string;
    action?: string;
    imageId?: string;
  };
  onSubmit?: (feedback: FeedbackData) => void;
  className?: string;
}

export function QuickFeedback({ context, onSubmit, className = "" }: QuickFeedbackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackData['type']>('general');
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickFeedback = async (type: 'positive' | 'negative') => {
    const feedback: FeedbackData = {
      type: 'rating',
      rating: type === 'positive' ? 5 : 2,
      message: type === 'positive' ? 'Positive feedback' : 'Negative feedback',
      context: context || { page: 'unknown' },
      priority: type === 'negative' ? 'medium' : 'low',
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    await submitFeedback(feedback);
  };

  const handleDetailedFeedback = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);
    
    const feedback: FeedbackData = {
      type: feedbackType,
      rating: feedbackType === 'rating' ? rating : undefined,
      message: message.trim(),
      context: context || { page: 'unknown' },
      userEmail: email.trim() || undefined,
      priority: feedbackType === 'bug_report' ? 'high' : 'medium',
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    await submitFeedback(feedback);
    
    // Reset form
    setMessage('');
    setEmail('');
    setRating(0);
    setIsOpen(false);
    setIsSubmitting(false);
  };

  const submitFeedback = async (feedback: FeedbackData) => {
    try {
      // In production, this would send to your feedback API
      console.log('Submitting feedback:', feedback);
      
      // Call the onSubmit callback if provided
      onSubmit?.(feedback);
      
      // Show success message
      // You could use a toast notification here
      alert('Thank you for your feedback!');
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  const feedbackTypes = [
    { id: 'rating', label: 'Rating', icon: Star, description: 'Rate your experience' },
    { id: 'bug_report', label: 'Bug Report', icon: AlertTriangle, description: 'Report an issue' },
    { id: 'feature_request', label: 'Feature Request', icon: Lightbulb, description: 'Suggest an improvement' },
    { id: 'general', label: 'General Feedback', icon: MessageSquare, description: 'Share your thoughts' }
  ];

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {/* Quick Feedback Buttons */}
      <div className="flex gap-2 mb-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickFeedback('positive')}
          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
        >
          <ThumbsUp className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickFeedback('negative')}
          className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
        >
          <ThumbsDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Detailed Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
            <MessageSquare className="w-4 h-4 mr-2" />
            Feedback
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Feedback</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Feedback Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">What type of feedback?</label>
              <div className="grid grid-cols-2 gap-2">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setFeedbackType(type.id as FeedbackData['type'])}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-colors",
                        feedbackType === type.id 
                          ? "border-blue-500 bg-blue-50 text-blue-900" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <div className="text-sm font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rating (if rating feedback) */}
            {feedbackType === 'rating' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">How would you rate your experience?</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={cn(
                        "p-1 transition-colors",
                        star <= rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"
                      )}
                    >
                      <Star className={cn("w-6 h-6", star <= rating && "fill-current")} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {feedbackType === 'bug_report' ? 'Describe the issue' :
                 feedbackType === 'feature_request' ? 'Describe your idea' :
                 'Your message'}
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  feedbackType === 'bug_report' ? 'What happened? What did you expect to happen?' :
                  feedbackType === 'feature_request' ? 'What feature would you like to see? How would it help you?' :
                  'Tell us what you think...'
                }
                rows={4}
              />
            </div>

            {/* Email (optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll only use this to follow up on your feedback
              </p>
            </div>

            {/* Context Info */}
            {context && (
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                <strong>Context:</strong> {context.page}
                {context.action && ` • ${context.action}`}
                {context.imageId && ` • Image: ${context.imageId.slice(0, 8)}...`}
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDetailedFeedback}
                disabled={!message.trim() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Feedback Management Dashboard Component
interface FeedbackDashboardProps {
  feedback: FeedbackData[];
  onStatusChange?: (id: string, status: FeedbackData['status']) => void;
  className?: string;
}

export function FeedbackDashboard({ feedback, onStatusChange, className = "" }: FeedbackDashboardProps) {
  const [filter, setFilter] = useState<'all' | FeedbackData['type'] | FeedbackData['status']>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'rating'>('date');

  const filteredFeedback = feedback
    .filter(item => filter === 'all' || item.type === filter || item.status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorities = { high: 3, medium: 2, low: 1 };
          return priorities[b.priority] - priorities[a.priority];
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });

  const getStatusColor = (status: FeedbackData['status']) => {
    switch (status) {
      case 'implemented': return 'bg-green-100 text-green-700';
      case 'reviewed': return 'bg-blue-100 text-blue-700';
      case 'dismissed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getPriorityColor = (priority: FeedbackData['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header and Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feedback Dashboard</h2>
          <p className="text-muted-foreground">{feedback.length} total feedback items</p>
        </div>
        
        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All Feedback</option>
            <optgroup label="By Type">
              <option value="rating">Ratings</option>
              <option value="bug_report">Bug Reports</option>
              <option value="feature_request">Feature Requests</option>
              <option value="general">General</option>
            </optgroup>
            <optgroup label="By Status">
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="implemented">Implemented</option>
              <option value="dismissed">Dismissed</option>
            </optgroup>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="date">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="rating">Sort by Rating</option>
          </select>
        </div>
      </div>

      {/* Feedback Items */}
      <div className="space-y-4">
        {filteredFeedback.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.type.replace('_', ' ')}</Badge>
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority} priority
                  </Badge>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                  {item.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{item.rating}/5</span>
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {new Date(item.timestamp).toLocaleDateString()}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm mb-3">{item.message}</p>
              
              {item.context && (
                <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted rounded">
                  <strong>Context:</strong> {item.context.page}
                  {item.context.action && ` • ${item.context.action}`}
                  {item.context.imageId && ` • Image: ${item.context.imageId}`}
                </div>
              )}
              
              {item.userEmail && (
                <div className="text-xs text-muted-foreground mb-3">
                  <strong>Contact:</strong> {item.userEmail}
                </div>
              )}
              
              {onStatusChange && (
                <div className="flex gap-2">
                  {(['reviewed', 'implemented', 'dismissed'] as const).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={item.status === status ? "default" : "outline"}
                      onClick={() => item.id && onStatusChange(item.id, status)}
                    >
                      Mark as {status}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {filteredFeedback.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No feedback items match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}