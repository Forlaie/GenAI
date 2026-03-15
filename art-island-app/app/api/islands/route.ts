import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const islandSchema = new mongoose.Schema({
  userId: String,
  id: Number,
  x: Number,
  y: Number,
  size: Number,
  color: String,
  border: String,
  label: String,
  skin: { type: String, default: "dirt" },
  createdAt: { type: Date, default: Date.now },
});

const Island = mongoose.models.Island || mongoose.model("Island", islandSchema);

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me",
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

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const islands = await Island.find({ userId }).sort({ createdAt: 1 });

    return NextResponse.json(
      islands.map((island) => ({
        id: island.id,
        x: island.x,
        y: island.y,
        size: island.size,
        color: island.color,
        border: island.border,
        label: island.label,
        skin: island.skin,
      })),
    );
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Failed to load islands" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await request.json();

    const island = await Island.create({
      userId,
      id: body.id,
      x: body.x,
      y: body.y,
      size: body.size,
      color: body.color,
      border: body.border,
      label: body.label,
      skin: body.skin || "dirt",
    });

    return NextResponse.json({
      id: island.id,
      x: island.x,
      y: island.y,
      size: island.size,
      color: island.color,
      border: island.border,
      label: island.label,
      skin: island.skin,
    });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Failed to save island" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await request.json();

    const island = await Island.findOneAndUpdate(
      { userId, id: body.id },
      { x: body.x, y: body.y },
      { new: true },
    );

    if (!island) {
      return NextResponse.json({ error: "Island not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: island.id,
      x: island.x,
      y: island.y,
      size: island.size,
      color: island.color,
      border: island.border,
      label: island.label,
      skin: island.skin,
    });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update island" },
      { status: 500 },
    );
  }
}
