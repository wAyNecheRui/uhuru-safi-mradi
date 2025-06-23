
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, Phone, MessageSquare, AlertTriangle, Wrench, Droplets, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SimplifiedReporting = () => {
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  const commonIssues = [
    {
      id: 'road',
      title: 'Barabara Mbaya',
      titleEn: 'Bad Roads',
      icon: <Wrench className="h-8 w-8" />,
      color: 'bg-orange-500',
      examples: ['Mashimo', 'Njia zenye matope', 'Daraja lililoharibika']
    },
    {
      id: 'water',
      title: 'Maji',
      titleEn: 'Water Issues',
      icon: <Droplets className="h-8 w-8" />,
      color: 'bg-blue-500',
      examples: ['Bomba limevunjika', 'Ukosefu wa maji', 'Maji machafu']
    },
    {
      id: 'electricity',
      title: 'Umeme',
      titleEn: 'Electricity',
      icon: <Zap className="h-8 w-8" />,
      color: 'bg-yellow-500',
      examples: ['Taa za barabarani', 'Umeme haupo', 'Waya wa hatari']
    },
    {
      id: 'security',
      title: 'Usalama',
      titleEn: 'Security',
      icon: <AlertTriangle className="h-8 w-8" />,
      color: 'bg-red-500',
      examples: ['Mwanga mdogo', 'Eneo hatari', 'Ulinzi mdogo']
    }
  ];

  const handleIssueSelect = (issueId: string) => {
    setSelectedIssue(issueId);
    setCurrentStep(2);
  };

  const handleSubmitReport = () => {
    toast({
      title: "Ripoti Imetumwa! / Report Sent!",
      description: "Utapokea ujumbe wa SMS kuhusu maendeleo. / You'll receive SMS updates on progress.",
    });
    setCurrentStep(3);
  };

  if (currentStep === 3) {
    return (
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Asante! / Thank You!</h3>
          <p className="text-gray-600 mb-6">
            Ripoti yako imetumwa kwa serikali. Utapokea SMS kuhusu maendeleo.
            <br />
            <span className="text-sm text-gray-500">
              Your report has been sent to the government. You'll receive SMS updates.
            </span>
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              <strong>Nambari ya Ripoti / Report Number:</strong> UWZ-{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Hifadhi nambari hii kwa marejeo / Keep this number for reference
            </p>
          </div>
          <Button onClick={() => { setCurrentStep(1); setSelectedIssue(''); }} className="bg-green-600 hover:bg-green-700">
            Ripoti Lingine / Report Another Issue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 2) {
    const issue = commonIssues.find(i => i.id === selectedIssue);
    return (
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
          <CardTitle className="flex items-center text-xl">
            {issue?.icon}
            <span className="ml-3">{issue?.title} / {issue?.titleEn}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Piga Picha ya Tatizo / Take Photo of Problem
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Picha itasaidia serikali kuelewa tatizo / Photo helps government understand the issue
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button className="h-24 bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center justify-center space-y-2">
              <Camera className="h-8 w-8" />
              <span>Piga Picha / Take Photo</span>
            </Button>

            <Button variant="outline" className="h-16 flex items-center justify-center space-x-3">
              <MapPin className="h-6 w-6 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Mahali / Location</div>
                <div className="text-sm text-gray-500">Nairobi, Kasarani (Auto-detected)</div>
              </div>
            </Button>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Mifano ya {issue?.title} / Examples:</h4>
            <div className="grid grid-cols-1 gap-2">
              {issue?.examples.map((example, index) => (
                <Badge key={index} variant="outline" className="justify-start text-yellow-700 border-yellow-300">
                  {example}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(1)}
              className="flex-1"
            >
              Rudi Nyuma / Go Back
            </Button>
            <Button 
              onClick={handleSubmitReport}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Tuma Ripoti / Send Report
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto shadow-xl">
      <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
        <CardTitle className="text-2xl text-center">
          Ripoti Tatizo la Miundombinu / Report Infrastructure Issue
        </CardTitle>
        <p className="text-center text-green-100 mt-2">
          Chagua aina ya tatizo / Choose type of problem
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {commonIssues.map((issue) => (
            <button
              key={issue.id}
              onClick={() => handleIssueSelect(issue.id)}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-16 h-16 ${issue.color} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                  {issue.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{issue.title}</h3>
                  <p className="text-gray-600">{issue.titleEn}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-2">Mifano / Examples:</p>
                {issue.examples.slice(0, 2).map((example, index) => (
                  <Badge key={index} variant="outline" className="mr-2 text-xs">
                    {example}
                  </Badge>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-3">Njia Nyingine za Kuripoti / Other Ways to Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">SMS/Simu</div>
                <div className="text-sm text-gray-600">*483*1# au 0800-123-456</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">WhatsApp</div>
                <div className="text-sm text-gray-600">+254 700 123 456</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimplifiedReporting;
