import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, Upload, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentPosition } from '@/utils/geoUtils';

interface MediaFile {
  id: string;
  url: string;
  type: 'photo' | 'video';
  timestamp: string;
  gpsCoordinates?: string;
  fileName: string;
  size: number;
}

interface CameraIntegrationProps {
  onMediaCapture?: (files: MediaFile[]) => void;
  maxFiles?: number;
  allowVideo?: boolean;
  reportId?: string;
}

const CameraIntegration: React.FC<CameraIntegrationProps> = ({
  onMediaCapture,
  maxFiles = 10,
  allowVideo = true,
  reportId
}) => {
  const { user } = useAuth();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const { toast } = useToast();

  const getCurrentLocationString = async (): Promise<string> => {
    try {
      const pos = await getCurrentPosition();
      return `${pos.lat.toFixed(6)}, ${pos.lon.toFixed(6)}`;
    } catch (error) {
      console.warn('Location access denied or unavailable:', error);
      return 'Location not available';
    }
  };

  const handleFileCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (mediaFiles.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      });
      return;
    }

    setCapturing(true);

    try {
      const gpsCoordinates = await getCurrentLocation();
      const newFiles: MediaFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith('video/');
        
        if (isVideo && !allowVideo) {
          toast({
            title: "Video not allowed",
            description: "Only photos are permitted for this upload",
            variant: "destructive"
          });
          continue;
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        
        const mediaFile: MediaFile = {
          id: `temp-${Date.now()}-${i}`,
          url: previewUrl,
          type: isVideo ? 'video' : 'photo',
          timestamp: new Date().toISOString(),
          gpsCoordinates,
          fileName: file.name,
          size: file.size
        };

        newFiles.push(mediaFile);
      }

      const updatedFiles = [...mediaFiles, ...newFiles];
      setMediaFiles(updatedFiles);
      onMediaCapture?.(updatedFiles);

      toast({
        title: "Media captured successfully",
        description: `${newFiles.length} file(s) added with GPS coordinates`
      });

    } catch (error) {
      console.error('Error capturing media:', error);
      toast({
        title: "Capture failed",
        description: "Failed to capture media files",
        variant: "destructive"
      });
    } finally {
      setCapturing(false);
    }
  };

  const uploadToSupabase = async (file: File, fileName: string): Promise<string> => {
    if (!user) throw new Error('User must be logged in to upload files');
    
    // Path must start with user.id to satisfy RLS policy
    const { data, error } = await supabase.storage
      .from('report-files')
      .upload(`${user.id}/${reportId || 'media'}/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('report-files')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleUploadAll = async () => {
    if (mediaFiles.length === 0) return;

    setUploading(true);

    try {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (!fileInput?.files) return;

      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < Math.min(fileInput.files.length, mediaFiles.length); i++) {
        const file = fileInput.files[i];
        const fileName = `${Date.now()}-${file.name}`;
        
        try {
          const publicUrl = await uploadToSupabase(file, fileName);
          uploadedUrls.push(publicUrl);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          });
        }
      }

      // Update media files with uploaded URLs
      const updatedFiles = mediaFiles.map((file, index) => ({
        ...file,
        url: uploadedUrls[index] || file.url,
        id: uploadedUrls[index] ? `uploaded-${Date.now()}-${index}` : file.id
      }));

      setMediaFiles(updatedFiles);
      onMediaCapture?.(updatedFiles);

      toast({
        title: "Upload completed",
        description: `${uploadedUrls.length} file(s) uploaded successfully`
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload media files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = mediaFiles.filter(file => file.id !== fileId);
    setMediaFiles(updatedFiles);
    onMediaCapture?.(updatedFiles);
    
    // Revoke object URL if it's a temporary preview
    const fileToRemove = mediaFiles.find(f => f.id === fileId);
    if (fileToRemove?.url.startsWith('blob:')) {
      URL.revokeObjectURL(fileToRemove.url);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Media Capture & GPS Tagging
          </CardTitle>
          <p className="text-sm text-gray-600">
            Capture photos and videos with automatic GPS coordinates for evidence documentation.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Capture Controls */}
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <input
                type="file"
                accept={allowVideo ? "image/*,video/*" : "image/*"}
                multiple
                capture="environment"
                onChange={handleFileCapture}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={capturing || mediaFiles.length >= maxFiles}
              />
              <Button 
                disabled={capturing || mediaFiles.length >= maxFiles}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Camera className="h-4 w-4 mr-2" />
                {capturing ? 'Capturing...' : 'Capture Media'}
              </Button>
            </div>

            {mediaFiles.length > 0 && (
              <Button
                onClick={handleUploadAll}
                disabled={uploading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : `Upload All (${mediaFiles.length})`}
              </Button>
            )}
          </div>

          {/* File Count Status */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{mediaFiles.length} of {maxFiles} files selected</span>
            {mediaFiles.length > 0 && (
              <span>
                Total size: {formatFileSize(mediaFiles.reduce((total, file) => total + file.size, 0))}
              </span>
            )}
          </div>

          {/* Media Preview Grid */}
          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaFiles.map((file) => (
                <div key={file.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    {file.type === 'photo' ? (
                      <img
                        src={file.url}
                        alt="Captured evidence"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <div className="text-center">
                          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-xs text-gray-600">Video</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File Info Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeFile(file.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* File Details */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge className={file.type === 'photo' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                        {file.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    
                    {file.gpsCoordinates && file.gpsCoordinates !== 'Location not available' && (
                      <div className="flex items-center text-xs text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{file.gpsCoordinates}</span>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      {new Date(file.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          {mediaFiles.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No media captured yet</h3>
              <p className="text-gray-600 mb-4">
                Use the camera to capture photos{allowVideo ? ' and videos' : ''} with GPS coordinates
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>• GPS coordinates are automatically added</p>
                <p>• Timestamp is recorded for each capture</p>
                <p>• Files are compressed for optimal upload</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraIntegration;