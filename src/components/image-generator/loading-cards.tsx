"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2 } from "lucide-react";

interface LoadingCardsProps {
  count?: number;
  className?: string;
}

export function LoadingCards({ count = 4, className }: LoadingCardsProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="relative aspect-square bg-gradient-to-br from-sophisticated-gray-100 to-sophisticated-gray-200 dark:from-sophisticated-gray-800 dark:to-sophisticated-gray-700 overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10 -skew-x-12 animate-[shimmer_1.5s_ease-in-out_infinite]" 
                 style={{ 
                   animationDelay: `${index * 0.2}s`,
                 }} 
            />
            
            {/* Central loading icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-ocean-gold/20 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-6 h-6 text-ocean-blue-600 dark:text-ocean-blue-400" />
                </div>
                {/* Spinning ring around the icon */}
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-ocean-blue-500 animate-spin" />
              </div>
            </div>

            {/* Processing indicator at the bottom */}
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-ocean-blue-600" />
                <span className="text-xs text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                  Processing...
                </span>
              </div>
            </div>

            {/* Floating particles effect */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 3 }).map((_, particleIndex) => (
                <div
                  key={particleIndex}
                  className="absolute w-1 h-1 bg-ocean-blue-400 rounded-full animate-[float_3s_ease-in-out_infinite]"
                  style={{
                    left: `${20 + (particleIndex * 30)}%`,
                    animationDelay: `${particleIndex * 1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Add these keyframes to your global CSS or tailwind config
// @keyframes shimmer {
//   0% { transform: translateX(-100%) skewX(-12deg); }
//   100% { transform: translateX(200%) skewX(-12deg); }
// }
// 
// @keyframes float {
//   0%, 100% { transform: translateY(0px) opacity-0; }
//   50% { transform: translateY(-10px) opacity-1; }
// }