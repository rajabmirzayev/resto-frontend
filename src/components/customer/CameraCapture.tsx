import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { X, RotateCcw } from 'lucide-react';

interface Props {
  onCapture: (photo: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState('');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        if (!cancelled) setError(t('error.camera_permission_denied'));
      }
    };
    init();
    return () => { cancelled = true; stopCamera(); };
  }, [facingMode, stopCamera, t]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    stopCamera();
    onCapture(dataUrl);
  }, [facingMode, stopCamera, onCapture]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const toggleCamera = () => {
    setFacingMode((prev) => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black">
        <h3 className="text-white font-semibold">{t('camera.title')}</h3>
        <button onClick={handleClose} className="p-2 text-white hover:bg-white/10 rounded-xl transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 relative bg-black overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
        <canvas ref={canvasRef} className="hidden" />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
            <p className="text-white text-sm text-center">{error}</p>
          </div>
        )}
      </div>
      <div className="bg-black px-6 py-6 flex items-center justify-center gap-6">
        <button
          onClick={toggleCamera}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={capturePhoto}
          className="w-16 h-16 rounded-full bg-white border-4 border-white/50 flex items-center justify-center hover:scale-105 transition-transform"
        >
          <div className="w-14 h-14 rounded-full border-2 border-gray-300 dark:border-slate-600" />
        </button>
        <div className="w-12 h-12" />
      </div>
    </div>
  );
}
