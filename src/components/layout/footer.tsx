import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="container flex flex-col md:flex-row h-auto md:h-14 items-center justify-between text-sm text-muted-foreground mx-auto px-4 py-3 md:py-0">
        <div className="flex items-center space-x-4 order-2 md:order-1">
          <span className="text-center md:text-left">© 2024 Piktor. All rights reserved.</span>
        </div>
        <div className="flex items-center space-x-4 order-1 md:order-2 mb-2 md:mb-0">
          <Link
            href="/help"
            className="transition-colors hover:text-foreground"
          >
            Help
          </Link>
          <Link
            href="/contact"
            className="transition-colors hover:text-foreground"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}