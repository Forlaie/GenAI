"use client";

interface IslandData {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  border: string;
  label: string;
}

interface CharacterData {
  id: string;
  position: { x: number; y: number };
  islandId?: number;
}

interface MinimapProps {
  islands: IslandData[];
  characters: CharacterData[];
  panX: number;
  panY: number;
}

const ISLAND_SIZE = 620;

export function Minimap({ islands, characters, panX, panY }: MinimapProps) {
  const minimapWidth = 200;
  const minimapHeight = 120;

  // Calculate actual pixel positions for all islands using the grid layout
  const getIslandPixelPosition = (index: number, total: number) => {
    const columns = Math.max(1, Math.ceil(Math.sqrt(total)));
    const rows = Math.ceil(total / columns);
    const column = index % columns;
    const row = Math.floor(index / columns);
    const horizontalSpacing = ISLAND_SIZE + 180; // 800px
    const verticalSpacing = ISLAND_SIZE + 220; // 840px
    const offsetX = (column - (columns - 1) / 2) * horizontalSpacing;
    const offsetY = (row - (rows - 1) / 2) * verticalSpacing;
    return { x: offsetX, y: offsetY };
  };

  // Get all island positions in world space
  const islandPixelPositions = islands.map((island, index) =>
    getIslandPixelPosition(index, islands.length),
  );

  // Calculate world bounds (expand by island radius to account for island size)
  const islandRadius = ISLAND_SIZE / 2;
  const allX = islandPixelPositions.map((p) => p.x);
  const allY = islandPixelPositions.map((p) => p.y);

  const minX = Math.min(...allX, -window.innerWidth / 2) - islandRadius;
  const maxX = Math.max(...allX, window.innerWidth / 2) + islandRadius;
  const minY = Math.min(...allY, -window.innerHeight / 2) - islandRadius;
  const maxY = Math.max(...allY, window.innerHeight / 2) + islandRadius;

  const worldWidth = maxX - minX || window.innerWidth;
  const worldHeight = maxY - minY || window.innerHeight;

  const scaleX = minimapWidth / worldWidth;
  const scaleY = minimapHeight / worldHeight;

  // Convert world position to minimap coordinates
  const worldToMinimap = (worldX: number, worldY: number) => ({
    x: (worldX - minX) * scaleX,
    y: (worldY - minY) * scaleY,
  });

  return (
    <div className="fixed bottom-4 right-4 z-30 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
      <div
        className="relative overflow-hidden border border-gray-300 bg-gray-50"
        style={{ width: minimapWidth, height: minimapHeight }}
      >
        {/* Islands */}
        {islands.map((island, index) => {
          const pixelPos = islandPixelPositions[index];
          const minimapPos = worldToMinimap(pixelPos.x, pixelPos.y);
          const displaySize = (island.size / worldWidth) * minimapWidth * 0.3;

          return (
            <div
              key={island.id}
              className="absolute rounded-full"
              style={{
                left: minimapPos.x - displaySize / 2,
                top: minimapPos.y - displaySize / 2,
                width: displaySize,
                height: displaySize,
                backgroundColor: island.color,
                border: `1.5px solid ${island.border}`,
                opacity: 0.8,
              }}
              title={island.label}
            />
          );
        })}

        {/* Characters */}
        {characters.map((character) => {
          // Characters are positioned relative to islands
          // For simplicity, show them near their island positions
          const island = islands.find((i) => i.id === character.islandId);
          if (!island) return null;

          const islandIndex = islands.indexOf(island);
          const islandPixelPos = islandPixelPositions[islandIndex];

          // Characters are offset from island center
          const charWorldX = islandPixelPos.x + character.position.x - 50;
          const charWorldY = islandPixelPos.y + character.position.y - 50;

          const charMinimapPos = worldToMinimap(charWorldX, charWorldY);

          return (
            <div
              key={character.id}
              className="absolute rounded-full"
              style={{
                left: charMinimapPos.x - 3,
                top: charMinimapPos.y - 3,
                width: 6,
                height: 6,
                backgroundColor: "#7F77DD",
                border: "1px solid #6366f1",
              }}
              title={character.name}
            />
          );
        })}

        {/* Viewport indicator - shows current view */}
        <div
          className="absolute rounded-full"
          style={{
            left: (-panX - minX) * scaleX - 4,
            top: (-panY - minY) * scaleY - 4,
            width: 8,
            height: 8,
            backgroundColor: "#A855F7",
            border: "1px solid #7C3AED",
            pointerEvents: "none",
            opacity: 0.8,
          }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">Minimap</p>
    </div>
  );
}
