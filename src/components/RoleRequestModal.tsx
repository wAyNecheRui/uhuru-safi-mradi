import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleService, type AppRole } from '@/services/RoleService';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

interface RoleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RoleRequestModal = ({ isOpen, onClose, onSuccess }: RoleRequestModalProps) => {
  const [requestedRole, setRequestedRole] = useState<AppRole>('contractor');
  const [justification, setJustification] = useState('');
  const [documents, setDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!justification.trim()) {
      toast.error('Please provide a justification for your role request');
      return;
    }

    setLoading(true);
    try {
      const result = await RoleService.requestRoleUpgrade(
        requestedRole,
        justification,
        documents.length > 0 ? documents : undefined
      );

      if (result.success) {
        toast.success('Role upgrade request submitted successfully! An administrator will review your request.');
        setJustification('');
        setDocuments([]);
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || 'Failed to submit role request');
      }
    } catch (error) {
      console.error('Error submitting role request:', error);
      toast.error('An error occurred while submitting your request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90dvh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="pr-8">Request Role Upgrade</DialogTitle>
          <DialogDescription className="pr-8">
            Request access to additional roles. Your request will be reviewed by an administrator.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Requested Role</Label>
            <Select value={requestedRole} onValueChange={(value) => setRequestedRole(value as AppRole)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="government">Government Official</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {requestedRole === 'contractor' 
                ? 'Contractors can bid on projects and manage construction work.'
                : 'Government officials can approve projects, manage payments, and verify contractors.'}
            </p>
          </div>

          {/* Justification */}
          <div className="space-y-2">
            <Label htmlFor="justification">Justification *</Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder={
                requestedRole === 'contractor'
                  ? 'Explain your experience, qualifications, and why you should be approved as a contractor...'
                  : 'Provide your government department, position, and employee number...'
              }
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <Label>Supporting Documents (Optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Upload supporting documents (Coming soon)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                KRA PIN, Business permits, ID copies, etc.
              </p>
            </div>
          </div>

          {/* Requirements Info */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Requirements:</h4>
            {requestedRole === 'contractor' ? (
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Valid KRA PIN</li>
                <li>Business registration certificate</li>
                <li>Tax compliance certificate</li>
                <li>Professional qualifications or experience</li>
              </ul>
            ) : (
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Valid government employee ID</li>
                <li>Department confirmation letter</li>
                <li>Official email address</li>
                <li>Supervisor contact details</li>
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
