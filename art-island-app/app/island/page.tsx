"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Plus, LogOut, MapPin, Moon, Sun, BookOpen, Bone, ZoomIn, ZoomOut, Maximize2, Navigation } from "lucide-react";
import { PersonalityData } from "@/types/character";
import { Character } from "../components/Character";
import { CharacterDetail } from "../components/CharacterDetail";
import { UploadModal } from "../components/UploadModal";
import { NewIslandModal } from "../components/NewIslandModal";
import { ChooseInputModal } from "../components/ChooseInputModal";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { TutorialOverlay } from "../components/TutorialOverlay";
import JointEditor from "@/app/components/JointEditor";

type ModalState = "none" | "choose" | "draw" | "upload" | "rig";
type TutorialStep = "create-island" | "draw-maple" | "none";

interface CharacterData {
  id: string;
  imageUrl: string;
  name: string;
  age: number;
  position: { x: number; y: number };
  islandId: number;
  personality?: PersonalityData | null;
  memories?: Array<{ id: string; text: string; createdAt: string | Date }>;
  evolutionMilestones?: Array<{
    imageUrl: string;
    createdAt: string | Date;
    label?: string;
  }>;
  versionHistory?: Array<{
    imageUrl: string;
    createdAt: string | Date;
    stage: number;
    label?: string;
  }>;
}

interface IslandData {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  border: string;
  label: string;
  skin?: string;
}

const ISLAND_SKINS = [
  { id: "dirt",  imagePath: "/island.png" },
  { id: "sand",  imagePath: "/sand_island.png" },
  { id: "stone", imagePath: "/stone_island.png" },
];

const getSkinPath = (skinId?: string) =>
  ISLAND_SKINS.find((s) => s.id === skinId)?.imagePath ?? ISLAND_SKINS[0].imagePath;

const ISLAND_SIZE         = 620;
const CHARACTER_FP_PX     = 112;
const WORLD_SCALE         = 160;
const MIN_ZOOM            = 0.05;
const MAX_ZOOM            = 6;
const ZOOM_STEP           = 0.25;
const ZOOM_SENSITIVITY    = 0.0012;
const FLY_DURATION_MS     = 500;
const FLY_TARGET_Y_OFFSET = 0;

function islandWorldPos(island: IslandData) {
  return {
    x: (island.x - 50) * WORLD_SCALE,
    y: (island.y - 50) * WORLD_SCALE,
  };
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default function App() {
  const router = useRouter();

  const [characters, setCharacters]         = useState<CharacterData[]>([]);
  const [islands, setIslands]               = useState<IslandData[]>([]);
  const [nextIslandId, setNextIslandId]     = useState(1);
  const [loading, setLoading]               = useState(true);
  const [darkMode, setDarkMode]             = useState(false);

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterData | null>(null);
  const [modalState, setModalState]         = useState<ModalState>("none");
  const [pendingDrawing, setPendingDrawing] = useState<string | null>(null);
  const [showNewIslandModal, setShowNewIslandModal] = useState(false);
  const [tutorialStep, setTutorialStep]     = useState<TutorialStep>("none");
  const [showTutorial, setShowTutorial]     = useState(true);
  const [pendingCharacter, setPendingCharacter] = useState<{
    imageFile: File | null; name: string; age: number;
    islandId: number; personality: PersonalityData;
  } | null>(null);
  const [evolvingCharacter, setEvolvingCharacter] = useState<CharacterData | null>(null);
  const [rigPreviewUrl, setRigPreviewUrl] = useState<string | null>(null);
  const [pendingEvolution, setPendingEvolution] = useState<{
    characterId: string;
    imageFile: File | null;
    memoryText: string;
    personalityDelta: PersonalityData;
    name: string;
    age: number;
    islandId: number;
  } | null>(null);

  const [panX, setPanX]     = useState(0);
  const [panY, setPanY]     = useState(0);
  const [zoom, setZoom]     = useState(1);
  const [isPanning, setIsPanning] = useState(false);

  const [armedIslandId, setArmedIslandId]       = useState<number | null>(null);
  const [draggingIslandId, setDraggingIslandId] = useState<number | null>(null);

  const panStartRef   = useRef<{ x: number; y: number } | null>(null);
  const islandDragRef = useRef<{
    islandId: number; startClientX: number; startClientY: number;
    startX: number; startY: number;
  } | null>(null);
  const flyRafRef = useRef<number | null>(null);
  const panXRef   = useRef(panX);
  const panYRef   = useRef(panY);
  const zoomRef   = useRef(zoom);
  panXRef.current = panX;
  panYRef.current = panY;
  zoomRef.current = zoom;

  useEffect(() => {
    const loadChars = async () => {
      try {
        const res = await fetch("/api/characters");
        if (res.status === 401) { router.push("/login"); return; }
        if (res.ok) setCharacters(await res.json());
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    const loadIslands = async () => {
      try {
        const res = await fetch("/api/islands");
        if (res.status === 401) { router.push("/login"); return; }
        if (!res.ok) return;
        const data: IslandData[] = await res.json();
        const norm = data.map((i) => ({ ...i, size: ISLAND_SIZE }));
        setIslands(norm);
        setNextIslandId(norm.length > 0 ? Math.max(...norm.map((i) => i.id)) + 1 : 1);
        if (norm.length === 0) { setTutorialStep("create-island"); setShowTutorial(true); }
      } catch (e) { console.error(e); }
    };
    loadChars();
    loadIslands();
  }, [router]);

  useEffect(() => {
    if (!selectedCharacter) return;
    if (flyRafRef.current) {
      cancelAnimationFrame(flyRafRef.current);
      flyRafRef.current = null;
    }
    panStartRef.current = null;
    islandDragRef.current = null;
    setIsPanning(false);
    setDraggingIslandId(null);
    setArmedIslandId(null);
  }, [selectedCharacter]);

  const flyTo = useCallback((worldX: number, worldY: number, targetZoom?: number) => {
    if (flyRafRef.current) cancelAnimationFrame(flyRafRef.current);
    const startPanX = panXRef.current;
    const startPanY = panYRef.current;
    const startZoom = zoomRef.current;
    const endZoom   = targetZoom ?? startZoom;
    const endPanX   = -worldX * endZoom;
    const endPanY   = FLY_TARGET_Y_OFFSET - worldY * endZoom;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / FLY_DURATION_MS, 1);
      const e = easeInOut(t);
      setPanX(startPanX + (endPanX - startPanX) * e);
      setPanY(startPanY + (endPanY - startPanY) * e);
      setZoom(startZoom + (endZoom - startZoom) * e);
      if (t < 1) flyRafRef.current = requestAnimationFrame(tick);
    };
    flyRafRef.current = requestAnimationFrame(tick);
  }, []);

  const flyToIsland = useCallback((island: IslandData) => {
    const { x, y } = islandWorldPos(island);
    flyTo(x, y, Math.max(0.7, Math.min(1.2, zoomRef.current)));
  }, [flyTo]);

  const resetView = useCallback(() => { flyTo(0, 0, 1); }, [flyTo]);

  const zoomBy = useCallback((delta: number) => {
    const next  = Math.min(Math.max(zoomRef.current + delta, MIN_ZOOM), MAX_ZOOM);
    const ratio = next / zoomRef.current;
    setPanX((p) => p * ratio);
    setPanY((p) => p * ratio);
    setZoom(next);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (selectedCharacter) return;
    e.preventDefault();
    if (flyRafRef.current) { cancelAnimationFrame(flyRafRef.current); flyRafRef.current = null; }
    const next  = Math.min(Math.max(zoomRef.current - e.deltaY * ZOOM_SENSITIVITY, MIN_ZOOM), MAX_ZOOM);
    const ratio = next / zoomRef.current;
    const mx    = e.clientX - window.innerWidth / 2;
    const my    = e.clientY - window.innerHeight / 2;
    setPanX((p) => mx + (p - mx) * ratio);
    setPanY((p) => my + (p - my) * ratio);
    setZoom(next);
  }, [selectedCharacter]);

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingIslandId !== null) return;
    if (["draw","upload","rig"].includes(modalState) || selectedCharacter) return;
    const t = e.target as HTMLElement;
    if (t.closest("[data-no-pan]") || t.closest("button") || t.closest("a")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY };
  }, [draggingIslandId, modalState, selectedCharacter]);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingIslandId !== null) return;
    if (!panStartRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    if (Math.hypot(dx, dy) <= 3) return;
    if (flyRafRef.current) { cancelAnimationFrame(flyRafRef.current); flyRafRef.current = null; }
    setPanX((p) => p + dx);
    setPanY((p) => p + dy);
    panStartRef.current = { x: e.clientX, y: e.clientY };
  }, [draggingIslandId]);

  const stopPan = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    panStartRef.current = null;
    setIsPanning(false);
  }, []);

  const handleIslandDblClick = (id: number) =>
    setArmedIslandId((p) => (p === id ? null : id));

  const handleIslandPointerDown = (e: React.PointerEvent<HTMLDivElement>, island: IslandData) => {
    if (selectedCharacter) return;
    if (armedIslandId !== island.id && e.detail < 2) return;
    e.preventDefault(); e.stopPropagation();
    setArmedIslandId(island.id);
    islandDragRef.current = {
      islandId: island.id, startClientX: e.clientX, startClientY: e.clientY,
      startX: island.x, startY: island.y,
    };
    setDraggingIslandId(island.id);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleIslandPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (selectedCharacter) return;
    if (!islandDragRef.current) return;
    e.preventDefault(); e.stopPropagation();
    const d = islandDragRef.current;
    setIslands((prev) => prev.map((i) =>
      i.id === d.islandId ? {
        ...i,
        x: d.startX + (e.clientX - d.startClientX) / (zoomRef.current * WORLD_SCALE),
        y: d.startY + (e.clientY - d.startClientY) / (zoomRef.current * WORLD_SCALE),
      } : i
    ));
  };

  const handleIslandPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (selectedCharacter) return;
    if (!islandDragRef.current) return;
    e.preventDefault(); e.stopPropagation();
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    const d = islandDragRef.current;
    islandDragRef.current = null;
    setDraggingIslandId(null);
    setArmedIslandId(null);
    const moved = islands.find((i) => i.id === d.islandId);
    if (moved) {
      fetch("/api/islands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: moved.id, x: moved.x, y: moved.y }),
      }).catch(console.error);
    }
  };

  const getPackedPos = (index: number) => {
    if (index === 0) return { x: 50, y: 50 };
    const r = (ISLAND_SIZE + 120) * Math.sqrt(index);
    const a = index * 2.399963229728653;
    return { x: 50 + Math.cos(a) * r / WORLD_SCALE, y: 50 + Math.sin(a) * r / WORLD_SCALE };
  };

  const handleAddIsland = async (name: string, skin?: string) => {
    try {
      const pos = getPackedPos(islands.length);
      const newIsland: IslandData = {
        id: nextIslandId, ...pos, size: ISLAND_SIZE,
        color: "", border: "", label: name, skin: skin ?? "",
      };
      const res = await fetch("/api/islands", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIsland),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setIslands((p) => [...p, saved]);
      setNextIslandId((p) => p + 1);
      setShowNewIslandModal(false);
      setTimeout(() => flyToIsland(saved), 100);
      if (tutorialStep === "create-island") { setTutorialStep("draw-maple"); setShowTutorial(true); }
    } catch { alert("Failed to add island."); }
  };

  const handleDeleteIsland = async (id: number) => {
    if (!window.confirm("Delete this island? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/islands?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setIslands((p) => p.filter((i) => i.id !== id));
      setCharacters((p) => p.filter((c) => c.islandId !== id));
    } catch { alert("Failed to delete island."); }
  };

  const getCharacterPosition = (islandId: number) => {
    const island = islands.find((i) => i.id === islandId);
    if (!island) return { x: 50, y: 50 };
    const existing = characters.filter((c) => c.islandId === islandId).map((c) => c.position);
    const minDist = (CHARACTER_FP_PX / island.size) * 100;
    if (existing.length === 0) return { x: 50, y: 50 };
    for (let a = 0; a < 240; a++) {
      const angle = a * 2.399963229728653;
      const dist  = (50 - minDist / 2 - 3) * (0.45 + 0.55 * ((a % 12) / 11));
      const c     = { x: 50 + Math.cos(angle) * dist, y: 50 + Math.sin(angle) * dist };
      if (!existing.some((p) => Math.hypot(p.x - c.x, p.y - c.y) < minDist)) return c;
    }
    return { x: 50, y: 50 };
  };

  const getIslandCharLayouts = useCallback((islandId: number) => {
    const island = islands.find((i) => i.id === islandId);
    if (!island) return [] as CharacterData[];
    const chars  = characters.filter((c) => c.islandId === islandId);
    const placed: { x: number; y: number }[] = [];
    const minDist = (CHARACTER_FP_PX / island.size) * 100;
    const gL = 15, gR = 85, gT = 10, gB = 45, gW = 70, gH = 35;
    return chars.map((ch, i) => {
      const cols = Math.ceil(Math.sqrt(chars.length));
      const x    = gL + (gW * (i % cols + 0.5)) / cols;
      const y    = gT + (gH * (Math.floor(i / cols) + 0.5)) / cols;
      const cand = { x, y };
      if (!placed.some((p) => Math.hypot(p.x - x, p.y - y) < minDist)) {
        placed.push(cand); return { ...ch, position: cand };
      }
      const fb = {
        x: Math.max(gL, Math.min(gR, x + ((i % 3) - 1) * 8)),
        y: Math.max(gT, Math.min(gB, y + ((i % 2) - 0.5) * 6)),
      };
      placed.push(fb); return { ...ch, position: fb };
    });
  }, [islands, characters]);

  const islandCharLayouts = useMemo(() => {
    const m: Record<number, CharacterData[]> = {};
    islands.forEach((i) => { m[i.id] = getIslandCharLayouts(i.id); });
    return m;
  }, [islands, getIslandCharLayouts]);

  const handleAddCharacter = (
    imageFile: File | null, name: string, age: number,
    islandId: number, personality: PersonalityData, evolveMemoryText?: string,
  ) => {
    if (evolvingCharacter) {
      setPendingEvolution({
        characterId: evolvingCharacter.id,
        imageFile,
        memoryText: evolveMemoryText ?? "",
        personalityDelta: personality,
        name: evolvingCharacter.name,
        age: evolvingCharacter.age,
        islandId: evolvingCharacter.islandId,
      });
      setRigPreviewUrl(imageFile ? URL.createObjectURL(imageFile) : pendingDrawing);
      setModalState("rig");
      return;
    }
    setPendingCharacter({ imageFile, name, age, islandId, personality });
    setRigPreviewUrl(imageFile ? URL.createObjectURL(imageFile) : pendingDrawing);
    setModalState("rig");
  };

  const handleRigBack = () => {
    if (pendingEvolution) {
      setPendingEvolution(null);
      setRigPreviewUrl(null);
      setPendingDrawing(null);
      setModalState("choose");
      return;
    }
    setPendingCharacter(null);
    setRigPreviewUrl(null);
    setModalState("upload");
  };

  const handleRigConfirm = async (joints: Record<string, { x: number; y: number }>) => {
    if (!pendingCharacter && !pendingEvolution) return;
    const evolutionPayload = pendingEvolution;
    const creationPayload  = pendingCharacter;
    const imageFile  = evolutionPayload?.imageFile ?? creationPayload?.imageFile ?? null;
    const name       = evolutionPayload?.name ?? creationPayload?.name ?? "";
    const age        = evolutionPayload?.age  ?? creationPayload?.age  ?? Date.now();
    const islandId   = evolutionPayload?.islandId ?? creationPayload?.islandId ?? 1;
    const personality =
      evolutionPayload?.personalityDelta ??
      creationPayload?.personality ??
      { catchphrase: "", traits: [], dailyActivity: "", favoriteThing: "" };
    try {
      let imageUrl = pendingDrawing;
      if (!imageUrl && imageFile) {
        imageUrl = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload  = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(imageFile);
        });
      }
      const res = await fetch(
        "/api/characters",
        evolutionPayload
          ? {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "evolve",
                characterId: evolutionPayload.characterId,
                imageUrl, joints, personality,
                memoryText: evolutionPayload.memoryText,
              }),
            }
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name, age, imageUrl,
                position: getCharacterPosition(islandId),
                islandId, joints, personality,
              }),
            },
      );
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody?.error || "Failed to save character");
      }
      const resultCharacter = await res.json();
      if (evolutionPayload) {
        setCharacters((prev) =>
          prev.map((c) => (c.id === resultCharacter.id ? resultCharacter : c)),
        );
      } else {
        setCharacters((p) => [...p, resultCharacter]);
      }
      setPendingDrawing(null);
      setPendingCharacter(null);
      setPendingEvolution(null);
      setEvolvingCharacter(null);
      setRigPreviewUrl(null);
      setModalState("none");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save character.");
    }
  };

  const handleTutorialDismiss = () => {
    if (tutorialStep === "create-island") { setShowTutorial(false); setShowNewIslandModal(true); }
    else if (tutorialStep === "draw-maple") { setModalState("choose"); setShowTutorial(false); }
  };

  const bg      = darkMode ? "#0f2336" : "#e8f9ff";
  const navBg   = darkMode ? "rgba(15,35,54,0.9)"     : "rgba(255,255,255,0.9)";
  const navBord = darkMode ? "rgba(255,255,255,0.08)"  : "rgba(0,0,0,0.06)";
  const txtMain = darkMode ? "#f0f6ff" : "#1a1a1a";
  const txtMuted= darkMode ? "#7ea8c4" : "#888780";
  const bBg     = darkMode ? "#1e3a52" : "#000";
  const bHov    = darkMode ? "#2a4d6b" : "#222";
  const bTxt    = "#fff";
  const zoomPct = `${Math.round(zoom * 100)}%`;

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center" style={{ backgroundColor: bg }}>
        <p className="text-lg animate-pulse" style={{ color: txtMuted }}>Loading islands…</p>
      </div>
    );
  }

  return (
    <div
      className={`size-full touch-none select-none relative overflow-hidden ${
        isPanning ? "cursor-grabbing" : draggingIslandId ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ backgroundColor: bg }}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={stopPan}
      onPointerCancel={stopPan}
      onWheel={handleWheel}
    >
      {/* Canvas */}
      <div
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isPanning || draggingIslandId ? "none" : "transform 0.08s ease-out",
        }}
        className="absolute inset-0 pointer-events-none"
      >
        {islands.map((planet) => {
          const { x: wx, y: wy } = islandWorldPos(planet);
          const armed   = armedIslandId === planet.id;
          const dragging= draggingIslandId === planet.id;
          return (
            <div
              key={planet.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group pointer-events-auto ${
                dragging ? "cursor-grabbing" : armed ? "cursor-move" : ""
              }`}
              style={{ left: `calc(50% + ${wx}px)`, top: `calc(50% + ${wy}px)` }}
              onDoubleClick={() => handleIslandDblClick(planet.id)}
              onPointerDown={(e) => handleIslandPointerDown(e, planet)}
              onPointerMove={handleIslandPointerMove}
              onPointerUp={handleIslandPointerUp}
            >
              <div
                style={{
                  width: planet.size,
                  height: planet.size * 0.4,
                  overflow: "hidden",
                  position: "relative",
                  backgroundImage: `url('${getSkinPath(planet.skin)}')`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center top",
                  outline: armed ? "3px dashed rgba(59,130,246,0.9)" : undefined,
                  outlineOffset: armed ? "3px" : undefined,
                  transition: "outline 0.15s",
                }}
              >
                {(islandCharLayouts[planet.id] ?? []).map((ch) => (
                  <Character key={ch.id} {...ch} onClick={() => setSelectedCharacter(ch)} />
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <p className="text-lg font-medium select-none" style={{ color: txtMuted }}>
                  {planet.label}
                </p>
                <button
                  onClick={() => handleDeleteIsland(planet.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold"
                  title="Delete island"
                >
                  ×
                </button>
              </div>
              {armed && (
                <p className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-medium text-blue-400 whitespace-nowrap select-none">
                  drag to reposition · double-click to cancel
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {islands.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 pointer-events-none text-center px-6">
          <p className="text-5xl">🏝️</p>
          <div>
            <p className="text-lg font-semibold" style={{ color: txtMain }}>No islands yet</p>
            <p className="text-sm mt-1" style={{ color: txtMuted }}>
              Create your first island, then add drawings to bring it to life.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewIslandModal(true)}
            className="pointer-events-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: bBg, color: bTxt }}
          >
            <MapPin className="w-4 h-4" /> Create first island
          </button>
        </div>
      )}

      {/* Top navbar */}
      <div
        className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-5 py-2.5"
        style={{ background: navBg, borderBottom: `1px solid ${navBord}`, backdropFilter: "blur(14px)" }}
      >
        <div className="shrink-0">
          <h1 className="text-sm sm:text-base font-semibold leading-tight" style={{ color: txtMain }}>
            Ding Dong Doodle
          </h1>
          <p className="text-[10px] hidden sm:block" style={{ color: txtMuted }}>Draw · Dream · Discover</p>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <NavBtn icon={<Plus className="w-3.5 h-3.5" />} label="Add Drawing" shortLabel="Add"
            onClick={() => setModalState("choose")} bg={bBg} hov={bHov} color={bTxt} />
          <NavBtn icon={<MapPin className="w-3.5 h-3.5" />} label="New Island" shortLabel="Island"
            onClick={() => setShowNewIslandModal(true)} bg={bBg} hov={bHov} color={bTxt} />
          <NavBtn icon={<Bone className="w-3.5 h-3.5" />} label="Rig Character" shortLabel="Rig"
            onClick={() => router.push("/rig")} bg={bBg} hov={bHov} color={bTxt} />
          <NavBtn icon={<BookOpen className="w-3.5 h-3.5" />} label="Storyboard" shortLabel="Stories"
            onClick={() => router.push("/storyboard")}
            bg={darkMode ? "#92400e" : "#f59e0b"} hov={darkMode ? "#b45309" : "#d97706"}
            color={darkMode ? "#fff" : "#1c1917"} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <IconBtn onClick={() => setDarkMode((p) => !p)} title="Toggle theme" bg={bBg} color={bTxt}>
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </IconBtn>
          <IconBtn onClick={async () => { await fetch("/api/auth", { method: "DELETE" }); router.push("/"); }}
            title="Log out" bg={bBg} color={bTxt}>
            <LogOut className="w-3.5 h-3.5" />
          </IconBtn>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="fixed bottom-5 left-5 z-20 flex flex-col gap-1.5" style={{ pointerEvents: "auto" }} data-no-pan>
        <CtrlBtn onClick={() => zoomBy(ZOOM_STEP)} title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </CtrlBtn>
        <div
          className="flex items-center justify-center rounded-full text-[11px] font-semibold select-none"
          style={{
            width: 40, height: 28,
            background: darkMode ? "rgba(15,35,54,0.9)" : "rgba(255,255,255,0.9)",
            border: `1px solid ${navBord}`, color: txtMuted, backdropFilter: "blur(8px)",
          }}
        >
          {zoomPct}
        </div>
        <CtrlBtn onClick={() => zoomBy(-ZOOM_STEP)} title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </CtrlBtn>
        <CtrlBtn onClick={resetView} title="Reset view">
          <Maximize2 className="w-4 h-4" />
        </CtrlBtn>
        {islands.length > 0 && (
          <CtrlBtn onClick={() => flyToIsland(islands[0])} title="Go to home island">
            <Navigation className="w-4 h-4" />
          </CtrlBtn>
        )}
      </div>

      {/* Minimap */}
      {islands.length > 0 && (
        <IslandMinimap
          islands={islands} characters={characters}
          panX={panX} panY={panY} zoom={zoom}
          darkMode={darkMode} onFlyToIsland={flyToIsland}
        />
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {selectedCharacter && (
          <CharacterDetail
            {...selectedCharacter}
            onClose={() => setSelectedCharacter(null)}
            onEvolved={(updated) => {
              setCharacters((prev) =>
                prev.map((c) =>
                  c.id === updated.id
                    ? {
                        ...c,
                        imageUrl:       updated.imageUrl,
                        versionHistory: updated.versionHistory,
                        memories:       updated.memories,
                        personality:    updated.personality,
                      }
                    : c
                )
              );
              setSelectedCharacter((prev) =>
                prev?.id === updated.id
                  ? {
                      ...prev,
                      imageUrl:       updated.imageUrl,
                      versionHistory: updated.versionHistory,
                      memories:       updated.memories,
                      personality:    updated.personality,
                    }
                  : prev
              );
            }}
          />
        )}
        {modalState === "choose" && (
          <ChooseInputModal
            onChooseDraw={() => setModalState("draw")}
            onChooseUpload={() => setModalState("upload")}
            onClose={() => {
              setModalState("none");
              setPendingDrawing(null);
              setEvolvingCharacter(null);
            }}
          />
        )}
        {modalState === "draw" && (
          <motion.div key="draw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <DrawingCanvas
              onSave={(url) => { setPendingDrawing(url); setModalState("upload"); }}
              onClose={() => setModalState("choose")}
              tutorialHint={tutorialStep === "draw-maple" ? "🦆 Draw a character!" : undefined}
            />
          </motion.div>
        )}
        {modalState === "upload" && (
          <UploadModal
            onClose={() => { setPendingDrawing(null); setModalState("choose"); }}
            onSubmit={handleAddCharacter}
            previewImageUrl={pendingDrawing ?? undefined}
            islands={islands}
            isEvolution={!!evolvingCharacter}
            evolutionName={evolvingCharacter?.name}
            evolutionIslandId={evolvingCharacter?.islandId}
          />
        )}
        {modalState === "rig" && (pendingCharacter || pendingEvolution) && (
          <motion.div key="rig" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-base font-medium text-gray-800">Place joints</h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Click to place each joint on{" "}
                    <span className="font-medium text-gray-600">
                      {pendingCharacter?.name ?? evolvingCharacter?.name ?? "your character"}
                    </span>
                  </p>
                </div>
                <button onClick={handleRigBack} className="text-sm text-gray-400 hover:text-gray-600">
                  ← Back
                </button>
              </div>
              <div className="p-4">
                <JointEditor
                  imageUrl={rigPreviewUrl ?? pendingDrawing ?? ""}
                  onConfirm={handleRigConfirm}
                  onBack={handleRigBack}
                />
              </div>
            </div>
          </motion.div>
        )}
        {showNewIslandModal && (
          <NewIslandModal
            onClose={() => setShowNewIslandModal(false)}
            onSubmit={handleAddIsland}
            isTutorial={tutorialStep === "create-island"}
            defaultSkinIndex={islands.length}
          />
        )}
      </AnimatePresence>

      {showTutorial && (tutorialStep === "create-island" || tutorialStep === "draw-maple") && (
        <TutorialOverlay step={tutorialStep} onDismiss={handleTutorialDismiss} />
      )}
    </div>
  );
}

// ─── Minimap ──────────────────────────────────────────────────────────────────

interface MinimapProps {
  islands: IslandData[];
  characters: CharacterData[];
  panX: number; panY: number; zoom: number;
  darkMode: boolean;
  onFlyToIsland: (island: IslandData) => void;
}

function IslandMinimap({ islands, characters, panX, panY, zoom, darkMode, onFlyToIsland }: MinimapProps) {
  const [expanded, setExpanded] = useState(false);
  const [expPanX, setExpPanX]   = useState(0);
  const [expPanY, setExpPanY]   = useState(0);
  const dragRef = useRef<{ sx: number; sy: number; spx: number; spy: number } | null>(null);

  const MW = 210, MH = 128;
  const EW = 720, EH = 500;

  const worldPositions = islands.map(islandWorldPos);
  const allX = worldPositions.map((p) => p.x);
  const allY = worldPositions.map((p) => p.y);
  const pad  = ISLAND_SIZE * 0.6;
  const minX = Math.min(...allX) - pad, maxX = Math.max(...allX) + pad;
  const minY = Math.min(...allY) - pad, maxY = Math.max(...allY) + pad;
  const wW   = maxX - minX || 1200;
  const wH   = maxY - minY || 800;

  const toMini = (wx: number, wy: number) => ({
    x: ((wx - minX) / wW) * MW,
    y: ((wy - minY) / wH) * MH,
  });

  const vpW  = (window.innerWidth / zoom / wW) * MW;
  const vpH  = (window.innerHeight / zoom / wH) * MH;
  const vpCx = toMini(-panX / zoom, -panY / zoom);
  const vpX  = vpCx.x - vpW / 2;
  const vpY  = vpCx.y - vpH / 2;

  const expScale = Math.min((EW - 32) / wW, (EH - 48) / wH) * 0.85;

  const toExp = (wx: number, wy: number) => ({
    x: (wx - minX) * expScale + 16 + expPanX,
    y: (wy - minY) * expScale + 24 + expPanY,
  });

  const surfaceStyle: React.CSSProperties = {
    background: darkMode ? "rgba(10,25,42,0.95)" : "rgba(255,255,255,0.97)",
    border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
    backdropFilter: "blur(12px)",
    borderRadius: 12,
  };

  return (
    <>
      {!expanded && (
        <div
          className="fixed bottom-5 right-5 z-20 shadow-lg"
          style={{ ...surfaceStyle, padding: 10, cursor: "pointer", pointerEvents: "auto" }}
          data-no-pan
          onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="relative overflow-hidden rounded" style={{ width: MW, height: MH, background: darkMode ? "#0d1f2f" : "#f0f9ff" }}>
            {islands.map((isl, idx) => {
              const mp = toMini(worldPositions[idx].x, worldPositions[idx].y);
              const dw = Math.max(22, (isl.size / wW) * MW * 0.75);
              const dh = dw * 0.4;
              return (
                <div key={isl.id} style={{ pointerEvents: "none" }}>
                  <div className="absolute" style={{
                    left: mp.x - dw / 2, top: mp.y - dh / 2, width: dw, height: dh,
                    backgroundImage: `url('${getSkinPath(isl.skin)}')`,
                    backgroundSize: "cover", backgroundPosition: "center top", opacity: 0.85,
                  }} />
                  <span className="absolute text-center truncate" style={{
                    left: mp.x - dw / 2, top: mp.y + dh / 2 + 1, width: dw, fontSize: 8,
                    color: darkMode ? "#9bb8cc" : "#666",
                  }}>{isl.label}</span>
                </div>
              );
            })}
            {characters.map((ch) => {
              const isl = islands.find((i) => i.id === ch.islandId);
              if (!isl) return null;
              const idx = islands.indexOf(isl);
              const cx  = worldPositions[idx].x + ((ch.position.x - 50) / 100) * isl.size;
              const cy  = worldPositions[idx].y + ((ch.position.y - 50) / 100) * (isl.size * 0.4);
              const mp  = toMini(cx, cy);
              return <div key={ch.id} className="absolute rounded-full" style={{
                left: mp.x - 2.5, top: mp.y - 2.5, width: 5, height: 5,
                background: "#7F77DD", border: "1px solid #6366f1", pointerEvents: "none",
              }} />;
            })}
            <div className="absolute" style={{
              left: vpX, top: vpY, width: Math.max(12, vpW), height: Math.max(12, vpH),
              border: "1.5px solid rgba(59,130,246,0.7)",
              background: "rgba(59,130,246,0.08)",
              borderRadius: 2, pointerEvents: "none",
            }} />
          </div>
          <p className="text-center mt-1.5 text-[10px]" style={{ color: darkMode ? "#6a8fa8" : "#aaa" }}>
            Map · click to expand
          </p>
        </div>
      )}

      {expanded && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setExpanded(false)}
            onPointerDown={(e) => e.stopPropagation()} style={{ pointerEvents: "auto" }} />
          <div
            className="fixed z-50 shadow-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ ...surfaceStyle, width: EW, height: EH, overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 z-10"
              style={{ borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}` }}>
              <p className="text-xs font-semibold" style={{ color: darkMode ? "#9bb8cc" : "#555" }}>
                World Map · click an island to fly there
              </p>
              <button onClick={() => setExpanded(false)}
                className="text-lg leading-none opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: darkMode ? "#fff" : "#000" }}>×</button>
            </div>
            <div
              className="absolute inset-0 cursor-grab active:cursor-grabbing overflow-hidden"
              style={{ top: 40 }}
              onPointerDown={(e) => {
                dragRef.current = { sx: e.clientX, sy: e.clientY, spx: expPanX, spy: expPanY };
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!dragRef.current) return;
                setExpPanX(dragRef.current.spx + (e.clientX - dragRef.current.sx));
                setExpPanY(dragRef.current.spy + (e.clientY - dragRef.current.sy));
              }}
              onPointerUp={(e) => {
                dragRef.current = null;
                if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId))
                  (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
              }}
              onPointerCancel={(e) => {
                dragRef.current = null;
                if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId))
                  (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
              }}
            >
              <div className="absolute inset-0" style={{ background: darkMode ? "#0d1f2f" : "#dff3fb" }} />
              {islands.map((isl, idx) => {
                const ep = toExp(worldPositions[idx].x, worldPositions[idx].y);
                const dw = Math.max(46, isl.size * expScale * 0.58);
                const dh = dw * 0.4;
                return (
                  <div key={isl.id}
                    className="absolute cursor-pointer group"
                    style={{ left: ep.x - dw / 2, top: ep.y - dh / 2, width: dw, height: dh + 28 }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); setExpanded(false); onFlyToIsland(isl); }}
                  >
                    <div style={{
                      width: dw, height: dh,
                      backgroundImage: `url('${getSkinPath(isl.skin)}')`,
                      backgroundSize: "cover", backgroundPosition: "center top",
                      borderRadius: 4, overflow: "hidden",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)", transition: "transform 0.15s",
                    }} className="group-hover:scale-105" />
                    <p className="text-center mt-1 text-xs font-medium truncate"
                      style={{ color: darkMode ? "#9bb8cc" : "#444", width: dw }}>
                      {isl.label}
                    </p>
                    {characters.filter((c) => c.islandId === isl.id).map((ch) => {
                      const cx = ((ch.position.x - 15) / 70) * dw;
                      const cy = ((ch.position.y - 10) / 35) * dh;
                      return <div key={ch.id} className="absolute rounded-full" style={{
                        left: cx - 4, top: cy - 4, width: 8, height: 8,
                        background: "#7F77DD", border: "1.5px solid #6366f1", pointerEvents: "none",
                      }} />;
                    })}
                  </div>
                );
              })}
            </div>
            <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] pointer-events-none"
              style={{ color: darkMode ? "#4a6880" : "#bbb" }}>
              Drag to pan · click an island to fly there
            </p>
          </div>
        </>
      )}
    </>
  );
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function NavBtn({ icon, label, shortLabel, onClick, bg, hov, color }: {
  icon: React.ReactNode; label: string; shortLabel: string;
  onClick: () => void; bg: string; hov: string; color: string;
}) {
  const [h, setH] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="flex items-center gap-1.5 rounded-full px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors"
      style={{ backgroundColor: h ? hov : bg, color }}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>
    </button>
  );
}

function IconBtn({ children, onClick, title, bg, color }: {
  children: React.ReactNode; onClick: () => void; title?: string; bg: string; color: string;
}) {
  const [h, setH] = useState(false);
  return (
    <button type="button" onClick={onClick} title={title}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
      style={{ backgroundColor: h ? "#333" : bg, color }}>
      {children}
    </button>
  );
}

function CtrlBtn({ children, onClick, title }: {
  children: React.ReactNode; onClick: () => void; title?: string;
}) {
  const [h, setH] = useState(false);
  return (
    <button type="button" onClick={onClick} title={title} data-no-pan
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="flex items-center justify-center rounded-full transition-all"
      style={{
        width: 36, height: 36,
        background: h ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.92)",
        border: "1px solid rgba(0,0,0,0.1)",
        color: h ? "#fff" : "#333",
        backdropFilter: "blur(8px)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
      }}>
      {children}
    </button>
  );
}