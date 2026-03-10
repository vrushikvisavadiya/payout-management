"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Login failed"); return; }
      toast.success(`Welcome, ${data.name}!`);
      await refresh();
      router.push("/payouts");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">

      {/* Subtle background blob */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-8">

        {/* Brand */}
        <div className="space-y-1">
          {/* <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary mb-4">
            <span className="text-primary-foreground text-xl">💸</span>
          </div> */}
          <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
          <p className="text-muted-foreground text-sm">
            Payout Management 
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-sm font-medium mt-1"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
            ) : "Sign In →"}
          </Button>
        </form>

        {/* Demo pills */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            Quick fill with demo account
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setEmail("ops@demo.com"); setPassword("ops123"); }}
              className="rounded-lg border border-border px-3 py-2.5 text-left hover:bg-muted transition-colors group"
            >
              <p className="text-xs font-semibold group-hover:text-primary transition-colors">
                OPS
              </p>
              <p className="text-[11px] text-muted-foreground">ops@demo.com</p>
            </button>
            <button
              type="button"
              onClick={() => { setEmail("finance@demo.com"); setPassword("fin123"); }}
              className="rounded-lg border border-border px-3 py-2.5 text-left hover:bg-muted transition-colors group"
            >
              <p className="text-xs font-semibold group-hover:text-primary transition-colors">
                FINANCE
              </p>
              <p className="text-[11px] text-muted-foreground">finance@demo.com</p>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
