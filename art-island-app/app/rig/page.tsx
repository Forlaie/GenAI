"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading characters...</p>
      </div>
    );

  if (saved)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-gray-700">
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
            className="px-5 py-2 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
          >
            Back to island
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="relative border-b px-6 py-4 flex items-center justify-center">
        <Link
          href="/island"
          className="absolute top-4 left-4 bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1 px-3 py-2 rounded hover:-translate-y-0.5 transition-all"
        >
          ← Back
        </Link>
        <div className="text-center">
          <h1 className="text-lg font-medium text-gray-800">
            {selected ? `Rigging: ${selected.name}` : "Rig a character"}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {selected
              ? "Place joints on the character, then save."
              : "Select a character to place joints on."}
          </p>
        </div>
      </div>

      {!selected ? (
        <div className="p-6">
          {characters.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-300 text-lg">No characters yet.</p>
              <Link
                href="/island"
                className="text-sm text-blue-400 hover:underline mt-2 inline-block"
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
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-50 border">
                    <img
                      src={char.imageUrl}
                      alt={char.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="w-full">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {char.name}
                    </p>
                    <p className="text-xs text-gray-400">Age {char.age}</p>
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
