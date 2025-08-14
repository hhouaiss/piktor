"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center mx-auto px-4">
        {/* Logo and Brand */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl">Piktor</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-8">
          <Link
            href="/templates"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Examples
          </Link>
          <Link
            href="/generate"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Pricing
          </Link>
        </nav>

        {/* Desktop CTA Button */}
        <div className="hidden md:flex flex-1 items-center justify-end space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/upload">Try Free</Link>
          </Button>
          <Button variant="default" size="sm" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href="/upload">Start Creating</Link>
          </Button>
        </div>

        {/* Mobile Hamburger Menu Button */}
        <div className="flex md:hidden flex-1 items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMenu}
            className="p-2"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          isMenuOpen
            ? "max-h-64 opacity-100 border-b border-border/40"
            : "max-h-0 opacity-0"
        )}
      >
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <nav className="container mx-auto px-4 py-4 space-y-3">
            <Link
              href="/templates"
              className="block py-2 text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={closeMenu}
            >
              Examples
            </Link>
            <Link
              href="/generate"
              className="block py-2 text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={closeMenu}
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="block py-2 text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={closeMenu}
            >
              Pricing
            </Link>
            <div className="pt-2 space-y-2">
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/upload" onClick={closeMenu}>Try Free</Link>
              </Button>
              <Button variant="default" size="sm" asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href="/upload" onClick={closeMenu}>Start Creating</Link>
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}