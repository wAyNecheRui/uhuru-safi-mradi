
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MobileCameraProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  maxFiles?: number;
}

export const MobileCamera = ({ onCapture, onClose, maxFiles = 5 }: MobileCameraProps) => {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
      console.error('Camera access error:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (context) {
      context.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const imageUrl = URL.createObjectURL(blob);
          
          setCapturedImages(prev => [...prev, imageUrl]);
          onCapture(file);
          
          toast({
            title: "Photo Captured",
            description: "Photo has been added to your report."
          });
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index]);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  React.useEffect(() => {
    return () => {
      stopCamera();
      capturedImages.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Camera</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!isCapturing ? (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <Button onClick={startCamera}>
              Start Camera
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-48 object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex justify-center space-x-4">
              <Button onClick={stopCamera} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Stop
              </Button>
              <Button 
                onClick={capturePhoto}
                disabled={capturedImages.length >= maxFiles}
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
            </div>
          </div>
        )}

        {capturedImages.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">
              Captured Photos ({capturedImages.length}/{maxFiles})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {capturedImages.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Captured ${index + 1}`}
                    className="w-full h-16 object-cover rounded"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
