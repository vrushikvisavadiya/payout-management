"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Vendor {
  _id: string;
  name: string;
}

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
    fetch("/api/vendors")
      .then((r) => r.json())
      .then(setVendors);
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
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success("Payout created as Draft!");
      router.push("/payouts");
    } catch {
      toast.error("Failed to create payout");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New Payout Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Vendor *</Label>
              <Select
                value={form.vendor_id}
                onValueChange={(v) => setForm({ ...form, vendor_id: v || "" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select vendor">
                    {form.vendor_id
                      ? vendors.find((v) => v._id === form.vendor_id)?.name ??
                        "Select vendor"
                      : "Select vendor"}
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

            <div className="space-y-1">
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Mode *</Label>
              <Select
                value={form.mode}
                onValueChange={(v) => setForm({ ...form, mode: v || "" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="IMPS">IMPS</SelectItem>
                  <SelectItem value="NEFT">NEFT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Note (optional)</Label>
              <Textarea
                placeholder="Add a note..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Draft
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
