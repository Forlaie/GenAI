"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { EvolutionTimeline, VersionStage } from "./EvolutionTimeline";
import JointEditor from "@/app/components/JointEditor";
import { DrawingCanvas } from "./DrawingCanvas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Memory {
  id: string;
  text: string;
  createdAt?: string;
}

export interface Personality {
  catchphrase?: string;
  traits?: string[];
  dailyActivity?: string;
  favoriteThing?: string;
}

export interface CharacterDetailProps {
  id: string;
  name: string;
  age: number;
  imageUrl: string;
  islandId: number;
  memories?: Memory[];
  personality?: Personality | null;
  versionHistory?: VersionStage[];
  onClose: () => void;
  /** Fired after successful evolve so the island can update the sprite */
  onEvolved?: (updated: {
    id: string;
    imageUrl: string;
    versionHistory: VersionStage[];
    memories: Memory[];
    personality: Personality | null;
  }) => void;
}

type Tab        = "info" | "memories" | "evolution";
type EvolveStep = "idle" | "choose" | "draw" | "rig" | "saving";
type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  text: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CharacterDetail({
  id,
  name,
  age,
  imageUrl:        initialImageUrl,
  memories:        initialMemories    = [],
  personality:     initialPersonality,
  versionHistory:  initialHistory     = [],
  onClose,
  onEvolved,
}: CharacterDetailProps) {
  const [tab, setTab]                 = useState<Tab>("info");
  const [evolveStep, setEvolveStep]   = useState<EvolveStep>("idle");
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [evolveError, setEvolveError] = useState<string | null>(null);
  const [memoryNote, setMemoryNote]   = useState("");

  // Live local copies – updated immediately on success so the modal reflects
  // the change without needing a full reload / close-reopen.
  const [liveImageUrl,      setLiveImageUrl]      = useState(initialImageUrl);
  const [liveHistory,       setLiveHistory]       = useState<VersionStage[]>(initialHistory);
  const [liveMemories,      setLiveMemories]      = useState<Memory[]>(initialMemories);
  const [livePersonality,   setLivePersonality]   = useState<Personality | null>(initialPersonality ?? null);
  const [chatInput, setChatInput]                 = useState("");
  const [chatBusy, setChatBusy]                   = useState(false);

  const favoriteForQuote = useMemo(() => {
    if (livePersonality?.favoriteThing?.trim()) return livePersonality.favoriteThing.trim();
    if (livePersonality?.traits?.length) return livePersonality.traits[0];
    if (liveMemories.length > 0) return liveMemories[liveMemories.length - 1].text;
    return "new adventures";
  }, [livePersonality, liveMemories]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: `Hi! I am ${name}. And I like ${favoriteForQuote}. How are you?!`,
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageCount   = liveHistory.length;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const readFile = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const cancelEvolve = () => {
    setEvolveStep("idle");
    setNewImageUrl(null);
    setEvolveError(null);
    setMemoryNote("");
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatBusy) return;

    const nextMessages: ChatMessage[] = [...chatMessages, { role: "user", text }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatBusy(true);

    try {
      const res = await fetch("/api/character-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: {
            id,
            name,
            age,
            memories: liveMemories,
            personality: livePersonality,
            versionHistory: liveHistory,
          },
          messages: nextMessages,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Could not chat with character.");
      }

      const payload = await res.json();
      const reply = String(payload?.reply || "").trim();
      if (!reply) throw new Error("Character had no response.");

      setChatMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chat failed.";
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Sorry, I got shy for a moment: ${message}` },
      ]);
    } finally {
      setChatBusy(false);
    }
  };

  // ── Rig → PATCH evolve ───────────────────────────────────────────────────

  const handleRigConfirm = async (joints: Record<string, { x: number; y: number }>) => {
    if (!newImageUrl) return;
    setEvolveStep("saving");
    setEvolveError(null);

    try {
      const res = await fetch("/api/characters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:      "evolve",
          characterId: id,
          imageUrl:    newImageUrl,
          joints,
          memoryText:  memoryNote.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const p = await res.json().catch(() => null);
        throw new Error(p?.error ?? "Evolve failed");
      }

      const updated = await res.json();

      // Update live state so everything reflects the new stage immediately
      setLiveImageUrl(updated.imageUrl);
      setLiveHistory(updated.versionHistory ?? []);
      setLiveMemories(updated.memories ?? []);
      setLivePersonality(updated.personality ?? null);

      // Tell the island page to swap the sprite
      onEvolved?.({
        id:             updated.id,
        imageUrl:       updated.imageUrl,
        versionHistory: updated.versionHistory ?? [],
        memories:       updated.memories ?? [],
        personality:    updated.personality ?? null,
      });

      setEvolveStep("idle");
      setNewImageUrl(null);
      setMemoryNote("");
      setTab("evolution");          // land on timeline so they can see all stages
    } catch (err) {
      setEvolveError(err instanceof Error ? err.message : "Evolve failed");
      setEvolveStep("rig");         // stay on rig so they can retry
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/*
        DrawingCanvas is rendered OUTSIDE the constrained modal div as a
        true full-screen portal so the canvas, toolbar, and pointer events
        aren't clipped by overflow:hidden or maxHeight.
      */}
      {evolveStep === "draw" && (
        <div className="fixed inset-0 z-60">
          <DrawingCanvas
            onSave={(dataUrl) => {
              setNewImageUrl(dataUrl);
              setEvolveStep("rig");
            }}
            onClose={() => setEvolveStep("choose")}
            tutorialHint={`Draw ${name}'s evolved form ✨`}
          />
        </div>
      )}

      {/* Hidden file input – always mounted so ref is stable */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setNewImageUrl(await readFile(file));
          setEvolveStep("rig");
          // reset so same file can be re-picked
          e.target.value = "";
        }}
      />

      {/* Main modal backdrop + card */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/45 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
        onClick={evolveStep === "idle" ? onClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full overflow-hidden flex flex-col"
          style={{
            maxWidth:  evolveStep === "rig" ? 760 : 620,
            height: "min(92vh, 48rem)",
            maxHeight: "92vh",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">

            {/* ── Choose: draw or upload ─────────────────────────────────── */}
            {evolveStep === "choose" && (
              <motion.div key="choose"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ModalHeader
                  title={`Evolve ${name}`}
                  sub="Choose how to create the next stage drawing"
                  onBack={cancelEvolve}
                />
                <div className="p-6 space-y-5">

                  {/* Current stage preview */}
                  <div className="flex justify-center">
                    <div className="text-center space-y-1">
                      <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
                        Current — Stage {stageCount || 1}
                      </p>
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-50 mx-auto">
                        <Image src={liveImageUrl} alt="current" fill className="object-contain p-2" />
                      </div>
                      <p className="text-[10px] text-stone-400">
                        This will be saved as a memory of stage {stageCount || 1}
                      </p>
                    </div>
                  </div>

                  {/* Draw / Upload cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setEvolveStep("draw")}
                      className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors p-6">
                      <span className="text-4xl">✏️</span>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-amber-800">Draw it</p>
                        <p className="text-xs text-amber-600 mt-0.5">Open the drawing canvas</p>
                      </div>
                    </button>

                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors p-6">
                      <span className="text-4xl">📁</span>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-stone-700">Upload a file</p>
                        <p className="text-xs text-stone-400 mt-0.5">PNG, JPG, GIF</p>
                      </div>
                    </button>
                  </div>

                  {/* Memory note */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1.5">
                      What changed in this stage?{" "}
                      <span className="font-normal normal-case text-stone-300">(optional)</span>
                    </label>
                    <input
                      value={memoryNote}
                      onChange={(e) => setMemoryNote(e.target.value)}
                      placeholder={`e.g. ${name} learned to fly today`}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Rig joints ───────────────────────────────────────────────── */}
            {(evolveStep === "rig" || evolveStep === "saving") && newImageUrl && (
              <motion.div key="rig"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ModalHeader
                  title="Place joints"
                  sub={`Mark ${name}'s joints for stage ${(stageCount || 1) + 1}`}
                  onBack={() => { setNewImageUrl(null); setEvolveStep("choose"); }}
                />
                {evolveError && (
                  <p className="mx-5 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    {evolveError}
                  </p>
                )}
                <div className="p-4">
                  {evolveStep === "saving" ? (
                    <div className="flex items-center justify-center h-56 gap-3">
                      <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-stone-500">Saving evolution…</p>
                    </div>
                  ) : (
                    <JointEditor
                      imageUrl={newImageUrl}
                      onConfirm={handleRigConfirm}
                      onBack={() => { setNewImageUrl(null); setEvolveStep("choose"); }}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Normal view (idle) ────────────────────────────────────────── */}
            {evolveStep === "idle" && (
              <motion.div key="normal"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">

                {/* Tab bar + action buttons */}
                <div className="flex items-center border-b border-stone-200 px-1 pt-1 shrink-0">
                  <TabBtn active={tab === "info"}      onClick={() => setTab("info")}>Info</TabBtn>
                  <TabBtn active={tab === "memories"}  onClick={() => setTab("memories")}>
                    Memories {liveMemories.length > 0 && <Pill n={liveMemories.length} />}
                  </TabBtn>
                  <TabBtn active={tab === "evolution"} onClick={() => setTab("evolution")}>
                    Evolution {stageCount > 0 && <Pill n={stageCount} amber />}
                  </TabBtn>
                  <div className="flex-1" />
                  <button type="button" onClick={() => setEvolveStep("choose")}
                    className="mr-2 flex items-center gap-1.5 rounded-full bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 text-xs font-semibold text-stone-900 transition-colors">
                    ✨ Evolve
                  </button>
                  <button type="button" onClick={onClose}
                    className="mr-3 text-stone-400 hover:text-stone-700 text-xl leading-none transition">
                    ×
                  </button>
                </div>

                {/* Tab content */}
                <div className="flex-1 min-h-0 overflow-hidden">

                  {/* ── Info ────────────────────────────────────────────────── */}
                  {tab === "info" && (
                    <div className="h-full min-h-0 overflow-y-auto overscroll-contain p-5 space-y-5">
                      <div className="flex gap-5">
                        <div className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden border border-stone-200 bg-stone-50">
                          <Image src={liveImageUrl} alt={name} fill className="object-contain p-2" />
                          {stageCount > 0 && (
                            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-stone-900">
                              Lv {stageCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <h2 className="font-serif text-xl font-bold text-stone-900">{name}</h2>
                          <p className="text-sm text-stone-500">Age {age}</p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button type="button" onClick={() => setEvolveStep("choose")}
                              className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 text-xs font-semibold text-stone-900 transition-colors">
                              ✨ Evolve character
                            </button>
                            {stageCount > 1 && (
                              <button type="button" onClick={() => setTab("evolution")}
                                className="text-xs text-amber-600 hover:text-amber-800 font-medium transition self-center">
                                View {stageCount} stages →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {livePersonality && (
                        <div className="rounded-xl border border-stone-200 divide-y divide-stone-100">
                          {livePersonality.catchphrase && (
                            <InfoRow label="Catchphrase">
                              <span className="italic">&ldquo;{livePersonality.catchphrase}&rdquo;</span>
                            </InfoRow>
                          )}
                          {livePersonality.traits && livePersonality.traits.length > 0 && (
                            <div className="px-4 py-3">
                              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mb-2">Traits</p>
                              <div className="flex flex-wrap gap-1.5">
                                {livePersonality.traits.map((t) => (
                                  <span key={t} className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-700">{t}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {livePersonality.dailyActivity && (
                            <InfoRow label="Daily activity">{livePersonality.dailyActivity}</InfoRow>
                          )}
                          {livePersonality.favoriteThing && (
                            <InfoRow label="Favourite thing">{livePersonality.favoriteThing}</InfoRow>
                          )}
                        </div>
                      )}

                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm text-stone-700">
                          <span className="font-semibold text-amber-800">Hi! I am {name}. </span>
                          And I like <span className="font-semibold text-amber-800">{favoriteForQuote}</span>. How are you?!
                        </p>
                      </div>

                      <div className="rounded-xl border border-stone-200 bg-white">
                        <div className="border-b border-stone-100 px-4 py-2.5">
                          <p className="text-[11px] text-stone-500 uppercase tracking-widest font-semibold">
                            Chat with {name}
                          </p>
                        </div>

                        <div className="max-h-56 overflow-y-auto px-3 py-3 space-y-2 bg-stone-50">
                          {chatMessages.map((m, i) => (
                            <div
                              key={`${m.role}-${i}`}
                              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                                  m.role === "user"
                                    ? "bg-amber-400 text-stone-900"
                                    : "bg-white border border-stone-200 text-stone-700"
                                }`}
                              >
                                {m.text}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-3 border-t border-stone-100 flex gap-2">
                          <input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void sendChat();
                              }
                            }}
                            placeholder={`Ask ${name} about memories...`}
                            className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300"
                          />
                          <button
                            type="button"
                            onClick={() => void sendChat()}
                            disabled={chatBusy || !chatInput.trim()}
                            className="rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-stone-200 disabled:text-stone-400 px-3 py-2 text-sm font-semibold text-stone-900 transition-colors"
                          >
                            {chatBusy ? "..." : "Send"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Memories ──────────────────────────────────────────── */}
                  {tab === "memories" && (
                    <div className="h-full min-h-0 overflow-y-auto overscroll-contain p-5">
                      {liveMemories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
                          <p className="text-stone-400 text-sm">No memories yet.</p>
                          <p className="text-stone-300 text-xs">
                            Memories are added from the Storyboard or when you evolve a character.
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {liveMemories.map((m) => (
                            <li key={m.id}
                              className="flex items-start gap-2.5 rounded-xl bg-stone-50 border border-stone-100 px-3.5 py-2.5">
                              <span className="mt-0.5 text-amber-400">·</span>
                              <div>
                                <p className="text-sm text-stone-700">{m.text}</p>
                                {m.createdAt && (
                                  <p className="text-[11px] text-stone-400 mt-0.5">
                                    {new Date(m.createdAt).toLocaleDateString("en-US", {
                                      month: "short", day: "numeric", year: "numeric",
                                    })}
                                  </p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* ── Evolution ─────────────────────────────────────────── */}
                  {tab === "evolution" && (
                    <div className="h-full overflow-hidden">
                      <EvolutionTimeline
                        characterName={name}
                        currentImageUrl={liveImageUrl}
                        versionHistory={liveHistory}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </motion.div>
    </>
  );
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function ModalHeader({ title, sub, onBack }: { title: string; sub: string; onBack: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
      <div>
        <h2 className="font-serif text-lg font-bold text-stone-900">{title}</h2>
        <p className="text-xs text-stone-400 mt-0.5">{sub}</p>
      </div>
      <button type="button" onClick={onBack}
        className="text-stone-400 hover:text-stone-700 transition text-sm font-medium">
        ← Back
      </button>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active ? "border-amber-400 text-amber-800" : "border-transparent text-stone-500 hover:text-stone-700"
      }`}>
      {children}
    </button>
  );
}

function Pill({ n, amber }: { n: number; amber?: boolean }) {
  return (
    <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
      amber ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"
    }`}>{n}</span>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between px-4 py-2.5 gap-4">
      <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold shrink-0 mt-0.5">{label}</p>
      <p className="text-sm text-stone-700 text-right">{children}</p>
    </div>
  );
}