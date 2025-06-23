
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, Users, CheckCircle } from 'lucide-react';

const SMSIntegration = () => {
  const [selectedService, setSelectedService] = useState<string>('');

  const smsServices = [
    {
      id: 'ussd',
      title: '*483*1# - USSD',
      description: 'Ripoti kupitia USSD (hakuna data)',
      descriptionEn: 'Report via USSD (no data needed)',
      steps: [
        'Bonyeza *483*1#',
        'Chagua "1" kwa Ripoti',
        'Fuata maagizo',
        'Pokea nambari ya ripoti'
      ],
      icon: <Phone className="h-6 w-6" />
    },
    {
      id: 'sms',
      title: 'SMS - 22483',
      description: 'Tuma SMS ya haraka',
      descriptionEn: 'Send quick SMS',
      steps: [
        'Tuma: TATIZO [Mahali] [Maelezo]',
        'Kwa: 22483',
        'Mfano: TATIZO KASARANI Shimo kubwa barabarani',
        'Utapokea ujumbe wa kuthibitisha'
      ],
      icon: <MessageSquare className="h-6 w-6" />
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Bot',
      description: 'Mazungumzo ya kiotomatiki',
      descriptionEn: 'Automated chat support',
      steps: [
        'Fungua WhatsApp',
        'Tuma ujumbe kwa +254 700 123 456',
        'Andika "Ripoti" kuanza',
        'Bot itakusaidia'
      ],
      icon: <Users className="h-6 w-6" />
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-green-600">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center text-2xl">
            <Phone className="h-6 w-6 mr-3 text-green-600" />
            SMS/USSD Services - Huduma za SMS/USSD
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Ripoti tatizo lako bila kutumia data ya mtandao / Report issues without using internet data
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {smsServices.map((service) => (
          <Card 
            key={service.id}
            className={`shadow-lg cursor-pointer transition-all hover:shadow-xl ${
              selectedService === service.id ? 'ring-2 ring-green-500 border-green-500' : ''
            }`}
            onClick={() => setSelectedService(selectedService === service.id ? '' : service.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                  {service.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <p className="text-sm text-gray-600">{service.description}</p>
                  <p className="text-xs text-gray-500">{service.descriptionEn}</p>
                </div>
              </div>
            </CardHeader>
            
            {selectedService === service.id && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <Badge className="bg-blue-100 text-blue-800 w-full justify-center">
                    Hatua za Kufuata / Steps to Follow
                  </Badge>
                  <ol className="space-y-2">
                    {service.steps.map((step, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700 flex-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Faida za SMS/USSD / Benefits of SMS/USSD
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <ul className="space-y-2">
                  <li>• Hakuna haja ya mtandao wa kina</li>
                  <li>• Inafanya kazi kwenye simu zote</li>
                  <li>• Gharama ndogo</li>
                  <li>• Haraka na rahisi</li>
                </ul>
                <ul className="space-y-2">
                  <li>• No internet connection needed</li>
                  <li>• Works on all phones</li>
                  <li>• Low cost</li>
                  <li>• Fast and easy</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-yellow-800">
              <strong>Muhimu / Important:</strong> Huduma hizi za SMS/USSD ziko tayari kufanya kazi katika kaunti zote 47 za Kenya.
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              These SMS/USSD services are ready to work in all 47 counties of Kenya.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMSIntegration;
