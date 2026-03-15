import { NextResponse } from "next/server";
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
  joints: { type: mongoose.Schema.Types.Mixed, default: null }, // ← add
  riggedAt: { type: Date, default: null }, // ← add
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

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const characters = await Character.find({ userId }).sort({ createdAt: 1 });

    return NextResponse.json(
      characters.map((char) => ({
        id: char._id.toString(),
        imageUrl: char.imageUrl,
        name: char.name,
        age: char.age,
        position: char.position,
        islandId: char.islandId,
      }))
    );
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Failed to load characters" },
      { status: 500 }
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

    const character = await Character.create({
      userId,
      name: body.name,
      age: body.age,
      imageUrl: body.imageUrl,
      position: body.position,
      islandId: body.islandId,
      joints: body.joints ?? null,
    });

    return NextResponse.json({
      id: character._id.toString(),
      name: character.name,
      age: character.age,
      imageUrl: character.imageUrl,
      position: character.position,
      islandId: character.islandId,
    });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Failed to save character" },
      { status: 500 }
    );
  }
}
