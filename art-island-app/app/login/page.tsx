"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STARS = [
  { id: 0, width: 2, height: 2, top: 5, left: 10, opacity: 0.8 },
  { id: 1, width: 1, height: 1, top: 12, left: 25, opacity: 0.6 },
  { id: 2, width: 3, height: 3, top: 8, left: 40, opacity: 0.9 },
  { id: 3, width: 1, height: 1, top: 20, left: 55, opacity: 0.5 },
  { id: 4, width: 2, height: 2, top: 6, left: 70, opacity: 0.7 },
  { id: 5, width: 1, height: 1, top: 15, left: 85, opacity: 0.8 },
  { id: 6, width: 2, height: 2, top: 30, left: 5, opacity: 0.6 },
  { id: 7, width: 3, height: 3, top: 25, left: 20, opacity: 0.9 },
  { id: 8, width: 1, height: 1, top: 35, left: 35, opacity: 0.5 },
  { id: 9, width: 2, height: 2, top: 22, left: 50, opacity: 0.7 },
  { id: 10, width: 1, height: 1, top: 40, left: 65, opacity: 0.6 },
  { id: 11, width: 2, height: 2, top: 18, left: 80, opacity: 0.8 },
  { id: 12, width: 3, height: 3, top: 45, left: 12, opacity: 0.7 },
  { id: 13, width: 1, height: 1, top: 50, left: 30, opacity: 0.5 },
  { id: 14, width: 2, height: 2, top: 38, left: 45, opacity: 0.9 },
  { id: 15, width: 1, height: 1, top: 55, left: 60, opacity: 0.6 },
  { id: 16, width: 2, height: 2, top: 42, left: 75, opacity: 0.8 },
  { id: 17, width: 3, height: 3, top: 10, left: 92, opacity: 0.7 },
  { id: 18, width: 1, height: 1, top: 60, left: 8, opacity: 0.5 },
  { id: 19, width: 2, height: 2, top: 28, left: 90, opacity: 0.9 },
  { id: 20, width: 1, height: 1, top: 3, left: 33, opacity: 0.6 },
  { id: 21, width: 2, height: 2, top: 48, left: 88, opacity: 0.7 },
  { id: 22, width: 3, height: 3, top: 32, left: 58, opacity: 0.8 },
  { id: 23, width: 1, height: 1, top: 58, left: 42, opacity: 0.5 },
  { id: 24, width: 2, height: 2, top: 14, left: 15, opacity: 0.9 },
  { id: 25, width: 1, height: 1, top: 62, left: 22, opacity: 0.6 },
  { id: 26, width: 2, height: 2, top: 4, left: 62, opacity: 0.7 },
  { id: 27, width: 3, height: 3, top: 52, left: 78, opacity: 0.8 },
  { id: 28, width: 1, height: 1, top: 16, left: 48, opacity: 0.5 },
  { id: 29, width: 2, height: 2, top: 36, left: 95, opacity: 0.9 },
];

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="size-full flex items-center justify-center bg-gradient-to-b from-black via-indigo-950 to-indigo-900">
      <div className="absolute inset-0">
        {STARS.map((star) => (
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

      <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <h2 className="text-3xl font-bold text-white text-center mb-2">
          {isSignup ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-white/60 text-center mb-8 text-sm">
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
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-purple-400 transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-purple-400 transition-colors"
            required
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {loading ? "Loading..." : isSignup ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p className="text-white/50 text-center mt-6 text-sm">
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
            className="text-purple-400 hover:text-purple-300 ml-1 font-medium"
          >
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
