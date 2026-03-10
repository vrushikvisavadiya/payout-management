"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, CreditCard } from "lucide-react";

interface Vendor {
  _id: string;
  name: string;
}
interface Payout {
  _id: string;
  vendor_id: string;
  amount: number;
  mode: string;
  status: string;
  note?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  Draft: "secondary",
  Submitted: "outline",
  Approved: "default",
  Rejected: "destructive",
};

export default function PayoutsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [vendorFilter, setVendorFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/vendors")
      .then((r) => r.json())
      .then(setVendors);
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
    vendors.find((v) => v._id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Payouts</h1>
          <p className="text-sm text-muted-foreground">
            {payouts.length} results
          </p>
        </div>
        {user?.role === "OPS" && (
          <Button
            size="sm"
            className="gap-2"
            onClick={() => router.push("/payouts/new")}
          >
            <Plus className="h-4 w-4" /> New Payout
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v || "ALL")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Submitted">Submitted</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={vendorFilter}
          onValueChange={(v) => setVendorFilter(v || "ALL")}
        >
          <SelectTrigger className="w-48">
            <SelectValue>
              {vendorFilter === "ALL"
                ? "All Vendors"
                : vendors.find((v) => v._id === vendorFilter)?.name ??
                  "All Vendors"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Vendors</SelectItem>
            {vendors.map((v) => (
              <SelectItem key={v._id} value={v._id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(statusFilter !== "ALL" || vendorFilter !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("ALL");
              setVendorFilter("ALL");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>No payouts found.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {payouts.map((p) => (
            <Card
              key={p._id}
              className="cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => router.push(`/payouts/${p._id}`)}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">
                    ₹{p.amount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getVendorName(p.vendor_id)} · {p.mode}
                    {p.note && ` · ${p.note}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(p.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Badge
                  variant={
                    STATUS_COLORS[p.status] as
                      | "default"
                      | "secondary"
                      | "outline"
                      | "destructive"
                  }
                >
                  {p.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
