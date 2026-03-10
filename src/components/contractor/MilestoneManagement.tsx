import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, Trash2, CheckCircle, Clock, DollarSign, 
  Loader2, Calendar, Target, Save, AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Milestone {
  id?: string;
  title: string;
  description: string;
  payment_percentage: number;
  milestone_number: number;
  target_completion_date: string;
  completion_criteria: string;
  status?: string;
}

interface Project {
  id: string;
  title: string;
  budget: number | null;
  contractor_id: string | null;
}

interface MilestoneManagementProps {
  project: Project;
  onClose: () => void;
  onSaved: () => void;
}

const MilestoneManagement: React.FC<MilestoneManagementProps> = ({ project, onClose, onSaved }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMilestones();
  }, [project.id]);

  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', project.id)
        .order('milestone_number', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setMilestones(data.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          payment_percentage: m.payment_percentage,
          milestone_number: m.milestone_number,
          target_completion_date: m.target_completion_date?.split('T')[0] || '',
          completion_criteria: m.completion_criteria || '',
          status: m.status
        })));
      } else {
        // Initialize with empty milestone - contractor fills in details
        setMilestones([
          { title: '', description: '', payment_percentage: 0, milestone_number: 1, target_completion_date: '', completion_criteria: '' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast({
        title: "Error",
        description: "Failed to load milestones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addMilestone = () => {
    const newNumber = milestones.length + 1;
    setMilestones([...milestones, {
      title: `Milestone ${newNumber}`,
      description: '',
      payment_percentage: 0,
      milestone_number: newNumber,
      target_completion_date: '',
      completion_criteria: ''
    }]);
  };

  const removeMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index)
      .map((m, i) => ({ ...m, milestone_number: i + 1 }));
    setMilestones(updated);
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string | number) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const getTotalPercentage = () => {
    return milestones.reduce((sum, m) => sum + (m.payment_percentage || 0), 0);
  };

  const saveMilestones = async () => {
    // Pre-check: verify project status and contractor assignment
    const { data: { user } } = await supabase.auth.getUser();
    const { data: projectData } = await supabase
      .from('projects')
      .select('status, contractor_id')
      .eq('id', project.id)
      .single();
    
    if (projectData?.status === 'completed' || projectData?.status === 'cancelled') {
      toast({
        title: "Project Completed",
        description: "No changes can be made to a completed project.",
        variant: "destructive"
      });
      return;
    }

    if (projectData?.contractor_id !== user?.id) {
      toast({
        title: "Not Assigned",
        description: "You can only configure milestones for projects assigned to you.",
        variant: "destructive"
      });
      return;
    }

    const total = getTotalPercentage();
    if (total !== 100) {
      toast({
        title: "Invalid Percentages",
        description: `Total payment percentage must equal 100%. Current: ${total}%`,
        variant: "destructive"
      });
      return;
    }

    // Validate all milestones have titles
    const emptyTitles = milestones.filter(m => !m.title.trim());
    if (emptyTitles.length > 0) {
      toast({
        title: "Missing Titles",
        description: "All milestones must have a title.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Separate existing milestones (with IDs) from new ones
      const existingMilestones = milestones.filter(m => m.id);
      const newMilestones = milestones.filter(m => !m.id);

      // Get current milestone IDs in database
      const { data: currentDbMilestones, error: fetchError } = await supabase
        .from('project_milestones')
        .select('id, status')
        .eq('project_id', project.id);

      if (fetchError) {
        console.error('Error fetching current milestones:', fetchError);
        throw new Error('Failed to fetch current milestones');
      }

      // Check if trying to DELETE or MODIFY milestones that have progressed beyond 'pending' status
      const nonPendingDbMilestones = currentDbMilestones?.filter(m => m.status !== 'pending') || [];
      const nonPendingIds = nonPendingDbMilestones.map(m => m.id);
      
      // Check if any non-pending milestones are being modified or deleted
      const existingIds = existingMilestones.map(m => m.id);
      const attemptingToDeleteNonPending = nonPendingIds.some(id => !existingIds.includes(id));
      
      if (attemptingToDeleteNonPending) {
        toast({
          title: "Cannot Delete Progressed Milestones",
          description: "Milestones that have been submitted, verified, or paid cannot be deleted.",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }
      
      // Check if trying to modify non-pending milestones
      for (const milestone of existingMilestones) {
        if (nonPendingIds.includes(milestone.id)) {
          const dbMilestone = currentDbMilestones?.find(m => m.id === milestone.id);
          if (dbMilestone) {
            // Allow viewing but show warning - we'll skip updates for non-pending
            console.log(`Milestone ${milestone.id} has status ${dbMilestone.status}, skipping update`);
          }
        }
      }

      // Find milestones to delete (in DB but not in current list) - only pending ones
      const currentMilestoneIds = existingMilestones.map(m => m.id);
      const milestonesToDelete = currentDbMilestones?.filter(m => 
        !currentMilestoneIds.includes(m.id) && m.status === 'pending'
      ) || [];

      // Delete removed milestones (only pending ones)
      if (milestonesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('project_milestones')
          .delete()
          .in('id', milestonesToDelete.map(m => m.id));

        if (deleteError) {
          console.error('Error deleting milestones:', deleteError);
          throw new Error(`Failed to delete milestones: ${deleteError.message}`);
        }
      }

      // Update existing milestones - only update pending ones
      for (const milestone of existingMilestones) {
        // Skip non-pending milestones - they cannot be modified
        if (nonPendingIds.includes(milestone.id)) {
          console.log(`Skipping update for non-pending milestone ${milestone.id}`);
          continue;
        }
        
        const { error: updateError } = await supabase
          .from('project_milestones')
          .update({
            title: milestone.title,
            description: milestone.description,
            payment_percentage: milestone.payment_percentage,
            milestone_number: milestone.milestone_number,
            target_completion_date: milestone.target_completion_date || null,
            completion_criteria: milestone.completion_criteria,
          })
          .eq('id', milestone.id);

        if (updateError) {
          console.error('Error updating milestone:', updateError);
          throw new Error(`Failed to update milestone: ${updateError.message}`);
        }
      }

      // Insert new milestones
      if (newMilestones.length > 0) {
        const milestonesToInsert = newMilestones.map(m => ({
          project_id: project.id,
          title: m.title,
          description: m.description,
          payment_percentage: m.payment_percentage,
          milestone_number: m.milestone_number,
          target_completion_date: m.target_completion_date || null,
          completion_criteria: m.completion_criteria,
          status: 'pending'
        }));

        const { error: insertError } = await supabase
          .from('project_milestones')
          .insert(milestonesToInsert);

        if (insertError) {
          console.error('Error inserting milestones:', insertError);
          throw new Error(`Failed to insert milestones: ${insertError.message}`);
        }
      }

      toast({
        title: "Milestones Saved",
        description: `${milestones.length} milestones have been configured for this project.`
      });

      onSaved();
    } catch (error: any) {
      console.error('Error saving milestones:', error);
      toast({
        title: "Failed to Save Milestones",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DialogContent>
    );
  }

  const totalPercentage = getTotalPercentage();
  const isValid = totalPercentage === 100;

  return (
    <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-4xl max-h-[90dvh] flex flex-col">
      <DialogHeader className="flex-shrink-0">
        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg pr-8">
          <Target className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="truncate">Configure Milestones</span>
        </DialogTitle>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">
          {project.title} - {formatCurrency(project.budget || 0)}
        </p>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 py-2 pr-1">
        {/* Percentage Progress */}
        <Card className={`${isValid ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' : 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800'}`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm sm:text-base">Total Allocation</span>
              <span className={`font-bold text-sm sm:text-base ${isValid ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}>
                {totalPercentage}%
              </span>
            </div>
            <Progress value={Math.min(totalPercentage, 100)} className="h-2 sm:h-3" />
            {!isValid && (
              <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-400 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Must total 100%</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Milestones List */}
        <div className="space-y-3">
          {milestones.map((milestone, index) => {
            const isLocked = milestone.status && milestone.status !== 'pending';
            return (
            <Card key={index} className={`shadow-sm ${isLocked ? 'bg-muted/50 border-muted' : ''}`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-primary text-xs">
                      #{milestone.milestone_number}
                    </Badge>
                    {isLocked && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {milestone.status}
                      </Badge>
                    )}
                  </div>
                  {milestones.length > 1 && !isLocked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMilestone(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {isLocked && (
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      This milestone has been {milestone.status} and cannot be edited.
                    </p>
                  )}
                  {/* Title - Full width */}
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm">Title</Label>
                    <Input
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                      placeholder="e.g., Site Preparation & Mobilization"
                      className="text-sm"
                      disabled={isLocked}
                    />
                  </div>

                  {/* Payment & Date - Two columns on larger screens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm">Payment %</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={milestone.payment_percentage}
                          onChange={(e) => updateMilestone(index, 'payment_percentage', parseInt(e.target.value) || 0)}
                          className="text-sm w-20"
                          disabled={isLocked}
                        />
                        <span className="text-xs text-muted-foreground truncate">
                          = {formatCurrency((project.budget || 0) * (milestone.payment_percentage / 100))}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm">Target Date</Label>
                      <Input
                        type="date"
                        value={milestone.target_completion_date}
                        onChange={(e) => updateMilestone(index, 'target_completion_date', e.target.value)}
                        className="text-sm"
                        disabled={isLocked}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm">Description</Label>
                    <Input
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                      placeholder="e.g., Initial setup, material delivery, and groundwork"
                      className="text-sm"
                      disabled={isLocked}
                    />
                  </div>

                  {/* Criteria */}
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm">Completion Criteria</Label>
                    <Textarea
                      value={milestone.completion_criteria}
                      onChange={(e) => updateMilestone(index, 'completion_criteria', e.target.value)}
                      placeholder="e.g., Site cleared and secured, all materials delivered and verified, foundation excavation complete"
                      rows={2}
                      className="text-sm resize-none"
                      disabled={isLocked}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>

        <Button onClick={addMilestone} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      <DialogFooter className="flex-shrink-0 pt-4 border-t gap-2 sm:gap-0">
        <Button variant="outline" onClick={onClose} size="sm" className="flex-1 sm:flex-none">
          Cancel
        </Button>
        <Button 
          onClick={saveMilestones} 
          disabled={saving || !isValid}
          className="bg-primary flex-1 sm:flex-none"
          size="sm"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default MilestoneManagement;
