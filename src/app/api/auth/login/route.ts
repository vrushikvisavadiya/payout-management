import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { signToken } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcrypt";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const token = signToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const res = NextResponse.json({ role: user.role, name: user.name });
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return res;
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
