"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { Character } from "./components/Character";
import { CharacterDetail } from "./components/CharacterDetail";
import { UploadModal } from "./components/UploadModal";

interface CharacterData {
  id: string;
  imageUrl: string;
  name: string;
  age: number;
  position: { x: number; y: number };
}

export default function App() {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterData | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [towerColor, setTowerColor] = useState(0); // Hue value for rainbow effect

  // Cycle tower colors through rainbow spectrum
  useEffect(() => {
    const interval = setInterval(() => {
      setTowerColor((prev) => (prev + 36) % 360);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load characters from MongoDB on mount
  useEffect(() => {
    loadCharactersFromMongoDB();
  }, []);

  const loadCharactersFromMongoDB = async () => {
    try {
      const res = await fetch("/api/characters");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      // Map MongoDB response to CharacterData format
      const mappedCharacters: CharacterData[] = data.map((char: any) => ({
        id: char._id || char.id,
        imageUrl: char.image_url || char.imageUrl,
        name: char.name,
        age: char.age,
        position: {
          x: char.position_x || char.position?.x || 0,
          y: char.position_y || char.position?.y || 0,
        },
      }));

      setCharacters(mappedCharacters);
    } catch (error) {
      console.error("Error loading characters from MongoDB:", error);
      loadCharactersFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadCharactersFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem("art-island-characters");
      if (stored) {
        setCharacters(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveCharactersToLocalStorage = (chars: CharacterData[]) => {
    try {
      localStorage.setItem("art-island-characters", JSON.stringify(chars));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  const getValidCharacterPosition = (): { x: number; y: number } => {
    const minDistance = 8; // Minimum percent distance between characters
    const maxAttempts = 10;
    let attempt = 0;

    while (attempt < maxAttempts) {
      const x = Math.random() * 30 + 35; // 35-65% from left (center area of deck)
      const y = 30 + Math.random() * 2; // 30-32% (tight vertical positioning on deck)

      // Check if position is far enough from other characters
      const isFarEnough = characters.every((char) => {
        const distance = Math.sqrt(
          Math.pow(x - char.position.x, 2) + Math.pow(y - char.position.y, 2),
        );
        return distance >= minDistance;
      });

      if (isFarEnough) {
        return { x, y };
      }
      attempt++;
    }

    // Fallback if can't find non-overlapping position
    return {
      x: Math.random() * 30 + 35,
      y: 30 + Math.random() * 2,
    };
  };

  const handleAddCharacter = async (
    imageFile: File,
    name: string,
    age: number,
  ) => {
    await handleAddCharacterMongoDB(imageFile, name, age);
  };

  const handleAddCharacterLocal = (
    imageFile: File,
    name: string,
    age: number,
  ) => {
    try {
      // Generate valid position on the observation deck with no overlap
      const position = getValidCharacterPosition();

      // Create object URL for local preview
      const imageUrl = URL.createObjectURL(imageFile);

      const newCharacter: CharacterData = {
        id: Date.now().toString(),
        imageUrl,
        name,
        age,
        position,
      };

      const updatedCharacters = [...characters, newCharacter];
      setCharacters(updatedCharacters);
      saveCharactersToLocalStorage(updatedCharacters);
    } catch (error) {
      console.error("Error adding character locally:", error);
      alert("Failed to add character. Please try again.");
    }
  };

  const handleAddCharacterMongoDB = async (
    imageFile: File,
    name: string,
    age: number,
  ) => {
    try {
      // Generate valid position on the observation deck with no overlap
      const position = getValidCharacterPosition();

      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      // Save character data to MongoDB via API
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          age,
          image_url: base64,
          position_x: position.x,
          position_y: position.y,
        }),
      });

      if (!res.ok) throw new Error("Failed to save character");

      const newCharacter = await res.json();

      // Map MongoDB response to CharacterData format
      const mappedCharacter: CharacterData = {
        id: newCharacter._id || newCharacter.id,
        imageUrl: newCharacter.image_url || newCharacter.imageUrl,
        name: newCharacter.name,
        age: newCharacter.age,
        position: {
          x: newCharacter.position_x || 0,
          y: newCharacter.position_y || 0,
        },
      };

      setCharacters([...characters, mappedCharacter]);
    } catch (error) {
      console.error("Error adding character to MongoDB:", error);
      // Fall back to local storage
      handleAddCharacterLocal(imageFile, name, age);
    }
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-gradient-to-b from-black via-indigo-950 to-indigo-900">
        <div className="text-2xl text-white drop-shadow-lg">
          Loading the CN Tower... 🗼
        </div>
      </div>
    );
  }

  return (
    <div className="size-full relative overflow-hidden bg-gradient-to-b from-black via-indigo-950 to-indigo-900">
      {/* Night Sky with Stars */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-star-drift"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 70 + "%",
              opacity: Math.random() * 0.7 + 0.3,
              animationDelay: Math.random() * -120 + "s",
            }}
          />
        ))}
      </div>

      {/* CN Tower Structure */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
        {/* Tower Spire */}
        <div
          className="relative w-0 h-0"
          style={{
            borderLeft: "calc(80px * var(--tower-scale)) solid transparent",
            borderRight: "calc(80px * var(--tower-scale)) solid transparent",
            borderBottom: "calc(400px * var(--tower-scale)) solid #6b7280",
            filter: "drop-shadow(0 4px 20px rgba(0, 0, 0, 0.5))",
          }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 bg-gray-400"
            style={{
              width: "calc(4px * var(--tower-scale))",
              height: "calc(120px * var(--tower-scale))",
              bottom: "calc(400px * var(--tower-scale))",
              boxShadow: "0 0 10px rgba(107, 114, 128, 0.8)",
            }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-red-500 animate-pulse"
            style={{
              width: "calc(16px * var(--tower-scale))",
              height: "calc(16px * var(--tower-scale))",
              bottom: "calc(510px * var(--tower-scale))",
              transform: "translateX(-50%)",
              boxShadow: "0 0 20px rgba(239, 68, 68, 0.8)",
            }}
          />
        </div>

        {/* Observation Deck */}
        <div className="relative flex flex-col items-center">
          <div className="w-[400px] h-16 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-full shadow-lg" />

          <div className="relative w-[500px] h-40 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full shadow-2xl flex items-center justify-center">
            <div
              className="absolute rounded-full transition-all duration-1000 ease-in-out"
              style={{
                width: "calc(420px * var(--tower-scale))",
                height: "calc(128px * var(--tower-scale))",
                background: `linear-gradient(to bottom, 
                  hsla(${towerColor}, 80%, 60%, 0.6), 
                  hsla(${towerColor}, 80%, 50%, 0.8))`,
                boxShadow: `
                  inset 0 0 40px hsla(${towerColor}, 80%, 60%, 0.8),
                  0 0 60px hsla(${towerColor}, 80%, 60%, 0.5),
                  0 0 100px hsla(${towerColor}, 80%, 60%, 0.3)
                `,
              }}
            >
              <div className="absolute inset-4 bg-gray-700/40 rounded-full" />
            </div>

            <div className="absolute inset-0 rounded-full overflow-hidden">
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="absolute bg-gray-400/30"
                  style={{
                    width: "calc(2px * var(--tower-scale))",
                    height: "100%",
                    left: "50%",
                    transformOrigin: "center",
                    transform: `rotate(${i * 15}deg) translateX(calc(250px * var(--tower-scale)))`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="relative w-[600px] h-24 bg-gradient-to-b from-gray-600 to-gray-700 rounded-full shadow-xl flex items-center justify-center mt-[-10px]">
            <div className="absolute inset-0 rounded-full overflow-hidden opacity-30">
              {[...Array(40)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full h-[2px] bg-gray-800"
                  style={{
                    top: `${i * 2.5}%`,
                  }}
                />
              ))}
            </div>

            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: "3px solid #9ca3af",
              }}
            />

   
          </div>

            {/* base of the tower */}
          <div
            className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-full shadow-xl"
            style={{
              width: "calc(420px * var(--tower-scale))",
              height: "calc(64px * var(--tower-scale))",
            }}
          />
          <div
            className="bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl"
            style={{
              width: "calc(128px * var(--tower-scale))",
              height: "calc(96px * var(--tower-scale))",
            }}
          />
          <div
            className="bg-black/50 rounded-full blur-md"
            style={{
              width: "calc(160px * var(--tower-scale))",
              height: "calc(12px * var(--tower-scale))",
            }}
          />
        </div>
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

      {/* Add Character Button */}
      <button
        onClick={() => setShowUploadModal(true)}
        className="fixed top-4 sm:top-6 left-4 sm:left-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 z-10 text-sm sm:text-base"
      >
        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="hidden sm:inline">Add Drawing</span>
        <span className="sm:hidden">Add</span>
      </button>

      {/* Title */}
      <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 text-center z-10 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
          CN Tower Observation Deck
        </h1>
        <p className="text-white/90 text-xs sm:text-sm md:text-base lg:text-lg mt-1 drop-shadow">
          Toronto, Ontario 🇨🇦
        </p>
      </div>

      {/* Empty State */}
      {characters.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-4">
          <p className="text-lg sm:text-xl md:text-2xl text-white/80 drop-shadow">
            Click "Add Drawing" to bring your art to the CN Tower! 🎨
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
