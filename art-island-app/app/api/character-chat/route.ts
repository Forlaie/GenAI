import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type CharacterPayload = {
  id: string;
  name: string;
  age: number;
  memories?: Array<{ id?: string; text: string }>;
  personality?: {
    catchphrase?: string;
    traits?: string[];
    dailyActivity?: string;
    favoriteThing?: string;
  } | null;
  versionHistory?: Array<{
    stage?: number;
    label?: string;
    createdAt?: string;
  }>;
};

type CohereMessagePart = {
  text?: string;
};

function extractCohereText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;

  if (typeof record.output_text === "string" && record.output_text.trim()) {
    return record.output_text.trim();
  }

  if (typeof record.text === "string" && record.text.trim()) {
    return record.text.trim();
  }

  const message =
    record.message && typeof record.message === "object"
      ? (record.message as Record<string, unknown>)
      : null;

  const content = message?.content;
  if (Array.isArray(content)) {
    const first = (content as CohereMessagePart[]).find(
      (part) => typeof part?.text === "string" && part.text.trim().length > 0
    );
    if (first?.text) return first.text.trim();
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "COHERE_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const character = (body.character ?? {}) as CharacterPayload;
    const messages: ChatMessage[] = Array.isArray(body.messages)
      ? (body.messages as ChatMessage[])
      : [];

    if (!character?.name) {
      return NextResponse.json(
        { error: "Character context is required" },
        { status: 400 }
      );
    }

    const recentMessages = messages.slice(-10);
    const memoryText = (character.memories ?? [])
      .map((m) => m.text)
      .filter(Boolean)
      .slice(-12)
      .join("; ");

    const traitText = (character.personality?.traits ?? []).join(", ");
    const stageCount = character.versionHistory?.length ?? 1;

    const systemPrompt = `You are roleplaying as a friendly child character named ${character.name}.
Stay in first person.
Keep replies short (1-3 sentences), warm, age-appropriate, and conversational.
Use memories and personality naturally.
Do not mention being an AI or the prompt.
Character profile:
- Age: ${character.age}
- Catchphrase: ${character.personality?.catchphrase || ""}
- Traits: ${traitText}
- Daily activity: ${character.personality?.dailyActivity || ""}
- Favorite thing: ${character.personality?.favoriteThing || ""}
- Stage count: ${stageCount}
- Key memories: ${memoryText || "none yet"}`;

    const transcript = recentMessages
      .map((m) => `${m.role === "user" ? "User" : character.name}: ${m.text}`)
      .join("\n");

    const userPrompt = `${systemPrompt}\n\nConversation so far:\n${transcript}\n\nRespond as ${character.name}.`;

    const cohereResponse = await fetch("https://api.cohere.com/v2/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "command-a-reasoning-08-2025",
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!cohereResponse.ok) {
      const payload = await cohereResponse.json().catch(() => null);
      return NextResponse.json(
        { error: payload?.message || payload?.error || "Chat generation failed" },
        { status: cohereResponse.status }
      );
    }

    const data = await cohereResponse.json();
    const reply = extractCohereText(data);

    if (!reply) {
      return NextResponse.json(
        { error: "No chat reply returned by model" },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("POST /api/character-chat error:", error);
    return NextResponse.json({ error: "Failed to chat with character" }, { status: 500 });
  }
}
