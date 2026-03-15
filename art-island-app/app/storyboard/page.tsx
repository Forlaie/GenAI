"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

  const storyCountLabel = useMemo(
    () => `${stories.length} ${stories.length === 1 ? "story" : "stories"}`,
    [stories.length]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400">Loading stories...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="relative border-b px-6 py-4 flex items-center justify-center">
        <Link
          href="/island"
          className="absolute top-4 left-4 bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1 px-3 py-2 rounded hover:-translate-y-0.5 transition-all"
        >
          ← Island
        </Link>

        <div className="text-center">
          <h1 className="text-lg font-medium text-gray-800">Stories</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Browse saved stories or create a new one.
          </p>
        </div>

        <Link
          href="/storyboard/new"
          className="absolute top-4 right-4 bg-black text-white text-sm flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-800 hover:-translate-y-0.5 transition-all"
        >
          + Create new story
        </Link>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{storyCountLabel}</p>
          <Link
            href="/storyboard/new"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            Start another story
          </Link>
        </div>

        {stories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
            <p className="text-gray-500 text-base">No saved stories yet.</p>
            <p className="text-gray-400 text-sm mt-1">
              Create your first story and it will appear here.
            </p>
            <Link
              href="/storyboard/new"
              className="inline-flex mt-4 rounded-full bg-black text-white px-4 py-2 text-sm hover:bg-gray-800"
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

              return (
                <article
                  key={story.id}
                  className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 leading-snug">
                        {cardHeadline}
                      </h3>
                      <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">
                        {cardSummary}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-gray-400 mt-0.5">
                      {new Date(story.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center">
                      {(story.characterImageUrls ?? []).slice(0, 4).map((img, idx) => (
                        <div
                          key={`${story.id}-img-${idx}`}
                          className="relative w-8 h-8 rounded-full overflow-hidden border border-white shadow-sm -ml-1 first:ml-0"
                        >
                          <Image src={img} alt="Character" fill className="object-cover" />
                        </div>
                      ))}
                      {(story.characterImageUrls?.length ?? 0) === 0 && (
                        <div className="text-xs text-gray-400">
                          {story.characterNames.slice(0, 2).join(", ")}
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-400 truncate">
                      {story.title}
                    </p>
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setActiveStory(story)}
                      className="rounded-full border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white"
                      style={{ borderColor: theme.border, backgroundColor: theme.buttonBg }}
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
        <div className="fixed inset-0 z-50 bg-black/45 p-4 sm:p-8">
          <div className="mx-auto h-full max-w-3xl rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                  {activeStory.title}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
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
                className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {activeStory.characterNames.map((name) => (
                  <span
                    key={`view-${activeStory.id}-${name}`}
                    className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                  >
                    {name}
                  </span>
                ))}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {activeStory.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
