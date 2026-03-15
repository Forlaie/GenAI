import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

// ─── Schema ───────────────────────────────────────────────────────────────────
//
//  Custom themes are lesson / moral concepts a parent defines themselves.
//  They persist across sessions and appear alongside the built-in preset chips.

const themeSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  label: { type: String, required: true },   // e.g. "Coping with a new baby"
  emoji: { type: String, default: "💡" },    // parent-chosen emoji
  createdAt: { type: Date, default: Date.now },
});

const Theme = mongoose.models.Theme || mongoose.model("Theme", themeSchema);

// ─── Auth ─────────────────────────────────────────────────────────────────────

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me"
);

async function getUserId() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

// ─── GET — list all custom themes for this user ───────────────────────────────

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const themes = await Theme.find({ userId }).sort({ createdAt: 1 });

    return NextResponse.json(
      themes.map((t) => ({
        id: t._id.toString(),
        label: t.label,
        emoji: t.emoji,
        createdAt: t.createdAt,
        custom: true,
      }))
    );
  } catch (error) {
    console.error("GET /api/themes error:", error);
    return NextResponse.json({ error: "Failed to load themes" }, { status: 500 });
  }
}

// ─── POST — create a new custom theme ────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await request.json();

    if (!body.label?.trim()) {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }

    const theme = await Theme.create({
      userId,
      label: body.label.trim(),
      emoji: body.emoji?.trim() || "💡",
    });

    return NextResponse.json({
      id: theme._id.toString(),
      label: theme.label,
      emoji: theme.emoji,
      createdAt: theme.createdAt,
      custom: true,
    });
  } catch (error) {
    console.error("POST /api/themes error:", error);
    return NextResponse.json({ error: "Failed to save theme" }, { status: 500 });
  }
}

// ─── DELETE — remove a custom theme by id ─────────────────────────────────────
//  URL: /api/themes?id=<themeId>

export async function DELETE(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "id is required" }, { status: 400 });

    await connectDB();
    const result = await Theme.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0)
      return NextResponse.json({ error: "Theme not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/themes error:", error);
    return NextResponse.json({ error: "Failed to delete theme" }, { status: 500 });
  }
}