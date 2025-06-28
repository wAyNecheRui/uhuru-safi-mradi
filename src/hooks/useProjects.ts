
import { useState, useEffect } from 'react';

export interface Project {
  id: number;
  title: string;
  description: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending Review' | 'Active' | 'Bidding' | 'Completed' | 'Cancelled';
  budget: string;
  contractor: string;
  progress: number;
  reportedBy: string;
  dateReported: string;
  votes: number;
  category?: string;
  estimatedCost?: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      title: "Road Repair - Kilifi County",
      description: "Potholes on main road causing accidents",
      location: "Kilifi, Kenya",
      priority: "High",
      status: "Active",
      budget: "KSh 2,500,000",
      contractor: "BuildRight Ltd",
      progress: 65,
      reportedBy: "John Mwangi",
      dateReported: "2025-06-15",
      votes: 124,
      category: "Roads & Transportation"
    },
    {
      id: 2,
      title: "Water Pipeline Extension",
      description: "Community lacks clean water access",
      location: "Nakuru, Kenya",
      priority: "Critical",
      status: "Bidding",
      budget: "KSh 4,200,000",
      contractor: "Pending",
      progress: 0,
      reportedBy: "Mary Wanjiku",
      dateReported: "2025-06-20",
      votes: 89,
      category: "Water & Sanitation"
    }
  ]);

  const addProject = (projectData: Omit<Project, 'id' | 'progress' | 'votes' | 'status' | 'contractor'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now(),
      status: 'Pending Review',
      contractor: 'Pending',
      progress: 0,
      votes: 1
    };
    
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = (id: number, updates: Partial<Project>) => {
    setProjects(prev => prev.map(project => 
      project.id === id ? { ...project, ...updates } : project
    ));
  };

  const deleteProject = (id: number) => {
    setProjects(prev => prev.filter(project => project.id !== id));
  };

  const getProjectsByStatus = (status: Project['status']) => {
    return projects.filter(project => project.status === status);
  };

  const getProjectsByPriority = (priority: Project['priority']) => {
    return projects.filter(project => project.priority === priority);
  };

  useEffect(() => {
    // Load projects from localStorage if available
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects));
      } catch (error) {
        console.error('Failed to load projects from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save projects to localStorage whenever they change
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  return {
    projects,
    addProject,
    updateProject,
    deleteProject,
    getProjectsByStatus,
    getProjectsByPriority
  };
};
