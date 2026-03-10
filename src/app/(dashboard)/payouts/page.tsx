"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Loader2,
  CreditCard,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Vendor { _id: string; name: string; }
interface Payout {
  _id: string;
  vendor_id: string;
  amount: number;
  mode: string;
  status: string;
  note?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  Draft:     { label: "Draft",     className: "bg-muted text-muted-foreground border-transparent" },
  Submitted: { label: "Submitted", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" },
  Approved:  { label: "Approved",  className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" },
  Rejected:  { label: "Rejected",  className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" },
};

const STATUS_DOT: Record<string, string> = {
  Draft:     "bg-muted-foreground",
  Submitted: "bg-blue-500",
  Approved:  "bg-emerald-500",
  Rejected:  "bg-red-500",
};

const STATUSES = ["Draft", "Submitted", "Approved", "Rejected"];

export default function PayoutsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [vendorFilter, setVendorFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/vendors").then((r) => r.json()).then(setVendors);
  }, []);

  useEffect(() => {
    const fetchPayouts = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (vendorFilter !== "ALL") params.set("vendor_id", vendorFilter);
      const res = await fetch(`/api/payouts?${params}`);
      const data = await res.json();
      setPayouts(data);
      setLoading(false);
    };
    fetchPayouts();
  }, [statusFilter, vendorFilter]);

  const getVendorName = (id: string) =>
    vendors.find((v) => v._id === id)?.name ?? "Unknown";

  const hasFilters = statusFilter !== "ALL" || vendorFilter !== "ALL";

  // Stats
  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = payouts.filter((p) => p.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading..." : `${payouts.length} payout${payouts.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
        {user?.role === "OPS" && (
          <Button className="gap-2" onClick={() => router.push("/payouts/new")}>
            <Plus className="h-4 w-4" />
            New Payout
          </Button>
        )}
      </div>

      {/* Status Summary Pills */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "ALL" : s)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              statusFilter === s
                ? STATUS_CONFIG[s].className + " shadow-sm scale-105"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[s])} />
            {s}
            <span className="font-semibold">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filter by</span>
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "ALL")}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={vendorFilter} onValueChange={(v) => setVendorFilter(v || "ALL")}>
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue>
              {vendorFilter === "ALL"
                ? "All Vendors"
                : vendors.find((v) => v._id === vendorFilter)?.name ?? "All Vendors"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Vendors</SelectItem>
            {vendors.map((v) => (
              <SelectItem key={v._id} value={v._id}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <button
            onClick={() => { setStatusFilter("ALL"); setVendorFilter("ALL"); }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Fetching payouts...</p>
        </div>
      ) : payouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
            <CreditCard className="h-6 w-6 opacity-40" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">No payouts found</p>
            <p className="text-sm mt-1">
              {hasFilters ? "Try adjusting your filters." : "Create your first payout to get started."}
            </p>
          </div>
          {user?.role === "OPS" && !hasFilters && (
            <Button size="sm" className="mt-2 gap-2" onClick={() => router.push("/payouts/new")}>
              <Plus className="h-4 w-4" /> New Payout
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {payouts.map((p) => {
            const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.Draft;
            return (
              <div
                key={p._id}
                onClick={() => router.push(`/payouts/${p._id}`)}
                className="flex items-center justify-between px-5 py-4 bg-card hover:bg-muted/40 cursor-pointer transition-colors group"
              >
                {/* Left */}
                <div className="flex items-center gap-4 min-w-0">
                  {/* Mode icon */}
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs font-medium text-muted-foreground">{p.mode}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {getVendorName(p.vendor_id)}
                      {p.note && (
                        <span className="text-muted-foreground/60"> · {p.note}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {new Date(p.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    cfg.className
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[p.status])} />
                    {p.status}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
