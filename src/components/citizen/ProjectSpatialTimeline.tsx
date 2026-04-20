import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle, Clock, Wallet, Shield,
    MapPin, Camera, TrendingUp, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Milestone {
    id: string;
    title: string;
    description: string;
    status: string;
    payment_percentage: number;
    milestone_number: number;
    evidence_urls: string[] | null;
    target_completion_date: string | null;
}

interface ProjectSpatialTimelineProps {
    milestones: Milestone[];
    currentStatus: string;
    className?: string;
}

const ProjectSpatialTimeline: React.FC<ProjectSpatialTimelineProps> = ({
    milestones,
    currentStatus,
    className
}) => {
    const sortedMilestones = [...milestones].sort((a, b) => a.milestone_number - b.milestone_number);

    const getStatusConfig = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return { icon: Wallet, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Paid & Finalized' };
            case 'verified':
                return { icon: Shield, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Citizen Verified' };
            case 'submitted':
                return { icon: Camera, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Awaiting Verification' };
            case 'in_progress':
                return { icon: TrendingUp, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', label: 'Active Work' };
            default:
                return { icon: Clock, color: 'text-slate-400', bgColor: 'bg-slate-400/10', label: 'Pending' };
        }
    };

    return (
        <div className={cn("relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-primary/20 before:to-transparent", className)}>
            {sortedMilestones.map((milestone, index) => {
                const config = getStatusConfig(milestone.status);
                const Icon = config.icon;
                const isOdd = index % 2 !== 0;

                return (
                    <div
                        key={milestone.id}
                        className={cn(
                            "relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active",
                            "animate-in fade-in slide-in-from-bottom-5 duration-700",
                        )}
                        style={{ animationDelay: `${index * 150}ms` }}
                    >
                        {/* Dot */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-background shadow-xl absolute left-0 md:left-1/2 md:-ml-5 flex-shrink-0 z-10 transition-transform group-hover:scale-110 duration-300">
                            <Icon className={cn("w-5 h-5", config.color)} />
                        </div>

                        {/* Content Card */}
                        <div className={cn(
                            "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)]",
                            "p-4 rounded-2xl border border-primary/10",
                            "bg-background/40 backdrop-blur-xl shadow-2xl transition-all duration-300",
                            "hover:border-primary/30 hover:bg-background/60 hover:-translate-y-1",
                            "ml-14 md:ml-0"
                        )}>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] font-mono opacity-60">
                                        Phase {milestone.milestone_number}
                                    </Badge>
                                    <h3 className="font-bold text-sm sm:text-base leading-tight">
                                        {milestone.title}
                                    </h3>
                                </div>
                                <Badge className={cn("text-[10px] uppercase tracking-wider", config.bgColor, config.color, "border-none")}>
                                    {config.label}
                                </Badge>
                            </div>

                            <p className="text-xs text-muted-foreground mb-4 line-clamp-2 italic">
                                {milestone.description}
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-primary/5">
                                <div className="flex items-center gap-1.5">
                                    <Wallet className="w-3.5 h-3.5 text-primary opacity-60" />
                                    <span className="text-[11px] font-medium">
                                        {milestone.payment_percentage}% Funding
                                    </span>
                                </div>
                                {milestone.target_completion_date && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-[10px]">
                                            Target: {new Date(milestone.target_completion_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ProjectSpatialTimeline;
