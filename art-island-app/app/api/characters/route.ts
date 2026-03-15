import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

// ─── Schema ───────────────────────────────────────────────────────────────────

const memorySchema = new mongoose.Schema({
  id:        { type: String, required: true },
  text:      { type: String, required: true },
  createdAt: { type: Date,   default: Date.now },
});

const evolutionMilestoneSchema = new mongoose.Schema({
  imageUrl:  { type: String, required: true },
  createdAt: { type: Date,   default: Date.now },
  label:     { type: String, default: "" },
});

const versionHistorySchema = new mongoose.Schema({
  imageUrl:  { type: String, required: true },
  createdAt: { type: Date,   default: Date.now },
  stage:     { type: Number, required: true },
  label:     { type: String, default: "" },
});

const characterSchema = new mongoose.Schema({
  userId:      String,
  name:        String,
  age:         Number,
  imageUrl:    String,
  rigPath:     { type: String, default: null },
  position:    { x: Number, y: Number },
  islandId:    Number,
  joints:      { type: mongoose.Schema.Types.Mixed, default: null },
  riggedAt:    { type: Date, default: null },
  animationPreference: { type: String, default: "auto" },
  personality: { type: mongoose.Schema.Types.Mixed, default: null },
  memories:              { type: [memorySchema],             default: [] },
  evolutionMilestones:   { type: [evolutionMilestoneSchema], default: [] },
  versionHistory:        { type: [versionHistorySchema],     default: [] },
  createdAt:   { type: Date, default: Date.now },
});

const Character =
  mongoose.models.Character || mongoose.model("Character", characterSchema);

// ─── Auth ─────────────────────────────────────────────────────────────────────

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

// ─── Serialise ────────────────────────────────────────────────────────────────

function serializeCharacter(char: mongoose.Document & Record<string, unknown>) {
  const c = char as unknown as {
    _id:      { toString(): string };
    imageUrl: string;
    rigPath?: string | null;
    riggedAt?: Date | null;
    name:     string;
    age:      number;
    position: { x: number; y: number };
    islandId: number;
    joints:   unknown;
    personality: unknown;
    memories:            Array<{ id: string; text: string; createdAt: Date }>;
    evolutionMilestones: Array<{ imageUrl: string; createdAt: Date; label?: string }>;
    versionHistory:      Array<{ imageUrl: string; createdAt: Date; stage: number; label?: string }>;
  };
  const normalizeAge = (rawAge: unknown) => {
    const n = typeof rawAge === "number" ? rawAge : Number(rawAge);
    if (!Number.isFinite(n)) return 1;

    // Legacy bug compatibility: some ages were stored as timestamps or calendar years.
    if (n > 1_000_000_000) {
      const years = Math.floor((Date.now() - n) / (365.25 * 24 * 60 * 60 * 1000));
      return Math.min(200, Math.max(1, years));
    }
    if (n > 3000) {
      const years = Math.floor((Date.now() - n) / (365.25 * 24 * 60 * 60 * 1000));
      return Math.min(200, Math.max(1, years));
    }
    if (n > 200 && n < 3000) {
      const years = new Date().getFullYear() - Math.floor(n);
      return Math.min(200, Math.max(1, years));
    }

    return Math.min(200, Math.max(0, Math.floor(n)));
  };
  return {
    id:       c._id.toString(),
    imageUrl: c.imageUrl,
    rigPath:  c.rigPath ?? null,
    riggedAt: c.riggedAt ?? null,
    animationPreference: (c as { animationPreference?: string }).animationPreference ?? "auto",
    name:     c.name,
    age:      normalizeAge(c.age),
    position: c.position,
    islandId: c.islandId,
    joints:   c.joints ?? null,
    personality: c.personality ?? null,
    memories: (c.memories ?? []).map((m) => ({
      id: m.id, text: m.text, createdAt: m.createdAt,
    })),
    evolutionMilestones: (c.evolutionMilestones ?? []).map((m) => ({
      imageUrl: m.imageUrl, createdAt: m.createdAt, label: m.label ?? "",
    })),
    versionHistory: (c.versionHistory ?? []).map((v) => ({
      imageUrl:  v.imageUrl,
      createdAt: v.createdAt,
      stage:     v.stage,
      label:     v.label ?? `Stage ${v.stage}`,
    })),
  };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const characters = await Character.find({ userId }).sort({ createdAt: 1 });
    return NextResponse.json(characters.map(serializeCharacter));
  } catch (error) {
    console.error("GET /api/characters error:", error);
    return NextResponse.json({ error: "Failed to load characters" }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await request.json();

    const toSafeAge = (rawAge: unknown) => {
      const n = typeof rawAge === "number" ? rawAge : Number(rawAge);
      if (!Number.isFinite(n)) return 1;
      if (n > 200) return 1;
      return Math.min(200, Math.max(0, Math.floor(n)));
    };

    const character = await Character.create({
      userId,
      name:        body.name,
      age:         toSafeAge(body.age),
      imageUrl:    body.imageUrl,
      rigPath:     body.rigPath ?? null,
      position:    body.position,
      islandId:    body.islandId,
      joints:      body.joints ?? null,
      animationPreference: body.animationPreference ?? "auto",
      personality: body.personality ?? null,
      memories:    [],
      // Seed Stage 1 immediately so versionHistory is never empty
      versionHistory: body.imageUrl
        ? [{ imageUrl: body.imageUrl, createdAt: new Date(), stage: 1, label: "Stage 1" }]
        : [],
    });

    return NextResponse.json(serializeCharacter(character));
  } catch (error) {
    console.error("POST /api/characters error:", error);
    return NextResponse.json({ error: "Failed to save character" }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
//
//  { action: "add",    characterId, memory: { id, text } }
//  { action: "remove", characterId, memoryId }
//  { action: "evolve", characterId, imageUrl, joints, personality?, memoryText? }

export async function PATCH(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await request.json();
    const { action, characterId, memory, memoryId } = body;

    if (!characterId || !action)
      return NextResponse.json(
        { error: "characterId and action are required" }, { status: 400 }
      );

    const char = await Character.findOne({ _id: characterId, userId });
    if (!char)
      return NextResponse.json({ error: "Character not found" }, { status: 404 });

    // ── add memory ───────────────────────────────────────────────────────────
    if (action === "add") {
      if (!memory?.id || !memory?.text)
        return NextResponse.json(
          { error: "memory.id and memory.text are required" }, { status: 400 }
        );
      char.memories.push({ id: memory.id, text: memory.text, createdAt: new Date() });

    // ── remove memory ────────────────────────────────────────────────────────
    } else if (action === "remove") {
      if (!memoryId)
        return NextResponse.json({ error: "memoryId is required" }, { status: 400 });
      char.memories = char.memories.filter((m: { id: string }) => m.id !== memoryId);

    // ── set animation preference ─────────────────────────────────────────────
    } else if (action === "set-animation") {
      const mode = String(body.animationPreference || "").trim();
      const allowed = new Set(["auto", "idle", "walk", "hop", "wave", "run", "dance", "sleep"]);
      if (!allowed.has(mode)) {
        return NextResponse.json({ error: "Invalid animationPreference" }, { status: 400 });
      }
      char.animationPreference = mode;

    // ── evolve ───────────────────────────────────────────────────────────────
    } else if (action === "evolve") {
      const { imageUrl, joints, personality, memoryText } = body;
      if (!imageUrl || !joints)
        return NextResponse.json(
          { error: "imageUrl and joints are required for evolve" }, { status: 400 }
        );

      // ── Build version history as PLAIN objects ──────────────────────────
      //
      //    Mongoose subdocuments can't be reliably spread and re-assigned.
      //    Convert everything to plain JS first, then reassign the whole array.

      const existingHistory: Array<{
        imageUrl: string; createdAt: Date; stage: number; label: string;
      }> = (char.versionHistory ?? []).map((v: {
        imageUrl: string; createdAt: Date; stage: number; label?: string;
      }) => ({
        imageUrl:  v.imageUrl,
        createdAt: v.createdAt ?? new Date(),
        stage:     v.stage,
        label:     v.label ?? `Stage ${v.stage}`,
      }));

      // If the character predates versionHistory tracking, seed Stage 1 now
      if (existingHistory.length === 0 && char.imageUrl) {
        existingHistory.push({
          imageUrl:  char.imageUrl,
          createdAt: char.createdAt ?? new Date(),
          stage:     1,
          label:     "Stage 1",
        });
      }

      // Append the new stage
      const nextStage = existingHistory.length + 1;
      existingHistory.push({
        imageUrl,
        createdAt: new Date(),
        stage:     nextStage,
        label:     `Stage ${nextStage}`,
      });

      // Directly replace the array (plain objects, no Mongoose subdoc issues)
      char.versionHistory = existingHistory;
      char.markModified("versionHistory");

      // Also keep evolutionMilestones in sync (legacy / backwards-compat)
      const milestones = (char.evolutionMilestones ?? []).map((m: {
        imageUrl: string; createdAt: Date; label?: string;
      }) => ({
        imageUrl: m.imageUrl, createdAt: m.createdAt ?? new Date(), label: m.label ?? "",
      }));
      if (char.imageUrl) {
        milestones.push({
          imageUrl: char.imageUrl, createdAt: new Date(), label: `Stage ${milestones.length + 1}`,
        });
      }
      char.evolutionMilestones = milestones;
      char.markModified("evolutionMilestones");

      // Swap the active image + joints
      char.imageUrl = imageUrl;
      char.joints   = joints;
      char.riggedAt = new Date();

      // Merge personality (additive — never replaces previous traits)
      if (personality) {
        const current = (char.personality as {
          catchphrase?: string; traits?: string[];
          dailyActivity?: string; favoriteThing?: string;
        } | null) ?? { catchphrase: "", traits: [], dailyActivity: "", favoriteThing: "" };

        char.personality = {
          catchphrase:
            personality.catchphrase?.trim() || current.catchphrase || "",
          traits: Array.from(new Set([
            ...(current.traits ?? []),
            ...((personality.traits as string[] | undefined) ?? []),
          ])),
          dailyActivity: [current.dailyActivity, personality.dailyActivity]
            .filter((v) => typeof v === "string" && v.trim()).join(" | "),
          favoriteThing: [current.favoriteThing, personality.favoriteThing]
            .filter((v) => typeof v === "string" && v.trim()).join(" | "),
        };
      }

      // Attach optional memory note
      if (typeof memoryText === "string" && memoryText.trim()) {
        char.memories.push({
          id:        crypto.randomUUID(),
          text:      memoryText.trim(),
          createdAt: new Date(),
        });
      }

    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await char.save();
    return NextResponse.json(serializeCharacter(char));
  } catch (error) {
    console.error("PATCH /api/characters error:", error);
    return NextResponse.json({ error: "Failed to update character" }, { status: 500 });
  }
}