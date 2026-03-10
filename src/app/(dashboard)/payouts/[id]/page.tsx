"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
} from "lucide-react";

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

const AUDIT_ICONS: Record<string, React.ReactNode> = {
  CREATED: <Clock className="h-4 w-4 text-blue-500" />,
  SUBMITTED: <Send className="h-4 w-4 text-yellow-500" />,
  APPROVED: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  REJECTED: <XCircle className="h-4 w-4 text-red-500" />,
};

const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Draft: "secondary",
  Submitted: "outline",
  Approved: "default",
  Rejected: "destructive",
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

  useEffect(() => {
    fetchPayout();
  }, [id]);

  const doAction = async (action: "submit" | "approve", body?: object) => {
    setActing(true);
    try {
      const res = await fetch(`/api/payouts/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);
      fetchPayout();
    } catch {
      toast.error("Action failed");
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Reason is required");
      return;
    }
    setActing(true);
    try {
      const res = await fetch(`/api/payouts/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success("Payout rejected");
      setRejectOpen(false);
      setRejectReason("");
      fetchPayout();
    } catch {
      toast.error("Action failed");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!payout) {
    return (
      <p className="text-center text-muted-foreground py-12">
        Payout not found.
      </p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Payout Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Payout Details</CardTitle>
          <Badge variant={STATUS_COLORS[payout.status]}>{payout.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground">Amount</p>
              <p className="font-semibold text-lg">
                ₹{payout.amount.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Mode</p>
              <p className="font-medium">{payout.mode}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{new Date(payout.createdAt).toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p>{new Date(payout.updatedAt).toLocaleString("en-IN")}</p>
            </div>
          </div>
          {payout.note && (
            <div>
              <p className="text-muted-foreground">Note</p>
              <p>{payout.note}</p>
            </div>
          )}
          {payout.decision_reason && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-muted-foreground text-xs">Rejection Reason</p>
              <p className="text-destructive font-medium">
                {payout.decision_reason}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {user?.role === "OPS" && payout.status === "Draft" && (
          <Button
            onClick={() => doAction("submit")}
            disabled={acting}
            className="gap-2"
          >
            {acting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit for Approval
          </Button>
        )}

        {user?.role === "FINANCE" && payout.status === "Submitted" && (
          <>
            <Button
              onClick={() => doAction("approve")}
              disabled={acting}
              className="gap-2"
            >
              {acting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve
            </Button>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger>
                <Button
                  variant="destructive"
                  disabled={acting}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Payout</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <Label>Reason *</Label>
                  <Textarea
                    placeholder="Provide a reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleReject}
                    variant="destructive"
                    className="w-full"
                    disabled={acting}
                  >
                    {acting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm Reject
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payout.audits.map((a, i) => (
              <div key={a._id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="mt-0.5">{AUDIT_ICONS[a.action]}</div>
                  {i < payout.audits.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-2" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">{a.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.performed_by} ({a.performed_role}) ·{" "}
                    {new Date(a.timestamp).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
