import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ArrowRightLeft, FileText, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Comparison", href: "/comparison", icon: ArrowRightLeft },
  { name: "Reports", href: "/reports", icon: FileText },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight text-primary">BAL Tracker</h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Event Operations</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Settings pinned at bottom */}
        <div className="p-4 border-t border-border">
          <Link href="/settings">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                location.startsWith("/settings")
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card flex items-center justify-between px-4 z-50">
        <h1 className="text-lg font-bold text-primary">BAL Tracker</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-background z-40 p-4 flex flex-col">
          <nav className="flex flex-col space-y-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-lg cursor-pointer text-lg ${
                      isActive
                        ? "bg-primary text-primary-foreground font-bold"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
          {/* Settings at bottom of mobile menu */}
          <Link href="/settings">
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-4 rounded-lg cursor-pointer text-lg border-t border-border mt-2 ${
                location.startsWith("/settings")
                  ? "bg-primary text-primary-foreground font-bold"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <Settings className="w-6 h-6" />
              <span>Settings</span>
            </div>
          </Link>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:pt-0 pt-16 overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
