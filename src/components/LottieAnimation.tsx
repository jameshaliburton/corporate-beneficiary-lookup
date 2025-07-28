import { useEffect, useRef } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

interface LottieAnimationProps {
  animationData: any | null;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
}

export function LottieAnimation({
  animationData,
  className = "",
  loop = true,
  autoplay = true,
  speed = 1
}: LottieAnimationProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(speed);
    }
  }, [speed]);

  // Apply theme colors to Lottie animation
  const style = {
    filter: 'hue-rotate(120deg) saturate(1.2) brightness(1.1)',
  };

  return (
    <div className={`relative ${className}`}>
      <div className="glass rounded-xl border border-glass-border p-6 backdrop-blur-xl bg-gradient-to-br from-primary/10 via-transparent to-primary-glow/5">
        {animationData ? (
          <Lottie
            lottieRef={lottieRef}
            animationData={animationData}
            loop={loop}
            autoplay={autoplay}
            style={style}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary-glow/20 rounded-full mx-auto animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 bg-primary-glow/40 rounded-full animate-pulse"></div>
              </div>
              <div className="text-sm text-primary-glow/80 font-medium">Ready for Lottie Animation</div>
              <div className="text-xs text-muted-foreground">Provide animationData prop</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}