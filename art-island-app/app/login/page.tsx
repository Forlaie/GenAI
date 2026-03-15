"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Moon, Sun } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Hydration-safe dark mode initialization
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved) {
      setDarkMode(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          action: isSignup ? "signup" : "login",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        router.push("/island");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="size-full flex items-center justify-center"
      style={{
        backgroundColor: darkMode ? "#0f2336" : "#ffffff",
      }}
    >
      {/* Top right theme toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-4 right-4 p-2 rounded-full transition-colors"
        style={{
          backgroundColor: darkMode
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.05)",
          color: darkMode ? "#f0f6ff" : "#1a1a1a",
        }}
        title="Toggle dark mode"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Back button - top left */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 text-sm flex items-center gap-1 px-3 py-2 rounded transition-all hover:-translate-y-0.5"
        style={{
          backgroundColor: darkMode
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.05)",
          color: darkMode ? "#7ea8c4" : "#888780",
          border: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        ← Back
      </button>

      <div
        className="relative z-10 rounded p-8 w-full max-w-sm shadow-lg border"
        style={{
          backgroundColor: darkMode ? "#1e3a52" : "#ffffff",
          borderColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        }}
      >
        <h2
          className="text-3xl font-bold text-center mb-2"
          style={{ color: darkMode ? "#f0f6ff" : "#000000" }}
        >
          {isSignup ? "Create Account" : "Welcome Back"}
        </h2>
        <p
          className="text-center mb-8 text-sm"
          style={{ color: darkMode ? "#7ea8c4" : "#888780" }}
        >
          {isSignup
            ? "Sign up to visit the floating islands"
            : "Log in to see your characters"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "#f3f4f6",
              borderColor: darkMode ? "rgba(255,255,255,0.1)" : "#d1d5db",
              color: darkMode ? "#f0f6ff" : "#000000",
            }}
            className="w-full px-4 py-3 rounded border placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
            onFocus={(e) => {
              if (darkMode) {
                e.currentTarget.style.borderColor = "rgba(96, 165, 250, 0.5)";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = darkMode
                ? "rgba(255,255,255,0.1)"
                : "#d1d5db";
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "#f3f4f6",
              borderColor: darkMode ? "rgba(255,255,255,0.1)" : "#d1d5db",
              color: darkMode ? "#f0f6ff" : "#000000",
            }}
            className="w-full px-4 py-3 rounded border placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
            onFocus={(e) => {
              if (darkMode) {
                e.currentTarget.style.borderColor = "rgba(96, 165, 250, 0.5)";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = darkMode
                ? "rgba(255,255,255,0.1)"
                : "#d1d5db";
            }}
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold py-3 rounded transition-all disabled:opacity-50"
            style={{
              backgroundColor: darkMode ? "#2a4d6b" : "#000000",
            }}
          >
            {loading ? "Loading..." : isSignup ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p
          className="text-center mt-6 text-sm"
          style={{ color: darkMode ? "#7ea8c4" : "#888780" }}
        >
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
              setUsername("");
              setPassword("");
            }}
            className="hover:underline ml-1 font-medium transition-colors"
            style={{ color: darkMode ? "#60a5fa" : "#000000" }}
          >
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>

      {/* Duck at the bottom of the screen */}
      <div className="absolute bottom-0 flex items-end justify-center gap-8 w-full">
        <Image
          src="/duck.png"
          alt="Duck"
          width={120}
          height={120}
          className="object-contain"
        />
        <Image
          src="/cow.png"
          alt="Cow"
          width={150}
          height={150}
          className="object-contain -translate-y-3"
        />
        <Image
          src="/shark.png"
          alt="Shark"
          width={120}
          height={120}
          className="object-contain"
        />
        <Image
          src="/cat.png"
          alt="Cat"
          width={120}
          height={120}
          className="object-contain"
        />
        <Image
          src="/octopus.png"
          alt="Octopus"
          width={120}
          height={120}
          className="object-contain"
        />
        <Image
          src="/dino.png"
          alt="Dino"
          width={120}
          height={120}
          className="object-contain"
        />
        <Image
          src="/orca.png"
          alt="Orca"
          width={120}
          height={120}
          className="object-contain"
        />
        <Image
          src="/elephant.png"
          alt="Elephant"
          width={120}
          height={120}
          className="object-contain"
        />
        <Image
          src="/otter.png"
          alt="Otter"
          width={120}
          height={120}
          className="object-contain"
        />
      </div>
    </div>
  );
}
