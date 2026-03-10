import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { z } from "zod";

const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  upi_id: z.string().optional(),
  bank_account: z.string().optional(),
  ifsc: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  const error = requireRole(user, ["OPS", "FINANCE"]);
  if (error) return error;

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME);
  const vendors = await db
    .collection("vendors")
    .find({ is_active: true })
    .toArray();
  return NextResponse.json(
    vendors.map((v) => ({ ...v, _id: v._id.toString() }))
  );
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const error = requireRole(user, ["OPS", "FINANCE"]);
  if (error) return error;

  const body = await req.json();
  const parsed = vendorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME);
  const result = await db.collection("vendors").insertOne({
    ...parsed.data,
    is_active: true,
    createdAt: new Date(),
  });

  return NextResponse.json(
    { _id: result.insertedId, ...parsed.data },
    { status: 201 },
  );
}
