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
    <div
      className="size-full relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        backgroundImage: "url('/image.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Subtle overlay to keep text readable */}
      <div className="absolute inset-0 bg-white/40" />

      {/* Stars background */}
      <div className="absolute inset-0 hidden">
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

      {/* Content */}
      <div className="relative z-10 text-center mb-12">
        <div
          className="px-48 py-20 flex flex-col items-center gap-3"
          style={{
            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 770 400" preserveAspectRatio="xMidYMid slice"><defs><filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/></filter></defs><path d="M 150 100 Q 100 80 80 120 Q 60 160 90 200 Q 70 220 100 240 Q 130 260 170 250 Q 200 240 210 280 Q 220 320 250 330 Q 280 335 300 310 Q 320 280 340 300 Q 360 320 380 310 Q 410 295 420 330 Q 430 350 460 340 Q 490 330 500 290 Q 510 250 530 260 Q 560 275 580 240 Q 600 200 620 220 Q 650 250 680 200 Q 700 160 680 120 Q 660 80 620 100 Q 580 110 560 80 Q 540 50 500 70 Q 470 85 450 60 Q 420 30 380 50 Q 350 70 330 40 Q 310 10 270 30 Q 240 45 220 20 Q 190 -10 150 100 Z" fill="white" stroke="black" stroke-width="8" filter="url(%23shadow)"/></svg>')`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            minHeight: "500px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h1 className="text-5xl md:text-7xl font-bold text-black drop-shadow-lg">
            Ding Dong Doodle
          </h1>
          <p className="text-black text-xl mt-0">Draw. Dream. Discover.</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-black text-white font-bold mt-2 px-10 py-4 text-xl rounded hover:-translate-y-1 transition-transform"
          >
            Explore
          </button>
        </div>
      </div>
    </div>
  );
}
