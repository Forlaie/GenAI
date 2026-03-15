"use client";

import { motion } from "motion/react";

interface ChooseInputModalProps {
  onChooseDraw: () => void;
  onChooseUpload: () => void;
  onClose: () => void;
}

export function ChooseInputModal({
  onChooseDraw,
  onChooseUpload,
  onClose,
}: ChooseInputModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="mb-1 font-serif text-2xl font-bold text-stone-900">
          Add your character
        </h2>
        <p className="mb-5 text-sm text-stone-500">
          How would you like to create it?
        </p>

        <div className="space-y-2.5">
          {/* Draw option */}
          <button
            onClick={onChooseDraw}
            className="flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-white p-3.5 text-left transition hover:border-stone-400 hover:bg-stone-100"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#57534e"
                strokeWidth="1.8"
              >
                <path d="M3 21l3.75-3.75L19 5a2.121 2.121 0 00-3-3L3.75 14.25 3 21z" />
                <path d="M15 6l3 3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">Draw it</p>
              <p className="mt-0.5 text-xs text-stone-500">
                Use the drawing canvas to create your character
              </p>
            </div>
          </button>

          {/* Upload option */}
          <button
            onClick={onChooseUpload}
            className="flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-white p-3.5 text-left transition hover:border-stone-400 hover:bg-stone-100"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#57534e"
                strokeWidth="1.8"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">
                Upload a photo
              </p>
              <p className="mt-0.5 text-xs text-stone-500">
                Upload a drawing or image from your device
              </p>
            </div>
          </button>
        </div>

        <div className="flex gap-2 pt-5">
          <button
            onClick={onChooseDraw}
            className="flex-1 rounded-full bg-stone-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Draw
          </button>
          <button
            onClick={onChooseUpload}
            className="flex-1 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            Upload
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
