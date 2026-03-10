import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { z } from "zod";

const payoutSchema = z.object({
  vendor_id: z.string().min(1),
  amount: z.number().positive("Amount must be > 0"),
  mode: z.enum(["UPI", "IMPS", "NEFT"]),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const error = requireRole(user, ["OPS", "FINANCE"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const vendor_id = searchParams.get("vendor_id");

  const filter: Record<string, string> = {};
  if (status) filter.status = status;
  if (vendor_id) filter.vendor_id = vendor_id;

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME);
  const payouts = await db
    .collection("payouts")
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json(
    payouts.map((p) => ({ ...p, _id: p._id.toString() }))
  );
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const error = requireRole(user, ["OPS"]); // only OPS can create
  if (error) return error;

  const body = await req.json();
  const parsed = payoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const now = new Date();
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME);

  const payout = {
    ...parsed.data,
    status: "Draft",
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("payouts").insertOne(payout);

  await db.collection("payout_audits").insertOne({
    payout_id: result.insertedId.toString(),
    action: "CREATED",
    performed_by: user!.email,
    performed_role: user!.role,
    timestamp: now,
  });

  return NextResponse.json(
    { _id: result.insertedId, ...payout },
    { status: 201 },
  );
}
