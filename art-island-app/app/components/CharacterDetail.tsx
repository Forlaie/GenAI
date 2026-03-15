"use client";

import { motion } from "motion/react";
import { X } from "lucide-react";

interface CharacterDetailProps {
  imageUrl: string;
  name: string;
  age: number;
  onClose: () => void;
}

function getAgeDisplay(ageValue: number): string {
  // ageValue is now the creation timestamp (milliseconds since epoch)
  let ageInDays: number;

  if (ageValue < 100000000) {
    // Old format: age is in years (realistic ages are 0-150)
    ageInDays = ageValue * 365.25;
  } else {
    // New format: age is a timestamp, calculate dynamically from now
    const now = new Date().getTime();
    const ageInMs = now - ageValue;
    ageInDays = Math.floor(ageInMs / (1000 * 86400));
  }

  const roundedDays = Math.floor(ageInDays);

  // Sanity check: if age is > 100,000 years, it's corrupted data
  if (roundedDays > 36500000) {
    return "I was created today";
  }

  if (roundedDays === 0) {
    return "I was created today";
  }

  const years = Math.floor(ageInDays / 365.25);

  if (years > 0) {
    return `${years} year${years > 1 ? "s" : ""} old`;
  }

  const months = Math.floor(ageInDays / 30.44);
  if (months > 0) {
    return `${months} month${months > 1 ? "s" : ""} old`;
  }

  return `${roundedDays} day${roundedDays !== 1 ? "s" : ""} old`;
}

export function CharacterDetail({
  imageUrl,
  name,
  age,
  onClose,
}: CharacterDetailProps) {
  const ageDisplay = getAgeDisplay(age);
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4"
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

        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-64 h-64 bg-gray-100 rounded-2xl shadow-lg overflow-hidden border-8 border-white flex-shrink-0">
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 relative">
            <motion.div
              className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-6 shadow-lg relative"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2 w-0 h-0 border-t-[15px] border-t-transparent border-r-[20px] border-r-purple-100 border-b-[15px] border-b-transparent" />

              <p className="text-2xl md:text-3xl font-bold text-gray-800 leading-relaxed">
                Hi! My name is <span className="text-purple-600">{name}</span>{" "}
                {ageDisplay.startsWith("I was") ? (
                  <>
                    and <span className="text-pink-600">{ageDisplay}</span>!
                  </>
                ) : (
                  <>
                    and I am <span className="text-pink-600">{ageDisplay}</span>
                    !
                  </>
                )}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
