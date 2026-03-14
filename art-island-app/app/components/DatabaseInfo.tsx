'use client';

import { Database, Image, Info, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { isSupabaseConfigured } from '@/lib/supabase';

export function DatabaseInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all z-10"
        title="View Database Info"
      >
        <Info className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-6">📊 Where is Your Data Stored?</h2>

              {!isSupabaseConfigured && (
                <div className="mb-6 border-2 border-yellow-300 rounded-lg p-6 bg-yellow-50">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                    <h3 className="text-xl font-bold text-gray-800">⚠️ Supabase Not Connected</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Your Supabase environment variables are not configured. Currently, your data is being saved to <strong>local browser storage</strong>.
                  </p>
                  <p className="text-gray-700">
                    To persist data across devices and sessions, you need to set up Supabase environment variables in your <code className="bg-white px-2 py-1 rounded">.env.local</code> file.
                  </p>
                </div>
              )}

              {isSupabaseConfigured && (
                <div className="mb-4 border-2 border-green-300 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 text-green-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">✅ Supabase Connected!</span>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-8 h-8 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-800">Database Table: "characters"</h3>
                  </div>
                  <p className="text-gray-700 mb-4">
                    All character information is stored in a table called <code className="bg-white px-2 py-1 rounded font-mono text-sm">characters</code>
                  </p>
                  <div className="bg-white rounded-lg p-4 font-mono text-sm">
                    <div className="text-gray-600">Table Structure:</div>
                    <ul className="mt-2 space-y-1 text-gray-800">
                      <li>• <span className="text-blue-600">id</span> - Unique identifier</li>
                      <li>• <span className="text-blue-600">name</span> - Character's name</li>
                      <li>• <span className="text-blue-600">age</span> - Character's age</li>
                      <li>• <span className="text-blue-600">image_url</span> - Link to the drawing image</li>
                      <li>• <span className="text-blue-600">position_x</span> - Horizontal position on island</li>
                      <li>• <span className="text-blue-600">position_y</span> - Vertical position on island</li>
                      <li>• <span className="text-blue-600">created_at</span> - When it was added</li>
                    </ul>
                  </div>
                </div>

                <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                  <div className="flex items-center gap-3 mb-4">
                    <Image className="w-8 h-8 text-green-600" />
                    <h3 className="text-xl font-bold text-gray-800">Storage Bucket: "character-images"</h3>
                  </div>
                  <p className="text-gray-700 mb-4">
                    All uploaded drawings are stored in a storage bucket called <code className="bg-white px-2 py-1 rounded font-mono text-sm">character-images</code>
                  </p>
                  <div className="bg-white rounded-lg p-4 font-mono text-sm text-gray-800">
                    Each image is saved with a unique filename like:<br />
                    <span className="text-green-600">1710417000000_abc123.jpg</span>
                  </div>
                </div>

                <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">🔍 How to View in Supabase Dashboard:</h3>
                  <ol className="space-y-3 text-gray-700">
                    <li className="flex gap-2">
                      <span className="font-bold text-purple-600">1.</span>
                      <span>Go to your Supabase project dashboard</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-purple-600">2.</span>
                      <span>Click <strong>"Table Editor"</strong> in the left sidebar to view the <code className="bg-white px-2 py-1 rounded text-sm">characters</code> table</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-purple-600">3.</span>
                      <span>Click <strong>"Storage"</strong> in the left sidebar, then select the <code className="bg-white px-2 py-1 rounded text-sm">character-images</code> bucket to see all uploaded drawings</span>
                    </li>
                  </ol>
                </div>

                <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">⚙️ First Time Setup Required:</h3>
                  <p className="text-gray-700 mb-4">
                    If you haven't set these up yet, you need to create them in your Supabase dashboard:
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Create the Table:</h4>
                      <div className="bg-white rounded-lg p-3 font-mono text-xs overflow-x-auto">
                        <pre>{`CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  position_x NUMERIC NOT NULL,
  position_y NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);`}</pre>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Create the Storage Bucket:</h4>
                      <ul className="text-gray-700 space-y-1 text-sm">
                        <li>• Go to Storage → Create new bucket</li>
                        <li>• Name it: <code className="bg-white px-2 py-1 rounded">character-images</code></li>
                        <li>• Make it <strong>Public</strong> so images can be displayed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="mt-6 w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
