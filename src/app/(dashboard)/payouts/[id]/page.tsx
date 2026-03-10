"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2, ArrowLeft, Clock, CheckCircle2,
  XCircle, Send, CreditCard, Calendar, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Payout {
  _id: string;
  vendor_id: string;
  amount: number;
  mode: string;
  note?: string;
  status: string;
  decision_reason?: string;
  createdAt: string;
  updatedAt: string;
  audits: Audit[];
}

interface Audit {
  _id: string;
  action: string;
  performed_by: string;
  performed_role: string;
  timestamp: string;
}

const STATUS_CONFIG: Record<string, { className: string; dot: string }> = {
  Draft:     { className: "bg-muted text-muted-foreground border-transparent", dot: "bg-muted-foreground" },
  Submitted: { className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800", dot: "bg-blue-500" },
  Approved:  { className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800", dot: "bg-emerald-500" },
  Rejected:  { className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800", dot: "bg-red-500" },
};

const AUDIT_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  CREATED:   { icon: <Clock className="h-3.5 w-3.5" />,        label: "Created",   color: "text-blue-500 bg-blue-50 dark:bg-blue-950" },
  SUBMITTED: { icon: <Send className="h-3.5 w-3.5" />,         label: "Submitted", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950" },
  APPROVED:  { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Approved",  color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" },
  REJECTED:  { icon: <XCircle className="h-3.5 w-3.5" />,      label: "Rejected",  color: "text-red-600 bg-red-50 dark:bg-red-950" },
};

export default function PayoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [payout, setPayout] = useState<Payout | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);

  const fetchPayout = async () => {
    setLoading(true);
    const res = await fetch(`/api/payouts/${id}`);
    const data = await res.json();
    setPayout(data);
    setLoading(false);
  };

  useEffect(() => { fetchPayout(); }, [id]);

  const doAction = async (action: "submit" | "approve") => {
    setActing(true);
    try {
      const res = await fetch(`/api/payouts/${id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message); return; }
      toast.success(data.message);
      fetchPayout();
    } catch { toast.error("Action failed"); }
    finally { setActing(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error("Reason is required"); return; }
    setActing(true);
    try {
      const res = await fetch(`/api/payouts/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message); return; }
      toast.success("Payout rejected");
      setRejectOpen(false);
      setRejectReason("");
      fetchPayout();
    } catch { toast.error("Action failed"); }
    finally { setActing(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading payout...</p>
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <p className="font-medium text-foreground">Payout not found</p>
        <p className="text-sm mt-1">It may have been deleted or the link is invalid.</p>
        <Button variant="ghost" className="mt-4 gap-2" onClick={() => router.push("/payouts")}>
          <ArrowLeft className="h-4 w-4" /> Back to Payouts
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[payout.status] ?? STATUS_CONFIG.Draft;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Payouts
      </button>

      {/* Hero row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">
              ₹{payout.amount.toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-muted-foreground">{payout.mode} transfer</p>
          </div>
        </div>
        <span className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
          statusCfg.className
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
          {payout.status}
        </span>
      </div>

      {/* Details grid */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
              <Calendar className="h-3 w-3" /> Created
            </p>
            <p className="text-sm font-medium">
              {new Date(payout.createdAt).toLocaleString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
              <RefreshCw className="h-3 w-3" /> Last Updated
            </p>
            <p className="text-sm font-medium">
              {new Date(payout.updatedAt).toLocaleString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {payout.note && (
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground mb-1">Note</p>
            <p className="text-sm">{payout.note}</p>
          </div>
        )}

        {payout.decision_reason && (
          <div className="px-5 py-4 bg-red-50/50 dark:bg-red-950/20">
            <p className="text-xs text-red-500 font-medium mb-1">Rejection Reason</p>
            <p className="text-sm text-red-700 dark:text-red-300">{payout.decision_reason}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(user?.role === "OPS" && payout.status === "Draft") ||
       (user?.role === "FINANCE" && payout.status === "Submitted") ? (
        <div className="flex gap-3">
          {user?.role === "OPS" && payout.status === "Draft" && (
            <Button onClick={() => doAction("submit")} disabled={acting} className="gap-2">
              {acting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />}
              Submit for Approval
            </Button>
          )}

          {user?.role === "FINANCE" && payout.status === "Submitted" && (
            <>
              <Button onClick={() => doAction("approve")} disabled={acting} className="gap-2">
                {acting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <CheckCircle2 className="h-4 w-4" />}
                Approve
              </Button>

              <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogTrigger >
                  <Button variant="destructive" disabled={acting} className="gap-2">
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Payout</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    This action cannot be undone. Provide a clear reason for rejection.
                  </p>
                  <div className="space-y-3 mt-1">
                    <div className="space-y-1.5">
                      <Label>Reason <span className="text-destructive">*</span></Label>
                      <Textarea
                        placeholder="e.g. Duplicate request, incorrect amount..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <Button onClick={handleReject} variant="destructive" className="w-full" disabled={acting}>
                      {acting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirm Rejection
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      ) : null}

      {/* Audit Trail */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Audit Trail
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {payout.audits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No audit records.</p>
          ) : (
            payout.audits.map((a, i) => {
              const cfg = AUDIT_CONFIG[a.action] ?? AUDIT_CONFIG.CREATED;
              return (
                <div
                  key={a._id}
                  className={cn(
                    "flex items-start gap-4 px-5 py-4",
                    i !== payout.audits.length - 1 && "border-b border-border"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    cfg.color
                  )}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{cfg.label}</p>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {new Date(a.timestamp).toLocaleString("en-IN", {
                          day: "numeric", month: "short",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.performed_by}
                      <span className="ml-1.5 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
                        {a.performed_role}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
