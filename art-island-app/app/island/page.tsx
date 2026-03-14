"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Plus, LogOut, MapPin } from "lucide-react";
import { Character } from "../components/Character";
import { CharacterDetail } from "../components/CharacterDetail";
import { UploadModal } from "../components/UploadModal";
import { NewIslandModal } from "../components/NewIslandModal";
import { ChooseInputModal } from "../components/ChooseInputModal";
import { DrawingCanvas } from "../components/DrawingCanvas";

type ModalState = "none" | "choose" | "draw" | "upload";

interface CharacterData {
  id: string;
  imageUrl: string;
  name: string;
  age: number;
  position: { x: number; y: number };
}

interface IslandData {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  border: string;
  label: string;
}

const DEFAULT_PLANETS: IslandData[] = [
  { id: 1, x: 18, y: 52, size: 160, color: "#EEEDFE", border: "#AFA9EC", label: "Planet Luminos" },
  { id: 2, x: 50, y: 58, size: 130, color: "#E1F5EE", border: "#5DCAA5", label: "Planet Verdara" },
  { id: 3, x: 78, y: 48, size: 110, color: "#FAEEDA", border: "#EF9F27", label: "Planet Solara" },
];

export default function App() {
  const router = useRouter();
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterData | null>(null);
  const [modalState, setModalState] = useState<ModalState>("none");
  const [pendingDrawing, setPendingDrawing] = useState<string | null>(null);
  const [showNewIslandModal, setShowNewIslandModal] = useState(false);
  const [islands, setIslands] = useState<IslandData[]>(DEFAULT_PLANETS);
  const [nextIslandId, setNextIslandId] = useState(4);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const res = await fetch("/api/characters");
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCharacters(data.map((char: any) => ({
        id: char.id,
        imageUrl: char.imageUrl,
        name: char.name,
        age: char.age,
        position: char.position,
      })));
    } catch (error) {
      console.error("Error loading characters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  };

  const getValidIslandPosition = (): { x: number; y: number } => {
    const minDistance = 25;
    const maxAttempts = 20;
    let attempt = 0;
    while (attempt < maxAttempts) {
      const x = Math.random() * 70 + 10;
      const y = Math.random() * 70 + 15;
      const isFarEnough = islands.every((island) => {
        const x1Px = (x / 100) * 1000;
        const y1Px = (y / 100) * 700;
        const x2Px = (island.x / 100) * 1000;
        const y2Px = (island.y / 100) * 700;
        const distance = Math.sqrt(Math.pow(x1Px - x2Px, 2) + Math.pow(y1Px - y2Px, 2));
        return distance >= island.size / 2 + 70;
      });
      if (isFarEnough) return { x, y };
      attempt++;
    }
    return { x: Math.random() * 70 + 10, y: Math.random() * 70 + 15 };
  };

  const handleAddIsland = (name: string, color: string, border: string) => {
    const position = getValidIslandPosition();
    const newIsland: IslandData = {
      id: nextIslandId,
      x: position.x,
      y: position.y,
      size: 100 + Math.random() * 60,
      color,
      border,
      label: name,
    };
    setIslands((prev) => [...prev, newIsland]);
    setNextIslandId((prev) => prev + 1);
  };

  const getValidCharacterPosition = (): { x: number; y: number } => {
    const minDistance = 8;
    for (let attempt = 0; attempt < 10; attempt++) {
      const x = Math.random() * 30 + 35;
      const y = 30 + Math.random() * 2;
      const isFarEnough = characters.every((char) => {
        const distance = Math.sqrt(
          Math.pow(x - char.position.x, 2) + Math.pow(y - char.position.y, 2)
        );
        return distance >= minDistance;
      });
      if (isFarEnough) return { x, y };
    }
    return { x: Math.random() * 30 + 35, y: 30 + Math.random() * 2 };
  };

  const handleDrawingSave = (dataUrl: string) => {
    setPendingDrawing(dataUrl);
    setModalState("upload");
  };

  const handleAddCharacter = async (imageFile: File | null, name: string, age: number) => {
    try {
      const position = getValidCharacterPosition();

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
        body: JSON.stringify({ name, age, imageUrl, position }),
      });

      if (!res.ok) throw new Error("Failed to save");
      const newCharacter = await res.json();
      setCharacters((prev) => [...prev, newCharacter]);
      setPendingDrawing(null);
      setModalState("none");
    } catch (error) {
      console.error("Error adding character:", error);
      alert("Failed to add character. Please try again.");
    }
  };

  const closeAll = () => {
    setModalState("none");
    setPendingDrawing(null);
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-white">
        <div className="text-2xl text-gray-500">Loading planets...</div>
      </div>
    );
  }

  return (
    <div className="size-full relative overflow-hidden bg-white">
      {/* Planets */}
      <div className="absolute inset-0 pointer-events-none">
        {islands.map((planet) => (
          <div
            key={planet.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${planet.x}%`, top: `${planet.y}%` }}
          >
            <div
              style={{
                width: planet.size,
                height: planet.size,
                borderRadius: "50%",
                background: planet.color,
                border: `2px solid ${planet.border}`,
              }}
            />
            <p className="text-center text-xs font-medium mt-1" style={{ color: "#888780" }}>
              {planet.label}
            </p>
          </div>
        ))}
      </div>

      {/* Characters */}
      <div className="absolute inset-0">
        {characters.map((character) => (
          <Character
            key={character.id}
            {...character}
            onClick={() => setSelectedCharacter(character)}
          />
        ))}
      </div>

      {/* Add Button */}
      <div className="fixed top-4 sm:top-6 left-4 sm:left-6 flex gap-2 z-10">
        <button
          onClick={() => setModalState("choose")}
          className="bg-purple-500 hover:bg-purple-600 text-white font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Drawing</span>
          <span className="sm:hidden">Add</span>
        </button>
        <button
          onClick={() => setShowNewIslandModal(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base"
        >
          <MapPin className="w-5 h-5" />
          <span className="hidden sm:inline">New Island</span>
          <span className="sm:hidden">Island</span>
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="fixed top-4 sm:top-6 right-4 sm:right-6 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium px-4 py-2 rounded-full transition-all flex items-center gap-2 z-10 text-sm"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Log Out</span>
      </button>

      {/* Title */}
      <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 text-center z-10 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium text-gray-800">Planet Pals</h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">Where your drawings come to life</p>
      </div>

      {characters.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-4">
          <p className="text-lg text-gray-300">Click "Add Drawing" to place your character on a planet</p>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {selectedCharacter && (
          <CharacterDetail {...selectedCharacter} onClose={() => setSelectedCharacter(null)} />
        )}

        {modalState === "choose" && (
          <ChooseInputModal
            onChooseDraw={() => setModalState("draw")}
            onChooseUpload={() => setModalState("upload")}
            onClose={closeAll}
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
          />
        )}

        {showNewIslandModal && (
          <NewIslandModal
            onClose={() => setShowNewIslandModal(false)}
            onSubmit={handleAddIsland}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
