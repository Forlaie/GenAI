"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
    <div className="size-full flex items-center justify-center bg-white">
      {/* Back button - top left */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1 px-3 py-2 rounded-lg hover:-translate-y-0.5 transition-all"
      >
        ← Back
      </button>

      <div className="relative z-10 bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm shadow-lg">
        <h2 className="text-3xl font-bold text-black text-center mb-2">
          {isSignup ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-gray-600 text-center mb-8 text-sm">
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
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-black placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-black placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-colors"
            required
          />

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {loading ? "Loading..." : isSignup ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p className="text-gray-600 text-center mt-6 text-sm">
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
              setUsername("");
              setPassword("");
            }}
            className="text-purple-600 hover:text-purple-700 ml-1 font-medium"
          >
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>

      {/* Duck at the bottom of the screen */}
      <div className="absolute bottom-0 flex items-end justify-center gap-4 w-full">
        <Image
          src="/duck.png"
          alt="Duck"
          width={120}
          height={120}
          className="object-contain"
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
          src="/orca.png"
          alt="Orca"
          width={120}
          height={120}
          className="object-contain"
        />
        <Image
          src="/cow.png"
          alt="Cow"
          width={200}
          height={200}
          className="object-contain translate-y-7"
        />
        <Image
          src="/octopus.png"
          alt="Octopus"
          width={120}
          height={120}
          className="object-contain"
        />
      </div>
    </div>
  );
}
