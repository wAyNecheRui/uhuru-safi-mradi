import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw, Upload, Image as ImageIcon, Aperture, SwitchCamera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebCameraCaptureProps {
  onCapture: (file: File) => void;
  onClose?: () => void;
  maxFiles?: number;
  capturedCount?: number;
  inline?: boolean;
}

const WebCameraCapture: React.FC<WebCameraCaptureProps> = ({
  onCapture,
  onClose,
  maxFiles = 5,
  capturedCount = 0,
  inline = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOpen(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Unable to access camera. Please try uploading a photo instead.');
      }
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCapturedPreview(null);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPreview(dataUrl);
  }, []);

  const confirmPhoto = useCallback(async () => {
    if (!capturedPreview) return;
    const res = await fetch(capturedPreview);
    const blob = await res.blob();
    const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
    onCapture(file);
    setCapturedPreview(null);
    toast({ title: '📸 Photo captured', description: 'Photo added to your submission.' });
  }, [capturedPreview, onCapture, toast]);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(startCamera, 200);
  }, [stopCamera, startCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (capturedCount < maxFiles) onCapture(file);
    });
  };

  const atLimit = capturedCount >= maxFiles;

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Camera viewfinder */}
      {isCameraOpen && (
        <div className="relative rounded-xl overflow-hidden bg-black border-2 border-primary/20">
          {capturedPreview ? (
            <img src={capturedPreview} alt="Preview" className="w-full aspect-[4/3] object-cover" />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover" />
          )}

          {/* Camera overlay controls */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-center gap-4">
              {capturedPreview ? (
                <>
                  <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white" onClick={() => setCapturedPreview(null)}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Retake
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmPhoto}>
                    <Aperture className="h-4 w-4 mr-1" /> Use Photo
                  </Button>
                </>
              ) : (
                <>
                  <Button size="icon" variant="outline" className="bg-white/10 border-white/20 text-white rounded-full h-10 w-10" onClick={switchCamera}>
                    <SwitchCamera className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="bg-white text-black rounded-full h-14 w-14 shadow-lg hover:bg-white/90"
                    onClick={takePhoto}
                    disabled={atLimit}
                  >
                    <div className="h-10 w-10 rounded-full border-2 border-black/20" />
                  </Button>
                  <Button size="icon" variant="outline" className="bg-white/10 border-white/20 text-white rounded-full h-10 w-10" onClick={stopCamera}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons when camera is closed */}
      {!isCameraOpen && (
        <div className={`grid ${inline ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-2`}>
          <Button
            type="button"
            variant="outline"
            className="h-14 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={startCamera}
            disabled={atLimit}
          >
            <Camera className="h-5 w-5 mr-2 text-primary" />
            <span className="font-medium">Take Photo</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-14 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={() => fileInputRef.current?.click()}
            disabled={atLimit}
          >
            <Upload className="h-5 w-5 mr-2 text-muted-foreground" />
            <span className="font-medium">Upload File</span>
          </Button>
        </div>
      )}

      {cameraError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <Camera className="h-3 w-3" /> {cameraError}
        </p>
      )}

      {atLimit && (
        <p className="text-xs text-muted-foreground text-center">Maximum {maxFiles} files reached</p>
      )}
    </div>
  );
};

export default WebCameraCapture;
