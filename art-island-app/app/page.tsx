"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Star {
  id: number;
  width: number;
  height: number;
  top: number;
  left: number;
  opacity: number;
}

interface Island {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  delay: number;
}

export default function LandingPage() {
  const router = useRouter();
  const [stars, setStars] = useState<Star[]>([]);
  const [islands, setIslands] = useState<Island[]>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 100 }, (_, i) => ({
        id: i,
        width: Math.random() * 3 + 1,
        height: Math.random() * 3 + 1,
        top: Math.random() * 100,
        left: Math.random() * 100,
        opacity: Math.random() * 0.7 + 0.3,
      })),
    );

    setIslands([
      {
        id: 1,
        x: 15,
        y: 40,
        size: 120,
        color: "from-green-600 to-green-700",
        rotation: 0,
        delay: 0,
      },
      {
        id: 2,
        x: 50,
        y: 50,
        size: 150,
        color: "from-emerald-500 to-emerald-700",
        rotation: 15,
        delay: 1,
      },
      {
        id: 3,
        x: 80,
        y: 35,
        size: 100,
        color: "from-teal-600 to-teal-700",
        rotation: -10,
        delay: 2,
      },
      {
        id: 4,
        x: 28,
        y: 65,
        size: 90,
        color: "from-green-700 to-green-800",
        rotation: 5,
        delay: 3,
      },
      {
        id: 5,
        x: 65,
        y: 70,
        size: 110,
        color: "from-emerald-600 to-emerald-800",
        rotation: -20,
        delay: 4,
      },
    ]);
  }, []);

  return (
    <div className="size-full relative overflow-hidden bg-gradient-to-b from-black via-indigo-950 to-indigo-900 flex flex-col items-center justify-center">
      {/* Stars background */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full"
            style={{
              width: star.width + "px",
              height: star.height + "px",
              top: star.top + "%",
              left: star.left + "%",
              opacity: star.opacity,
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
              className={`relative w-${island.size} h-${Math.floor(island.size * 0.6)} bg-gradient-to-b ${island.color} rounded-full shadow-2xl`}
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

      {/* Content */}
      <div className="relative z-10 text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg">
          Art Island
        </h1>
        <p className="text-white/70 text-xl mt-3">
          Where Your Drawings Come to Life ✨
        </p>
      </div>

      <button
        onClick={() => router.push("/login")}
        className="relative z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-10 py-4 rounded-full text-xl shadow-lg hover:shadow-pink-500/40 hover:scale-105 transition-all"
      >
        Visit the Islands 🏝️
      </button>
    </div>
  );
}
