
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Download, Upload, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const OfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineReports, setOfflineReports] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine && offlineReports > 0) {
        toast({
          title: "Mtandao Umepatikana! / Internet Connected!",
          description: `Ripoti ${offlineReports} zimetumwa kiotomatiki / ${offlineReports} reports sent automatically`,
        });
        setOfflineReports(0);
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [offlineReports, toast]);

  const handleInstallPWA = () => {
    toast({
      title: "Programu Imesakinishwa! / App Installed!",
      description: "Sasa unaweza kutumia programu bila mtandao / Now you can use the app offline",
    });
  };

  const simulateOfflineReport = () => {
    setOfflineReports(prev => prev + 1);
    toast({
      title: "Ripoti Imehifadhiwa / Report Saved",
      description: "Itatumwa mtandao unapopatikana / Will send when internet is available",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
          <CardTitle className="flex items-center text-2xl">
            {isOnline ? (
              <Wifi className="h-6 w-6 mr-3 text-green-600" />
            ) : (
              <WifiOff className="h-6 w-6 mr-3 text-red-600" />
            )}
            Offline Support - Uongozi bila Mtandao
          </CardTitle>
          <div className="flex items-center space-x-3 mt-2">
            <Badge className={isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {isOnline ? 'Mtandao unapatikana / Online' : 'Hakuna mtandao / Offline'}
            </Badge>
            {offlineReports > 0 && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {offlineReports} ripoti zinasubiri / reports pending
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2 text-blue-600" />
              Sakinisha Programu / Install App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-sm">
              Sakinisha programu kwenye simu yako ili utumie bila mtandao.
              <br />
              <span className="text-gray-500">Install app on your phone to use offline.</span>
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <Download className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">Programu Ndogo</div>
                  <div className="text-sm text-green-600">Inatumia data kidogo / Uses little data</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <WifiOff className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-800">Kazi bila Mtandao</div>
                  <div className="text-sm text-blue-600">Inaweza kutumika bila internet / Works without internet</div>
                </div>
              </div>
            </div>

            <Button onClick={handleInstallPWA} className="w-full bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Sakinisha Sasa / Install Now
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2 text-orange-600" />
              Ripoti za Offline / Offline Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-sm">
              Ripoti zako zitahifadhiwa na kutumwa mtandao unapopatikana.
              <br />
              <span className="text-gray-500">Your reports will be saved and sent when internet is available.</span>
            </p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-gray-900">{offlineReports}</div>
                <div className="text-sm text-gray-600">Ripoti zinasubiri / Reports pending</div>
              </div>
              
              {!isOnline && (
                <Button 
                  onClick={simulateOfflineReport}
                  variant="outline" 
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  Ongeza Ripoti Offline / Add Offline Report
                </Button>
              )}
            </div>

            {isOnline && offlineReports > 0 && (
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-sm text-green-800">
                  Ripoti zote zimetumwa! / All reports sent!
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Faida za Offline Support / Benefits of Offline Support
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Kwa Wanachi / For Citizens:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Ripoti hata bila mtandao / Report even without internet
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Data inahifadhiwa salama / Data is safely stored
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Hakuna kupoteza habari / No information lost
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Kwa Maeneo ya Mbali / For Rural Areas:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Inafanya kazi hata mtandao ukiwa mdogo / Works even with poor network
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Gharama ya data ni ndogo / Low data costs
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Uwazi kwa wote / Transparency for everyone
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineSupport;
