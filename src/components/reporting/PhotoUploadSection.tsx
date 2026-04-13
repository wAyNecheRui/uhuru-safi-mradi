
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, FileVideo, FileImage } from 'lucide-react';
import GrokCameraModal from '@/components/camera/GrokCameraModal';

interface PhotoUploadSectionProps {
  photoCount: number;
  photos?: File[];
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto?: (index: number) => void;
  onCameraCapture?: (file: File) => void;
}

const PhotoUploadSection = ({ photoCount, photos = [], onPhotoUpload, onRemovePhoto, onCameraCapture }: PhotoUploadSectionProps) => {
  const [previews, setPreviews] = useState<{ url: string; type: string; name: string }[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const newPreviews = photos.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      name: file.name
    }));
    setPreviews(newPreviews);
    return () => { newPreviews.forEach(preview => URL.revokeObjectURL(preview.url)); };
  }, [photos]);

  const handleCameraCapture = (file: File) => {
    if (onCameraCapture) {
      onCameraCapture(file);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground mb-2">
        Photo & Video Documentation <span className="text-destructive">*</span>
      </label>

      {/* Hidden file input for gallery upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={onPhotoUpload}
      />
      
      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-14 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
          onClick={() => setCameraOpen(true)}
          disabled={photoCount >= 10}
        >
          <Camera className="h-5 w-5 mr-2 text-primary" />
          <span className="font-medium">Take Photo</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-14 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
          onClick={() => fileInputRef.current?.click()}
          disabled={photoCount >= 10}
        >
          <Upload className="h-5 w-5 mr-2 text-muted-foreground" />
          <span className="font-medium">Upload File</span>
        </Button>
      </div>

      {/* Grok Camera Modal */}
      <GrokCameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
        maxFiles={10}
        capturedCount={photoCount}
      />

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {photoCount} file(s) attached
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((preview, index) => (
              <div 
                key={index} 
                className="relative group rounded-lg overflow-hidden border bg-muted aspect-square"
              >
                {preview.type === 'video' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                    <FileVideo className="h-8 w-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground px-2 text-center truncate w-full">
                      {preview.name}
                    </span>
                    <video 
                      src={preview.url} 
                      className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
                      muted
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => e.currentTarget.pause()}
                    />
                  </div>
                ) : (
                  <img 
                    src={preview.url} 
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* File type indicator */}
                <div className="absolute top-1 left-1 bg-black/50 rounded px-1.5 py-0.5">
                  {preview.type === 'video' ? (
                    <FileVideo className="h-3 w-3 text-white" />
                  ) : (
                    <FileImage className="h-3 w-3 text-white" />
                  )}
                </div>
                
                {/* Remove button */}
                {onRemovePhoto && (
                  <button
                    onClick={() => onRemovePhoto(index)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {photoCount >= 10 && (
        <p className="text-xs text-muted-foreground text-center">Maximum 10 files reached</p>
      )}
    </div>
  );
};

export default PhotoUploadSection;
