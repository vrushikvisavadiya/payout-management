"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, CreditCard, Building2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const navLinks = [
    { href: "/payouts", label: "Payouts", icon: CreditCard },
    { href: "/vendors", label: "Vendors", icon: Building2 },
  ];
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-sm">💸 Payout MVP</span>
            <nav className="flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <Button
                    variant={pathname.startsWith(href) ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={user?.role === "FINANCE" ? "default" : "secondary"}>
              {user?.role}
            </Badge>
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
