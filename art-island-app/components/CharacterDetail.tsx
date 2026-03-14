'use client';

import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface CharacterDetailProps {
  imageUrl: string;
  name: string;
  age: number;
  onClose: () => void;
}

export function CharacterDetail({ imageUrl, name, age, onClose }: CharacterDetailProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-64 h-64 bg-gray-100 rounded-2xl shadow-lg overflow-hidden border-8 border-white flex-shrink-0">
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 relative">
            <motion.div
              className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-6 shadow-lg relative"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Speech bubble tail */}
              <div className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2 w-0 h-0 border-t-[15px] border-t-transparent border-r-[20px] border-r-purple-100 border-b-[15px] border-b-transparent" />

              <p className="text-2xl md:text-3xl font-bold text-gray-800 leading-relaxed">
                Hi! My name is <span className="text-purple-600">{name}</span> and I am{' '}
                <span className="text-pink-600">{age}</span> years old!
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
