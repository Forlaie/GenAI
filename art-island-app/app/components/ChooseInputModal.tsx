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
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-sm mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-medium text-gray-800 mb-1">Add your character</h2>
        <p className="text-sm text-gray-400 mb-5">How would you like to create it?</p>

        <div className="flex flex-col gap-3">
          {/* Draw option */}
          <button
            onClick={onChooseDraw}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group text-left"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
              style={{ background: "#EEEDFE" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="1.8">
                <path d="M3 21l3.75-3.75L19 5a2.121 2.121 0 00-3-3L3.75 14.25 3 21z" />
                <path d="M15 6l3 3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Draw it</p>
              <p className="text-xs text-gray-400 mt-0.5">Use the drawing canvas to create your character</p>
            </div>
          </button>

          {/* Upload option */}
          <button
            onClick={onChooseUpload}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group text-left"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#EAF3DE" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#639922" strokeWidth="1.8">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Upload a photo</p>
              <p className="text-xs text-gray-400 mt-0.5">Upload a drawing or image from your device</p>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}
