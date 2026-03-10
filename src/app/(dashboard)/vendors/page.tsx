"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Building2, CreditCard, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface Vendor {
  _id: string;
  name: string;
  upi_id?: string;
  bank_account?: string;
  ifsc?: string;
  is_active: boolean;
}

function VendorInitial({ name }: { name: string }) {
  return (
    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
      <span className="text-primary font-semibold text-sm">
        {name.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
      <span className="font-medium text-foreground/60">{label}</span>
      {value}
    </span>
  );
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", upi_id: "", bank_account: "", ifsc: "",
  });

  const fetchVendors = async () => {
    setLoading(true);
    const res = await fetch("/api/vendors");
    const data = await res.json();
    setVendors(data);
    setLoading(false);
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message); return; }
      toast.success("Vendor added!");
      setOpen(false);
      setForm({ name: "", upi_id: "", bank_account: "", ifsc: "" });
      fetchVendors();
    } catch {
      toast.error("Failed to add vendor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading..." : `${vendors.length} active vendor${vendors.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger >
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground -mt-1">
              Only name is required. Payment details are optional.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4 mt-1">

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Acme Supplies"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  UPI ID
                </Label>
                <Input
                  placeholder="vendor@upi"
                  value={form.upi_id}
                  onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    Bank Account
                  </Label>
                  <Input
                    placeholder="1234567890"
                    value={form.bank_account}
                    onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>IFSC</Label>
                  <Input
                    placeholder="HDFC0001234"
                    value={form.ifsc}
                    onChange={(e) => setForm({ ...form, ifsc: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <Button type="submit" className="w-full h-10" disabled={submitting}>
                  {submitting
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                    : "Add Vendor →"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Fetching vendors...</p>
        </div>
      ) : vendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
            <Building2 className="h-6 w-6 opacity-40" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">No vendors yet</p>
            <p className="text-sm mt-1">Add your first vendor to start creating payouts.</p>
          </div>
          <Button size="sm" className="mt-2 gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add Vendor
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {vendors.map((v) => (
            <div
              key={v._id}
              className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
            >
              {/* Left */}
              <div className="flex items-center gap-4 min-w-0">
                <VendorInitial name={v.name} />
                <div className="min-w-0">
                  <p className="font-medium text-sm">{v.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {v.upi_id && <InfoPill label="UPI" value={v.upi_id} />}
                    {v.bank_account && <InfoPill label="A/C" value={v.bank_account} />}
                    {v.ifsc && <InfoPill label="IFSC" value={v.ifsc} />}
                    {!v.upi_id && !v.bank_account && !v.ifsc && (
                      <span className="text-xs text-muted-foreground">No payment details</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 shrink-0 ml-4">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
