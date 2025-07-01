
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';

interface MobileCameraProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  maxFiles?: number;
}

export const MobileCamera = ({ onCapture, onClose, maxFiles = 5 }: MobileCameraProps) => {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const { toast } = useToast();
  const { takePhoto, selectPhoto, isNative } = useNativeFeatures();

  const handleTakePhoto = async () => {
    try {
      const base64Image = await takePhoto();
      if (base64Image) {
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;
        
        // Convert base64 to File object
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        setCapturedImages(prev => [...prev, imageUrl]);
        onCapture(file);
        
        toast({
          title: "Photo Captured",
          description: "Photo has been added to your report."
        });
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to take photo. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSelectPhoto = async () => {
    try {
      const base64Image = await selectPhoto();
      if (base64Image) {
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;
        
        // Convert base64 to File object
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        setCapturedImages(prev => [...prev, imageUrl]);
        onCapture(file);
        
        toast({
          title: "Photo Selected",
          description: "Photo has been added to your report."
        });
      }
    } catch (error) {
      toast({
        title: "Selection Error",
        description: "Unable to select photo. Please try again.",
        variant: "destructive"
      });
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => {
      const newImages = [...prev];
      newImages.splice(index, 1);
      return newImages;
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            {isNative ? 'Native Camera' : 'Camera'} ({capturedImages.length}/{maxFiles})
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={handleTakePhoto}
              disabled={capturedImages.length >= maxFiles}
              className="h-16"
            >
              <Camera className="h-6 w-6 mb-2" />
              Take Photo
            </Button>
            
            <Button 
              onClick={handleSelectPhoto}
              disabled={capturedImages.length >= maxFiles}
              variant="outline"
              className="h-16"
            >
              <ImageIcon className="h-6 w-6 mb-2" />
              Select Photo
            </Button>
          </div>

          {capturedImages.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Captured Photos</p>
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
        </div>
      </CardContent>
    </Card>
  );
};
