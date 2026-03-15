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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-6 h-6"
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

        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Add your character
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          How would you like to create it?
        </p>

        <div className="space-y-3">
          {/* Draw option */}
          <button
            onClick={onChooseDraw}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all w-full text-left"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors"
              style={{ background: "#EEEDFE" }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7F77DD"
                strokeWidth="1.8"
              >
                <path d="M3 21l3.75-3.75L19 5a2.121 2.121 0 00-3-3L3.75 14.25 3 21z" />
                <path d="M15 6l3 3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Draw it</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Use the drawing canvas to create your character
              </p>
            </div>
          </button>

          {/* Upload option */}
          <button
            onClick={onChooseUpload}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all w-full text-left"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#EAF3DE" }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#639922"
                strokeWidth="1.8"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                Upload a photo
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Upload a drawing or image from your device
              </p>
            </div>
          </button>
        </div>

        <div className="flex gap-3 pt-6">
          <button
            onClick={onChooseDraw}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Draw
          </button>
          <button
            onClick={onChooseUpload}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Upload
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
