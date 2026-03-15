import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const characterSchema = new mongoose.Schema({
  userId: String,
  name: String,
  age: Number,
  imageUrl: String,
  position: { x: Number, y: Number },
  islandId: Number,
  joints: { type: mongoose.Schema.Types.Mixed, default: null },
  riggedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

const Character =
  mongoose.models.Character || mongoose.model("Character", characterSchema);

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me"
);

async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  console.log("POST /api/rig hit");
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { imageId, joints } = await req.json();
    if (!imageId || !joints)
      return NextResponse.json(
        { error: "Missing imageId or joints" },
        { status: 400 }
      );

    await connectDB();

    const updated = await Character.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(imageId), userId },
      { $set: { joints, riggedAt: new Date() } },
      { returnDocument: "after" } // ← fixes the warning too
    );

    console.log("imageId:", imageId);
    console.log("userId:", userId);
    console.log("updated:", updated);

    if (!updated)
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/rig error:", error);
    return NextResponse.json(
      { error: "Failed to save joints" },
      { status: 500 }
    );
  }
}
