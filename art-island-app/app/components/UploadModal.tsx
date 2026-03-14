"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Camera, Upload, X } from "lucide-react";

interface IslandData {
  id: number;
  label: string;
}

interface UploadModalProps {
  onClose: () => void;
  onSubmit: (
    imageFile: File | null,
    name: string,
    age: number,
    islandId: number,
  ) => void;
  previewImageUrl?: string;
  islands: IslandData[];
}

export function UploadModal({
  onClose,
  onSubmit,
  previewImageUrl,
  islands,
}: UploadModalProps) {
  const [imageUrl, setImageUrl] = useState<string>(previewImageUrl || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [creationDate, setCreationDate] = useState("");
  const [selectedIslandId, setSelectedIslandId] = useState(islands[0]?.id || 1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const calculateArtAge = (dateString: string): number => {
    const createdDate = new Date(dateString);
    const today = new Date();
    const ageInMs = today.getTime() - createdDate.getTime();
    const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    return Math.max(0, ageInDays);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Allow submission if we have an image (either from file or preview) and required fields
    if ((imageFile || previewImageUrl) && name && creationDate) {
      const artAge = calculateArtAge(creationDate);
      onSubmit(imageFile, name, artAge, selectedIslandId);
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          {previewImageUrl ? "Name Your Character" : "Add Your Drawing!"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {previewImageUrl ? "Your Drawing" : "Upload Your Drawing"}
            </label>
            {previewImageUrl ? (
              // Show preview image when using a drawing
              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={previewImageUrl}
                  alt="Your Drawing"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              // Show file upload when not using a drawing
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-gray-400" />
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-gray-600">
                    Take Photo or Choose File
                  </span>
                </label>
              </div>
            )}
            {imageUrl && !previewImageUrl && (
              <div className="mt-4 w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Character's Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
              placeholder="Enter name..."
              required
            />
          </div>

          <div>
            <label
              htmlFor="creationDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Art Creation Date
            </label>
            <input
              type="date"
              id="creationDate"
              value={creationDate}
              onChange={(e) => setCreationDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label
              htmlFor="island"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Choose Island
            </label>
            <select
              id="island"
              value={selectedIslandId}
              onChange={(e) => setSelectedIslandId(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none bg-white"
            >
              {islands.map((island) => (
                <option key={island.id} value={island.id}>
                  {island.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
          >
            Add to Island!
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
