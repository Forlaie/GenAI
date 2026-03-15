"use client";
import { useState, useRef, useCallback } from "react";

const JOINTS = [
  { key: "head_top", label: "Head top", color: "#E24B4A" },
  { key: "neck", label: "Neck / chin", color: "#EF9F27" },
  { key: "shl", label: "Left shoulder", color: "#1D9E75" },
  { key: "shr", label: "Right shoulder", color: "#1D9E75" },
  { key: "hipl", label: "Left hip", color: "#378ADD" },
  { key: "hipr", label: "Right hip", color: "#378ADD" },
  { key: "footl", label: "Left foot", color: "#AFA9EC" },
  { key: "footr", label: "Right foot", color: "#AFA9EC" },
] as const;

type JointKey = (typeof JOINTS)[number]["key"];
type Pos = { x: number; y: number };
type JointMap = Partial<Record<JointKey, Pos>>;

export default function JointEditor({
  imageUrl,
  onConfirm,
  onBack,
}: {
  imageUrl: string;
  onConfirm: (joints: JointMap) => void;
  onBack: () => void;
}) {
  const [placed, setPlaced] = useState<JointMap>({});
  const dragging = useRef<JointKey | null>(null);
  const dragOffset = useRef<Pos>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const nextJoint = JOINTS.find((j) => !placed[j.key]);

  const getCanvasPos = (e: React.MouseEvent): Pos => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragging.current || !nextJoint) return;
      const pos = getCanvasPos(e);
      setPlaced((prev) => ({ ...prev, [nextJoint.key]: pos }));
    },
    [nextJoint]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const pos = getCanvasPos(e);
    const key = dragging.current;
    setPlaced((prev) => ({
      ...prev,
      [key]: {
        x: pos.x - dragOffset.current.x,
        y: pos.y - dragOffset.current.y,
      },
    }));
  }, []);

  const handleMouseUp = () => {
    dragging.current = null;
  };

  const startDrag = (key: JointKey, e: React.MouseEvent) => {
    e.stopPropagation();
    const pos = getCanvasPos(e);
    dragOffset.current = {
      x: pos.x - placed[key]!.x,
      y: pos.y - placed[key]!.y,
    };
    dragging.current = key;
  };

  const removeJoint = (key: JointKey, e: React.MouseEvent) => {
    e.preventDefault();
    setPlaced((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  };

  return (
    <div
      className="flex border rounded-lg overflow-hidden"
      style={{ height: 520 }}
    >
      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative flex-1 cursor-crosshair select-none"
        style={{
          background:
            "repeating-conic-gradient(#f0f0f0 0% 25%, white 0% 50%) 0 0 / 20px 20px",
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={imageUrl}
          className="absolute top-1/2 left-1/2 pointer-events-none select-none"
          style={{
            transform: "translate(-50%, -50%)",
            maxHeight: "80%",
            maxWidth: "80%",
          }}
          draggable={false}
        />

        {/* Skeleton lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {[
            ["head_top", "neck"],
            ["neck", "shl"],
            ["neck", "shr"],
            ["neck", "hipl"],
            ["neck", "hipr"],
            ["hipl", "footl"],
            ["hipr", "footr"],
          ].map(([a, b]) => {
            const pa = placed[a as JointKey],
              pb = placed[b as JointKey];
            if (!pa || !pb) return null;
            return (
              <line
                key={a + b}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            );
          })}
        </svg>

        {/* Joint dots */}
        {JOINTS.map((j) => {
          const pos = placed[j.key];
          if (!pos) return null;
          return (
            <div key={j.key}>
              <div
                className="absolute rounded-full border-2 border-white"
                style={{
                  width: 18,
                  height: 18,
                  left: pos.x,
                  top: pos.y,
                  transform: "translate(-50%, -50%)",
                  background: j.color,
                  cursor: "grab",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  zIndex: 10,
                }}
                onMouseDown={(e) => startDrag(j.key, e)}
                onContextMenu={(e) => removeJoint(j.key, e)}
              />
              <span
                className="absolute text-xs font-medium pointer-events-none select-none"
                style={{
                  left: pos.x + 12,
                  top: pos.y - 6,
                  color: j.color,
                  zIndex: 11,
                  textShadow: "0 1px 2px white, 0 -1px 2px white",
                }}
              >
                {j.label}
              </span>
            </div>
          );
        })}

        {/* Hint */}
        {nextJoint && (
          <div className="absolute bottom-3 left-3 text-xs text-gray-400">
            Click to place:{" "}
            <span className="font-medium" style={{ color: nextJoint.color }}>
              {nextJoint.label}
            </span>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="flex flex-col border-l" style={{ width: 200 }}>
        <div className="flex-1 overflow-y-auto py-2">
          {JOINTS.map((j, i) => {
            const isPlaced = !!placed[j.key];
            const isNext = nextJoint?.key === j.key;
            return (
              <div
                key={j.key}
                className="flex items-center gap-2 px-3 py-2 text-xs"
                style={{
                  borderLeft: isNext
                    ? `2px solid ${j.color}`
                    : "2px solid transparent",
                  background: isNext ? "#f8f9ff" : "transparent",
                  color: isPlaced ? "#111" : isNext ? "#111" : "#aaa",
                }}
              >
                <span
                  className="rounded-full shrink-0"
                  style={{ width: 8, height: 8, background: j.color }}
                />
                {j.label}
                {isPlaced && <span className="ml-auto text-green-500">✓</span>}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t space-y-2">
          <button
            onClick={() => onConfirm(placed)}
            disabled={Object.keys(placed).length < 4}
            className="w-full py-2 text-xs rounded text-white disabled:opacity-40"
            style={{ background: "#378ADD" }}
          >
            Save joints
          </button>
          <button
            onClick={() => setPlaced({})}
            className="w-full py-2 text-xs rounded border text-gray-500 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={onBack}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600"
          >
            ← Back
          </button>
          <p className="text-center text-gray-300" style={{ fontSize: 10 }}>
            Right-click a joint to remove
          </p>
        </div>
      </div>
    </div>
  );
}
