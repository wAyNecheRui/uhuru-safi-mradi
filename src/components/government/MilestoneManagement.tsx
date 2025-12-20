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
        // Initialize with default milestone structure
        setMilestones([
          { title: 'Mobilization & Site Preparation', description: 'Initial setup and preparation', payment_percentage: 20, milestone_number: 1, target_completion_date: '', completion_criteria: 'Site cleared and secured, materials delivered' },
          { title: 'Foundation & Structure', description: 'Core construction work', payment_percentage: 30, milestone_number: 2, target_completion_date: '', completion_criteria: 'Foundation complete, structural work done' },
          { title: 'Main Works Completion', description: 'Primary construction completed', payment_percentage: 30, milestone_number: 3, target_completion_date: '', completion_criteria: 'All main construction work finished' },
          { title: 'Final Inspection & Handover', description: 'Final quality check and handover', payment_percentage: 20, milestone_number: 4, target_completion_date: '', completion_criteria: 'All quality checks passed, documentation complete' }
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
      <DialogContent className="max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DialogContent>
    );
  }

  const totalPercentage = getTotalPercentage();
  const isValid = totalPercentage === 100;

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Configure Project Milestones
        </DialogTitle>
        <p className="text-sm text-muted-foreground">
          {project.title} - Budget: {formatCurrency(project.budget || 0)}
        </p>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Percentage Progress */}
        <Card className={`${isValid ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Total Payment Allocation</span>
              <span className={`font-bold ${isValid ? 'text-green-700' : 'text-orange-700'}`}>
                {totalPercentage}%
              </span>
            </div>
            <Progress value={Math.min(totalPercentage, 100)} className="h-3" />
            {!isValid && (
              <p className="text-sm text-orange-700 mt-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Percentages must total exactly 100%
              </p>
            )}
          </CardContent>
        </Card>

        {/* Milestones List */}
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <Card key={index} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="outline" className="text-primary">
                    Milestone {milestone.milestone_number}
                  </Badge>
                  {milestones.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMilestone(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                      placeholder="Milestone title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Percentage (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={milestone.payment_percentage}
                        onChange={(e) => updateMilestone(index, 'payment_percentage', parseInt(e.target.value) || 0)}
                      />
                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        = {formatCurrency((project.budget || 0) * (milestone.payment_percentage / 100))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Completion Date</Label>
                    <Input
                      type="date"
                      value={milestone.target_completion_date}
                      onChange={(e) => updateMilestone(index, 'target_completion_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                      placeholder="Brief description"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Completion Criteria</Label>
                    <Textarea
                      value={milestone.completion_criteria}
                      onChange={(e) => updateMilestone(index, 'completion_criteria', e.target.value)}
                      placeholder="Define what must be completed for this milestone..."
                      rows={2}
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

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={saveMilestones} 
          disabled={saving || !isValid}
          className="bg-primary"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Milestones
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default MilestoneManagement;
