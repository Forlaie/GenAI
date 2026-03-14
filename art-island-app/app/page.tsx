'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { Character } from './components/Character';
import { CharacterDetail } from './components/CharacterDetail';
import { UploadModal } from './components/UploadModal';
import { DatabaseInfo } from './components/DatabaseInfo';
import { supabase, isSupabaseConfigured, type CharacterRow } from '@/lib/supabase';

interface CharacterData {
  id: string;
  imageUrl: string;
  name: string;
  age: number;
  position: { x: number; y: number };
}

export default function HomePage() {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterData | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load characters from Supabase or localStorage on mount
  useEffect(() => {
    if (isSupabaseConfigured) {
      loadCharactersFromSupabase();
    } else {
      loadCharactersFromLocalStorage();
    }
  }, []);

  const loadCharactersFromLocalStorage = () => {
    try {
      // Check if window is defined (Next.js SSR safety)
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('art-island-characters');
        if (stored) {
          setCharacters(JSON.parse(stored));
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCharactersToLocalStorage = (chars: CharacterData[]) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('art-island-characters', JSON.stringify(chars));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const loadCharactersFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const loadedCharacters: CharacterData[] = data.map((char: CharacterRow) => ({
          id: char.id,
          imageUrl: char.image_url,
          name: char.name,
          age: char.age,
          position: { x: char.position_x, y: char.position_y },
        }));
        setCharacters(loadedCharacters);
      }
    } catch (error) {
      console.error('Error loading characters from Supabase:', error);
      // Fall back to localStorage if Supabase fails
      loadCharactersFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const handleAddCharacter = async (imageFile: File, name: string, age: number) => {
    if (isSupabaseConfigured) {
      await handleAddCharacterSupabase(imageFile, name, age);
    } else {
      handleAddCharacterLocal(imageFile, name, age);
    }
  };

  const handleAddCharacterLocal = (imageFile: File, name: string, age: number) => {
    try {
      // Generate random position on the island platform
      const x = Math.random() * 70 + 10;
      const y = 15 + Math.random() * 10;

      // Create object URL for local preview
      const imageUrl = URL.createObjectURL(imageFile);

      const newCharacter: CharacterData = {
        id: Date.now().toString(),
        imageUrl,
        name,
        age,
        position: { x, y },
      };

      const updatedCharacters = [...characters, newCharacter];
      setCharacters(updatedCharacters);
      saveCharactersToLocalStorage(updatedCharacters);
    } catch (error) {
      console.error('Error adding character locally:', error);
      alert('Failed to add character. Please try again.');
    }
  };

  const handleAddCharacterSupabase = async (imageFile: File, name: string, age: number) => {
    try {
      // Generate random position on the island platform
      const x = Math.random() * 70 + 10; // 10-80% from left
      const y = 15 + Math.random() * 10; // Slight variation in vertical position

      // Upload image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('character-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from('character-images')
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      // Save character data to database
      const { data, error: dbError } = await supabase
        .from('characters')
        .insert([
          {
            name,
            age,
            image_url: imageUrl,
            position_x: x,
            position_y: y,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      // Add to local state
      const newCharacter: CharacterData = {
        id: data.id,
        imageUrl: data.image_url,
        name: data.name,
        age: data.age,
        position: { x: data.position_x, y: data.position_y },
      };

      setCharacters([...characters, newCharacter]);
    } catch (error) {
      console.error('Error adding character:', error);
      alert('Failed to add character. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-gradient-to-b from-sky-300 via-sky-200 to-green-200">
        <div className="text-2xl text-white drop-shadow-lg">Loading your island... 🏝️</div>
      </div>
    );
  }

  return (
    <div className="size-full relative overflow-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-green-200">
      {/* Sky and clouds */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-20 bg-white/70 rounded-full blur-sm" />
        <div className="absolute top-20 right-20 w-40 h-24 bg-white/60 rounded-full blur-sm" />
        <div className="absolute top-32 left-1/3 w-36 h-22 bg-white/50 rounded-full blur-sm" />
      </div>

      {/* Sun */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-yellow-300 rounded-full shadow-lg shadow-yellow-200" />

      {/* Island Platform */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3">
        {/* Island body */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-40 bg-gradient-to-b from-green-600 to-green-800 rounded-t-full shadow-2xl" />

        {/* Grass details */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-4/5 h-16 bg-green-500 rounded-t-full" />

        {/* Water/Shadow */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-blue-800/30" />
      </div>

      {/* Characters */}
      <div className="absolute inset-0">
        {characters.map((character) => (
          <Character
            key={character.id}
            {...character}
            onClick={() => setSelectedCharacter(character)}
          />
        ))}
      </div>

      {/* Add Character Button */}
      <button
        onClick={() => setShowUploadModal(true)}
        className="fixed top-6 left-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 z-10"
      >
        <Plus className="w-6 h-6" />
        Add Drawing
      </button>

      {/* Title */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 text-center z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
          My Art Island
        </h1>
        <p className="text-white/90 text-lg mt-1 drop-shadow">
          Click on characters to meet them!
        </p>
      </div>

      {/* Empty State */}
      {characters.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-2xl text-white/80 drop-shadow">
            Click "Add Drawing" to bring your art to life! 🎨
          </p>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {selectedCharacter && (
          <CharacterDetail
            {...selectedCharacter}
            onClose={() => setSelectedCharacter(null)}
          />
        )}
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onSubmit={handleAddCharacter}
          />
        )}
      </AnimatePresence>

      {/* Database Info */}
      <DatabaseInfo />
    </div>
  );
}
