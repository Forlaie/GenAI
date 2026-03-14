"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

interface IslandColor {
  label: string;
  color: string;
  border: string;
}

const ISLAND_COLORS: IslandColor[] = [
  { label: "Purple", color: "#EEEDFE", border: "#AFA9EC" },
  { label: "Green", color: "#E1F5EE", border: "#5DCAA5" },
  { label: "Orange", color: "#FAEEDA", border: "#EF9F27" },
  { label: "Pink", color: "#FCE4EC", border: "#EC407A" },
  { label: "Blue", color: "#E3F2FD", border: "#1976D2" },
  { label: "Yellow", color: "#FFFDE7", border: "#F57F17" },
];

interface NewIslandModalProps {
  onClose: () => void;
  onSubmit: (name: string, color: string, border: string) => void;
  isTutorial?: boolean;
}

export function NewIslandModal({
  onClose,
  onSubmit,
  isTutorial,
}: NewIslandModalProps) {
  const [name, setName] = useState(isTutorial ? "Toronto" : "");
  const [selectedColor, setSelectedColor] = useState(
    isTutorial ? ISLAND_COLORS[3] : ISLAND_COLORS[0],
  ); // Pink for tutorial

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name, selectedColor.color, selectedColor.border);
      onClose();
    }
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
        className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Create New Island
        </h2>
        {isTutorial && (
          <p className="text-sm text-gray-600 mb-6">
            🍁 Perfect! Let's create your first island - Toronto!
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="island-name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Island Name
            </label>
            <input
              type="text"
              id="island-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none"
              placeholder="Enter island name..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Color
            </label>
            <div className="grid grid-cols-3 gap-3">
              {ISLAND_COLORS.map((colorOption) => (
                <button
                  key={colorOption.label}
                  type="button"
                  onClick={() => setSelectedColor(colorOption)}
                  className={`relative w-14 h-14 rounded-lg transition-all ${
                    selectedColor.label === colorOption.label
                      ? "ring-4 ring-offset-2 ring-gray-400 scale-105"
                      : "hover:scale-110"
                  }`}
                  style={{
                    backgroundColor: colorOption.color,
                    border: `2px solid ${colorOption.border}`,
                  }}
                  title={colorOption.label}
                >
                  {selectedColor.label === colorOption.label && (
                    <div className="absolute inset-0 rounded-lg border-2 border-gray-800" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Create Island
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
