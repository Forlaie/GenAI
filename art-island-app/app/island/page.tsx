"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Plus, LogOut, MapPin, Moon, Sun } from "lucide-react";
import { Character } from "../components/Character";
import { CharacterDetail } from "../components/CharacterDetail";
import { UploadModal } from "../components/UploadModal";
import { NewIslandModal } from "../components/NewIslandModal";
import { ChooseInputModal } from "../components/ChooseInputModal";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { TutorialOverlay } from "../components/TutorialOverlay";
import { Minimap } from "../components/Minimap";
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

interface IslandSkin {
  id: string;
  imagePath: string;
}

const ISLAND_SKINS: IslandSkin[] = [
  { id: "dirt", imagePath: "/island.png" },
  { id: "sand", imagePath: "/sand_island.png" },
  { id: "stone", imagePath: "/stone_island.png" },
];

const getIslandSkinImagePath = (skinId?: string): string => {
  const skin = ISLAND_SKINS.find((s) => s.id === skinId);
  return skin?.imagePath || ISLAND_SKINS[0].imagePath;
};

const ISLAND_SIZE = 620;
const CHARACTER_FOOTPRINT_PX = 112;

export default function App() {
  const router = useRouter();
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterData | null>(null);
  const [modalState, setModalState] = useState<ModalState>("none");
  const [pendingDrawing, setPendingDrawing] = useState<string | null>(null);
  const [showNewIslandModal, setShowNewIslandModal] = useState(false);
  const [islands, setIslands] = useState<IslandData[]>([]);
  const [nextIslandId, setNextIslandId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>("none");
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(true);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pendingCharacter, setPendingCharacter] = useState<{
    imageFile: File | null;
    name: string;
    age: number;
    islandId: number;
    personality: any; // ← add
  } | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadCharacters();
    loadIslands();
  }, []);

  const loadCharacters = async () => {
    try {
      const res = await fetch("/api/characters");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      setCharacters(await res.json());
    } catch (error) {
      console.error("Error loading characters:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadIslands = async () => {
    try {
      const res = await fetch("/api/islands");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const normalizedIslands = data.map((island: IslandData) => ({
        ...island,
        size: ISLAND_SIZE,
      }));
      setIslands(normalizedIslands);
      setNextIslandId(
        normalizedIslands.length > 0
          ? Math.max(...normalizedIslands.map((i: any) => i.id)) + 1
          : 1,
      );

      if (normalizedIslands.length === 0) {
        setTutorialStep("create-island");
        setShowTutorialOverlay(true);
      }
    } catch (error) {
      console.error("Error loading islands:", error);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  };

  const getValidIslandPosition = (): { x: number; y: number } => ({
    x: Math.random() * 70 + 10,
    y: Math.random() * 70 + 15,
  });

  const handleAddIsland = async (
    name: string,
    color: string,
<<<<<<< HEAD
    border: string,
    skinId: string,
=======
    border: string
>>>>>>> 0b0654633d076fd269a280cc16dc15cf0ec1e745
  ) => {
    try {
      const newIsland: IslandData = {
        id: nextIslandId,
        ...getValidIslandPosition(),
        size: ISLAND_SIZE,
        color,
        border,
        label: name,
        skin: skinId,
      };

      const res = await fetch("/api/islands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIsland),
      });

      if (!res.ok) throw new Error("Failed to save island");

      const savedIsland = await res.json();
      setIslands((prev) => [...prev, savedIsland]);
      setNextIslandId((prev) => prev + 1);
      setShowNewIslandModal(false);

      if (tutorialStep === "create-island") {
        setTutorialStep("draw-maple");
        setShowTutorialOverlay(true);
      }
    } catch (error) {
      console.error("Error adding island:", error);
      alert("Failed to add island. Please try again.");
    }
  };

  const getCharacterPosition = (islandId: number): { x: number; y: number } => {
    const island = islands.find((i) => i.id === islandId);
    if (!island) return { x: 50, y: 50 };

    const existingPositions = characters
      .filter((char) => char.islandId === islandId)
      .map((char) => char.position);
    const minDistance = (CHARACTER_FOOTPRINT_PX / island.size) * 100;
    const maxRadius = 50 - minDistance / 2 - 3;

    if (existingPositions.length === 0) {
      return { x: 50, y: 50 };
    }

    for (let attempt = 0; attempt < 240; attempt++) {
      const angle = attempt * 2.399963229728653;
      const distance = maxRadius * (0.45 + 0.55 * ((attempt % 12) / 11));
      const candidate = {
        x: 50 + Math.cos(angle) * distance,
        y: 50 + Math.sin(angle) * distance,
      };

      const isColliding = existingPositions.some((position) => {
        const dx = position.x - candidate.x;
        const dy = position.y - candidate.y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      });

      if (!isColliding) {
        return candidate;
      }
    }

    return { x: 50, y: 50 };
  };

  const getIslandCharacterLayouts = (
    islandId: number,
    islandList: IslandData[],
<<<<<<< HEAD
    characterList: CharacterData[],
=======
    characterList: CharacterData[]
>>>>>>> 0b0654633d076fd269a280cc16dc15cf0ec1e745
  ) => {
    const island = islandList.find((item) => item.id === islandId);
    if (!island) return [] as CharacterData[];

    const islandCharacters = characterList.filter(
      (char) => char.islandId === islandId,
    );
    const placedPositions: Array<{ x: number; y: number }> = [];
    const minDistance = (CHARACTER_FOOTPRINT_PX / island.size) * 100;

    const greenTopStart = 10;
    const greenTopEnd = 45;
    const greenLeft = 15;
    const greenRight = 85;
    const greenWidth = greenRight - greenLeft;
    const greenHeight = greenTopEnd - greenTopStart;

    return islandCharacters.map((character, index) => {
      const cols = Math.ceil(Math.sqrt(islandCharacters.length));
      const row = Math.floor(index / cols);
      const col = index % cols;

      const x = greenLeft + (greenWidth * (col + 0.5)) / cols;
      const y = greenTopStart + (greenHeight * (row + 0.5)) / cols;

      const candidate = { x, y };

      const isColliding = placedPositions.some((position) => {
        const dx = position.x - candidate.x;
        const dy = position.y - candidate.y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      });

      if (!isColliding) {
        placedPositions.push(candidate);
        return { ...character, position: candidate };
      }

      // Deterministic fallback using index instead of Math.random()
      const fallback = {
        x: Math.max(
          greenLeft,
<<<<<<< HEAD
          Math.min(greenRight, candidate.x + ((index % 3) - 1) * 8),
        ),
        y: Math.max(
          greenTopStart,
          Math.min(greenTopEnd, candidate.y + ((index % 2) - 0.5) * 6),
=======
          Math.min(greenRight, candidate.x + ((index % 3) - 1) * 8)
        ),
        y: Math.max(
          greenTopStart,
          Math.min(greenTopEnd, candidate.y + ((index % 2) - 0.5) * 6)
>>>>>>> 0b0654633d076fd269a280cc16dc15cf0ec1e745
        ),
      };
      placedPositions.push(fallback);
      return { ...character, position: fallback };
    });
  };

  const islandCharacterLayouts = useMemo(() => {
    const layouts: Record<number, CharacterData[]> = {};
    islands.forEach((island) => {
      layouts[island.id] = getIslandCharacterLayouts(
        island.id,
        islands,
<<<<<<< HEAD
        characters,
=======
        characters
>>>>>>> 0b0654633d076fd269a280cc16dc15cf0ec1e745
      );
    });
    return layouts;
  }, [islands, characters]);

  const getIslandDisplayPosition = (index: number, total: number) => {
    const columns = Math.max(1, Math.ceil(Math.sqrt(total)));
    const rows = Math.ceil(total / columns);
    const column = index % columns;
    const row = Math.floor(index / columns);
    const horizontalSpacing = ISLAND_SIZE + 180;
    const verticalSpacing = ISLAND_SIZE + 220;
    const offsetX = (column - (columns - 1) / 2) * horizontalSpacing;
    const offsetY = (row - (rows - 1) / 2) * verticalSpacing;

    return {
      left: `calc(50% + ${offsetX}px)`,
      top: `calc(50% + ${offsetY}px)`,
    };
  };

  const handleDrawingSave = (dataUrl: string) => {
    setPendingDrawing(dataUrl);
    setModalState("upload");
  };

  const handleAddCharacter = async (
    imageFile: File | null,
    name: string,
    age: number,
    islandId: number,
<<<<<<< HEAD
=======
    personality: any // ← add
>>>>>>> 0b0654633d076fd269a280cc16dc15cf0ec1e745
  ) => {
    console.log("handleAddCharacter called", {
      name,
      age,
      islandId,
      personality,
    }); // ← check it arrives
    setPendingCharacter({ imageFile, name, age, islandId, personality }); // ← store it
    setModalState("rig");
  };

  const handleRigConfirm = async (
    joints: Record<string, { x: number; y: number }>,
  ) => {
    console.log("handleRigConfirm called");
    console.log("pendingCharacter:", pendingCharacter);
    console.log("pendingDrawing:", pendingDrawing);
    if (!pendingCharacter) return;
    const { imageFile, name, age, islandId, personality } = pendingCharacter;

    try {
      const position = getCharacterPosition(islandId);

      let imageUrl = pendingDrawing;
      if (!imageUrl && imageFile) {
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      }

      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          age,
          imageUrl,
          position,
          islandId,
          joints,
          personality,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      const newCharacter = await res.json();
      setCharacters((prev) => [...prev, newCharacter]);
      setPendingDrawing(null);
      setPendingCharacter(null);
      setModalState("none");
    } catch (error) {
      console.error("Error adding character:", error);
      alert("Failed to add character. Please try again.");
    }
  };

  const handleTutorialDismiss = () => {
    if (tutorialStep === "create-island") {
      setShowTutorialOverlay(false);
      setShowNewIslandModal(true);
    } else if (tutorialStep === "draw-maple") {
      setModalState("choose");
      setShowTutorialOverlay(false);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const newZoom = Math.min(Math.max(zoom - e.deltaY * 0.001, 0.3), 3);
    const zoomRatio = newZoom / zoom;

    const mouseX = e.clientX - window.innerWidth / 2;
    const mouseY = e.clientY - window.innerHeight / 2;

    setPanX((prev) => mouseX + (prev - mouseX) * zoomRatio);
    setPanY((prev) => mouseY + (prev - mouseY) * zoomRatio);
    setZoom(newZoom);
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      modalState === "draw" ||
      modalState === "upload" ||
      modalState === "rig" ||
      selectedCharacter
    ) {
      return;
    }

    const target = e.target as HTMLElement;
    if (
      target.closest("[data-no-pan='true']") ||
      target.closest("button") ||
      target.closest("a")
    ) {
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panStartRef.current) return;
    const panStart = panStartRef.current;

    const deltaX = e.clientX - panStart.x;
    const deltaY = e.clientY - panStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance <= 3) return;

    setPanX((current) => current + deltaX);
    setPanY((current) => current + deltaY);
    panStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const stopPanning = () => {
    panStartRef.current = null;
    setIsPanning(false);
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    stopPanning();
  };

  const handleCanvasPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    stopPanning();
  };

  if (loading) {
    return (
      <div
        className="size-full flex items-center justify-center"
        style={{ backgroundColor: "#e8f9ff" }}
      >
        <div className="text-2xl text-gray-500">Loading islands...</div>
      </div>
    );
  }

  return (
    <div
<<<<<<< HEAD
      className={`size-full touch-none select-none relative overflow-hidden ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        backgroundColor: darkMode ? "#1a3a52" : "#e8f9ff",
        opacity: darkMode ? 0.9 : 1,
      }}
=======
      className={`size-full touch-none select-none relative overflow-hidden ${
        isPanning ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ backgroundColor: "#e8f9ff" }}
>>>>>>> 0b0654633d076fd269a280cc16dc15cf0ec1e745
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onPointerCancel={handleCanvasPointerCancel}
      onWheel={handleWheel}
    >
      {/* Planets and Characters Container */}
      <div
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transition: isPanning ? "none" : "transform 0.1s ease-out",
        }}
        className="absolute inset-0 pointer-events-none"
      >
        {islands.map((planet, index) => {
          const displayPosition = getIslandDisplayPosition(
            index,
            islands.length,
          );
          const imagePath = getIslandSkinImagePath(planet.skin);
          console.log(
            `Island ${planet.id} skin: ${planet.skin}, image: ${imagePath}`,
          );

          return (
            <div
              key={planet.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={displayPosition}
            >
              <div
                style={{
                  width: planet.size,
                  height: planet.size * 0.4, // reduce height to clip the empty bottom space
                  overflow: "hidden",
                  position: "relative",
                  backgroundImage: `url('${imagePath}')`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center top",
                }}
              >
                {(islandCharacterLayouts[planet.id] ?? []).map((character) => (
                  <Character
                    key={character.id}
                    {...character}
                    onClick={() => setSelectedCharacter(character)}
                  />
                ))}
              </div>
              <p
                className="text-center text-lg font-medium mt-3"
                style={{ color: darkMode ? "#ffffff" : "#888780" }}
              >
                {planet.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Add Button */}
      <div className="fixed top-4 sm:top-6 left-4 sm:left-6 flex gap-2 z-10">
        <button
          onClick={() => setModalState("choose")}
          className="bg-black hover:bg-gray-900 text-white font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all flex items-center gap-2 text-sm sm:text-base"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Drawing</span>
          <span className="sm:hidden">Add</span>
        </button>
        <button
          onClick={() => setShowNewIslandModal(true)}
          className="bg-black hover:bg-gray-900 text-white font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all flex items-center gap-2 text-sm sm:text-base"
        >
          <MapPin className="w-5 h-5" />
          <span className="hidden sm:inline">New Island</span>
          <span className="sm:hidden">Island</span>
        </button>
      </div>

      {/* Right Side Buttons */}
      <div className="fixed top-4 sm:top-6 right-4 sm:right-6 flex gap-2 z-10">
        <button
          onClick={() => router.push("/rig")}
          className="bg-black hover:bg-gray-900 text-white font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all flex items-center gap-2 text-sm sm:text-base"
        >
          <span>🦴</span>
          <span className="hidden sm:inline">Rig Character</span>
          <span className="sm:hidden">Rig</span>
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base"
        >
          {darkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-100 hover:bg-red-200 text-red-600 font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>

      {/* Title */}
      <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 text-center z-10 px-4">
        <div
          style={{
            background: darkMode ? "transparent" : "white",
            padding: "1rem 1.5rem",
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            display: "inline-block",
            position: "relative",
            border: `2px solid ${darkMode ? "#ffffff" : "#000000"}`,
          }}
        >
          <h1
            className={`text-xl sm:text-2xl md:text-3xl font-medium ${darkMode ? "text-white" : "text-gray-800"}`}
          >
            Ding Dong Doodle
          </h1>
          <p
            className={`text-xs sm:text-sm mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            Draw. Dream. Discover.
          </p>
        </div>
      </div>

      {characters.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-4">
          <p className="text-lg text-gray-300">
            Click "Add Drawing" to place your character on a planet
          </p>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {selectedCharacter && (
          <CharacterDetail
            {...selectedCharacter}
            onClose={() => setSelectedCharacter(null)}
          />
        )}

        {modalState === "choose" && (
          <ChooseInputModal
            onChooseDraw={() => setModalState("draw")}
            onChooseUpload={() => setModalState("upload")}
            onClose={() => {
              setModalState("none");
              setPendingDrawing(null);
            }}
          />
        )}

        {modalState === "draw" && (
          <motion.div
            key="draw"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          >
            <DrawingCanvas
              onSave={handleDrawingSave}
              onClose={() => setModalState("choose")}
              tutorialHint={
                tutorialStep === "draw-maple"
                  ? "🦆 Draw a goose! Let your creativity shine!"
                  : undefined
              }
            />
          </motion.div>
        )}

        {modalState === "upload" && (
          <UploadModal
            onClose={() => {
              setPendingDrawing(null);
              setModalState("choose");
            }}
            onSubmit={handleAddCharacter}
            previewImageUrl={pendingDrawing ?? undefined}
            islands={islands}
          />
        )}

        {modalState === "rig" && pendingCharacter && (
          <motion.div
            key="rig"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-base font-medium text-gray-800">
                    Place joints
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Click to place each joint on{" "}
                    <span className="font-medium text-gray-600">
                      {pendingCharacter.name}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPendingCharacter(null);
                    setModalState("upload");
                  }}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  ← Back
                </button>
              </div>
              <div className="p-4">
                <JointEditor
                  imageUrl={pendingDrawing ?? ""}
                  onConfirm={handleRigConfirm}
                  onBack={() => {
                    setPendingCharacter(null);
                    setModalState("upload");
                  }}
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
          />
        )}
      </AnimatePresence>

      {/* Tutorial Overlay */}
      {showTutorialOverlay &&
        (tutorialStep === "create-island" || tutorialStep === "draw-maple") && (
          <TutorialOverlay
            step={tutorialStep}
            onDismiss={handleTutorialDismiss}
          />
        )}

      {/* Minimap */}
      {islands.length > 0 && (
        <Minimap
          islands={islands}
          characters={characters}
          panX={panX}
          panY={panY}
          zoom={zoom}
        />
      )}
    </div>
  );
}
