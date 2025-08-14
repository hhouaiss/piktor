import Link from "next/link";
import { Sparkles, Mail, Shield, FileText, HelpCircle } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-sophisticated-gray-200 bg-gradient-to-br from-sophisticated-gray-50 to-white dark:border-sophisticated-gray-700 dark:from-sophisticated-gray-900 dark:to-sophisticated-gray-950 mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-ocean-deep rounded-xl flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-sophisticated-gray-900 dark:text-sophisticated-gray-50">Piktor</span>
                <span className="text-xs text-muted-foreground font-medium">AI Image Studio</span>
              </div>
            </div>
            <p className="text-sophisticated-gray-600 dark:text-sophisticated-gray-400 leading-relaxed mb-6 max-w-md">
              Transform your furniture photos into professional marketing assets with AI-powered image generation. Trusted by 500+ furniture brands worldwide.
            </p>
            <div className="flex items-center space-x-2 text-sm text-sophisticated-gray-500 dark:text-sophisticated-gray-500">
              <Shield className="w-4 h-4" />
              <span>Enterprise-grade security & privacy</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-4">Product</h3>
            <nav className="flex flex-col space-y-3">
              <Link
                href="/templates"
                className="text-sophisticated-gray-600 hover:text-ocean-blue-700 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 transition-colors text-sm"
              >
                Examples
              </Link>
              <Link
                href="/generate"
                className="text-sophisticated-gray-600 hover:text-ocean-blue-700 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 transition-colors text-sm"
              >
                How It Works
              </Link>
              <Link
                href="#pricing"
                className="text-sophisticated-gray-600 hover:text-ocean-blue-700 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 transition-colors text-sm"
              >
                Pricing
              </Link>
              <Link
                href="/api"
                className="text-sophisticated-gray-600 hover:text-ocean-blue-700 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 transition-colors text-sm"
              >
                API Access
              </Link>
            </nav>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-4">Support</h3>
            <nav className="flex flex-col space-y-3">
              <Link
                href="/help"
                className="text-sophisticated-gray-600 hover:text-ocean-blue-700 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 transition-colors text-sm flex items-center space-x-2"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help Center</span>
              </Link>
              <Link
                href="/contact"
                className="text-sophisticated-gray-600 hover:text-ocean-blue-700 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 transition-colors text-sm flex items-center space-x-2"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Us</span>
              </Link>
              <Link
                href="/privacy"
                className="text-sophisticated-gray-600 hover:text-ocean-blue-700 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 transition-colors text-sm flex items-center space-x-2"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Privacy Policy</span>
              </Link>
              <Link
                href="/terms"
                className="text-sophisticated-gray-600 hover:text-ocean-blue-700 dark:text-sophisticated-gray-400 dark:hover:text-ocean-blue-400 transition-colors text-sm flex items-center space-x-2"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Terms of Service</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-6 border-t border-sophisticated-gray-200 dark:border-sophisticated-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-sophisticated-gray-500 dark:text-sophisticated-gray-400">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <span>© {currentYear} Piktor AI. All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <span className="text-xs bg-warm-gold-100 text-warm-gold-800 px-2 py-1 rounded-full font-medium dark:bg-warm-gold-900 dark:text-warm-gold-200">
                Powered by Advanced AI
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-xs">Made with ❤️ for furniture businesses</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}