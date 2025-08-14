"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

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
              <span className="text-xs text-muted-foreground font-medium">AI Image Studio</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium ml-12">
          <Link
            href="/templates"
            className="relative py-2 px-1 text-sophisticated-gray-600 hover:text-ocean-blue-700 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 transition-all duration-200 hover:scale-105"
          >
            Examples
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-ocean-gold transition-all duration-200 hover:w-full"></span>
          </Link>
          <Link
            href="/generate"
            className="relative py-2 px-1 text-sophisticated-gray-600 hover:text-ocean-blue-700 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 transition-all duration-200 hover:scale-105"
          >
            How It Works
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-ocean-gold transition-all duration-200 hover:w-full"></span>
          </Link>
          <Link
            href="#pricing"
            className="relative py-2 px-1 text-sophisticated-gray-600 hover:text-ocean-blue-700 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 transition-all duration-200 hover:scale-105"
          >
            Pricing
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-ocean-gold transition-all duration-200 hover:w-full"></span>
          </Link>
        </nav>

        {/* Desktop CTA Button */}
        <div className="hidden md:flex flex-1 items-center justify-end space-x-3">
          <Button variant="outline" size="default" asChild className="font-semibold">
            <Link href="/upload">Try Free</Link>
          </Button>
          <Button variant="primary" size="default" asChild className="font-semibold">
            <Link href="/upload">Start Creating</Link>
          </Button>
        </div>

        {/* Mobile Hamburger Menu Button */}
        <div className="flex md:hidden flex-1 items-center justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            className="relative"
            aria-label="Toggle menu"
          >
            <div className="relative w-5 h-5">
              {isMenuOpen ? (
                <X className="h-5 w-5 text-sophisticated-gray-700 dark:text-sophisticated-gray-300" />
              ) : (
                <Menu className="h-5 w-5 text-sophisticated-gray-700 dark:text-sophisticated-gray-300" />
              )}
            </div>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out animate-fade-in",
          isMenuOpen
            ? "max-h-80 opacity-100 border-b border-sophisticated-gray-200/60 dark:border-sophisticated-gray-700/60"
            : "max-h-0 opacity-0"
        )}
      >
        <div className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-sophisticated-gray-950/95 dark:supports-[backdrop-filter]:bg-sophisticated-gray-950/80">
          <nav className="container mx-auto px-4 py-6 space-y-4">
            <Link
              href="/templates"
              className="block py-3 px-2 text-sm font-medium text-sophisticated-gray-600 hover:text-ocean-blue-700 hover:bg-sophisticated-gray-50 rounded-lg transition-all duration-200 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 dark:hover:bg-sophisticated-gray-800/50"
              onClick={closeMenu}
            >
              Examples
            </Link>
            <Link
              href="/generate"
              className="block py-3 px-2 text-sm font-medium text-sophisticated-gray-600 hover:text-ocean-blue-700 hover:bg-sophisticated-gray-50 rounded-lg transition-all duration-200 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 dark:hover:bg-sophisticated-gray-800/50"
              onClick={closeMenu}
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="block py-3 px-2 text-sm font-medium text-sophisticated-gray-600 hover:text-ocean-blue-700 hover:bg-sophisticated-gray-50 rounded-lg transition-all duration-200 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 dark:hover:bg-sophisticated-gray-800/50"
              onClick={closeMenu}
            >
              Pricing
            </Link>
            <div className="pt-4 space-y-3">
              <Button variant="outline" size="default" asChild className="w-full font-semibold">
                <Link href="/upload" onClick={closeMenu}>Try Free</Link>
              </Button>
              <Button variant="primary" size="default" asChild className="w-full font-semibold">
                <Link href="/upload" onClick={closeMenu}>Start Creating</Link>
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}