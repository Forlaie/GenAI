"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/app/components/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CharacterMemory {
  id: string;
  text: string;
  createdAt?: string;
}

export interface CharacterData {
  id: string;
  imageUrl: string;
  name: string;
  age: number;
  position?: { x: number; y: number };
  islandId?: number;
  memories: CharacterMemory[];
  personality?: {
    catchphrase?: string;
    traits?: string[];
    dailyActivity?: string;
    favoriteThing?: string;
  } | null;
}

interface ThemeData {
  id: string;
  label: string;
  emoji: string;
  custom?: boolean;
}

interface StorySettingData {
  id: string;
  label: string;
  emoji: string;
  custom?: boolean;
}

interface StoryData {
  id: string;
  title: string;
  content: string;
  characterIds: string[];
  characterNames: string[];
  concept: string;
  conceptLabel?: string;
  setting?: string;
  settingLabel?: string;
  childName?: string;
  createdAt: string;
}

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESET_THEMES: ThemeData[] = [
  { id: "sharing", label: "Sharing & Generosity", emoji: "🎁" },
  { id: "kindness", label: "Kindness & Empathy", emoji: "💛" },
  { id: "honesty", label: "Honesty & Trust", emoji: "🌟" },
  { id: "bravery", label: "Bravery & Courage", emoji: "🦁" },
  { id: "friendship", label: "Friendship & Loyalty", emoji: "🤝" },
  { id: "patience", label: "Patience & Perseverance", emoji: "🌱" },
  { id: "differences", label: "Respecting Differences", emoji: "🌈" },
  { id: "responsibility", label: "Responsibility", emoji: "⭐" },
  { id: "gratitude", label: "Gratitude", emoji: "🙏" },
  { id: "problem-solving", label: "Problem Solving", emoji: "🔍" },
];

const PRESET_SETTINGS: StorySettingData[] = [
  { id: "enchanted-forest", label: "Enchanted Forest", emoji: "🌲" },
  { id: "ocean-kingdom", label: "Ocean Kingdom", emoji: "🌊" },
  { id: "outer-space", label: "Outer Space", emoji: "🚀" },
  { id: "cozy-village", label: "Cozy Village", emoji: "🏡" },
  { id: "mountain-adventure", label: "Mountain Adventure", emoji: "🏔️" },
  { id: "magical-school", label: "Magical School", emoji: "✏️" },
];

const STORY_LENGTHS = [
  { id: "short", label: "Short", desc: "~200 words" },
  { id: "medium", label: "Medium", desc: "~400 words" },
  { id: "long", label: "Long", desc: "~600 words" },
];

const EMOJI_OPTIONS = [
  "💡",
  "🌙",
  "🦋",
  "🐣",
  "🌺",
  "🎯",
  "🧩",
  "💪",
  "🌍",
  "❤️",
  "🎨",
  "🏆",
];

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── CharacterSelectCard ──────────────────────────────────────────────────────

function CharacterSelectCard({
  character,
  selected,
  onToggle,
  onAddMemory,
  onRemoveMemory,
}: {
  character: CharacterData;
  selected: boolean;
  onToggle: () => void;
  onAddMemory: (characterId: string, text: string) => Promise<void>;
  onRemoveMemory: (characterId: string, memoryId: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [memInput, setMemInput] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    const t = memInput.trim();
    if (!t) return;
    setSaving(true);
    await onAddMemory(character.id, t);
    setMemInput("");
    setSaving(false);
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${
        selected
          ? "border-amber-400 bg-amber-50 ring-2 ring-amber-100"
          : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >
      {/* Click top area to select */}
      <button type="button" onClick={onToggle} className="w-full p-3 text-left">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-stone-50 border border-stone-100">
          <Image
            src={character.imageUrl}
            alt={character.name}
            fill
            className="object-contain"
          />
          {selected && (
            <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white shadow-sm">
              ✓
            </span>
          )}
        </div>
        <p className="mt-2 truncate text-sm font-semibold text-stone-800">
          {character.name}
        </p>
        <p className="text-xs text-stone-400">Age {character.age}</p>
      </button>

      {/* Memory footer */}
      <div className="border-t border-stone-100 px-3 pb-3">
        <button
          type="button"
          onClick={() => {
            setExpanded((v) => !v);
            if (!expanded) setTimeout(() => inputRef.current?.focus(), 80);
          }}
          className="mt-2 flex w-full items-center justify-between text-xs text-stone-400 hover:text-stone-600 transition"
        >
          <span>
            {character.memories.length === 0
              ? "No memories yet"
              : `${character.memories.length} memor${
                  character.memories.length === 1 ? "y" : "ies"
                }`}
          </span>
          <span className="text-stone-300 text-[10px]">
            {expanded ? "▲ hide" : "▼ edit"}
          </span>
        </button>

        {expanded && (
          <div className="mt-2 space-y-2">
            {character.memories.length > 0 && (
              <ul className="space-y-1">
                {character.memories.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-start justify-between gap-1 rounded-lg bg-stone-50 px-2.5 py-1.5"
                  >
                    <span className="text-xs text-stone-600 leading-snug flex-1">
                      · {m.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveMemory(character.id, m.id)}
                      className="shrink-0 mt-0.5 text-stone-300 hover:text-red-400 transition text-sm leading-none"
                      title="Remove"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-1.5">
              <input
                ref={inputRef}
                value={memInput}
                onChange={(e) => setMemInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Add a memory…"
                className="flex-1 min-w-0 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving || !memInput.trim()}
                className="shrink-0 rounded-lg bg-amber-400 px-2.5 py-1.5 text-xs font-bold text-stone-900 disabled:bg-stone-200 disabled:text-stone-400 hover:bg-amber-300 transition"
              >
                {saving ? "…" : "+"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ThemeChip ────────────────────────────────────────────────────────────────

function ThemeChip({
  theme,
  selected,
  onToggle,
  onDelete,
}: {
  theme: ThemeData;
  selected: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={`group relative inline-flex items-center rounded-full border transition-all ${
        selected
          ? "border-amber-400 bg-amber-50 text-amber-800"
          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
      >
        <span className="text-base leading-none">{theme.emoji}</span>
        <span className={selected ? "font-medium" : ""}>{theme.label}</span>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="mr-2 flex items-center justify-center w-4 h-4 rounded-full bg-stone-100 text-stone-400 hover:bg-red-100 hover:text-red-500 transition text-[10px]"
          title="Delete custom item"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ─── StoryCard ────────────────────────────────────────────────────────────────

function StoryCard({
  story,
  allThemes,
  allSettings,
  onView,
}: {
  story: StoryData;
  allThemes: ThemeData[];
  allSettings: StorySettingData[];
  onView: () => void;
}) {
  const theme = allThemes.find((t) => t.id === story.concept);
  const themeLabel = theme?.label ?? story.conceptLabel ?? story.concept;
  const themeEmoji = theme?.emoji ?? "📖";
  const setting = allSettings.find((s) => s.id === story.setting);
  const settingLabel = setting?.label ?? story.settingLabel;
  const settingEmoji = setting?.emoji ?? "📍";

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-bold text-stone-900 leading-snug">
            {story.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {story.characterNames.map((name) => (
              <span
                key={`${story.id}-${name}`}
                className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600"
              >
                {name}
              </span>
            ))}
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              {themeEmoji} {themeLabel}
            </span>
            {settingLabel && (
              <span className="rounded-full bg-violet-50 border border-violet-200 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                {settingEmoji} {settingLabel}
              </span>
            )}
            {story.childName && (
              <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-xs text-sky-700">
                for {story.childName}
              </span>
            )}
          </div>
        </div>
        <p className="shrink-0 text-xs text-stone-400 mt-0.5">
          {new Date(story.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700 line-clamp-5">
        {story.content}
      </p>
      <div className="mt-4">
        <button
          type="button"
          onClick={onView}
          className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50"
        >
          View full story
        </button>
      </div>
    </article>
  );
}

// ─── StepLabel ────────────────────────────────────────────────────────────────

function StepLabel({
  n,
  label,
  sub,
}: {
  n: number;
  label: string;
  sub?: string;
}) {
  const darkMode = false;
  return (
    <div className="flex items-start gap-2.5">
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
        style={{
          backgroundColor: darkMode ? "rgba(96, 165, 250, 0.2)" : "#fff3cd",
          color: darkMode ? "#60a5fa" : "#856404",
        }}
      >
        {n}
      </span>
      <div>
        <p
          className="text-sm font-semibold"
          style={{ color: darkMode ? "#f0f6ff" : "#1a1a1a" }}
        >
          {label}
        </p>
        {sub && (
          <p
            className="text-xs mt-0.5"
            style={{ color: darkMode ? "#7ea8c4" : "#888780" }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  optional,
  required,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  type?: string;
  multiline?: boolean;
}) {
  const base =
    "w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300";
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-stone-400">
        {label}
        {optional && (
          <span className="normal-case font-normal text-stone-300">
            optional
          </span>
        )}
        {required && (
          <span className="text-red-400 normal-case font-normal">required</span>
        )}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StoryboardPage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [customThemes, setCustomThemes] = useState<ThemeData[]>([]);
  const [customSettings, setCustomSettings] = useState<StorySettingData[]>([]);
  const [stories, setStories] = useState<StoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>(
    [],
  );
  const [selectedConcept, setSelectedConcept] = useState("");

  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [selectedSetting, setSelectedSetting] = useState("");
  const [storyLength, setStoryLength] = useState("medium");
  const [favoriteThings, setFavoriteThings] = useState("");
  const [extraNote, setExtraNote] = useState("");

  const [showThemeForm, setShowThemeForm] = useState(false);
  const [newThemeLabel, setNewThemeLabel] = useState("");
  const [newThemeEmoji, setNewThemeEmoji] = useState("💡");
  const [savingTheme, setSavingTheme] = useState(false);

  const [showSettingForm, setShowSettingForm] = useState(false);
  const [newSettingLabel, setNewSettingLabel] = useState("");
  const [newSettingEmoji, setNewSettingEmoji] = useState("✨");
  const [savingSetting, setSavingSetting] = useState(false);

  const [activeStory, setActiveStory] = useState<StoryData | null>(null);
  const [narrating, setNarrating] = useState(false);
  const [narratingId, setNarratingId] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const allThemes = useMemo(
    () => [...PRESET_THEMES, ...customThemes],
    [customThemes],
  );

  const allSettings = useMemo(
    () => [...PRESET_SETTINGS, ...customSettings],
    [customSettings],
  );

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [charsRes, storiesRes, themesRes, settingsRes] = await Promise.all([
        fetch("/api/characters"),
        fetch("/api/stories"),
        fetch("/api/themes"),
        fetch("/api/story-settings"),
      ]);
      if ([charsRes, storiesRes].some((r) => r.status === 401)) {
        router.push("/login");
        return;
      }
      if (!charsRes.ok) throw new Error("Failed to load characters");
      if (!storiesRes.ok) throw new Error("Failed to load stories");
      const [charsData, storiesData, themesData, settingsData] =
        await Promise.all([
          charsRes.json(),
          storiesRes.json(),
          themesRes.ok ? themesRes.json() : Promise.resolve([]),
          settingsRes.ok ? settingsRes.json() : Promise.resolve([]),
        ]);
      setCharacters(charsData);
      setStories(storiesData);
      setCustomThemes(themesData);
      setCustomSettings(settingsData);
    } catch {
      setError("Could not load your storyboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Hydration-safe dark mode initialization
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved) {
      setDarkMode(JSON.parse(saved));
    }
  }, []);

  // Sync with localStorage when darkMode changes
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const selectedCharacters = useMemo(
    () => characters.filter((c) => selectedCharacterIds.includes(c.id)),
    [characters, selectedCharacterIds],
  );

  const toggleCharacter = (id: string) =>
    setSelectedCharacterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const canGenerate =
    selectedCharacterIds.length > 0 &&
    selectedConcept !== "" &&
    childAge !== "" &&
    selectedSetting !== "";

  // ── Memory handlers ───────────────────────────────────────────────────────
  const handleAddMemory = async (characterId: string, text: string) => {
    const memory = { id: nanoid(), text };
    const res = await fetch("/api/characters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", characterId, memory }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === characterId ? { ...c, memories: updated.memories } : c,
        ),
      );
    }
  };

  const handleRemoveMemory = async (characterId: string, memoryId: string) => {
    const res = await fetch("/api/characters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", characterId, memoryId }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === characterId ? { ...c, memories: updated.memories } : c,
        ),
      );
    }
  };

  // ── Theme handlers ────────────────────────────────────────────────────────
  const handleSaveTheme = async () => {
    if (!newThemeLabel.trim()) return;
    setSavingTheme(true);
    try {
      const res = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newThemeLabel.trim(),
          emoji: newThemeEmoji,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setCustomThemes((prev) => [...prev, saved]);
        setNewThemeLabel("");
        setNewThemeEmoji("💡");
        setShowThemeForm(false);
      }
    } finally {
      setSavingTheme(false);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!window.confirm("Delete this custom theme?")) return;
    if (selectedConcept === themeId) setSelectedConcept("");
    const res = await fetch(`/api/themes?id=${themeId}`, { method: "DELETE" });
    if (res.ok) {
      setCustomThemes((prev) => prev.filter((t) => t.id !== themeId));
    }
  };

  const handleSaveSetting = async () => {
    if (!newSettingLabel.trim()) return;
    setSavingSetting(true);
    try {
      const res = await fetch("/api/story-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newSettingLabel.trim(),
          emoji: newSettingEmoji,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        setCustomSettings((prev) => [...prev, saved]);
        setNewSettingLabel("");
        setNewSettingEmoji("✨");
        setShowSettingForm(false);
      }
    } finally {
      setSavingSetting(false);
    }
  };

  const handleDeleteSetting = async (settingId: string) => {
    if (!window.confirm("Delete this custom story setting?")) return;
    if (selectedSetting === settingId) setSelectedSetting("");
    const res = await fetch(`/api/story-settings?id=${settingId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCustomSettings((prev) => prev.filter((s) => s.id !== settingId));
    }
  };

  const stopNarration = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setNarrating(false);
    setNarratingId(null);
  };

  const handleNarrateStory = async (story: StoryData) => {
    try {
      if (narrating && narratingId === story.id) {
        stopNarration();
        return;
      }

      stopNarration();
      setNarrating(true);
      setNarratingId(story.id);

      const res = await fetch("/api/story-narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: story.title, content: story.content }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Could not narrate this story");
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => stopNarration();
      audio.onerror = () => stopNarration();
      await audio.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Narration failed.");
      stopNarration();
    }
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!canGenerate) {
      setError(
        "Please select characters, a lesson, a setting, and your child's age.",
      );
      return;
    }
    try {
      setGenerating(true);
      setError(null);
      setGeneratedStory(null);

      const conceptLabel =
        allThemes.find((t) => t.id === selectedConcept)?.label ??
        selectedConcept;
      const settingLabel =
        allSettings.find((s) => s.id === selectedSetting)?.label ??
        selectedSetting;

      const res = await fetch("/api/story-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          characters: selectedCharacters,
          concept: selectedConcept,
          conceptLabel,
          childName,
          childAge,
          setting: selectedSetting,
          settingLabel,
          storyLength,
          favoriteThings,
          extraNote,
        }),
      });

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null);
        throw new Error(
          errorPayload?.error ||
            errorPayload?.message ||
            "Story generation failed.",
        );
      }

      const data = await res.json();
      const title = typeof data?.title === "string" ? data.title : "";
      const content = typeof data?.content === "string" ? data.content : "";

      if (!title || !content) {
        throw new Error("Story service returned an empty response");
      }

      const maturationUpdates = Array.isArray(data?.maturationUpdates)
        ? data.maturationUpdates
        : [];

      if (maturationUpdates.length > 0) {
        const settled = await Promise.allSettled(
          maturationUpdates.map((update: unknown) => {
            if (!update || typeof update !== "object") {
              return Promise.resolve(null);
            }
            const record = update as Record<string, unknown>;
            const characterId = String(record.characterId || "").trim();
            if (!characterId) return Promise.resolve(null);

            return fetch("/api/characters", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "mature-story",
                characterId,
                memoryText: String(record.newMemory || "").trim(),
                personalityDelta:
                  record.personalityDelta &&
                  typeof record.personalityDelta === "object"
                    ? record.personalityDelta
                    : {},
              }),
            }).then(async (r) => (r.ok ? r.json() : null));
          }),
        );

        const updatedById = new Map<string, CharacterData>();
        for (const item of settled) {
          if (item.status === "fulfilled" && item.value?.id) {
            updatedById.set(item.value.id, item.value as CharacterData);
          }
        }

        if (updatedById.size > 0) {
          setCharacters((prev) => prev.map((c) => updatedById.get(c.id) ?? c));
        }
      }

      setGeneratedStory({ title, content });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Story generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!generatedStory) return;
    try {
      setSaving(true);
      setError(null);
      const conceptLabel =
        allThemes.find((t) => t.id === selectedConcept)?.label ??
        selectedConcept;
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedStory.title,
          content: generatedStory.content,
          characterIds: selectedCharacterIds,
          characterNames: selectedCharacters.map((c) => c.name),
          concept: selectedConcept,
          conceptLabel,
          setting: selectedSetting,
          settingLabel:
            allSettings.find((s) => s.id === selectedSetting)?.label ||
            selectedSetting,
          childName,
        }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        const p = await res.json().catch(() => null);
        throw new Error(p?.error ?? "Failed to save story");
      }
      await res.json();
      setGeneratedStory(null);
      setSelectedCharacterIds([]);
      setSelectedConcept("");
      setChildName("");
      setChildAge("");
      setSelectedSetting("");
      setFavoriteThings("");
      setExtraNote("");
      router.push("/storyboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save story.");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    const bgColor = darkMode ? "#0f2336" : "#ffffff";
    const textMuted = darkMode ? "#7ea8c4" : "#888780";
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <p className="text-sm animate-pulse" style={{ color: textMuted }}>
          Loading storyboard…
        </p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const bgColor = darkMode ? "#0f2336" : "#ffffff";
  const textMain = darkMode ? "#f0f6ff" : "#1a1a1a";
  const textMuted = darkMode ? "#7ea8c4" : "#888780";
  const borderColor = darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const cardBg = darkMode ? "#1e3a52" : "#f9fafb";
  const inputBg = darkMode ? "rgba(255,255,255,0.05)" : "#ffffff";

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <Navbar
        title="Create New Story"
        subtitle="Build a personalized story from your characters"
        onDarkModeChange={setDarkMode}
        showBackButton={true}
      />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6 pt-20">
        {error && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: darkMode ? "rgba(248, 113, 113, 0.3)" : "#fecaca",
              backgroundColor: darkMode ? "rgba(127, 29, 29, 0.2)" : "#fee2e2",
              color: darkMode ? "#fca5a5" : "#991b1b",
            }}
          >
            {error}
          </div>
        )}

        {/* Builder card */}
        <div
          className="rounded-2xl border shadow-sm overflow-hidden"
          style={{
            borderColor: borderColor,
            backgroundColor: darkMode ? "#12425c" : "#ffffff",
          }}
        >
          <div
            className="border-b px-6 py-4"
            style={{
              borderColor: borderColor,
            }}
          >
            <h2 className="text-sm font-semibold" style={{ color: textMain }}>
              Build a story
            </h2>
            <p className="text-xs mt-0.5" style={{ color: textMuted }}>
              Complete each step - we&apos;ll weave your characters&apos;
              memories into a personalised story.
            </p>
          </div>

          <div
            style={{
              borderColor: borderColor,
            }}
          >
            {/* Step 1 — Characters */}
            <section className="px-6 py-5 space-y-3">
              <StepLabel
                n={1}
                label="Choose characters"
                sub="Click to select · expand each card to view and add memories"
                darkMode={darkMode}
                textMain={textMain}
                textMuted={textMuted}
              />

              {characters.length === 0 ? (
                <p className="text-sm" style={{ color: textMuted }}>
                  No characters yet — create some on your island first.
                </p>
              ) : (
                <div
                  className="overflow-y-auto overscroll-contain pr-1"
                  style={{ maxHeight: "min(34rem, 65vh)" }}
                >
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {characters.map((character) => (
                      <CharacterSelectCard
                        key={character.id}
                        character={character}
                        selected={selectedCharacterIds.includes(character.id)}
                        onToggle={() => toggleCharacter(character.id)}
                        onAddMemory={handleAddMemory}
                        onRemoveMemory={handleRemoveMemory}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Memory preview for selected characters that have memories */}
              {selectedCharacters.some((c) => c.memories.length > 0) && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700 mb-2">
                    Memories woven into this story:
                  </p>
                  <div className="space-y-1">
                    {selectedCharacters
                      .filter((c) => c.memories.length > 0)
                      .map((c) => (
                        <div key={c.id} className="text-xs text-stone-600">
                          <span className="font-medium text-stone-700">
                            {c.name}:
                          </span>{" "}
                          {c.memories.map((m) => m.text).join(", ")}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </section>

            {/* Step 2 — Lesson */}
            <section className="px-6 py-5 space-y-3">
              <StepLabel
                n={2}
                label="Choose a lesson"
                sub="Pick a preset or save your own — custom themes are stored for reuse"
              />

              <div className="flex flex-wrap gap-2">
                {allThemes.map((theme) => (
                  <ThemeChip
                    key={theme.id}
                    theme={theme}
                    selected={selectedConcept === theme.id}
                    onToggle={() =>
                      setSelectedConcept(
                        selectedConcept === theme.id ? "" : theme.id,
                      )
                    }
                    onDelete={
                      theme.custom
                        ? () => handleDeleteTheme(theme.id)
                        : undefined
                    }
                  />
                ))}

                {!showThemeForm && (
                  <button
                    type="button"
                    onClick={() => setShowThemeForm(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-400 hover:border-stone-400 hover:text-stone-600 transition"
                  >
                    + Custom theme
                  </button>
                )}
              </div>

              {/* Custom theme creator */}
              {showThemeForm && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <p className="text-xs text-amber-700 font-medium">
                    Create a recurring theme - it&apos;ll be saved and ready to
                    use every time.
                  </p>
                  {/* Emoji row */}
                  <div className="flex flex-wrap gap-1">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setNewThemeEmoji(e)}
                        className={`text-base rounded-md px-1.5 py-0.5 transition ${
                          newThemeEmoji === e
                            ? "bg-amber-200 ring-1 ring-amber-400"
                            : "hover:bg-amber-100"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  {/* Label + save */}
                  <div className="flex items-center gap-2">
                    <input
                      value={newThemeLabel}
                      onChange={(e) => setNewThemeLabel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveTheme()}
                      placeholder="e.g. Dealing with a new baby sibling"
                      autoFocus
                      className="flex-1 min-w-0 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    <button
                      type="button"
                      onClick={handleSaveTheme}
                      disabled={savingTheme || !newThemeLabel.trim()}
                      className="shrink-0 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-900 disabled:bg-stone-200 disabled:text-stone-400 hover:bg-amber-300 transition"
                    >
                      {savingTheme ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowThemeForm(false);
                        setNewThemeLabel("");
                      }}
                      className="text-xs text-stone-400 hover:text-stone-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Step 3 — About the child */}
            <section className="px-6 py-5 space-y-4">
              <StepLabel
                n={3}
                label="About your child"
                sub="Personalises the language, references, and emotional tone"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Child's name"
                  optional
                  value={childName}
                  onChange={setChildName}
                  placeholder="e.g. Lily"
                />
                <Field
                  label="Child's age"
                  required
                  value={childAge}
                  onChange={setChildAge}
                  placeholder="e.g. 5"
                  type="number"
                />
              </div>
              <Field
                label="Their favourite things"
                optional
                value={favoriteThings}
                onChange={setFavoriteThings}
                placeholder="e.g. dinosaurs, swimming, her dog Max, strawberries"
              />
            </section>

            {/* Step 4 — Story settings */}
            <section className="px-6 py-5 space-y-4">
              <StepLabel
                n={4}
                label="Story settings"
                sub="Where it happens and how long it should be"
              />

              <div>
                <label className="mb-2 block text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
                  Setting{" "}
                  <span className="text-red-400 normal-case font-normal">
                    required
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {allSettings.map((s) => (
                    <ThemeChip
                      key={s.id}
                      theme={s}
                      selected={selectedSetting === s.id}
                      onToggle={() =>
                        setSelectedSetting(selectedSetting === s.id ? "" : s.id)
                      }
                      onDelete={
                        s.custom ? () => handleDeleteSetting(s.id) : undefined
                      }
                    />
                  ))}

                  {!showSettingForm && (
                    <button
                      type="button"
                      onClick={() => setShowSettingForm(true)}
                      className="inline-flex items-center gap-1 rounded-full border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-400 hover:border-stone-400 hover:text-stone-600 transition"
                    >
                      + Custom setting
                    </button>
                  )}
                </div>

                {showSettingForm && (
                  <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3 space-y-2">
                    <p className="text-xs text-violet-700 font-medium">
                      Save your own story setting so you can reuse it anytime.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {EMOJI_OPTIONS.map((e) => (
                        <button
                          key={`setting-${e}`}
                          type="button"
                          onClick={() => setNewSettingEmoji(e)}
                          className={`text-base rounded-md px-1.5 py-0.5 transition ${
                            newSettingEmoji === e
                              ? "bg-violet-200 ring-1 ring-violet-400"
                              : "hover:bg-violet-100"
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={newSettingLabel}
                        onChange={(e) => setNewSettingLabel(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSaveSetting()
                        }
                        placeholder="e.g. Rainy City Adventure"
                        className="flex-1 min-w-0 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-300"
                      />
                      <button
                        type="button"
                        onClick={handleSaveSetting}
                        disabled={savingSetting || !newSettingLabel.trim()}
                        className="shrink-0 rounded-lg bg-violet-400 px-4 py-2 text-sm font-semibold text-white disabled:bg-stone-200 disabled:text-stone-400 transition hover:bg-violet-500"
                      >
                        {savingSetting ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSettingForm(false);
                          setNewSettingLabel("");
                        }}
                        className="text-xs text-stone-400 hover:text-stone-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
                  Story length
                </label>
                <div className="flex gap-2">
                  {STORY_LENGTHS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setStoryLength(l.id)}
                      className={`flex-1 rounded-xl border py-2.5 transition-all ${
                        storyLength === l.id
                          ? "border-amber-400 bg-amber-50 text-amber-800"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      <span className="block text-sm font-semibold">
                        {l.label}
                      </span>
                      <span className="block text-[11px] opacity-60 mt-0.5">
                        {l.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Field
                label="Anything else to include?"
                optional
                value={extraNote}
                onChange={setExtraNote}
                placeholder="e.g. She just started school and is nervous about making friends."
                multiline
              />
            </section>

            {/* Generate bar */}
            <div className="flex items-center justify-between bg-stone-50 px-6 py-4">
              <p className="text-xs text-stone-400">
                {canGenerate
                  ? `${selectedCharacters.length} character${selectedCharacters.length !== 1 ? "s" : ""} · ${allThemes.find((t) => t.id === selectedConcept)?.label}`
                  : "Complete steps 1–4 to generate"}
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !canGenerate}
                className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-stone-900 hover:bg-amber-300 transition disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed"
              >
                {generating ? "Writing story…" : "✨ Generate Story"}
              </button>
            </div>
          </div>
        </div>

        {/* Generated story preview */}
        {(generating || generatedStory) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-amber-900">
                {generating ? "Writing your story…" : "Your story is ready!"}
              </h2>
              {!generating && generatedStory && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="rounded-full border border-amber-300 bg-white px-3.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 transition"
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-stone-900 hover:bg-amber-300 transition disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save Story"}
                  </button>
                </div>
              )}
            </div>

            {generating && (
              <div className="space-y-2.5 animate-pulse">
                {[55, 100, 80, 100, 70, 90, 60].map((w, i) => (
                  <div
                    key={i}
                    className="h-2.5 rounded-full bg-amber-200"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            )}

            {!generating && generatedStory && (
              <>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {generatedStory.title}
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                  {generatedStory.content}
                </p>
              </>
            )}
          </div>
        )}

        {/* Saved stories */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Saved stories
            </h2>
            <p className="text-xs text-stone-400">
              {stories.length} {stories.length === 1 ? "story" : "stories"}
            </p>
          </div>

          {stories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-14 text-center">
              <p className="text-sm text-stone-400">
                Saved stories will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  allThemes={allThemes}
                  allSettings={allSettings}
                  onView={() => setActiveStory(story)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/45 p-4 sm:p-8">
          <div className="mx-auto h-full max-w-3xl rounded-2xl bg-white shadow-xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="border-b border-stone-200 px-5 py-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900 leading-tight">
                  {activeStory.title}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {new Date(activeStory.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNarrateStory(activeStory)}
                  className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                  title="Narrate story"
                >
                  {narrating && narratingId === activeStory.id
                    ? "🔈 Stop"
                    : "🔊 Narrate"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopNarration();
                    setActiveStory(null);
                  }}
                  className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="px-5 py-4 overflow-y-auto space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {activeStory.characterNames.map((name) => (
                  <span
                    key={`view-${activeStory.id}-${name}`}
                    className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600"
                  >
                    {name}
                  </span>
                ))}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                {activeStory.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// "use client";

// import { useCallback, useEffect, useMemo, useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import Image from "next/image";

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface CharacterMemory {
//   id: string;
//   text: string; // e.g. "loves swimming", "scared of thunder"
// }

// interface CharacterData {
//   id: string;
//   imageUrl: string;
//   name: string;
//   age: number;
//   memories?: CharacterMemory[];
// }

// interface StoryData {
//   id: string;
//   title: string;
//   content: string;
//   characterIds: string[];
//   characterNames: string[];
//   concept: string;
//   childName?: string;
//   createdAt: string;
// }

// // ─── Constants ────────────────────────────────────────────────────────────────

// const TEACHING_CONCEPTS = [
//   { id: "sharing", label: "Sharing & Generosity", emoji: "🎁" },
//   { id: "kindness", label: "Kindness & Empathy", emoji: "💛" },
//   { id: "honesty", label: "Honesty & Trust", emoji: "🌟" },
//   { id: "bravery", label: "Bravery & Courage", emoji: "🦁" },
//   { id: "friendship", label: "Friendship & Loyalty", emoji: "🤝" },
//   { id: "patience", label: "Patience & Perseverance", emoji: "🌱" },
//   { id: "differences", label: "Respecting Differences", emoji: "🌈" },
//   { id: "responsibility", label: "Responsibility", emoji: "⭐" },
//   { id: "gratitude", label: "Gratitude", emoji: "🙏" },
//   { id: "problem-solving", label: "Problem Solving", emoji: "🔍" },
// ];

// const SETTINGS = [
//   { id: "enchanted-forest", label: "Enchanted Forest" },
//   { id: "ocean-kingdom", label: "Ocean Kingdom" },
//   { id: "outer-space", label: "Outer Space" },
//   { id: "cozy-village", label: "Cozy Village" },
//   { id: "mountain-adventure", label: "Mountain Adventure" },
//   { id: "magical-school", label: "Magical School" },
// ];

// const STORY_LENGTHS = [
//   { id: "short", label: "Short", desc: "~200 words" },
//   { id: "medium", label: "Medium", desc: "~400 words" },
//   { id: "long", label: "Long", desc: "~600 words" },
// ];

// // ─── Helper ───────────────────────────────────────────────────────────────────

// async function generateStoryWithCohere(params: {
//   characters: CharacterData[];
//   concept: string;
//   childName: string;
//   childAge: string;
//   setting: string;
//   storyLength: string;
//   favoriteThings: string;
//   extraNote: string;
// }): Promise<{ title: string; content: string }> {
//   const characterDescriptions = params.characters
//     .map((c) => {
//       const memories = c.memories?.map((m) => m.text).join(", ");
//       return `${c.name} (age ${c.age})${memories ? `, who ${memories}` : ""}`;
//     })
//     .join("; ");

//   const conceptLabel =
//     TEACHING_CONCEPTS.find((t) => t.id === params.concept)?.label ?? params.concept;
//   const settingLabel =
//     SETTINGS.find((s) => s.id === params.setting)?.label ?? params.setting;

//   const wordCount =
//     params.storyLength === "short"
//       ? 200
//       : params.storyLength === "medium"
//         ? 400
//         : 600;

//   const prompt = `Write a children's bedtime story for a ${params.childAge}-year-old named ${params.childName || "a child"}.

// Characters in the story: ${characterDescriptions}

// The story should naturally teach the value of: **${conceptLabel}**
// Setting: ${settingLabel}
// Length: approximately ${wordCount} words
// ${params.favoriteThings ? `The child loves: ${params.favoriteThings} — weave these in naturally.` : ""}
// ${params.extraNote ? `Parent's note: ${params.extraNote}` : ""}

// Guidelines:
// - Use the characters' personal memories and traits to make the story feel personal and warm.
// - Make the lesson feel organic — never preachy.
// - End with a gentle, hopeful resolution.
// - Use simple, age-appropriate language.
// - Begin with a creative, engaging title on the very first line, formatted as: TITLE: <title>
// - Then write the full story on the following lines.`;

//   const response = await fetch("/api/story-generate", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       characters: params.characters,
//       concept: params.concept,
//       conceptLabel,
//       childName: params.childName,
//       childAge: params.childAge,
//       setting: params.setting,
//       settingLabel,
//       storyLength: params.storyLength,
//       favoriteThings: params.favoriteThings,
//       extraNote: params.extraNote,
//       prompt,
//     }),
//   });

//   if (!response.ok) {
//     const err = await response.json().catch(() => null);
//     throw new Error(err?.error ?? err?.message ?? "Story generation failed");
//   }

//   const data = await response.json();
//   const title = typeof data?.title === "string" ? data.title : "";
//   const content = typeof data?.content === "string" ? data.content : "";

//   if (!title || !content) {
//     throw new Error("Story service returned an empty response");
//   }

//   return { title, content };
// }

// // ─── Sub-components ──────────────────────────────────────────────────────────

// function ConceptChip({
//   concept,
//   selected,
//   onToggle,
// }: {
//   concept: (typeof TEACHING_CONCEPTS)[0];
//   selected: boolean;
//   onToggle: () => void;
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onToggle}
//       className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
//         selected
//           ? "border-amber-400 bg-amber-50 text-amber-800"
//           : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
//       }`}
//     >
//       <span className="text-base leading-none">{concept.emoji}</span>
//       {concept.label}
//     </button>
//   );
// }

// function CharacterCard({
//   character,
//   selected,
//   onToggle,
// }: {
//   character: CharacterData;
//   selected: boolean;
//   onToggle: () => void;
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onToggle}
//       className={`group relative rounded-2xl border p-3 text-left transition-all ${
//         selected
//           ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200"
//           : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
//       }`}
//     >
//       {selected && (
//         <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-xs text-white">
//           ✓
//         </span>
//       )}
//       <div className="aspect-square w-full overflow-hidden rounded-xl bg-stone-100">
//         <Image
//           src={character.imageUrl}
//           alt={character.name}
//           width={160}
//           height={160}
//           className="h-full w-full object-contain"
//         />
//       </div>
//       <p className="mt-2 truncate text-sm font-semibold text-stone-800">
//         {character.name}
//       </p>
//       <p className="text-xs text-stone-400">Age {character.age}</p>
//       {character.memories && character.memories.length > 0 && (
//         <div className="mt-2 space-y-0.5">
//           {character.memories.slice(0, 2).map((m) => (
//             <p key={m.id} className="text-xs text-stone-500 leading-snug">
//               · {m.text}
//             </p>
//           ))}
//           {character.memories.length > 2 && (
//             <p className="text-xs text-stone-400">
//               +{character.memories.length - 2} more memories
//             </p>
//           )}
//         </div>
//       )}
//     </button>
//   );
// }

// function StoryCard({ story }: { story: StoryData }) {
//   const conceptLabel = TEACHING_CONCEPTS.find(
//     (t) => t.id === story.concept
//   )?.label;

//   return (
//     <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
//       <div className="flex items-start justify-between gap-3">
//         <div>
//           <h3 className="font-serif text-lg font-semibold text-stone-900 leading-tight">
//             {story.title}
//           </h3>
//           <div className="mt-1 flex flex-wrap items-center gap-2">
//             {story.characterNames.map((name) => (
//               <span
//                 key={`${story.id}-${name}`}
//                 className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600"
//               >
//                 {name}
//               </span>
//             ))}
//             {conceptLabel && (
//               <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700">
//                 {conceptLabel}
//               </span>
//             )}
//           </div>
//         </div>
//         <p className="shrink-0 text-xs text-stone-400">
//           {new Date(story.createdAt).toLocaleDateString("en-US", {
//             month: "short",
//             day: "numeric",
//           })}
//         </p>
//       </div>
//       <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700 line-clamp-4">
//         {story.content}
//       </p>
//     </article>
//   );
// }

// // ─── Main Page ────────────────────────────────────────────────────────────────

// export default function StoryboardPage() {
//   const router = useRouter();

//   // Data
//   const [characters, setCharacters] = useState<CharacterData[]>([]);
//   const [stories, setStories] = useState<StoryData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Story builder state
//   const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
//   const [selectedConcept, setSelectedConcept] = useState<string>("");

//   // Parent form
//   const [childName, setChildName] = useState("");
//   const [childAge, setChildAge] = useState("");
//   const [selectedSetting, setSelectedSetting] = useState("");
//   const [storyLength, setStoryLength] = useState("medium");
//   const [favoriteThings, setFavoriteThings] = useState("");
//   const [extraNote, setExtraNote] = useState("");

//   // Generation
//   const [generating, setGenerating] = useState(false);
//   const [generatedStory, setGeneratedStory] = useState<{
//     title: string;
//     content: string;
//   } | null>(null);
//   const [saving, setSaving] = useState(false);

//   // ── Load data ──────────────────────────────────────────────────────────────

//   const loadData = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const [charactersRes, storiesRes] = await Promise.all([
//         fetch("/api/characters"),
//         fetch("/api/stories"),
//       ]);
//       if (charactersRes.status === 401 || storiesRes.status === 401) {
//         router.push("/login");
//         return;
//       }
//       if (!charactersRes.ok) throw new Error("Failed to load characters");
//       if (!storiesRes.ok) throw new Error("Failed to load stories");
//       const [charactersData, storiesData] = await Promise.all([
//         charactersRes.json(),
//         storiesRes.json(),
//       ]);
//       setCharacters(charactersData);
//       setStories(storiesData);
//     } catch {
//       setError("Could not load your storyboard. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   }, [router]);

//   useEffect(() => {
//     void loadData();
//   }, [loadData]);

//   // ── Derived ────────────────────────────────────────────────────────────────

//   const selectedCharacters = useMemo(
//     () => characters.filter((c) => selectedCharacterIds.includes(c.id)),
//     [characters, selectedCharacterIds]
//   );

//   const toggleCharacter = (id: string) =>
//     setSelectedCharacterIds((prev) =>
//       prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
//     );

//   const canGenerate =
//     selectedCharacterIds.length > 0 &&
//     selectedConcept !== "" &&
//     childAge !== "" &&
//     selectedSetting !== "";

//   // ── Generate ───────────────────────────────────────────────────────────────

//   const handleGenerate = async () => {
//     if (!canGenerate) {
//       setError("Please select characters, a lesson, a setting, and the child's age.");
//       return;
//     }
//     try {
//       setGenerating(true);
//       setError(null);
//       setGeneratedStory(null);
//       const result = await generateStoryWithCohere({
//         characters: selectedCharacters,
//         concept: selectedConcept,
//         childName,
//         childAge,
//         setting: selectedSetting,
//         storyLength,
//         favoriteThings,
//         extraNote,
//       });
//       setGeneratedStory(result);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Story generation failed.");
//     } finally {
//       setGenerating(false);
//     }
//   };

//   // ── Save ───────────────────────────────────────────────────────────────────

//   const handleSave = async () => {
//     if (!generatedStory) return;
//     try {
//       setSaving(true);
//       setError(null);
//       const response = await fetch("/api/stories", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           title: generatedStory.title,
//           content: generatedStory.content,
//           characterIds: selectedCharacterIds,
//           characterNames: selectedCharacters.map((c) => c.name),
//           concept: selectedConcept,
//           childName,
//         }),
//       });
//       if (response.status === 401) { router.push("/login"); return; }
//       if (!response.ok) {
//         const payload = await response.json().catch(() => null);
//         throw new Error(payload?.error ?? "Failed to save story");
//       }
//       const saved = await response.json();
//       setStories((prev) => [saved, ...prev]);
//       setGeneratedStory(null);
//       setSelectedCharacterIds([]);
//       setSelectedConcept("");
//       setChildName("");
//       setChildAge("");
//       setSelectedSetting("");
//       setFavoriteThings("");
//       setExtraNote("");
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Could not save story.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ── Loading ────────────────────────────────────────────────────────────────

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-stone-50">
//         <p className="text-stone-500 text-sm">Loading storyboard…</p>
//       </div>
//     );
//   }

//   // ── Render ─────────────────────────────────────────────────────────────────

//   return (
//     <div className="min-h-screen bg-stone-50 font-sans">
//       {/* ── Header ──────────────────────────────────────────────────────── */}
//       <header className="border-b border-stone-200 bg-white px-6 py-4">
//         <div className="mx-auto flex max-w-5xl items-center justify-between">
//           <div>
//             <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
//               Story Maker
//             </h1>
//             <p className="text-xs text-stone-400 mt-0.5">
//               Personalised bedtime stories for your little ones
//             </p>
//           </div>
//           <Link
//             href="/island"
//             className="rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50"
//           >
//             ← Back to island
//           </Link>
//         </div>
//       </header>

//       <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
//         {error && (
//           <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//             {error}
//           </div>
//         )}

//         {/* ── Story Builder ──────────────────────────────────────────────── */}
//         <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
//           {/* Section header */}
//           <div className="border-b border-stone-100 px-6 py-4">
//             <h2 className="text-base font-semibold text-stone-900">
//               Build a story
//             </h2>
//             <p className="text-xs text-stone-400 mt-0.5">
//               Fill in the details below and we&apos;ll write a personalised story for your child.
//             </p>
//           </div>

//           <div className="divide-y divide-stone-100">
//             {/* Step 1 — Characters */}
//             <div className="px-6 py-5 space-y-3">
//               <div className="flex items-center gap-2">
//                 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
//                   1
//                 </span>
//                 <h3 className="text-sm font-semibold text-stone-800">
//                   Choose characters
//                 </h3>
//               </div>
//               {characters.length === 0 ? (
//                 <p className="text-sm text-stone-400">
//                   No characters yet. Create some on your island first.
//                 </p>
//               ) : (
//                 <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
//                   {characters.map((character) => (
//                     <CharacterCard
//                       key={character.id}
//                       character={character}
//                       selected={selectedCharacterIds.includes(character.id)}
//                       onToggle={() => toggleCharacter(character.id)}
//                     />
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Step 2 — Lesson */}
//             <div className="px-6 py-5 space-y-3">
//               <div className="flex items-center gap-2">
//                 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
//                   2
//                 </span>
//                 <h3 className="text-sm font-semibold text-stone-800">
//                   What lesson should the story teach?
//                 </h3>
//               </div>
//               <div className="flex flex-wrap gap-2">
//                 {TEACHING_CONCEPTS.map((concept) => (
//                   <ConceptChip
//                     key={concept.id}
//                     concept={concept}
//                     selected={selectedConcept === concept.id}
//                     onToggle={() =>
//                       setSelectedConcept(
//                         selectedConcept === concept.id ? "" : concept.id
//                       )
//                     }
//                   />
//                 ))}
//               </div>
//             </div>

//             {/* Step 3 — About the child */}
//             <div className="px-6 py-5 space-y-4">
//               <div className="flex items-center gap-2">
//                 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
//                   3
//                 </span>
//                 <h3 className="text-sm font-semibold text-stone-800">
//                   About your child
//                 </h3>
//               </div>

//               <div className="grid gap-4 sm:grid-cols-2">
//                 <div>
//                   <label className="mb-1.5 block text-xs font-medium text-stone-500 uppercase tracking-wide">
//                     Child&apos;s name <span className="text-stone-300 normal-case">(optional)</span>
//                   </label>
//                   <input
//                     value={childName}
//                     onChange={(e) => setChildName(e.target.value)}
//                     placeholder="e.g. Lily"
//                     className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
//                   />
//                 </div>
//                 <div>
//                   <label className="mb-1.5 block text-xs font-medium text-stone-500 uppercase tracking-wide">
//                     Child&apos;s age <span className="text-red-400">*</span>
//                   </label>
//                   <input
//                     value={childAge}
//                     onChange={(e) => setChildAge(e.target.value)}
//                     placeholder="e.g. 5"
//                     type="number"
//                     min="2"
//                     max="12"
//                     className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="mb-1.5 block text-xs font-medium text-stone-500 uppercase tracking-wide">
//                   Their favourite things <span className="text-stone-300 normal-case">(optional)</span>
//                 </label>
//                 <input
//                   value={favoriteThings}
//                   onChange={(e) => setFavoriteThings(e.target.value)}
//                   placeholder="e.g. dinosaurs, purple, swimming, her dog Max"
//                   className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
//                 />
//               </div>
//             </div>

//             {/* Step 4 — Story settings */}
//             <div className="px-6 py-5 space-y-4">
//               <div className="flex items-center gap-2">
//                 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
//                   4
//                 </span>
//                 <h3 className="text-sm font-semibold text-stone-800">
//                   Story settings
//                 </h3>
//               </div>

//               {/* Setting */}
//               <div>
//                 <label className="mb-2 block text-xs font-medium text-stone-500 uppercase tracking-wide">
//                   Where does the story take place? <span className="text-red-400">*</span>
//                 </label>
//                 <div className="flex flex-wrap gap-2">
//                   {SETTINGS.map((s) => (
//                     <button
//                       key={s.id}
//                       type="button"
//                       onClick={() => setSelectedSetting(s.id)}
//                       className={`rounded-full border px-3.5 py-1.5 text-sm transition-all ${
//                         selectedSetting === s.id
//                           ? "border-amber-400 bg-amber-50 text-amber-800 font-medium"
//                           : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
//                       }`}
//                     >
//                       {s.label}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Story length */}
//               <div>
//                 <label className="mb-2 block text-xs font-medium text-stone-500 uppercase tracking-wide">
//                   Story length
//                 </label>
//                 <div className="flex gap-2">
//                   {STORY_LENGTHS.map((l) => (
//                     <button
//                       key={l.id}
//                       type="button"
//                       onClick={() => setStoryLength(l.id)}
//                       className={`flex-1 rounded-xl border py-2.5 text-sm transition-all ${
//                         storyLength === l.id
//                           ? "border-amber-400 bg-amber-50 text-amber-800 font-medium"
//                           : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
//                       }`}
//                     >
//                       <span className="block font-semibold">{l.label}</span>
//                       <span className="block text-xs opacity-60 mt-0.5">{l.desc}</span>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Extra note */}
//               <div>
//                 <label className="mb-1.5 block text-xs font-medium text-stone-500 uppercase tracking-wide">
//                   Anything else to include? <span className="text-stone-300 normal-case">(optional)</span>
//                 </label>
//                 <textarea
//                   value={extraNote}
//                   onChange={(e) => setExtraNote(e.target.value)}
//                   rows={2}
//                   placeholder="e.g. My daughter recently started school and is nervous about making friends."
//                   className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 resize-none"
//                 />
//               </div>
//             </div>

//             {/* Generate button */}
//             <div className="px-6 py-4 bg-stone-50 flex items-center justify-between">
//               <p className="text-xs text-stone-400">
//                 {!canGenerate && "Complete steps 1–4 to generate a story"}
//               </p>
//               <button
//                 type="button"
//                 onClick={handleGenerate}
//                 disabled={generating || !canGenerate || characters.length === 0}
//                 className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-stone-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
//               >
//                 {generating ? "Writing your story…" : "✨ Generate Story"}
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* ── Generated Story Preview ─────────────────────────────────────── */}
//         {(generating || generatedStory) && (
//           <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 space-y-4">
//             <div className="flex items-center justify-between">
//               <h2 className="text-base font-semibold text-amber-900">
//                 {generating ? "Writing your story…" : "Your story is ready!"}
//               </h2>
//               {!generating && generatedStory && (
//                 <div className="flex gap-2">
//                   <button
//                     type="button"
//                     onClick={handleGenerate}
//                     disabled={generating}
//                     className="rounded-full border border-amber-300 bg-white px-3.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 transition"
//                   >
//                     Regenerate
//                   </button>
//                   <button
//                     type="button"
//                     onClick={handleSave}
//                     disabled={saving}
//                     className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-stone-900 hover:bg-amber-300 transition disabled:opacity-50"
//                   >
//                     {saving ? "Saving…" : "Save Story"}
//                   </button>
//                 </div>
//               )}
//             </div>

//             {generating && (
//               <div className="space-y-2 animate-pulse">
//                 <div className="h-3 w-1/2 rounded bg-amber-200" />
//                 <div className="h-3 w-full rounded bg-amber-200" />
//                 <div className="h-3 w-5/6 rounded bg-amber-200" />
//                 <div className="h-3 w-full rounded bg-amber-200" />
//                 <div className="h-3 w-4/5 rounded bg-amber-200" />
//               </div>
//             )}

//             {!generating && generatedStory && (
//               <>
//                 <h3 className="font-serif text-xl font-bold text-stone-900">
//                   {generatedStory.title}
//                 </h3>
//                 <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
//                   {generatedStory.content}
//                 </p>
//               </>
//             )}
//           </div>
//         )}

//         {/* ── Saved Stories ───────────────────────────────────────────────── */}
//         <div className="space-y-4">
//           <div className="flex items-baseline justify-between">
//             <h2 className="font-serif text-xl font-bold text-stone-900">
//               Saved stories
//             </h2>
//             <p className="text-xs text-stone-400">
//               {stories.length} {stories.length === 1 ? "story" : "stories"}
//             </p>
//           </div>

//           {stories.length === 0 ? (
//             <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-12 text-center">
//               <p className="text-sm text-stone-400">
//                 Your saved stories will appear here.
//               </p>
//             </div>
//           ) : (
//             <div className="grid gap-4 lg:grid-cols-2">
//               {stories.map((story) => (
//                 <StoryCard key={story.id} story={story} />
//               ))}
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }
