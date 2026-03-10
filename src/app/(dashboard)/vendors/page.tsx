"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Building2 } from "lucide-react";

interface Vendor {
  _id: string;
  name: string;
  upi_id?: string;
  bank_account?: string;
  ifsc?: string;
  is_active: boolean;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    upi_id: "",
    bank_account: "",
    ifsc: "",
  });

  const fetchVendors = async () => {
    setLoading(true);
    const res = await fetch("/api/vendors");
    const data = await res.json();
    setVendors(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

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
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Vendors</h1>
          <p className="text-sm text-muted-foreground">
            {vendors.length} active vendors
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>UPI ID</Label>
                <Input
                  value={form.upi_id}
                  onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                  placeholder="vendor@upi"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Bank Account</Label>
                  <Input
                    value={form.bank_account}
                    onChange={(e) =>
                      setForm({ ...form, bank_account: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>IFSC</Label>
                  <Input
                    value={form.ifsc}
                    onChange={(e) => setForm({ ...form, ifsc: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Vendor
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>No vendors yet. Add one above.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {vendors.map((v) => (
            <Card key={v._id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{v.name}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    {v.upi_id && <span>UPI: {v.upi_id}</span>}
                    {v.bank_account && <span>A/C: {v.bank_account}</span>}
                    {v.ifsc && <span>IFSC: {v.ifsc}</span>}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-200 bg-green-50"
                >
                  Active
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
