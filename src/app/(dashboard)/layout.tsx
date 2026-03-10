"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, CreditCard, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/payouts", label: "Payouts", icon: CreditCard },
  { href: "/vendors", label: "Vendors", icon: Building2 },
];

const ROLE_STYLES: Record<string, string> = {
  OPS:     "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  FINANCE: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">

      {/* Top Bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Left — Logo + Nav */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/payouts" className="flex items-center gap-2 shrink-0">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <CreditCard className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm hidden sm:block">Payout MVP</span>
            </Link>

            {/* Divider */}
            <div className="h-5 w-px bg-border hidden sm:block" />

            {/* Nav */}
            <nav className="flex items-center gap-0.5">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link key={href} href={href}>
                    <button className={cn(
                      "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right — Role + User + Logout */}
          <div className="flex items-center gap-3">
            {/* Role pill */}
            <span className={cn(
              "hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
              ROLE_STYLES[user.role] ?? "bg-muted text-muted-foreground"
            )}>
              {user.role}
            </span>

            {/* User avatar */}
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-foreground">
                  {user.name?.slice(0, 1).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-muted-foreground hidden md:block">
                {user.name}
              </span>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-border" />

            {/* Logout */}
            <button
              onClick={logout}
              title="Logout"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
