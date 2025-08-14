"use client";

import { Star, Shield, Clock, Users } from "lucide-react";

interface TrustSignalsProps {
  variant?: "compact" | "detailed";
  className?: string;
}

export function TrustSignals({ variant = "compact", className = "" }: TrustSignalsProps) {
  if (variant === "compact") {
    return (
      <div className={`flex items-center justify-center gap-6 text-sm text-muted-foreground ${className}`}>
        <div className="flex items-center gap-1">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="ml-2">4.9/5 from 500+ users</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="w-4 h-4 text-green-600" />
          <span>SSL Secured</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>24/7 Support</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}>
      <div className="text-center">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
        <div className="text-sm font-medium">4.9/5 Rating</div>
        <div className="text-xs text-muted-foreground">500+ Reviews</div>
      </div>
      
      <div className="text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Shield className="w-6 h-6 text-green-600" />
        </div>
        <div className="text-sm font-medium">Secure & Safe</div>
        <div className="text-xs text-muted-foreground">SSL Protected</div>
      </div>
      
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <div className="text-sm font-medium">500+ Brands</div>
        <div className="text-xs text-muted-foreground">Trust Piktor</div>
      </div>
      
      <div className="text-center">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Clock className="w-6 h-6 text-purple-600" />
        </div>
        <div className="text-sm font-medium">5 Min Setup</div>
        <div className="text-xs text-muted-foreground">Get Started Fast</div>
      </div>
    </div>
  );
}