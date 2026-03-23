import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Wallet, ImageOff } from 'lucide-react';
import ContractorBanner from '@/components/contractor/ContractorBanner';
import { CATEGORIES } from '@/constants/problemReporting';

export interface ProjectWithCategory {
  id: string;
  title: string;
  description: string;
  status: string;
  budget: number;
  contractor_id: string | null;
  category: string | null;
  progress: number;
  photo_url?: string | null;
}

interface ProjectCategoryCarouselProps {
  projects: ProjectWithCategory[];
  onSelectProject: (projectId: string) => void;
}

const getCategoryMeta = (categoryValue: string | null) => {
  const found = CATEGORIES.find(c => c.value === categoryValue);
  return found || { value: categoryValue || 'other', label: categoryValue || 'Other Infrastructure', icon: '🏗️' };
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'planning': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const CategoryRow = ({ 
  category, 
  projects, 
  onSelectProject 
}: { 
  category: ReturnType<typeof getCategoryMeta>; 
  projects: ProjectWithCategory[];
  onSelectProject: (id: string) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ 
      left: direction === 'left' ? -amount : amount, 
      behavior: 'smooth' 
    });
    setTimeout(updateScrollState, 350);
  };

  return (
    <div className="mb-8">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category.icon}</span>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">{category.label}</h2>
          <Badge variant="secondary" className="ml-1 text-xs">{projects.length}</Badge>
        </div>
        <div className="flex items-center gap-1">
          {canScrollLeft && (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll('left')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {canScrollRight && projects.length > 1 && (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll('right')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div 
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {projects.map((project) => (
          <div 
            key={project.id} 
            className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start cursor-pointer"
            onClick={() => onSelectProject(project.id)}
          >
            <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border border-border/60 overflow-hidden">
              {/* Hero Photo */}
              {project.photo_url ? (
                <div className="w-full h-[160px] overflow-hidden bg-muted">
                  <img 
                    src={project.photo_url} 
                    alt={project.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="w-full h-[100px] bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                  <ImageOff className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}

              {/* Contractor Banner - compact */}
              <div className="px-3 pt-2">
                <ContractorBanner contractorId={project.contractor_id} compact />
              </div>
              
              <CardContent className="p-3 pt-2">
                <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1 min-h-[2.5rem]">
                  {project.title}
                </h3>

                {/* Progress */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span className="font-semibold text-foreground">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-1.5" />
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between">
                  <Badge className={`${getStatusColor(project.status)} text-xs`}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Wallet className="h-3 w-3" />
                    KES {((project.budget || 0) / 1000000).toFixed(1)}M
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProjectCategoryCarousel = ({ projects, onSelectProject }: ProjectCategoryCarouselProps) => {
  // Group projects by category
  const grouped = projects.reduce<Record<string, ProjectWithCategory[]>>((acc, project) => {
    const key = project.category || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(project);
    return acc;
  }, {});

  // Sort categories: ones with more projects first
  const sortedCategories = Object.entries(grouped)
    .sort(([, a], [, b]) => b.length - a.length);

  if (sortedCategories.length === 0) return null;

  return (
    <div className="space-y-2">
      {sortedCategories.map(([categoryKey, categoryProjects]) => (
        <CategoryRow
          key={categoryKey}
          category={getCategoryMeta(categoryKey)}
          projects={categoryProjects}
          onSelectProject={onSelectProject}
        />
      ))}
    </div>
  );
};

export default ProjectCategoryCarousel;
