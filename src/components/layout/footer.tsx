import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between text-sm text-muted-foreground mx-auto px-4">
        <div className="flex items-center space-x-4">
          <span>© 2024 Piktor. All rights reserved.</span>
        </div>
        <div className="flex items-center space-x-4">
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