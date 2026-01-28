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
    const total = getTotalPercentage();
    if (total !== 100) {
      toast({
        title: "Invalid Percentages",
        description: `Total payment percentage must equal 100%. Current: ${total}%`,
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Delete existing milestones
      await supabase
        .from('project_milestones')
        .delete()
        .eq('project_id', project.id);

      // Insert new milestones
      const milestonesToInsert = milestones.map(m => ({
        project_id: project.id,
        title: m.title,
        description: m.description,
        payment_percentage: m.payment_percentage,
        milestone_number: m.milestone_number,
        target_completion_date: m.target_completion_date || null,
        completion_criteria: m.completion_criteria,
        status: 'pending'
      }));

      const { error } = await supabase
        .from('project_milestones')
        .insert(milestonesToInsert);

      if (error) throw error;

      toast({
        title: "Milestones Saved",
        description: `${milestones.length} milestones have been configured for this project.`
      });

      onSaved();
    } catch (error) {
      console.error('Error saving milestones:', error);
      toast({
        title: "Error",
        description: "Failed to save milestones",
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
          {milestones.map((milestone, index) => (
            <Card key={index} className="shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <Badge variant="outline" className="text-primary text-xs">
                    #{milestone.milestone_number}
                  </Badge>
                  {milestones.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMilestone(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Title - Full width */}
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm">Title</Label>
                    <Input
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                      placeholder="e.g., Site Preparation & Mobilization"
                      className="text-sm"
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
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
