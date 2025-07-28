'use client';

import { Camera, Zap } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface VideoCaptureProps {
  onCapture: (imageData?: string) => void;
  isScanning?: boolean;
}

export function VideoCapture({ onCapture, isScanning = false }: VideoCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setIsInitializing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      setIsCameraActive(true);
      
      // Set the video source after a short delay to ensure the ref is available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('📹 Video stream attached to video element');
        }
        setIsInitializing(false);
      }, 100);
      
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera permissions.');
      // Fallback to mock camera for testing
      setIsCameraActive(false);
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !isCameraActive) {
      // Don't call onCapture if camera isn't ready - just show error
      setError('Camera not ready. Please wait for camera to initialize.');
      return;
    }

    const video = videoRef.current;
    
    // Wait for video to be ready
    if (video.readyState < 2) { // HAVE_CURRENT_DATA
      setError('Camera not ready. Please wait a moment.');
      return;
    }

    try {
      // Create a canvas to capture the video frame
      const canvas = document.createElement('canvas');
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 JPEG
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        console.log('📸 Image captured successfully, length:', imageData.length);
        
        // Call onCapture with the image data
        onCapture(imageData);
      } else {
        throw new Error('Could not get canvas context');
      }
    } catch (err) {
      console.error('Image capture error:', err);
      setError('Failed to capture image. Please try again.');
      // Don't call onCapture on error - let user try again
    }
  };

  const handleCaptureClick = () => {
    if (isScanning || isInitializing || !isCameraActive) return;
    captureImage();
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Main capture frame - vertical aspect ratio - clickable */}
      <button
        onClick={handleCaptureClick}
        disabled={isScanning || isInitializing || !isCameraActive}
        className={`relative aspect-[9/16] w-full glass rounded-3xl border border-glass-border overflow-hidden transition-all duration-500 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-primary/30 ${isScanning ? 'ring-4 ring-primary-glow/50 animate-pulse' : ''} ${isInitializing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        
        {/* Video preview area */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/10 via-transparent to-primary/5">
          
          {/* Live video feed */}
          {isCameraActive && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          
          {/* Camera icon overlay - only show when not scanning and camera not active */}
          {!isScanning && !isCameraActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-20 h-20 rounded-full glass border border-glass-border flex items-center justify-center transition-all duration-300 ${isScanning ? 'scale-110 animate-pulse bg-primary/20' : 'hover:scale-105'}`}>
                <Camera className={`h-8 w-8 text-primary-glow transition-all duration-300 ${isScanning ? 'animate-pulse' : ''}`} />
              </div>
            </div>
          )}
          
          {/* Status text - positioned at bottom */}
          <div className="absolute bottom-8 left-0 right-0">
            <div className="text-center">
              {isScanning ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <Zap className="h-4 w-4 text-primary-glow animate-pulse" />
                    <span className="text-sm font-bold text-primary-glow uppercase tracking-wide">
                      Scanning
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reading product details...
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {isInitializing ? 'Initializing camera...' : 
                     isCameraActive ? 'Position product in frame' : 'Camera not available'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isInitializing ? 'Please wait...' :
                     isCameraActive ? 'Tap to capture and analyze' : 'Using fallback mode'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Scan overlay grid */}
        <div className={`absolute inset-4 border-2 border-dashed rounded-2xl transition-all duration-500 ${isScanning ? 'border-primary-glow/70 animate-pulse' : 'border-primary/30'}`}>
          {/* Corner markers */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary-glow rounded-tl"></div>
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary-glow rounded-tr"></div>
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary-glow rounded-bl"></div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary-glow rounded-br"></div>
        </div>
      </button>
      
      {/* Error message */}
      {error && (
        <div className="mt-2 text-center">
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}
      
      {/* Bottom instruction */}
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          {isScanning ? 'Analyzing product...' : 'Tap camera to scan product'}
        </p>
      </div>
    </div>
  );
}