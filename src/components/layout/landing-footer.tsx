import Link from "next/link";
import { Sparkles } from "lucide-react";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-sophisticated-gray-200 bg-gradient-to-br from-sophisticated-gray-50 to-white dark:border-sophisticated-gray-700 dark:from-sophisticated-gray-900 dark:to-sophisticated-gray-950 mt-auto">
      <div className="container mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-ocean-deep rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-sophisticated-gray-900 dark:text-sophisticated-gray-50">Piktor</span>
              <span className="text-xs text-muted-foreground font-medium">Vos produits, en scène.</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-8">
            <Link
              href="/about"
              className="text-sophisticated-gray-600 hover:text-ocean-blue-700 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 transition-colors text-sm"
            >
              Qui sommes-nous ?
            </Link>
            <Link
              href="/legal"
              className="text-sophisticated-gray-600 hover:text-ocean-blue-700 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 transition-colors text-sm"
            >
              Mentions légales
            </Link>
            <Link
              href="/contact"
              className="text-sophisticated-gray-600 hover:text-ocean-blue-700 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 transition-colors text-sm"
            >
              Contact
            </Link>
          </nav>
        </div>

        {/* Footer Bottom */}
        <div className="pt-6 border-t border-sophisticated-gray-200 dark:border-sophisticated-gray-700">
          <div className="text-center">
            <span className="text-sm text-sophisticated-gray-500 dark:text-sophisticated-gray-400">
              © {currentYear} Piktor AI. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}