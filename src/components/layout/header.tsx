"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { trackNavigation } from "@/lib/analytics";
import { useSimpleAuth } from "@/components/auth/simple-auth-provider";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSimpleAuth();
  const closeMenu = () => {};

  const handleCTAClick = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signup');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sophisticated-gray-200/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm dark:border-sophisticated-gray-700/60 dark:bg-sophisticated-gray-950/95 dark:supports-[backdrop-filter]:bg-sophisticated-gray-950/80">
      <div className="container flex h-16 max-w-screen-2xl items-center mx-auto px-4 lg:px-6">
        {/* Logo and Brand */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-3 group" onClick={closeMenu}>
            <div className="relative w-10 h-10 bg-gradient-ocean-deep rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
              <Sparkles className="w-5 h-5 text-white" />
              <div className="absolute inset-0 bg-gradient-ocean-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-sophisticated-gray-900 dark:text-sophisticated-gray-50 group-hover:text-ocean-blue-700 dark:group-hover:text-ocean-blue-400 transition-colors">Piktor</span>
              <span className="text-xs text-muted-foreground font-medium">Vos produits, en scène.</span>
            </div>
          </Link>
        </div>


        {/* Desktop CTA Button */}
        <div className="hidden md:flex flex-1 items-center justify-end">
          <Button
            size="default"
            className="bg-gradient-ocean-deep hover:opacity-90 text-white font-semibold shadow-md transition-all duration-200 hover:scale-105"
            onClick={handleCTAClick}
          >
            {user ? 'Dashboard' : 'Tester gratuitement'}
          </Button>
        </div>

        {/* Mobile CTA Button */}
        <div className="flex md:hidden flex-1 items-center justify-end">
          <Button
            size="default"
            className="bg-gradient-ocean-deep hover:opacity-90 text-white font-semibold shadow-md transition-all duration-200 hover:scale-105"
            onClick={handleCTAClick}
          >
            {user ? 'Dashboard' : 'Tester gratuitement'}
          </Button>
        </div>
      </div>

    </header>
  );
}