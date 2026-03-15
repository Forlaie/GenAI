"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/app/components/Navbar";
import JointEditor from "@/app/components/JointEditor";

interface Character {
  id: string;
  imageUrl: string;
  name: string;
  age: number;
}

export default function RigPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selected, setSelected] = useState<Character | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const bgColor = darkMode ? "#0f2336" : "#ffffff";
  const textMain = darkMode ? "#f0f6ff" : "#1a1a1a";
  const textMuted = darkMode ? "#7ea8c4" : "#888780";
  const borderColor = darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const hoverBg = darkMode ? "rgba(255,255,255,0.05)" : "#f3f4f6";

  useEffect(() => {
    fetch("/api/characters")
      .then((r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setCharacters(data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Hydration-safe dark mode initialization
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved) {
      setDarkMode(JSON.parse(saved));
    }
  }, []);

  // Sync with localStorage when darkMode changes
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  async function handleConfirm(
    joints: Record<string, { x: number; y: number }>,
  ) {
    await fetch("/api/rig", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId: selected!.id, joints }),
    });
    setSaved(true);
  }

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <p style={{ color: textMuted }}>Loading characters...</p>
      </div>
    );

  if (saved)
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: bgColor }}
      >
        <p className="text-xl" style={{ color: textMain }}>
          Joints saved for <span className="font-medium">{selected?.name}</span>
          !
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSaved(false);
              setSelected(null);
            }}
            className="px-5 py-2 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition-colors"
          >
            Rig another
          </button>
          <Link
            href="/island"
            className="px-5 py-2 rounded-full text-sm transition-colors"
            style={{
              backgroundColor: hoverBg,
              color: textMuted,
            }}
          >
            Back to island
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <Navbar
        title={selected ? `Rigging: ${selected.name}` : "Rig a character"}
        subtitle={
          selected
            ? "Place joints on the character, then save."
            : "Select a character to place joints on."
        }
        onDarkModeChange={setDarkMode}
        showBackButton={true}
      />

      {!selected ? (
        <div className="p-6 pt-20">
          {characters.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg" style={{ color: textMuted }}>
                No characters yet.
              </p>
              <Link
                href="/island"
                className="text-sm hover:underline mt-2 inline-block"
                style={{ color: "#60a5fa" }}
              >
                Go add one first
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => setSelected(char)}
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-left"
                  style={{
                    borderColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(96, 165, 250, 0.5)";
                    e.currentTarget.style.backgroundColor = darkMode
                      ? "rgba(59, 130, 246, 0.1)"
                      : "#eff6ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div
                    className="w-full aspect-square rounded-lg overflow-hidden border"
                    style={{
                      backgroundColor: hoverBg,
                      borderColor,
                    }}
                  >
                    <img
                      src={char.imageUrl}
                      alt={char.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="w-full">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: textMain }}
                    >
                      {char.name}
                    </p>
                    <p className="text-xs" style={{ color: textMuted }}>
                      Age {char.age}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-6">
          <JointEditor
            imageUrl={selected.imageUrl}
            onConfirm={handleConfirm}
            onBack={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  );
}
