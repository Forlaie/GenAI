import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const storySchema = new mongoose.Schema({
  userId: String,
  title: String,
  content: String,
  characterIds: { type: [String], default: [] },
  characterNames: { type: [String], default: [] },
  characterImageUrls: { type: [String], default: [] },
  concept: { type: String, default: "" },
  conceptLabel: { type: String, default: "" },
  setting: { type: String, default: "" },
  settingLabel: { type: String, default: "" },
  childName: { type: String, default: "" },
  aiHeadline: { type: String, default: "" },
  aiSummary: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const Story = mongoose.models.Story || mongoose.model("Story", storySchema);
const Character =
  mongoose.models.Character ||
  mongoose.model(
    "Character",
    new mongoose.Schema(
      {
        userId: String,
        name: String,
        imageUrl: String,
      },
      { strict: false }
    )
  );

const CONCEPT_FALLBACK_LABELS: Record<string, string> = {
  sharing: "sharing",
  kindness: "kindness",
  honesty: "honesty",
  bravery: "bravery",
  friendship: "friendship",
  patience: "patience",
  differences: "respect",
  responsibility: "responsibility",
  gratitude: "gratitude",
  "problem-solving": "problem solving",
};

type CohereMessagePart = {
  type?: string;
  text?: string;
};

function extractCohereText(data: unknown): string {
  if (!data || typeof data !== "object") return "";

  const record = data as Record<string, unknown>;

  const outputText = record.output_text;
  if (typeof outputText === "string" && outputText.trim()) {
    return outputText.trim();
  }

  const directText = record.text;
  if (typeof directText === "string" && directText.trim()) {
    return directText.trim();
  }

  const message =
    record.message && typeof record.message === "object"
      ? (record.message as Record<string, unknown>)
      : null;
  const content = message?.content;

  if (Array.isArray(content)) {
    const parts = content as CohereMessagePart[];

    const firstTextPart = parts.find(
      (part) => typeof part?.text === "string" && part.text.trim().length > 0
    );
    if (firstTextPart?.text) {
      return firstTextPart.text.trim();
    }
  }

  return "";
}

function fallbackCardCopy(input: {
  childName: string;
  concept: string;
  conceptLabel: string;
  title: string;
  content: string;
}) {
  const learner = input.childName || "A child";
  const lesson =
    input.conceptLabel || CONCEPT_FALLBACK_LABELS[input.concept] || "a gentle lesson";
  const headline = `${learner} learns ${lesson}`;

  const flat = input.content
    .replace(/\s+/g, " ")
    .replace(/TITLE:\s*/i, "")
    .trim();
  const summary = flat.slice(0, 180);

  return {
    headline,
    summary: summary.length < flat.length ? `${summary}...` : summary,
  };
}

async function generateStoryCardCopyWithCohere(input: {
  title: string;
  content: string;
  childName: string;
  concept: string;
  conceptLabel: string;
  characterNames: string[];
}) {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    return fallbackCardCopy(input);
  }

  const prompt = `You write short story-card metadata.
Given the story below, return ONLY valid JSON with keys "headline" and "summary".

Rules:
- headline: <= 60 chars, style like "<child name> learns ..."
- summary: <= 180 chars, exactly 1-2 short sentences, warm and clear
- no emojis, no markdown, no extra keys, no explanations

Child: ${input.childName || "Child"}
Lesson: ${input.conceptLabel || input.concept || "kindness"}
Characters: ${input.characterNames.join(", ") || "N/A"}
Story title: ${input.title}
Story content:
${input.content}`;

  try {
    const res = await fetch("https://api.cohere.com/v2/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "command-a-reasoning-08-2025",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      return fallbackCardCopy(input);
    }

    const data = await res.json();
    const text = extractCohereText(data);
    if (!text) return fallbackCardCopy(input);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse((jsonMatch?.[0] || text).trim()) as {
      headline?: string;
      summary?: string;
    };

    const fallback = fallbackCardCopy(input);
    const headline = String(parsed.headline || fallback.headline).trim().slice(0, 80);
    const summary = String(parsed.summary || fallback.summary).trim().slice(0, 220);

    return {
      headline: headline || fallback.headline,
      summary: summary || fallback.summary,
    };
  } catch {
    return fallbackCardCopy(input);
  }
}

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
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const stories = await Story.find({ userId }).sort({ createdAt: -1 });
    const allCharacterIds = new Set<string>();
    for (const s of stories) {
      for (const id of s.characterIds ?? []) {
        if (typeof id === "string" && id) allCharacterIds.add(id);
      }
    }
    const userCharacters =
      allCharacterIds.size > 0
        ? await Character.find({ userId, _id: { $in: [...allCharacterIds] } })
        : [];
    const imageById = new Map(
      userCharacters.map((c: { _id: { toString(): string }; imageUrl?: string }) => [
        c._id.toString(),
        c.imageUrl || "",
      ])
    );

    return NextResponse.json(
      stories.map((story) => ({
        id: story._id.toString(),
        title: story.title,
        content: story.content,
        characterIds: story.characterIds,
        characterNames: story.characterNames,
        characterImageUrls:
          story.characterImageUrls?.length > 0
            ? story.characterImageUrls
            : (story.characterIds ?? [])
                .map((id: string) => imageById.get(id) || "")
                .filter(Boolean),
        concept: story.concept,
        conceptLabel: story.conceptLabel,
        setting: story.setting,
        settingLabel: story.settingLabel,
        childName: story.childName,
        aiHeadline: story.aiHeadline,
        aiSummary: story.aiSummary,
        createdAt: story.createdAt,
      }))
    );
  } catch (error) {
    console.error("GET /api/stories error:", error);
    return NextResponse.json(
      { error: "Failed to load stories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const characterIds: string[] = [];
    if (Array.isArray(body.characterIds)) {
      for (const id of body.characterIds as unknown[]) {
        if (typeof id === "string") {
          characterIds.push(id);
        }
      }
    }

    const characterNames: string[] = [];
    if (Array.isArray(body.characterNames)) {
      for (const name of body.characterNames as unknown[]) {
        if (typeof name === "string") {
          characterNames.push(name);
        }
      }
    }
    const concept = String(body.concept || "").trim();
    const conceptLabel = String(body.conceptLabel || "").trim();
    const setting = String(body.setting || "").trim();
    const settingLabel = String(body.settingLabel || "").trim();
    const childName = String(body.childName || "").trim();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    if (characterIds.length === 0) {
      return NextResponse.json(
        { error: "At least one character is required" },
        { status: 400 }
      );
    }

    const charactersForImages = await Character.find({
      userId,
      _id: { $in: characterIds },
    });
    const imageById = new Map(
      charactersForImages.map((c: { _id: { toString(): string }; imageUrl?: string }) => [
        c._id.toString(),
        c.imageUrl || "",
      ])
    );
    const characterImageUrls = characterIds
      .map((id) => imageById.get(id) || "")
      .filter(Boolean);

    const cardCopy = await generateStoryCardCopyWithCohere({
      title,
      content,
      childName,
      concept,
      conceptLabel,
      characterNames,
    });

    const story = await Story.create({
      userId,
      title,
      content,
      characterIds,
      characterNames,
      characterImageUrls,
      concept,
      conceptLabel,
      setting,
      settingLabel,
      childName,
      aiHeadline: cardCopy.headline,
      aiSummary: cardCopy.summary,
    });

    return NextResponse.json({
      id: story._id.toString(),
      title: story.title,
      content: story.content,
      characterIds: story.characterIds,
      characterNames: story.characterNames,
      characterImageUrls: story.characterImageUrls,
      concept: story.concept,
      conceptLabel: story.conceptLabel,
      setting: story.setting,
      settingLabel: story.settingLabel,
      childName: story.childName,
      aiHeadline: story.aiHeadline,
      aiSummary: story.aiSummary,
      createdAt: story.createdAt,
    });
  } catch (error) {
    console.error("POST /api/stories error:", error);
    return NextResponse.json(
      { error: "Failed to save story" },
      { status: 500 }
    );
  }
}
