
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, FileVideo, FileImage } from 'lucide-react';

interface PhotoUploadSectionProps {
  photoCount: number;
  photos?: File[];
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto?: (index: number) => void;
}

const PhotoUploadSection = ({ photoCount, photos = [], onPhotoUpload, onRemovePhoto }: PhotoUploadSectionProps) => {
  const [previews, setPreviews] = useState<{ url: string; type: string; name: string }[]>([]);

  useEffect(() => {
    // Generate previews for uploaded files
    const newPreviews = photos.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      name: file.name
    }));
    setPreviews(newPreviews);

    // Cleanup URLs on unmount
    return () => {
      newPreviews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, [photos]);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Photo & Video Documentation</label>
      
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">Upload photos or videos to document the problem</p>
        <p className="text-xs text-muted-foreground mb-4">Supports images and videos (max 10 files)</p>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={onPhotoUpload}
          className="hidden"
          id="photo-upload"
        />
        <Button variant="outline" onClick={() => document.getElementById('photo-upload')?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Choose Files
        </Button>
      </div>

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {photoCount} file(s) selected
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((preview, index) => (
              <div 
                key={index} 
                className="relative group rounded-lg overflow-hidden border bg-muted aspect-square"
              >
                {preview.type === 'video' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                    <FileVideo className="h-8 w-8 text-gray-500 mb-1" />
                    <span className="text-xs text-gray-500 px-2 text-center truncate w-full">
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
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUploadSection;
