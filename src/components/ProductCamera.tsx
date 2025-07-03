'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ProductCameraProps {
  onImageCaptured: (file: File) => void;
  onClose: () => void;
}

export default function ProductCamera({ onImageCaptured, onClose }: ProductCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      setError('Failed to get canvas context');
      setIsCapturing(false);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'product-image.jpg', { type: 'image/jpeg' });
        onImageCaptured(file);
        stopCamera();
      } else {
        setError('Failed to capture image');
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.8);
  }, [onImageCaptured, stopCamera]);

  const handleRetake = useCallback(() => {
    startCamera();
  }, [startCamera]);

  // Fix: Only run once on mount, cleanup on unmount
  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, []); // Empty dependency array - only run once

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            📸 Take Product Photo
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Take a clear photo of the <strong>brand name or company name</strong> on the product.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="relative mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 bg-gray-100 rounded-lg object-cover"
          />
          
          {isCameraActive && !isCapturing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white rounded-lg p-2">
                <div className="w-48 h-32 border-2 border-blue-400 rounded"></div>
              </div>
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            className="hidden"
          />
        </div>

        <div className="flex flex-col gap-3">
          {isCameraActive && !isCapturing && (
            <Button
              onClick={captureImage}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isCapturing}
            >
              📷 Capture Photo
            </Button>
          )}
          
          {isCapturing && (
            <Button disabled className="bg-gray-400 text-white">
              📸 Capturing...
            </Button>
          )}
          
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-300 text-gray-700"
          >
            ✕ Cancel
          </Button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>💡 Tips:</strong> Look for logos, brand names, or company information. 
            Focus on the main branding area where the company name is displayed. 
            Good lighting and a steady hand will improve recognition accuracy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 