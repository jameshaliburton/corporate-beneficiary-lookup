import { Loader2, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface LoadingScreenProps {
  context?: 'image' | 'manual';
}

export function LoadingScreen({ context = 'image' }: LoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [agentMessageIndex, setAgentMessageIndex] = useState(0);
  
  // Different progress steps based on context
  const progressSteps = context === 'image' 
    ? [
        "Running vision + OCR to detect the product",
        "Matching brand data with ownership databases", 
        "Agents verifying ownership and confidence level"
      ]
    : [
        "Analyzing your search query",
        "Matching brand data with ownership databases", 
        "Agents verifying ownership and confidence level"
      ];

  const agentMessages = context === 'image'
    ? [
        "🤖 Our agents are piecing it together…",
        "🔍 Cross-checking brand ownership…",
        "📊 Verifying the final details…",
        "🧠 AI models analyzing patterns…",
        "🔗 Connecting the ownership dots…"
      ]
    : [
        "🔍 Researching your brand query…",
        "📊 Cross-checking ownership databases…",
        "🤖 AI agents verifying the details…",
        "🔗 Connecting the ownership chain…",
        "📋 Finalizing the results…"
      ];

  // Progress through steps
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < progressSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }, 1800); // 1.8 seconds per step

    return () => clearTimeout(timer);
  }, [currentStep, progressSteps.length]);

  // Rotate agent messages
  useEffect(() => {
    const messageTimer = setInterval(() => {
      setAgentMessageIndex((prev) => (prev + 1) % agentMessages.length);
    }, 2200); // Change message every 2.2 seconds

    return () => clearInterval(messageTimer);
  }, [agentMessages.length]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <div className="text-center space-y-8 w-full max-w-lg mx-auto px-4">
        <div className="glass-card p-10 space-y-8">
          
          {/* Spinner with glow and pulse */}
          <div className="flex justify-center">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-primary-glow animate-spin" />
              <div className="absolute inset-0 h-12 w-12 rounded-full bg-primary-glow/30 blur-lg animate-pulse"></div>
            </div>
          </div>
          
          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-[22px] font-bold text-foreground">
              {context === 'image' 
                ? "Our AI agents are on the case…"
                : "Researching your brand…"
              }
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {context === 'image'
                ? "Using computer vision and AI agents to analyze the product, detect the brand, and uncover the real owner."
                : "Using AI agents to research your brand, match it with ownership databases, and uncover the real owner."
              }
            </p>
          </div>
          
          {/* Animated progress steps */}
          <div className="space-y-3">
            {progressSteps.map((step, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-3 text-left transition-all duration-500 ${
                  index === currentStep 
                    ? 'text-primary-glow animate-pulse' 
                    : index < currentStep 
                      ? 'text-muted-foreground' 
                      : 'text-muted-foreground/50'
                }`}
              >
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 ${
                  index < currentStep 
                    ? 'bg-primary-glow text-background' 
                    : index === currentStep 
                      ? 'bg-primary-glow/20 border border-primary-glow animate-pulse' 
                      : 'bg-muted/20 border border-muted/30'
                }`}>
                  {index < currentStep ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${
                      index === currentStep ? 'bg-primary-glow' : 'bg-muted/50'
                    }`} />
                  )}
                </div>
                <span className="text-[15px]">{step}</span>
              </div>
            ))}
          </div>

          {/* Agent personality message */}
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground/80 animate-fade-in" key={agentMessageIndex}>
              {agentMessages[agentMessageIndex]}
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}