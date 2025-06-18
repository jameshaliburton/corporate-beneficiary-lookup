import React, { useRef, useState, useEffect } from 'react';
import { BrowserMultiFormatReader, NotFoundException, Result } from '@zxing/library';

export type ScannerState =
  | 'IDLE'
  | 'CAMERA_ACTIVE'
  | 'BARCODE_DETECTED'
  | 'PROCESSING'
  | 'RESULTS'
  | 'ERROR';

interface BarcodeScannerProps {
  onBarcode: (barcode: string) => void;
  processing: boolean;
  onManualEntry: () => void;
}

const DEBOUNCE_MS = 2000;

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onBarcode, processing, onManualEntry }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scannerState, setScannerState] = useState<ScannerState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<{ barcode: string; ts: number } | null>(null);
  const [alreadyScanned, setAlreadyScanned] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Ensure client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Start camera
  const startCamera = async () => {
    setError(null);
    setScannerState('CAMERA_ACTIVE');
    setDetectedBarcode(null);
    setAlreadyScanned(false);
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
        setError('Camera not available in this environment.');
        setScannerState('ERROR');
        return;
      }
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 480 },
          height: { ideal: 320 },
        },
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError('Camera permission denied or not available.');
      setScannerState('ERROR');
    }
  };

  // Stop camera
  const stopCamera = () => {
    setCameraActive(false);
    setStream(null);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line
  }, []);

  // Barcode scanning logic (client-only)
  useEffect(() => {
    if (!isMounted || !cameraActive || !videoRef.current) return;
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;
    let cancelled = false;

    const scan = () => {
      if (!videoRef.current) return;
      codeReader.decodeFromVideoElement(videoRef.current)
        .then((result: Result) => {
          if (cancelled) return;
          if (result && result.getText()) {
            const text = result.getText();
            if (
              lastScan &&
              lastScan.barcode === text &&
              Date.now() - lastScan.ts < DEBOUNCE_MS
            ) {
              setAlreadyScanned(true);
              setTimeout(() => setAlreadyScanned(false), 1500);
              scan();
              return;
            }
            setDetectedBarcode(text);
            setScannerState('BARCODE_DETECTED');
            setLastScan({ barcode: text, ts: Date.now() });
            codeReader.reset();
          }
        })
        .catch((err) => {
          if (err instanceof NotFoundException) {
            if (!cancelled) requestAnimationFrame(scan);
          } else {
            setError('Scanning failed.');
            setScannerState('ERROR');
            codeReader.reset();
          }
        });
    };
    scan();
    return () => {
      cancelled = true;
      codeReader.reset();
    };
    // eslint-disable-next-line
  }, [cameraActive, isMounted]);

  // Handle processing state
  useEffect(() => {
    if (processing) {
      setScannerState('PROCESSING');
      stopCamera();
    } else if (scannerState === 'PROCESSING') {
      setScannerState('RESULTS');
    }
    // eslint-disable-next-line
  }, [processing]);

  // Confirm scan
  const handleConfirm = () => {
    if (detectedBarcode) {
      setScannerState('PROCESSING');
      stopCamera();
      onBarcode(detectedBarcode);
    }
  };

  // Scan another
  const handleScanAnother = () => {
    setDetectedBarcode(null);
    setScannerState('IDLE');
    setAlreadyScanned(false);
    setError(null);
  };

  // Manual entry fallback
  const handleManual = () => {
    stopCamera();
    setScannerState('IDLE');
    setError(null);
    onManualEntry();
  };

  // Visual feedback
  const borderColor =
    scannerState === 'BARCODE_DETECTED'
      ? 'border-green-500'
      : scannerState === 'ERROR'
      ? 'border-red-500'
      : 'border-blue-400';

  if (!isMounted) {
    return <div className="w-full flex items-center justify-center py-12 text-gray-400">Loading scanner...</div>;
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-4 mt-2 mb-4 flex flex-col items-center">
        <div className="w-full flex flex-col items-center mb-4">
          <div className="text-lg font-semibold text-gray-800 mb-1">Scan a Barcode</div>
          <div className="text-xs text-gray-500 mb-2 text-center">Align the barcode within the frame. Good lighting helps!</div>
        </div>
        {scannerState === 'IDLE' && (
          <>
            <button
              className="w-full bg-blue-600 text-white text-lg font-semibold py-3 rounded shadow hover:bg-blue-700 transition mb-3"
              onClick={startCamera}
              type="button"
            >
              Tap to scan barcode
            </button>
            <button
              className="w-full bg-gray-200 text-gray-700 text-base py-2 rounded shadow hover:bg-gray-300 transition"
              onClick={handleManual}
              type="button"
            >
              Enter manually
            </button>
          </>
        )}
        {(scannerState === 'CAMERA_ACTIVE' || scannerState === 'BARCODE_DETECTED') && (
          <div className="relative w-full max-w-xs aspect-video flex flex-col items-center mt-2 mb-2">
            <video
              ref={videoRef}
              className={`w-full h-auto rounded-lg border-4 ${borderColor} object-cover`}
              playsInline
              muted
              autoPlay
            />
            {/* Overlay with crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-1/2 border-4 border-dashed rounded-lg border-white opacity-80"></div>
              {/* Crosshairs */}
              <div className="absolute left-1/2 top-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2">
                <div className="absolute left-1/2 top-0 w-0.5 h-8 bg-blue-400 -translate-x-1/2" />
                <div className="absolute top-1/2 left-0 h-0.5 w-8 bg-blue-400 -translate-y-1/2" />
              </div>
            </div>
            {scannerState === 'BARCODE_DETECTED' && detectedBarcode && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white bg-opacity-90 px-4 py-2 rounded shadow text-center w-11/12">
                <div className="font-semibold text-green-700">Barcode found!</div>
                <div className="text-lg font-mono tracking-widest">{detectedBarcode}</div>
                <button
                  className="mt-2 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                  onClick={handleConfirm}
                >
                  Confirm scan
                </button>
                <button
                  className="mt-2 w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition"
                  onClick={handleManual}
                >
                  Enter manually
                </button>
              </div>
            )}
            {alreadyScanned && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded shadow text-xs font-semibold">
                Already scanned
              </div>
            )}
          </div>
        )}
        {scannerState === 'PROCESSING' && (
          <div className="w-full flex flex-col items-center mt-4">
            <div className="animate-spin h-8 w-8 border-4 border-t-4 border-t-blue-600 border-blue-200 rounded-full mb-2"></div>
            <div className="text-blue-700 font-medium">Researching ownership...</div>
          </div>
        )}
        {scannerState === 'RESULTS' && (
          <button
            className="w-full bg-blue-600 text-white text-lg font-semibold py-3 rounded shadow hover:bg-blue-700 transition mt-4"
            onClick={handleScanAnother}
          >
            Scan another product
          </button>
        )}
        {scannerState === 'ERROR' && (
          <div className="w-full flex flex-col items-center mt-4">
            <div className="text-red-600 font-semibold mb-2">{error || 'Scanning failed.'}</div>
            <button
              className="w-full bg-gray-200 text-gray-700 text-base py-2 rounded shadow hover:bg-gray-300 transition"
              onClick={handleManual}
            >
              Enter manually
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 