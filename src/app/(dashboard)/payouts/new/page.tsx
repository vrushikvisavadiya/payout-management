"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Building2, IndianRupee, Wallet, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface Vendor { _id: string; name: string; }

const MODES = [
  { value: "UPI",  label: "UPI",  desc: "Instant transfer via UPI ID" },
  { value: "IMPS", label: "IMPS", desc: "Immediate Payment Service" },
  { value: "NEFT", label: "NEFT", desc: "Net banking transfer" },
];

export default function NewPayoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    vendor_id: "",
    amount: "",
    mode: "",
    note: "",
  });

  useEffect(() => {
    if (user && user.role !== "OPS") {
      toast.error("Only OPS can create payouts");
      router.push("/payouts");
    }
    fetch("/api/vendors").then((r) => r.json()).then(setVendors);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendor_id || !form.mode) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message); return; }
      toast.success("Payout created as Draft!");
      router.push("/payouts");
    } catch {
      toast.error("Failed to create payout");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVendor = vendors.find((v) => v._id === form.vendor_id);

  return (
    <div className="max-w-xl mx-auto space-y-6">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Payouts
      </button>

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Payout</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Creates a Draft — submit after review.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Vendor */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            Vendor <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.vendor_id}
            onValueChange={(v) => setForm({ ...form, vendor_id: v ?? "" })}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Select a vendor">
                {selectedVendor?.name ?? "Select a vendor"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {vendors.map((v) => (
                <SelectItem key={v._id} value={v._id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
            Amount <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
              ₹
            </span>
            <Input
              type="number"
              min="1"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="h-11 pl-7"
              required
            />
          </div>
        </div>

        {/* Mode — card picker */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
            Payment Mode <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setForm({ ...form, mode: m.value })}
                className={cn(
                  "rounded-lg border px-3 py-3 text-left transition-all",
                  form.mode === m.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:bg-muted"
                )}
              >
                <p className={cn(
                  "text-sm font-semibold",
                  form.mode === m.value ? "text-primary" : "text-foreground"
                )}>
                  {m.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                  {m.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            Note
            <span className="text-xs font-normal text-muted-foreground ml-1">(optional)</span>
          </Label>
          <Textarea
            placeholder="Add a note for this payout..."
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Summary preview */}
        {(form.amount || form.vendor_id || form.mode) && (
          <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 space-y-1.5 text-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Summary
            </p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vendor</span>
              <span className="font-medium">{selectedVendor?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-foreground">
                {form.amount ? `₹${Number(form.amount).toLocaleString("en-IN")}` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode</span>
              <span className="font-medium">{form.mode || "—"}</span>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full h-11" disabled={submitting}>
          {submitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
          ) : (
            "Create Draft →"
          )}
        </Button>
      </form>
    </div>
  );
}
