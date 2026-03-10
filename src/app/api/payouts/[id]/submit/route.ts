import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const error = requireRole(user, ["OPS"]);
  if (error) return error;

  const { id } = await params;
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME);
  const payout = await db
    .collection("payouts")
    .findOne({ _id: new ObjectId(id) });

  if (!payout)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (payout.status !== "Draft") {
    return NextResponse.json(
      { message: "Only Draft payouts can be submitted" },
      { status: 400 },
    );
  }

  const now = new Date();
  await db
    .collection("payouts")
    .updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "Submitted", updatedAt: now } },
    );
  await db.collection("payout_audits").insertOne({
    payout_id: id,
    action: "SUBMITTED",
    performed_by: user!.email,
    performed_role: user!.role,
    timestamp: now,
  });

  return NextResponse.json({ message: "Submitted" });
}
