
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, Users, CheckCircle, AlertTriangle, Shield } from 'lucide-react';

const USSDIntegration = () => {
  const [selectedService, setSelectedService] = useState<string>('');

  const ussdServices = [
    {
      id: 'reporting',
      shortcode: '*483*1#',
      title: 'Report Infrastructure Issues',
      titleSw: 'Ripoti Tatizo la Miundombinu',
      description: 'Report problems without internet data',
      descriptionSw: 'Ripoti matatizo bila data ya mtandao',
      steps: [
        'Dial *483*1#',
        'Select "1" for Report Issue',
        'Choose problem category',
        'Provide location details',
        'Receive confirmation SMS'
      ],
      stepsSw: [
        'Bonyeza *483*1#',
        'Chagua "1" kwa Ripoti Tatizo',
        'Chagua aina ya tatizo',
        'Toa maelezo ya mahali',
        'Pokea ujumbe wa kuthibitisha'
      ]
    },
    {
      id: 'tracking',
      shortcode: '*483*2#',
      title: 'Track Your Reports',
      titleSw: 'Fuatilia Ripoti Zako',
      description: 'Check status of your submitted reports',
      descriptionSw: 'Angalia hali ya ripoti ulizotuma',
      steps: [
        'Dial *483*2#',
        'Enter your phone number',
        'View list of your reports',
        'Select report for details',
        'Get current status update'
      ],
      stepsSw: [
        'Bonyeza *483*2#',
        'Ingiza nambari yako ya simu',
        'Ona orodha ya ripoti zako',
        'Chagua ripoti ili kupata maelezo',
        'Pata taarifa za hali ya sasa'
      ]
    },
    {
      id: 'verification',
      shortcode: '*483*3#',
      title: 'Verify Project Progress',
      titleSw: 'Thibitisha Maendeleo ya Mradi',
      description: 'Confirm project completion in your area',
      descriptionSw: 'Thibitisha kumaliza kwa mradi katika eneo lako',
      steps: [
        'Dial *483*3#',
        'Enter project reference number',
        'Rate project progress (1-5)',
        'Add optional comments',
        'Submit verification'
      ],
      stepsSw: [
        'Bonyeza *483*3#',
        'Ingiza nambari ya kumbukumbu ya mradi',
        'Kadiria maendeleo ya mradi (1-5)',
        'Ongeza maoni (hiari)',
        'Wasilisha uthibitisho'
      ]
    }
  ];

  const smsCommands = [
    {
      command: 'REPORT [LOCATION] [ISSUE]',
      example: 'REPORT KASARANI Road pothole blocking traffic',
      description: 'Send to 22483 to report issues'
    },
    {
      command: 'STATUS [REPORT_ID]',
      example: 'STATUS RPT001',
      description: 'Check report status via SMS'
    },
    {
      command: 'VERIFY [PROJECT_ID] [RATING]',
      example: 'VERIFY PRJ001 4',
      description: 'Verify project completion (rating 1-5)'
    }
  ];

  const usageStats = [
    { metric: 'USSD Sessions Today', value: '1,247', change: '+12%' },
    { metric: 'SMS Reports Sent', value: '3,892', change: '+8%' },
    { metric: 'Rural Area Access', value: '76%', change: '+15%' },
    { metric: 'Response Time', value: '< 3 sec', change: 'Stable' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-green-600">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center text-2xl">
            <Phone className="h-6 w-6 mr-3 text-green-600" />
            USSD & SMS Integration - Huduma za Simu
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Universal access to government services through basic mobile phones. No internet required.
          </p>
          <p className="text-gray-600 text-sm">
            Ufikiaji wa kila mtu kwa huduma za serikali kupitia simu za kawaida. Hakuna haja ya mtandao wa kina.
          </p>
        </CardHeader>
      </Card>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {usageStats.map((stat, index) => (
          <Card key={index} className="shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 mb-2">{stat.metric}</div>
              <Badge className={`text-xs ${stat.change.includes('+') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {stat.change}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* USSD Services */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">USSD Services - Huduma za USSD</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ussdServices.map((service) => (
            <Card 
              key={service.id}
              className={`shadow-lg cursor-pointer transition-all hover:shadow-xl ${
                selectedService === service.id ? 'ring-2 ring-green-500 border-green-500' : ''
              }`}
              onClick={() => setSelectedService(selectedService === service.id ? '' : service.id)}
            >
              <CardHeader className="pb-3">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Phone className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">{service.shortcode}</div>
                  <div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <p className="text-sm text-gray-600 font-medium">{service.titleSw}</p>
                  </div>
                </div>
              </CardHeader>
              
              {selectedService === service.id && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">{service.description}</p>
                      <p className="text-sm text-gray-500 italic">{service.descriptionSw}</p>
                    </div>

                    <div className="space-y-3">
                      <Badge className="bg-blue-100 text-blue-800 w-full justify-center">
                        Steps to Follow - Hatua za Kufuata
                      </Badge>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">English:</h4>
                          <ol className="space-y-1">
                            {service.steps.map((step, index) => (
                              <li key={index} className="flex items-start space-x-2 text-sm">
                                <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {index + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Kiswahili:</h4>
                          <ol className="space-y-1">
                            {service.stepsSw.map((step, index) => (
                              <li key={index} className="flex items-start space-x-2 text-sm">
                                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {index + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Try Now - Jaribu Sasa
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* SMS Commands */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
            SMS Commands - Amri za SMS
          </CardTitle>
          <p className="text-sm text-gray-600">
            Send SMS to <strong>22483</strong> using these commands
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {smsCommands.map((cmd, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {cmd.command}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Example:</strong> {cmd.example}
                  </div>
                  <div className="text-sm text-gray-500">
                    {cmd.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Benefits - Faida
                </h3>
                <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>• No internet required</span>
                    <span className="text-gray-500">• Hakuna haja ya mtandao</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Works on all phones</span>
                    <span className="text-gray-500">• Inafanya kazi simu zote</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Low cost (KES 5-10)</span>
                    <span className="text-gray-500">• Gharama ndogo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 24/7 availability</span>
                    <span className="text-gray-500">• Inapatikana mchana na usiku</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Shield className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Coverage - Upeo
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span>Rural Areas</span>
                    <Badge className="bg-green-100 text-green-800">96% Coverage</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>All Mobile Networks</span>
                    <Badge className="bg-blue-100 text-blue-800">Supported</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Languages</span>
                    <Badge className="bg-purple-100 text-purple-800">EN + SW</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Response Time</span>
                    <Badge className="bg-orange-100 text-orange-800">< 3 seconds</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Status */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto" />
            <h3 className="font-semibold text-yellow-800">
              Implementation Ready - Tayari kwa Utekelezaji
            </h3>
            <p className="text-sm text-yellow-700 max-w-2xl mx-auto">
              USSD and SMS services are configured and ready for deployment across all 47 counties. 
              Integration with Safaricom, Airtel, and Telkom networks completed.
            </p>
            <p className="text-xs text-yellow-600 max-w-2xl mx-auto">
              Huduma za USSD na SMS zimekamilishwa na ni tayari kwa matumizi katika kaunti zote 47. 
              Muunganiko na mitandao ya Safaricom, Airtel, na Telkom umekamilika.
            </p>
            <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
              Launch Services - Zindua Huduma
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default USSDIntegration;
