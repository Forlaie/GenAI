import { motion, AnimatePresence } from "motion/react";

interface TutorialOverlayProps {
  step: "create-island" | "draw-maple" | "none";
  onDismiss: () => void;
}

export function TutorialOverlay({ step, onDismiss }: TutorialOverlayProps) {
  const messages: Record<string, { title: string; description: string }> = {
    "create-island": {
      title: "Welcome to Art Island! 🍁",
      description:
        "Your island modal is ready! Create 'Toronto' with a pink color. The name and color are already set for you.",
    },
    "draw-maple": {
      title: "Draw a Goose! 🦆",
      description:
        "Great! Now let's draw a character! Click 'Add Drawing' and draw a goose on the canvas. Be creative!",
    },
  };

  return (
    <AnimatePresence>
      {step !== "none" && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40 pointer-events-auto"
            onClick={onDismiss}
          />

          {/* Tutorial Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-2xl p-8 max-w-md"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {messages[step].title}
            </h2>
            <p className="text-gray-600 mb-6 text-lg">
              {messages[step].description}
            </p>
            <button
              onClick={onDismiss}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 rounded-lg transition-colors"
            >
              Got it!
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
