import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScanButtonProps {
  onClick: () => void;
  isScanning?: boolean;
}

export function ScanButton({ onClick, isScanning = false }: ScanButtonProps) {
  return (
    <div className="relative flex flex-col items-center">
      <Button
        onClick={onClick}
        disabled={isScanning}
        className={`
          relative h-24 w-24 rounded-full bg-primary hover:bg-primary-hover 
          transition-all duration-500 shadow-2xl hover:shadow-primary/25
          ${isScanning ? 'scan-pulse animate-pulse scan-glow' : 'hover:scale-110 neo-glow'}
          ring-4 ring-primary/30 hover:ring-primary-glow/40 glass-button
        `}
      >
        <Camera className={`h-10 w-10 text-primary-foreground transition-transform duration-300 ${isScanning ? 'scale-110' : ''}`} />
      </Button>
      
      {/* Magical glow effect */}
              <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/20 via-emerald-400/30 to-emerald-500/20 blur-2xl transition-all duration-1000 ${isScanning ? 'opacity-100 scale-150' : 'opacity-60 scale-100'}`}></div>
      
      {isScanning && (
        <div className="mt-4 text-center">
          <p className="text-sm font-bold text-primary-glow animate-pulse uppercase tracking-wide">
            Exposing...
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Uncovering corporate secrets
          </p>
        </div>
      )}
    </div>
  );
}