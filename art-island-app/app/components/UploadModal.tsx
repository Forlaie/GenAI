"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Camera, Upload, X } from "lucide-react";
import { PersonalityData } from "@/types/character";

interface IslandData {
  id: number;
  label: string;
  skin?: string;
}

interface UploadModalProps {
  onClose: () => void;
  onSubmit: (
    imageFile: File | null,
    name: string,
    age: number,
    islandId: number,
    personality: PersonalityData,
    evolveMemoryText?: string,
  ) => void;
  previewImageUrl?: string;
  islands: IslandData[];
  isEvolution?: boolean;
  evolutionName?: string;
  evolutionIslandId?: number;
}

const TRAITS = [
  "Brave",
  "Silly",
  "Cozy",
  "Adventurous",
  "Sneaky",
  "Cheerful",
  "Grumpy",
  "Magical",
];

export function UploadModal({
  onClose,
  onSubmit,
  previewImageUrl,
  islands,
  isEvolution = false,
  evolutionName,
  evolutionIslandId,
}: UploadModalProps) {
  const [imageUrl, setImageUrl] = useState<string>(previewImageUrl || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [characterAge, setCharacterAge] = useState("1");
  const [selectedIslandId, setSelectedIslandId] = useState<number | null>(
    isEvolution ? (evolutionIslandId ?? null) : null,
  );
  const [showPersonality, setShowPersonality] = useState(false);
  const [evolveMemoryText, setEvolveMemoryText] = useState("");
  const [personality, setPersonality] = useState<PersonalityData>({
    catchphrase: "",
    traits: [],
    dailyActivity: "",
    favoriteThing: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEvolution && (imageFile || previewImageUrl)) {
      onSubmit(
        imageFile,
        evolutionName || name || "Evolved",
        Date.now(),
        evolutionIslandId ?? selectedIslandId ?? islands[0]?.id ?? 1,
        personality,
        evolveMemoryText,
      );
      return;
    }
    if ((imageFile || previewImageUrl) && name && characterAge && selectedIslandId !== null) {
      const parsedAge = Number.parseInt(characterAge, 10);
      const safeAge = Number.isFinite(parsedAge)
        ? Math.min(200, Math.max(0, parsedAge))
        : 1;
      onSubmit(
        imageFile,
        name,
        safeAge,
        selectedIslandId,
        personality,
      );
    }
  };

  const toggleTrait = (trait: string) => {
    setPersonality({
      ...personality,
      traits: personality.traits.includes(trait)
        ? personality.traits.filter((t) => t !== trait)
        : [...personality.traits, trait],
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          {isEvolution
            ? "Evolve Character"
            : previewImageUrl
              ? "Name Your Character"
              : "Add Your Drawing!"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {previewImageUrl ? "Your Drawing" : "Upload Your Drawing"}
            </label>
            {previewImageUrl ? (
              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={previewImageUrl}
                  alt="Your Drawing"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-gray-400" />
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-gray-600">
                    Take Photo or Choose File
                  </span>
                </label>
              </div>
            )}
            {imageUrl && !previewImageUrl && (
              <div className="mt-4 w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {!isEvolution && (
            <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Character's Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
              placeholder="Enter name..."
              required
            />
            </div>
          )}

          {!isEvolution && (
            <div>
            <label
              htmlFor="characterAge"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Character Age
            </label>
            <input
              type="number"
              id="characterAge"
              value={characterAge}
              onChange={(e) => setCharacterAge(e.target.value)}
              min={0}
              max={200}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
              required
            />
            </div>
          )}

          {!isEvolution && (
            <div>
            <label
              htmlFor="island"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Choose Island
            </label>
            <select
              id="island"
              value={selectedIslandId ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedIslandId(value ? parseInt(value, 10) : null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none bg-white"
              required
            >
              <option value="" disabled>
                Select an island
              </option>
              {islands.map((island) => (
                <option key={island.id} value={island.id}>
                  {island.label}
                </option>
              ))}
            </select>
            </div>
          )}

          {isEvolution && (
            <div>
              <label
                htmlFor="evolveMemory"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Add memory from this stage (optional)
              </label>
              <textarea
                id="evolveMemory"
                value={evolveMemoryText}
                onChange={(e) => setEvolveMemoryText(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                placeholder="What changed as they evolved?"
              />
            </div>
          )}

          {/* Personality Section */}
          <div>
            <button
              type="button"
              onClick={() => setShowPersonality(!showPersonality)}
              className="text-sm text-black hover:underline font-medium"
            >
              {showPersonality
                ? "Hide personality ▲"
                : "Give them a personality! (optional) ▼"}
            </button>

            {showPersonality && (
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  placeholder="Their catchphrase?"
                  value={personality.catchphrase}
                  onChange={(e) =>
                    setPersonality({
                      ...personality,
                      catchphrase: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm"
                />

                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Personality traits
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TRAITS.map((trait) => (
                      <button
                        key={trait}
                        type="button"
                        onClick={() => toggleTrait(trait)}
                        className={`px-3 py-1 rounded-full text-sm border transition-all ${
                          personality.traits.includes(trait)
                            ? "bg-gray-500 text-white border-gray-500"
                            : "bg-white text-gray-600 border-gray-300 hover:border-purple-400"
                        }`}
                      >
                        {trait}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="What do they do all day?"
                  value={personality.dailyActivity}
                  onChange={(e) =>
                    setPersonality({
                      ...personality,
                      dailyActivity: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm"
                />

                <input
                  type="text"
                  placeholder="Their favourite thing?"
                  value={personality.favoriteThing}
                  onChange={(e) =>
                    setPersonality({
                      ...personality,
                      favoriteThing: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={
                !(imageFile || previewImageUrl) ||
                (!isEvolution && (!name || selectedIslandId === null))
              }
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              {isEvolution ? "Continue to Rig" : "Add to Island!"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
