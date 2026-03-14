"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { Plus, LogOut } from "lucide-react";
import { Character } from "../components/Character";
import { CharacterDetail } from "../components/CharacterDetail";
import { UploadModal } from "../components/UploadModal";

interface CharacterData {
  id: string;
  imageUrl: string;
  name: string;
  age: number;
  position: { x: number; y: number };
}

export default function App() {
  const router = useRouter();
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterData | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [islands, setIslands] = useState<
    {
      id: number;
      x: number;
      y: number;
      size: number;
      color: string;
      rotation: number;
      delay: number;
    }[]
  >([]);

  useEffect(() => {
    setIslands([
      {
        id: 1,
        x: 10,
        y: 35,
        size: 120,
        color: "from-green-600 to-green-700",
        rotation: 0,
        delay: 0,
      },
      {
        id: 2,
        x: 55,
        y: 45,
        size: 150,
        color: "from-emerald-500 to-emerald-700",
        rotation: 15,
        delay: 1,
      },
      {
        id: 3,
        x: 85,
        y: 30,
        size: 100,
        color: "from-teal-600 to-teal-700",
        rotation: -10,
        delay: 2,
      },
    ]);
  }, []);

  const stars = useMemo(
    () =>
      Array.from({ length: 100 }, (_, i) => ({
        id: i,
        width: Math.random() * 3 + 1,
        height: Math.random() * 3 + 1,
        top: Math.random() * 70,
        opacity: Math.random() * 0.7 + 0.3,
        animationDelay: Math.random() * -120,
      })),
    [],
  );

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const res = await fetch("/api/characters");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const mappedCharacters: CharacterData[] = data.map((char: any) => ({
        id: char.id,
        imageUrl: char.imageUrl,
        name: char.name,
        age: char.age,
        position: char.position,
      }));
      setCharacters(mappedCharacters);
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

  const getValidCharacterPosition = (): { x: number; y: number } => {
    const minDistance = 8;
    const maxAttempts = 10;
    let attempt = 0;
    while (attempt < maxAttempts) {
      const x = Math.random() * 30 + 35;
      const y = 30 + Math.random() * 2;
      const isFarEnough = characters.every((char) => {
        const distance = Math.sqrt(
          Math.pow(x - char.position.x, 2) + Math.pow(y - char.position.y, 2),
        );
        return distance >= minDistance;
      });
      if (isFarEnough) return { x, y };
      attempt++;
    }
    return { x: Math.random() * 30 + 35, y: 30 + Math.random() * 2 };
  };

  const handleAddCharacter = async (
    imageFile: File,
    name: string,
    age: number,
  ) => {
    try {
      const position = getValidCharacterPosition();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age, imageUrl: base64, position }),
      });

      if (!res.ok) throw new Error("Failed to save");
      const newCharacter = await res.json();
      setCharacters((prev) => [...prev, newCharacter]);
    } catch (error) {
      console.error("Error adding character:", error);
      alert("Failed to add character. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-gradient-to-b from-black via-indigo-950 to-indigo-900">
        <div className="text-2xl text-white drop-shadow-lg">
          Loading the floating islands... ✨
        </div>
      </div>
    );
  }

  return (
    <div className="size-full relative overflow-hidden bg-gradient-to-b from-black via-indigo-950 to-indigo-900">
      {/* Stars */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full animate-star-drift"
            style={{
              width: star.width + "px",
              height: star.height + "px",
              top: star.top + "%",
              opacity: star.opacity,
              animationDelay: star.animationDelay + "s",
            }}
          />
        ))}
      </div>

      {/* Floating Islands */}
      <div className="absolute inset-0 pointer-events-none">
        {islands.map((island) => (
          <div
            key={island.id}
            className="absolute animate-bounce"
            style={{
              left: island.x + "%",
              top: island.y + "%",
              animationDelay: island.delay + "s",
            }}
          >
            {/* Island shadow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-2 bg-black/20 rounded-full blur-md" />

            {/* Island body */}
            <div
              className={`relative bg-gradient-to-b ${island.color} rounded-full shadow-2xl`}
              style={{
                width: island.size + "px",
                height: Math.floor(island.size * 0.6) + "px",
                transform: `rotate(${island.rotation}deg)`,
              }}
            >
              {/* Grass texture */}
              <div className="absolute inset-0 rounded-full opacity-30">
                <div className="absolute top-2 left-4 w-3 h-3 bg-green-300 rounded-full" />
                <div className="absolute top-3 right-6 w-2 h-2 bg-green-300 rounded-full" />
                <div className="absolute top-4 left-1/2 w-2 h-2 bg-green-300 rounded-full" />
              </div>

              {/* Trees/vegetation */}
              <div className="absolute top-2 left-3 text-lg">🌲</div>
              <div className="absolute top-1 right-4 text-lg">🌲</div>
              {island.size > 100 && (
                <>
                  <div className="absolute top-2 left-1/2 text-lg">🌳</div>
                  <div className="absolute bottom-6 right-6 text-base">🍄</div>
                </>
              )}
            </div>
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
      <button
        onClick={() => setShowUploadModal(true)}
        className="fixed top-4 sm:top-6 left-4 sm:left-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 z-10 text-sm sm:text-base"
      >
        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="hidden sm:inline">Add Drawing</span>
        <span className="sm:hidden">Add</span>
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="fixed top-4 sm:top-6 right-4 sm:right-6 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 z-10 text-sm"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Log Out</span>
      </button>

      {/* Title */}
      <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 text-center z-10 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
          Art Island
        </h1>
        <p className="text-white/90 text-xs sm:text-sm md:text-base lg:text-lg mt-1 drop-shadow">
          Where Your Drawings Come to Life ✨
        </p>
      </div>

      {/* Empty State */}
      {characters.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-4">
          <p className="text-lg sm:text-xl md:text-2xl text-white/80 drop-shadow">
            Click "Add Drawing" to bring your art to the floating islands! 🎨
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
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onSubmit={handleAddCharacter}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
