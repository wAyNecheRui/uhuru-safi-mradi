import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, Clock, FileText, User } from 'lucide-react';
import { RoleService, type VerificationRequest } from '@/services/RoleService';
import { VerificationStatusBadge } from '@/components/VerificationStatusBadge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const GovernmentVerificationRequests = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await RoleService.getPendingVerificationRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      const result = await RoleService.approveVerificationRequest(
        selectedRequest.id,
        reviewNotes
      );

      if (result.success) {
        toast.success('Request approved successfully');
        setSelectedRequest(null);
        setReviewNotes('');
        loadRequests();
      } else {
        toast.error(result.error || 'Failed to approve request');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !reviewNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const result = await RoleService.rejectVerificationRequest(
        selectedRequest.id,
        reviewNotes
      );

      if (result.success) {
        toast.success('Request rejected');
        setSelectedRequest(null);
        setReviewNotes('');
        loadRequests();
      } else {
        toast.error(result.error || 'Failed to reject request');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'contractor':
        return 'bg-blue-500';
      case 'government':
        return 'bg-purple-500';
      case 'admin':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading verification requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Verification Requests
        </h1>
        <p className="text-muted-foreground">
          Review and approve role verification requests from users
        </p>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground text-center">
                There are no pending verification requests at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-3">
                      <User className="h-5 w-5" />
                      <span className="capitalize">
                        {request.requested_role} Role Request
                      </span>
                      <Badge className={getRoleBadgeColor(request.requested_role)}>
                        {request.requested_role}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Submitted {new Date(request.created_at).toLocaleDateString()} at{' '}
                      {new Date(request.created_at).toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  <VerificationStatusBadge status={request.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.justification && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">
                      Justification:
                    </Label>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">{request.justification}</p>
                    </div>
                  </div>
                )}

                {request.supporting_documents && request.supporting_documents.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">
                      Supporting Documents:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {request.supporting_documents.map((doc, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Document {index + 1}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedRequest(request);
                      setReviewNotes('');
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedRequest(request);
                      setReviewNotes('');
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Review {selectedRequest?.requested_role} Role Request
            </DialogTitle>
            <DialogDescription>
              Provide notes for this verification decision
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="review_notes">Review Notes</Label>
              <Textarea
                id="review_notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter your review notes..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedRequest(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GovernmentVerificationRequests;
