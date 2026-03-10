import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const error = requireRole(user, ["OPS", "FINANCE"]);
  if (error) return error;

  const { id } = await params;
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME);

  const payout = await db
    .collection("payouts")
    .findOne({ _id: new ObjectId(id) });
  if (!payout)
    return NextResponse.json({ message: "Not found" }, { status: 404 });

  const audits = await db
    .collection("payout_audits")
    .find({ payout_id: id })
    .sort({ timestamp: 1 })
    .toArray();

  return NextResponse.json({
    ...payout,
    _id: payout._id.toString(),
    audits: audits.map((a) => ({ ...a, _id: a._id.toString() })),
  });
}
