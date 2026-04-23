import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw, Upload, Aperture, SwitchCamera } from 'lucide-react';
import { toast } from 'sonner';

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
  maxFiles = 10,
  capturedCount = 0,
  inline = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  // On mobile: use native camera input. On desktop: use getUserMedia stream.
  const handleCameraClick = useCallback(() => {
    if (isMobile) {
      // Trigger native camera via file input with capture attribute
      cameraInputRef.current?.click();
    } else {
      // Desktop: open getUserMedia stream
      startDesktopCamera();
    }
  }, [isMobile]);

  const startDesktopCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
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
    toast.success('📸 Photo captured and added');
  }, [capturedPreview, onCapture]);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(() => startDesktopCamera(), 200);
  }, [stopCamera, startDesktopCamera]);

  // Handle files from native camera input (mobile)
  const handleCameraInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      if (capturedCount < maxFiles) {
        onCapture(file);
        toast.success('📸 Photo captured and added');
      }
    });
    // Reset so user can capture again
    e.target.value = '';
  }, [capturedCount, maxFiles, onCapture]);

  // Handle files from gallery/file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    let added = 0;
    Array.from(files).forEach(file => {
      if (capturedCount + added < maxFiles) {
        onCapture(file);
        added++;
      }
    });
    if (added > 0) {
      toast.success(`${added} file(s) added successfully`);
    }
    // Reset so user can select again
    e.target.value = '';
  }, [capturedCount, maxFiles, onCapture]);

  const atLimit = capturedCount >= maxFiles;

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Hidden file input for gallery upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />
      
      {/* Hidden file input for native mobile camera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraInput}
      />

      {/* Desktop camera viewfinder */}
      {isCameraOpen && !isMobile && (
        <div className="relative rounded-xl overflow-hidden bg-black border-2 border-primary/20">
          {capturedPreview ? (
            <img src={capturedPreview} alt="Preview" className="w-full aspect-[4/3] object-cover" />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover" />
          )}

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
                  <Button size="icon" variant="outline" className="bg-white/10 border-white/20 text-white rounded-full h-10 w-10" onClick={switchCamera} aria-label="Switch camera">
                    <SwitchCamera className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="bg-white text-black rounded-full h-14 w-14 shadow-lg hover:bg-white/90"
                    onClick={takePhoto}
                    disabled={atLimit}
                    aria-label="Take photo"
                  >
                    <div className="h-10 w-10 rounded-full border-2 border-black/20" />
                  </Button>
                  <Button size="icon" variant="outline" className="bg-white/10 border-white/20 text-white rounded-full h-10 w-10" onClick={stopCamera} aria-label="Stop camera">
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isCameraOpen && (
        <div className={`grid ${inline ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-2`}>
          <Button
            type="button"
            variant="outline"
            className="h-14 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={handleCameraClick}
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
