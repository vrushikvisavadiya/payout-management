import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

const schema = z.object({ reason: z.string().min(1, "Reason is required") });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const error = requireRole(user, ["FINANCE"]);
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { id } = await params;
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME);
  const payout = await db
    .collection("payouts")
    .findOne({ _id: new ObjectId(id) });

  if (!payout)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (payout.status !== "Submitted") {
    return NextResponse.json(
      { message: "Only Submitted payouts can be rejected" },
      { status: 400 },
    );
  }

  const now = new Date();
  await db.collection("payouts").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: "Rejected",
        decision_reason: parsed.data.reason,
        updatedAt: now,
      },
    },
  );
  await db.collection("payout_audits").insertOne({
    payout_id: id,
    action: "REJECTED",
    performed_by: user!.email,
    performed_role: user!.role,
    timestamp: now,
  });

  return NextResponse.json({ message: "Rejected" });
}
