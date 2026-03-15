"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";

interface IslandData {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  border: string;
  label: string;
  skin?: string;
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
  zoom: number;
}

const ISLAND_SIZE = 620;
const WORLD_COORD_SCALE = 160;

const ISLAND_SKINS = [
  { id: "dirt", imagePath: "/island.png" },
  { id: "sand", imagePath: "/sand_island.png" },
  { id: "stone", imagePath: "/stone_island.png" },
];

const getIslandSkinImagePath = (skinId?: string): string => {
  const skin = ISLAND_SKINS.find((s) => s.id === skinId);
  return skin?.imagePath || ISLAND_SKINS[0].imagePath;
};

export function Minimap({
  islands,
  characters,
  panX,
  panY,
  zoom,
}: MinimapProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Independent pan state for the expanded map
  const [expandedPanX, setExpandedPanX] = useState(0);
  const [expandedPanY, setExpandedPanY] = useState(0);
  const isDraggingMap = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const minimapWidth = 300;
  const minimapHeight = 180;
  const expandedWidth = 900;
  const expandedHeight = 650;

  // < 1 means more zoomed out = more world space visible
  const EXPANDED_ZOOM_OUT = 0.6;

  const getIslandWorldPosition = (island: IslandData) => ({
    x: (island.x - 50) * WORLD_COORD_SCALE,
    y: (island.y - 50) * WORLD_COORD_SCALE,
  });

  const islandWorldPositions = islands.map(getIslandWorldPosition);

  const islandRadius = ISLAND_SIZE / 2;
  const allX = islandWorldPositions.map((p) => p.x);
  const allY = islandWorldPositions.map((p) => p.y);

  const minX = Math.min(...allX, -window.innerWidth / 2) - islandRadius;
  const maxX = Math.max(...allX, window.innerWidth / 2) + islandRadius;
  const minY = Math.min(...allY, -window.innerHeight / 2) - islandRadius;
  const maxY = Math.max(...allY, window.innerHeight / 2) + islandRadius;

  const worldWidth = maxX - minX || window.innerWidth;
  const worldHeight = maxY - minY || window.innerHeight;

  const scaleX = minimapWidth / worldWidth;
  const scaleY = minimapHeight / worldHeight;

  const worldToUserCentricMinimap = (worldX: number, worldY: number) => ({
    x: (worldX + panX / Math.max(zoom, 0.001)) * scaleX + minimapWidth / 2,
    y: (worldY + panY / Math.max(zoom, 0.001)) * scaleY + minimapHeight / 2,
  });

  const expandedContentWidth = expandedWidth - 24;
  const expandedContentHeight = expandedHeight - 40;
  const expandedScaleX =
    (expandedContentWidth / worldWidth) * EXPANDED_ZOOM_OUT;
  const expandedScaleY =
    (expandedContentHeight / worldHeight) * EXPANDED_ZOOM_OUT;

  const worldToExpanded = (worldX: number, worldY: number) => ({
    x:
      (worldX + panX) * expandedScaleX +
      expandedContentWidth / 2 +
      expandedPanX,
    y:
      (worldY + panY) * expandedScaleY +
      expandedContentHeight / 2 +
      expandedPanY,
  });

  const handleExpandedPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingMap.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { x: expandedPanX, y: expandedPanY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleExpandedPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingMap.current) return;
    e.stopPropagation();
    setExpandedPanX(panStart.current.x + (e.clientX - dragStart.current.x));
    setExpandedPanY(panStart.current.y + (e.clientY - dragStart.current.y));
  };

  const handleExpandedPointerUp = () => {
    isDraggingMap.current = false;
  };

  return (
    <>
      {/* Minimap — hidden when expanded map is open */}
      {!isExpanded && (
        <div
          className="fixed bottom-4 right-4"
          style={{ cursor: "pointer", zIndex: 50, pointerEvents: "auto" }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(true);
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <div
              className="relative overflow-hidden border border-gray-300 bg-gray-50"
              style={{
                width: minimapWidth,
                height: minimapHeight,
                pointerEvents: "none",
              }}
            >
              {islands.map((island, index) => {
                const worldPos = islandWorldPositions[index];
                const minimapPos = worldToUserCentricMinimap(
                  worldPos.x,
                  worldPos.y,
                );
                const rawDisplayWidth =
                  (island.size / worldWidth) * minimapWidth * 0.85;
                const displayWidth = Math.max(28, rawDisplayWidth);
                const displayHeight = displayWidth * 0.4;
                const skinPath = getIslandSkinImagePath(island.skin);
                return (
                  <div key={island.id} style={{ pointerEvents: "none" }}>
                    <div
                      className="absolute"
                      style={{
                        left: minimapPos.x - displayWidth / 2,
                        top: minimapPos.y - displayHeight / 2,
                        width: displayWidth,
                        height: displayHeight,
                        backgroundImage: `url('${skinPath}')`,
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center top",
                        opacity: 0.8,
                        pointerEvents: "none",
                      }}
                      title={island.label}
                    />
                    <span
                      className="absolute text-xs font-bold text-gray-800 text-center truncate"
                      style={{
                        left: minimapPos.x - displayWidth / 2,
                        top: minimapPos.y + displayHeight / 2 + 2,
                        width: displayWidth,
                        fontSize: "9px",
                        maxWidth: displayWidth + 10,
                      }}
                    >
                      {island.label}
                    </span>
                  </div>
                );
              })}

              {characters.map((character) => {
                const island = islands.find((i) => i.id === character.islandId);
                if (!island) return null;
                const islandIndex = islands.indexOf(island);
                const islandWorldPos = islandWorldPositions[islandIndex];
                const charWorldX =
                  islandWorldPos.x +
                  ((character.position.x - 50) / 100) * island.size;
                const charWorldY =
                  islandWorldPos.y +
                  ((character.position.y - 50) / 100) * (island.size * 0.4);
                const charMinimapPos = worldToUserCentricMinimap(
                  charWorldX,
                  charWorldY,
                );
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
                      pointerEvents: "none",
                    }}
                  />
                );
              })}
              {/* User dot — center of minimap */}
              <div
                className="absolute rounded-full"
                style={{
                  left: minimapWidth / 2 - 4,
                  top: minimapHeight / 2 - 4,
                  width: 8,
                  height: 8,
                  backgroundColor: "#000000",
                  border: "1px solid #7C3AED",
                  pointerEvents: "none",
                  opacity: 0.8,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center pointer-events-none">
              Minimap (Click to expand)
            </p>
          </div>
        </div>
      )}

      {/* Expanded Map Popup */}
      {isExpanded && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setIsExpanded(false)}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ pointerEvents: "auto" }}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-2xl p-3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: expandedWidth, height: expandedHeight }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsExpanded(false)}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded z-10"
            >
              <X size={20} />
            </button>

            <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-400 pointer-events-none select-none">
              Drag to pan
            </p>

            <div
              className="relative overflow-hidden border border-gray-300 bg-gray-50"
              style={{
                width: expandedContentWidth,
                height: expandedContentHeight,
              }}
              onPointerDown={handleExpandedPointerDown}
              onPointerMove={handleExpandedPointerMove}
              onPointerUp={handleExpandedPointerUp}
              onPointerLeave={handleExpandedPointerUp}
            >
              {islands.map((island, index) => {
                const worldPos = islandWorldPositions[index];
                const pos = worldToExpanded(worldPos.x, worldPos.y);
                const displayWidth =
                  (island.size / worldWidth) *
                  expandedContentWidth *
                  0.6 *
                  EXPANDED_ZOOM_OUT;
                const displayHeight = displayWidth * 0.4;
                const skinPath = getIslandSkinImagePath(island.skin);
                return (
                  <div key={island.id} style={{ pointerEvents: "none" }}>
                    <div
                      className="absolute"
                      style={{
                        left: pos.x - displayWidth / 2,
                        top: pos.y - displayHeight / 2,
                        width: displayWidth,
                        height: displayHeight,
                        backgroundImage: `url('${skinPath}')`,
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center top",
                        opacity: 0.8,
                        pointerEvents: "none",
                      }}
                      title={island.label}
                    />
                    <span
                      className="absolute text-xs font-bold text-gray-800 text-center truncate"
                      style={{
                        left: pos.x - displayWidth / 2,
                        top: pos.y + displayHeight / 2 + 4,
                        width: displayWidth,
                        fontSize: "9px",
                        maxWidth: displayWidth + 10,
                      }}
                    >
                      {island.label}
                    </span>
                  </div>
                );
              })}

              {characters.map((character) => {
                const island = islands.find((i) => i.id === character.islandId);
                if (!island) return null;
                const islandIndex = islands.indexOf(island);
                const islandWorldPos = islandWorldPositions[islandIndex];
                const charWorldX =
                  islandWorldPos.x +
                  ((character.position.x - 50) / 100) * island.size;
                const charWorldY =
                  islandWorldPos.y +
                  ((character.position.y - 50) / 100) * (island.size * 0.4);
                const pos = worldToExpanded(charWorldX, charWorldY);
                return (
                  <div
                    key={character.id}
                    className="absolute rounded-full"
                    style={{
                      left: pos.x - 5,
                      top: pos.y - 5,
                      width: 10,
                      height: 10,
                      backgroundColor: "#7F77DD",
                      border: "2px solid #6366f1",
                      pointerEvents: "none",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
