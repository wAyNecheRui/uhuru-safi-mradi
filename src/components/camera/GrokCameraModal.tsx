import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Camera, X, RotateCcw, Check, SwitchCamera, 
  Zap, ZapOff, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface GrokCameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  maxFiles?: number;
  capturedCount?: number;
}

const GrokCameraModal: React.FC<GrokCameraModalProps> = ({
  open,
  onClose,
  onCapture,
  maxFiles = 10,
  capturedCount = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  // Start camera stream when modal opens (desktop / PWA)
  useEffect(() => {
    if (open && !isMobile) {
      startStream();
    }
    return () => stopStream();
  }, [open, facingMode, isMobile]);

  // On mobile, immediately trigger native camera when modal opens
  useEffect(() => {
    if (open && isMobile) {
      // small delay so the Dialog renders first
      const t = setTimeout(() => mobileInputRef.current?.click(), 150);
      return () => clearTimeout(t);
    }
  }, [open, isMobile]);

  const startStream = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;

      // Check flash / torch support
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      setFlashSupported(!!capabilities?.torch);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera permissions.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Unable to access camera.');
      }
    }
  }, [facingMode]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({ advanced: [{ torch: !flashEnabled }] });
      setFlashEnabled(!flashEnabled);
    } catch {
      toast.error('Flash not supported on this device');
    }
  }, [flashEnabled]);

  const switchCamera = useCallback(() => {
    stopStream();
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  }, [stopStream]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPreview(dataUrl);
    setIsCapturing(false);
  }, [facingMode]);

  const confirmPhoto = useCallback(async () => {
    if (!capturedPreview) return;
    const res = await fetch(capturedPreview);
    const blob = await res.blob();
    const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
    onCapture(file);
    setCapturedPreview(null);
    toast.success('📸 Photo captured');
    // Don't close — let user take more
  }, [capturedPreview, onCapture]);

  const retakePhoto = useCallback(() => {
    setCapturedPreview(null);
  }, []);

  // Handle native mobile camera result
  const handleMobileCapture = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) {
        onClose(); // user cancelled
        return;
      }
      Array.from(files).forEach(f => {
        if (capturedCount < maxFiles) onCapture(f);
      });
      toast.success('📸 Photo captured');
      e.target.value = '';
      onClose();
    },
    [capturedCount, maxFiles, onCapture, onClose],
  );

  // Gallery upload
  const handleGalleryUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      let added = 0;
      Array.from(files).forEach(f => {
        if (capturedCount + added < maxFiles) {
          onCapture(f);
          added++;
        }
      });
      if (added) toast.success(`${added} file(s) added`);
      e.target.value = '';
    },
    [capturedCount, maxFiles, onCapture],
  );

  const handleClose = useCallback(() => {
    stopStream();
    setCapturedPreview(null);
    setCameraError('');
    onClose();
  }, [stopStream, onClose]);

  const atLimit = capturedCount >= maxFiles;

  // Mobile: render a transparent dialog with hidden file input only
  if (isMobile) {
    return (
      <>
        <input
          ref={mobileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleMobileCapture}
        />
        {/* No visible dialog on mobile — native camera takes over */}
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="p-0 gap-0 border-0 bg-black max-w-none w-screen h-screen sm:max-w-2xl sm:h-[85dvh] sm:rounded-2xl overflow-hidden [&>button]:hidden">
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleGalleryUpload}
        />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full h-10 w-10"
            onClick={handleClose}
            aria-label="Close camera"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            {flashSupported && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                onClick={toggleFlash}
                aria-label={flashEnabled ? 'Disable flash' : 'Enable flash'}
              >
                {flashEnabled ? <Zap className="h-5 w-5 text-yellow-400" /> : <ZapOff className="h-5 w-5" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full h-10 w-10"
              onClick={switchCamera}
              aria-label="Switch camera"
            >
              <SwitchCamera className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Camera viewfinder / Preview */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {cameraError ? (
            <div className="text-center text-white px-6 space-y-4">
              <Camera className="h-16 w-16 mx-auto text-white/40" />
              <p className="text-lg font-medium">{cameraError}</p>
              <Button variant="outline" className="border-white/30 text-white" onClick={startStream}>
                Retry
              </Button>
            </div>
          ) : capturedPreview ? (
            <img
              src={capturedPreview}
              alt="Captured"
              className="w-full h-full object-contain animate-in fade-in-0 zoom-in-95 duration-200"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}

          {/* Capture flash overlay */}
          {isCapturing && (
            <div className="absolute inset-0 bg-white animate-out fade-out-0 duration-150 z-30" />
          )}
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-6 pb-8 pt-12">
          {capturedPreview ? (
            /* Preview controls */
            <div className="flex items-center justify-center gap-8">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20 rounded-full flex flex-col items-center gap-1 h-auto py-2 px-4"
                onClick={retakePhoto}
              >
                <RotateCcw className="h-6 w-6" />
                <span className="text-xs">Retake</span>
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex flex-col items-center gap-1 h-auto py-3 px-8 shadow-lg shadow-primary/30"
                onClick={confirmPhoto}
                disabled={atLimit}
              >
                <Check className="h-6 w-6" />
                <span className="text-xs font-medium">Use Photo</span>
              </Button>
            </div>
          ) : (
            /* Capture controls */
            <div className="flex items-center justify-between">
              {/* Gallery button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full h-12 w-12"
                onClick={() => galleryInputRef.current?.click()}
                disabled={atLimit}
                aria-label="Choose from gallery"
              >
                <ImageIcon className="h-6 w-6" />
              </Button>

              {/* Capture button — Grok style */}
              <button
                onClick={takePhoto}
                disabled={!isStreaming || atLimit}
                className="relative h-[72px] w-[72px] rounded-full flex items-center justify-center group disabled:opacity-40"
              >
                {/* Outer ring */}
                <span className="absolute inset-0 rounded-full border-[3px] border-white/80 group-hover:border-white transition-colors" />
                {/* Inner circle */}
                <span className="h-[58px] w-[58px] rounded-full bg-white group-hover:bg-white/90 group-active:scale-90 transition-all duration-100 shadow-lg" />
              </button>

              {/* Counter badge */}
              <div className="h-12 w-12 flex items-center justify-center">
                {capturedCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center">
                    {capturedCount}
                  </span>
                )}
              </div>
            </div>
          )}

          {atLimit && (
            <p className="text-center text-white/60 text-xs mt-3">Maximum {maxFiles} files reached</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GrokCameraModal;
