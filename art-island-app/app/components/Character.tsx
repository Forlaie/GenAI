"use client";

import { motion } from "motion/react";

interface CharacterProps {
  id: string;
  imageUrl: string;
  name: string;
  age: number;
  position: { x: number; y: number };
  onClick: () => void;
}

export function Character({
  imageUrl,
  name,
  position,
  onClick,
}: CharacterProps) {
  return (
    <motion.div
      className="absolute cursor-pointer pointer-events-auto"
      data-no-pan="true"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ scale: 0, y: -100 }}
      animate={{ scale: 1, y: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 bg-white rounded-lg shadow-lg overflow-hidden border-4 border-white">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="mt-2 bg-white/90 px-3 py-1 rounded-full shadow-md">
          <p className="text-sm font-medium text-gray-800">{name}</p>
        </div>
      </div>
    </motion.div>
  );
}
