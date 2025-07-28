import { Camera, Zap } from "lucide-react";

interface VideoCaptureProps {
  onCapture: () => void;
  isScanning?: boolean;
}

export function VideoCapture({ onCapture, isScanning = false }: VideoCaptureProps) {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Main capture frame - vertical aspect ratio - clickable */}
      <button
        onClick={onCapture}
        disabled={isScanning}
        className={`relative aspect-[9/16] w-full glass rounded-3xl border border-glass-border overflow-hidden transition-all duration-500 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-primary/30 ${isScanning ? 'ring-4 ring-primary-glow/50 animate-pulse' : ''}`}
      >
        
        {/* Video preview area */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/10 via-transparent to-primary/5">
          
          {/* Camera icon - perfectly centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-20 h-20 rounded-full glass border border-glass-border flex items-center justify-center transition-all duration-300 ${isScanning ? 'scale-110 animate-pulse bg-primary/20' : 'hover:scale-105'}`}>
              <Camera className={`h-8 w-8 text-primary-glow transition-all duration-300 ${isScanning ? 'animate-pulse' : ''}`} />
            </div>
          </div>
          
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
                    Position product in frame
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tap to reveal ownership
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
      
      {/* Bottom instruction */}
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          {isScanning ? 'Analyzing product...' : 'Tap camera to scan product'}
        </p>
      </div>
    </div>
  );
}