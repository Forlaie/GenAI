"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

interface IslandSkin {
  id: string;
  imagePath: string;
  label: string;
}

const ISLAND_SKINS: IslandSkin[] = [
  { id: "dirt", imagePath: "/island.png", label: "Dirt" },
  { id: "sand", imagePath: "/sand_island.png", label: "Sand" },
  { id: "stone", imagePath: "/stone_island.png", label: "Stone" },
];

interface NewIslandModalProps {
  onClose: () => void;
  onSubmit: (name: string, skinId: string) => void;
  isTutorial?: boolean;
  defaultSkinIndex?: number;
}

export function NewIslandModal({
  onClose,
  onSubmit,
  isTutorial,
  defaultSkinIndex = 0,
}: NewIslandModalProps) {
  const [name, setName] = useState(isTutorial ? "Toronto" : "");
  const [selectedSkin, setSelectedSkin] = useState(
    ISLAND_SKINS[defaultSkinIndex % ISLAND_SKINS.length],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name, selectedSkin.id);
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-1">
          Create New Island
        </h2>
        {isTutorial && (
          <p className="mb-5 text-sm text-stone-500">
            Perfect! Let&apos;s create your first island.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="island-name"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-stone-400"
            >
              Island Name
            </label>
            <input
              type="text"
              id="island-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="Enter island name..."
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-400">
              Choose Skin
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {ISLAND_SKINS.map((skin) => (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => setSelectedSkin(skin)}
                  className={`rounded-xl border p-2 transition-colors ${
                    selectedSkin.id === skin.id
                      ? "border-stone-400 bg-stone-100"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                  title={skin.label}
                >
                  <img
                    src={skin.imagePath}
                    alt={skin.label}
                    className="h-12 w-12 rounded object-cover"
                  />
                  <div className="mt-1 text-xs font-medium text-stone-700">
                    {skin.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 rounded-full bg-stone-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
            >
              Create Island
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
