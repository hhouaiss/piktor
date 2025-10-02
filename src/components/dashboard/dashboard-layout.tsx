"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Plus, 
  Images, 
  Settings, 
  BookOpen, 
  User, 
  MessageCircle, 
  Menu, 
  X,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent, trackPageView } from "@/lib/analytics";
import { useSimpleAuth } from "@/components/auth/simple-auth-provider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const sidebarItems: SidebarItem[] = [
  {
    id: "home",
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Vue d'ensemble et projets récents"
  },
  {
    id: "create",
    label: "Créer un visuel",
    href: "/dashboard/create",
    icon: Plus,
    description: "Générer de nouveaux visuels IA"
  },
  {
    id: "library",
    label: "Bibliothèque",
    href: "/dashboard/library",
    icon: Images,
    description: "Gérer vos visuels générés"
  },
  {
    id: "account",
    label: "Compte",
    href: "/dashboard/account",
    icon: User,
    description: "Profil et abonnement"
  }
  // Hidden items: settings, tutorials, support
  // {
  //   id: "settings",
  //   label: "Paramètres",
  //   href: "/dashboard/settings",
  //   icon: Settings,
  //   description: "Personnaliser vos visuels"
  // },
  // {
  //   id: "tutorials",
  //   label: "Tutoriels",
  //   href: "/dashboard/tutorials",
  //   icon: BookOpen,
  //   description: "Aide et ressources"
  // },
  // {
  //   id: "support",
  //   label: "Support",
  //   href: "/dashboard/support",
  //   icon: MessageCircle,
  //   description: "Assistance et tickets"
  // }
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useSimpleAuth();

  // Track page views for dashboard pages
  useEffect(() => {
    trackPageView(pathname || '/', `Dashboard - ${pathname?.split('/').pop() || 'Home'}`);
  }, [pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    trackEvent('dashboard_sidebar_toggled', {
      event_category: 'dashboard',
      event_label: sidebarCollapsed ? 'expanded' : 'collapsed'
    });
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    trackEvent('dashboard_mobile_menu_toggled', {
      event_category: 'dashboard',
      event_label: mobileMenuOpen ? 'closed' : 'opened'
    });
  };

  const handleSidebarItemClick = (item: SidebarItem) => {
    trackEvent('dashboard_navigation', {
      event_category: 'dashboard',
      event_label: item.id,
      custom_parameters: {
        target_page: item.href
      }
    });
    setMobileMenuOpen(false);
  };

  const handleProfileDropdownClick = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      trackEvent('dashboard_logout', {
        event_category: 'auth',
        event_label: 'dashboard_logout'
      });
      setProfileDropdownOpen(false);
      await signOut();
      // User will be redirected to login by the ProtectedRoute component
    } catch (error) {
      console.error('Logout error:', error);
      // Could show a toast notification here
    }
  };

  // Helper functions for user display
  const getDisplayName = () => {
    if (user?.display_name) {
      return user.display_name;
    }
    if (user?.email) {
      // Extract name from email (part before @)
      return user.email.split('@')[0];
    }
    return 'Utilisateur';
  };

  const getUserInitials = () => {
    if (user?.display_name) {
      const names = user.display_name.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-sophisticated-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Ouvrir le menu</span>
            </Button>

            {/* Desktop sidebar toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex"
              onClick={toggleSidebar}
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Basculer la sidebar</span>
            </Button>

            {/* Logo - only show on mobile when menu is closed */}
            <div className={cn(
              "flex items-center space-x-3",
              mobileMenuOpen && "lg:flex hidden"
            )}>
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-ocean-deep rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-sophisticated-gray-900">Piktor</span>
              </Link>
            </div>
          </div>

          {/* Center section - Search bar - Hidden */}
          {false && (
            <div className="flex-1 max-w-md mx-8 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Rechercher vos visuels..."
                  className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Notifications - Hidden */}
            {false && (
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full text-xs w-2 h-2"></span>
              </Button>
            )}

            {/* Profile dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                onClick={handleProfileDropdownClick}
              >
                <div className="w-7 h-7 bg-gradient-ocean-deep rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">{getUserInitials()}</span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || 'Non renseigné'}
                    </p>
                  </div>
                  <div className="p-1">
                    <Link href="/dashboard/account" className="flex items-center space-x-2 p-2 text-sm hover:bg-muted rounded-md">
                      <User className="h-4 w-4" />
                      <span>Mon compte</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 p-2 text-sm hover:bg-muted rounded-md text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={cn(
          "hidden lg:flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40",
          sidebarCollapsed ? "w-16" : "w-64"
        )}>
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => handleSidebarItemClick(item)}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    sidebarCollapsed && "justify-center"
                  )}
                  title={sidebarCollapsed ? item.label : ""}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                  )} />
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                      )}>
                        {item.label}
                      </p>
                      <p className={cn(
                        "text-xs truncate",
                        isActive ? "text-sidebar-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {item.description}
                      </p>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50 lg:hidden">
              <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-ocean-deep rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-lg text-sidebar-foreground">Piktor</span>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="p-4 space-y-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => handleSidebarItemClick(item)}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className={cn(
                        "h-5 w-5",
                        isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium",
                          isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground"
                        )}>
                          {item.label}
                        </p>
                        <p className={cn(
                          "text-xs",
                          isActive ? "text-sidebar-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300",
          "lg:ml-64",
          sidebarCollapsed && "lg:ml-16"
        )}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Click outside to close profile dropdown */}
      {profileDropdownOpen && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setProfileDropdownOpen(false)}
        />
      )}
    </div>
  );
}