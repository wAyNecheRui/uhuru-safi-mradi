
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Wrench, MapPin, Star, Briefcase, Phone, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WorkforceIntegration = () => {
  const [selectedSkill, setSelectedSkill] = useState('');
  const { toast } = useToast();

  const skillCategories = [
    {
      name: 'Construction',
      skills: ['Masonry', 'Carpentry', 'Plumbing', 'Electrical', 'Painting', 'Roofing'],
      icon: <Wrench className="h-5 w-5" />,
      color: 'bg-blue-500'
    },
    {
      name: 'Infrastructure',
      skills: ['Road Construction', 'Water Systems', 'Drainage', 'Bridge Building'],
      icon: <Briefcase className="h-5 w-5" />,
      color: 'bg-green-500'
    },
    {
      name: 'Maintenance',
      skills: ['Equipment Repair', 'Facility Maintenance', 'Landscaping', 'Cleaning'],
      icon: <Wrench className="h-5 w-5" />,
      color: 'bg-orange-500'
    }
  ];

  const availableJobs = [
    {
      id: 1,
      title: 'Road Repair Crew - Thika Road',
      location: 'Kasarani, Nairobi',
      skillsNeeded: ['Masonry', 'Road Construction'],
      duration: '2 weeks',
      dailyRate: 1500,
      urgency: 'High',
      description: 'Pothole repair and road surface maintenance on Thika Road section.',
      applicants: 12,
      spotsAvailable: 5
    },
    {
      id: 2,
      title: 'Water Pipeline Installation',
      location: 'Kibera, Nairobi',
      skillsNeeded: ['Plumbing', 'Water Systems'],
      duration: '3 weeks',
      dailyRate: 1800,
      urgency: 'Critical',
      description: 'Install new water pipeline to connect 200+ households.',
      applicants: 8,
      spotsAvailable: 3
    },
    {
      id: 3,
      title: 'School Roof Repair',
      location: 'Mathare, Nairobi',
      skillsNeeded: ['Roofing', 'Carpentry'],
      duration: '1 week',
      dailyRate: 1200,
      urgency: 'Medium',
      description: 'Replace damaged roof sections at Mathare Primary School.',
      applicants: 15,
      spotsAvailable: 8
    }
  ];

  const registeredWorkers = [
    {
      id: 1,
      name: 'John Mwangi',
      skills: ['Masonry', 'Carpentry'],
      experience: '5 years',
      location: 'Kasarani, Nairobi',
      rating: 4.8,
      completedJobs: 23,
      availability: 'Available',
      phone: '+254 712 345 678'
    },
    {
      id: 2,
      name: 'Grace Wanjiku',
      skills: ['Plumbing', 'Water Systems'],
      experience: '3 years',
      location: 'Kibera, Nairobi',
      rating: 4.6,
      completedJobs: 18,
      availability: 'Busy until Feb 15',
      phone: '+254 723 456 789'
    }
  ];

  const handleJobApplication = (jobId: number) => {
    toast({
      title: "Application submitted!",
      description: "You will be contacted if selected for this opportunity.",
    });
  };

  const handleViewJobDetails = (jobId: number) => {
    toast({
      title: "Job Details",
      description: "Full job details will be displayed. Check the skills required and location.",
    });
  };

  const handleViewWorkerProfile = (workerId: number) => {
    toast({
      title: "Worker Profile",
      description: "Complete worker profile with contact information and job history.",
    });
  };

  const handleContactWorker = (workerId: number, phone: string) => {
    toast({
      title: "Contact Info",
      description: `Call ${phone} to reach this worker.`,
    });
  };

  const handleUpdateSkillsProfile = () => {
    toast({
      title: "Profile Updated!",
      description: "Your skills profile has been saved. You'll receive job matches soon.",
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-green-600">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center text-2xl">
            <Users className="h-6 w-6 mr-3 text-green-600" />
            Citizen Workforce Integration
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Connect skilled citizens with local infrastructure projects. Register your skills and find opportunities in your community.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg">
          <TabsTrigger value="jobs">Available Jobs</TabsTrigger>
          <TabsTrigger value="skills">Skills Registry</TabsTrigger>
          <TabsTrigger value="workers">Local Workers</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          <div className="grid gap-6">
            {availableJobs.map((job) => (
              <Card key={job.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                        <Badge className={getUrgencyColor(job.urgency)}>
                          {job.urgency}
                        </Badge>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {job.location}
                      </div>

                      <p className="text-gray-700">{job.description}</p>

                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-600">Skills needed:</span>
                        {job.skillsNeeded.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Duration:</span>
                          <div className="font-medium">{job.duration}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Daily Rate:</span>
                          <div className="font-medium text-green-600">KES {job.dailyRate.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Applicants:</span>
                          <div className="font-medium">{job.applicants}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Spots Available:</span>
                          <div className="font-medium text-blue-600">{job.spotsAvailable}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button
                        onClick={() => handleJobApplication(job.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Apply Now
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewJobDetails(job.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Register Your Skills</CardTitle>
              <p className="text-sm text-gray-600">
                Add your skills to get matched with relevant job opportunities in your area.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {skillCategories.map((category, index) => (
                  <Card key={index} className="border-2 hover:border-green-400 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-lg">
                        <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center text-white mr-3`}>
                          {category.icon}
                        </div>
                        {category.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {category.skills.map((skill, skillIndex) => (
                          <div key={skillIndex} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`${category.name}-${skill}`}
                              className="rounded border-gray-300"
                            />
                            <label
                              htmlFor={`${category.name}-${skill}`}
                              className="text-sm text-gray-700 cursor-pointer"
                            >
                              {skill}
                            </label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <Input placeholder="e.g., 5 years" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <Input placeholder="+254 7XX XXX XXX" />
                  </div>
                </div>
                <Button 
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={handleUpdateSkillsProfile}
                >
                  Update Skills Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers" className="space-y-6">
          <div className="grid gap-6">
            {registeredWorkers.map((worker) => (
              <Card key={worker.id} className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">{worker.name}</h3>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="font-medium">{worker.rating}/5.0</span>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {worker.location}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-600">Skills:</span>
                        {worker.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Experience:</span>
                          <div className="font-medium">{worker.experience}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Completed Jobs:</span>
                          <div className="font-medium">{worker.completedJobs}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Availability:</span>
                          <div className={`font-medium ${worker.availability === 'Available' ? 'text-green-600' : 'text-orange-600'}`}>
                            {worker.availability}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <div className="font-medium">{worker.phone}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleContactWorker(worker.id, worker.phone)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewWorkerProfile(worker.id)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-green-900 mb-4">Workforce Integration Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-green-800 mb-2">For Citizens</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Local employment opportunities</li>
                <li>• Skill development programs</li>
                <li>• Fair wage determination</li>
                <li>• Performance-based ratings</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">For Projects</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Access to local skilled workers</li>
                <li>• Community ownership of projects</li>
                <li>• Reduced project costs</li>
                <li>• Faster project completion</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">For Community</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Economic empowerment</li>
                <li>• Capacity building</li>
                <li>• Social cohesion</li>
                <li>• Sustainable development</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkforceIntegration;
