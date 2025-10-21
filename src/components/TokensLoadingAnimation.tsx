"use client";

import { Coins, Zap, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

export function TokensLoadingAnimation() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="relative w-full max-w-md">
        {/* Main Container */}
        <div className="relative bg-card/50 backdrop-blur-sm rounded-lg p-8">
          
          {/* Animated Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Orbiting Icons */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
                <Zap className="absolute -top-8 left-1/2 -translate-x-1/2 w-5 h-5 text-primary" />
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "4s", animationDirection: "reverse" }}>
                <TrendingUp className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-5 h-5 text-secondary" />
              </div>
              
              {/* Center Coin */}
              <div className="relative">
                <Coins className="w-16 h-16 text-primary glow-text animate-pulse" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              </div>
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-black text-accent mb-2 glow-text">
              Loading Tokens
            </h3>
            <p className="text-sm text-muted-foreground">
              Fetching live launches from blockchain...
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="relative h-3 bg-background/50 rounded-full overflow-hidden border border-primary/30">
              {/* Animated Background */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20"
                style={{
                  animation: "shimmer 2s infinite",
                  backgroundSize: "200% 100%"
                }}
              />
              
              {/* Progress Fill */}
              <div
                className="relative h-full bg-gradient-to-r from-primary via-secondary to-primary transition-all duration-300 ease-out"
                style={{ 
                  width: `${progress}%`,
                  boxShadow: "0 0 15px rgba(255, 176, 0, 0.6)"
                }}
              >
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </div>
            </div>
            
            {/* Progress Text */}
            <div className="flex justify-between text-xs font-medium">
              <span className="text-primary">{progress}%</span>
              <span className="text-muted-foreground">Syncing...</span>
            </div>
          </div>

          {/* Floating Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-primary rounded-full"
                style={{
                  left: `${20 + i * 15}%`,
                  animation: `float ${2 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.6
                }}
              />
            ))}
          </div>
        </div>

        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            style={{
              animation: "scan-vertical 3s linear infinite",
              filter: "blur(2px)"
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) scale(1);
            opacity: 0.6;
          }
          50% { 
            transform: translateY(-30px) scale(1.2);
            opacity: 0.3;
          }
        }
        
        @keyframes scan-vertical {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}