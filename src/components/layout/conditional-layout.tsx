"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { FooterWrapper } from "@/components/layout/footer-wrapper";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Check if current route is a dashboard route
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  
  // For dashboard routes, render children without header/footer
  if (isDashboardRoute) {
    return <>{children}</>;
  }
  
  // For all other routes, render with header/footer
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <FooterWrapper />
    </div>
  );
}