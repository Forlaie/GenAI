"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/app/components/Navbar";

interface StoryData {
  id: string;
  title: string;
  content: string;
  characterIds: string[];
  characterNames: string[];
  characterImageUrls?: string[];
  concept: string;
  conceptLabel?: string;
  setting?: string;
  settingLabel?: string;
  childName?: string;
  aiHeadline?: string;
  aiSummary?: string;
  createdAt: string;
}

const STORY_CARD_THEMES = [
  { bg: "#FFF4CC", border: "#F2D77E", buttonBg: "#FFF9E6" },
  { bg: "#EAF7FF", border: "#9ED7F5", buttonBg: "#F5FCFF" },
  { bg: "#FDEBFF", border: "#D9A8EF", buttonBg: "#FFF5FF" },
  { bg: "#EFFFF0", border: "#A5DFB0", buttonBg: "#F7FFF8" },
  { bg: "#FFEDE5", border: "#F2B59A", buttonBg: "#FFF6F1" },
];

export default function StoryboardHomePage() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<StoryData | null>(null);
  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const bgColor = darkMode ? "#0f2336" : "#ffffff";
  const textMain = darkMode ? "#f0f6ff" : "#1a1a1a";
  const textMuted = darkMode ? "#7ea8c4" : "#888780";

  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/stories");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load stories");
        const data: StoryData[] = await res.json();
        setStories(data);
      } catch {
        setError("Could not load stories. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void loadStories();
  }, [router]);

  // Hydration-safe dark mode initialization
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    setDarkMode(saved ? JSON.parse(saved) : false);
    setHydrated(true);
  }, []);

  // Sync with localStorage when darkMode changes
  useEffect(() => {
    if (darkMode !== null) {
      localStorage.setItem("darkMode", JSON.stringify(darkMode));
    }
  }, [darkMode]);

  const storyCountLabel = useMemo(
    () => `${stories.length} ${stories.length === 1 ? "story" : "stories"}`,
    [stories.length],
  );

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <p style={{ color: textMuted }}>Loading stories...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <Navbar
        title="Stories"
        subtitle="Browse saved stories or create a new one."
        darkMode={darkMode}
        onDarkModeToggle={() => setDarkMode((p) => !p)}
        showBackButton={true}
      />

      <div className="pt-20 p-6 max-w-5xl mx-auto">
        {error && (
          <div
            className="rounded-xl border px-4 py-3 text-sm mb-4"
            style={{
              borderColor: darkMode ? "rgba(248, 113, 113, 0.3)" : "#fecaca",
              backgroundColor: darkMode ? "rgba(127, 29, 29, 0.2)" : "#fee2e2",
              color: darkMode ? "#fca5a5" : "#991b1b",
            }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm" style={{ color: textMuted }}>
            {storyCountLabel}
          </p>
          <Link
            href="/storyboard/new"
            className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
            style={{
              backgroundColor: darkMode ? "#1e3a52" : "#000",
              color: "#fff",
            }}
          >
            Start another story
          </Link>
        </div>

        {stories.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed py-16 text-center"
            style={{
              borderColor: darkMode ? "rgba(255,255,255,0.2)" : "#d1d5db",
              backgroundColor: darkMode ? "rgba(255,255,255,0.02)" : "#f9fafb",
            }}
          >
            <p className="text-base" style={{ color: textMuted }}>
              No saved stories yet.
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: darkMode ? "#64748b" : "#9ca3af" }}
            >
              Create your first story and it will appear here.
            </p>
            <Link
              href="/storyboard/new"
              className="inline-flex mt-4 rounded-full text-white px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: darkMode ? "#1e3a52" : "#000",
              }}
            >
              Create new story
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {stories.map((story, index) => {
              const theme = STORY_CARD_THEMES[index % STORY_CARD_THEMES.length];
              const fallbackHeadline =
                story.childName && story.childName.trim().length > 0
                  ? `${story.childName} learns something new`
                  : story.title;
              const cardHeadline =
                story.aiHeadline && story.aiHeadline.trim().length > 0
                  ? story.aiHeadline
                  : fallbackHeadline;

              const fallbackSummary =
                story.content.length > 170
                  ? `${story.content.slice(0, 170)}...`
                  : story.content;
              const cardSummary =
                story.aiSummary && story.aiSummary.trim().length > 0
                  ? story.aiSummary
                  : fallbackSummary;

              const cardBg = darkMode ? "#1e3a52" : theme.bg;
              const cardBorder = darkMode
                ? "rgba(255,255,255,0.1)"
                : theme.border;

              return (
                <article
                  key={story.id}
                  className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        className="font-semibold leading-snug"
                        style={{ color: darkMode ? "#e2e8f0" : "#111827" }}
                      >
                        {cardHeadline}
                      </h3>
                      <p
                        className="mt-1.5 text-xs line-clamp-2"
                        style={{ color: darkMode ? "#94a3b8" : "#9ca3af" }}
                      >
                        {cardSummary}
                      </p>
                    </div>
                    <p
                      className="shrink-0 text-xs mt-0.5"
                      style={{ color: darkMode ? "#64748b" : "#9ca3af" }}
                    >
                      {new Date(story.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center">
                      {(story.characterImageUrls ?? [])
                        .slice(0, 4)
                        .map((img, idx) => (
                          <div
                            key={`${story.id}-img-${idx}`}
                            className="relative w-8 h-8 rounded-full overflow-hidden border shadow-sm -ml-1 first:ml-0"
                            style={{
                              borderColor: cardBg,
                            }}
                          >
                            <Image
                              src={img}
                              alt="Character"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      {(story.characterImageUrls?.length ?? 0) === 0 && (
                        <div className="text-xs" style={{ color: textMuted }}>
                          {story.characterNames.slice(0, 2).join(", ")}
                        </div>
                      )}
                    </div>

                    <p
                      className="text-[11px] truncate"
                      style={{ color: darkMode ? "#94a3b8" : "#9ca3af" }}
                    >
                      {story.title}
                    </p>
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setActiveStory(story)}
                      className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                      style={{
                        borderColor: darkMode
                          ? "rgba(255,255,255,0.2)"
                          : theme.border,
                        backgroundColor: darkMode
                          ? "rgba(255,255,255,0.08)"
                          : theme.buttonBg,
                        color: darkMode ? "#60a5fa" : "#374151",
                      }}
                    >
                      View full story
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {activeStory && (
        <div
          className="fixed inset-0 z-50 p-4 sm:p-8"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div
            className="mx-auto h-full max-w-3xl rounded-2xl shadow-xl border overflow-hidden flex flex-col"
            style={{
              backgroundColor: bgColor,
              borderColor: darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb",
            }}
          >
            <div
              className="border-b px-5 py-4 flex items-center justify-between gap-3"
              style={{
                borderColor: darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb",
              }}
            >
              <div>
                <h3
                  className="text-xl font-semibold leading-tight"
                  style={{ color: textMain }}
                >
                  {activeStory.title}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                  {new Date(activeStory.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveStory(null)}
                className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  borderColor: darkMode ? "rgba(255,255,255,0.2)" : "#d1d5db",
                  color: darkMode ? "#cbd5e1" : "#4b5563",
                }}
              >
                Close
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {activeStory.characterNames.map((name) => (
                  <span
                    key={`view-${activeStory.id}-${name}`}
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(96, 165, 250, 0.1)"
                        : "#f3f4f6",
                      color: darkMode ? "#60a5fa" : "#4b5563",
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>
              <p
                className="whitespace-pre-wrap text-sm leading-relaxed"
                style={{ color: textMain }}
              >
                {activeStory.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
