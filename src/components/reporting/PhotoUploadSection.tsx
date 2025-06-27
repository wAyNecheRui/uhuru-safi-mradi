
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';

interface PhotoUploadSectionProps {
  photoCount: number;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PhotoUploadSection = ({ photoCount, onPhotoUpload }: PhotoUploadSectionProps) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Photo Documentation</label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">Upload photos to document the problem</p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={onPhotoUpload}
          className="hidden"
          id="photo-upload"
        />
        <Button variant="outline" onClick={() => document.getElementById('photo-upload')?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Choose Photos
        </Button>
        {photoCount > 0 && (
          <div className="mt-4">
            <p className="text-sm text-green-600">{photoCount} photo(s) selected</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoUploadSection;
