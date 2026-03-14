"use client";

import { useRef, useEffect, useState, useCallback } from "react";

type Tool = "pen" | "eraser" | "fill";

interface DrawingCanvasProps {
  onSave?: (dataUrl: string) => void;
  onClose?: () => void;
  width?: number;
  height?: number;
  tutorialHint?: string;
}

const COLORS = [
  "#2C2C2A",
  "#ffffff",
  "#E24B4A",
  "#EF9F27",
  "#639922",
  "#378ADD",
  "#7F77DD",
  "#D4537E",
  "#1D9E75",
  "#D85A30",
];

export function DrawingCanvas({
  onSave,
  onClose,
  width = 680,
  height = 420,
  tutorialHint,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#2C2C2A");
  const [size, setSize] = useState(4);
  const [drawing, setDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    const initial = canvas.toDataURL();
    setHistory([initial]);
    setHistoryIndex(0);
  }, [width, height]);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      const src =
        "touches" in e
          ? (e as React.TouchEvent).touches[0]
          : (e as React.MouseEvent);
      return {
        x: (src.clientX - rect.left) * scaleX,
        y: (src.clientY - rect.top) * scaleY,
      };
    },
    [width, height],
  );

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      const capped = next.length >= 30 ? next.slice(1) : next;
      return [...capped, dataUrl];
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 29));
  }, [historyIndex]);

  const floodFill = useCallback(
    (startX: number, startY: number, fillColor: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const sx = Math.round(startX);
      const sy = Math.round(startY);
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const idx = (sy * width + sx) * 4;
      const tr = data[idx],
        tg = data[idx + 1],
        tb = data[idx + 2],
        ta = data[idx + 3];
      const fr = parseInt(fillColor.slice(1, 3), 16);
      const fg = parseInt(fillColor.slice(3, 5), 16);
      const fb = parseInt(fillColor.slice(5, 7), 16);
      if (tr === fr && tg === fg && tb === fb) return;
      const stack: [number, number][] = [[sx, sy]];
      while (stack.length) {
        const [x, y] = stack.pop()!;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        const i = (y * width + x) * 4;
        if (
          data[i] !== tr ||
          data[i + 1] !== tg ||
          data[i + 2] !== tb ||
          data[i + 3] !== ta
        )
          continue;
        data[i] = fr;
        data[i + 1] = fg;
        data[i + 2] = fb;
        data[i + 3] = 255;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      ctx.putImageData(imageData, 0, 0);
    },
    [width, height],
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const pos = getPos(e);
      if (tool === "fill") {
        floodFill(pos.x, pos.y, color);
        saveState();
        return;
      }
      setDrawing(true);
      lastPos.current = pos;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      ctx.beginPath();
      ctx.arc(
        pos.x,
        pos.y,
        (tool === "eraser" ? size * 2 : size) / 2,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.fill();
    },
    [tool, color, size, getPos, floodFill, saveState],
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!drawing || !lastPos.current) return;
      const pos = getPos(e);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.lineWidth = tool === "eraser" ? size * 2 : size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      lastPos.current = pos;
    },
    [drawing, tool, color, size, getPos],
  );

  const handlePointerUp = useCallback(() => {
    if (drawing) {
      setDrawing(false);
      lastPos.current = null;
      saveState();
    }
  }, [drawing, saveState]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.src = history[newIndex];
    img.onload = () => ctx.drawImage(img, 0, 0);
  }, [historyIndex, history]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    saveState();
  }, [width, height, saveState]);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    if (onSave) {
      onSave(dataUrl);
    } else {
      const a = document.createElement("a");
      a.download = "my-character.png";
      a.href = dataUrl;
      a.click();
    }
  }, [onSave]);

  const cursorStyle =
    tool === "eraser" ? "cell" : tool === "fill" ? "crosshair" : "crosshair";

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-gray-100 w-full max-w-2xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Tools */}
        <div className="flex gap-1">
          <ToolButton
            active={tool === "pen"}
            onClick={() => setTool("pen")}
            title="Pen"
          >
            <PenIcon />
          </ToolButton>
          <ToolButton
            active={tool === "eraser"}
            onClick={() => setTool("eraser")}
            title="Eraser"
          >
            <EraserIcon />
          </ToolButton>
          <ToolButton
            active={tool === "fill"}
            onClick={() => setTool("fill")}
            title="Fill bucket"
          >
            <FillIcon />
          </ToolButton>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Colors */}
        <div className="flex items-center gap-1 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              title={c}
              onClick={() => {
                setColor(c);
                if (tool === "eraser") setTool("pen");
              }}
              className="transition-transform hover:scale-110"
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: c,
                border:
                  color === c
                    ? "2.5px solid #7F77DD"
                    : c === "#ffffff"
                      ? "1.5px solid #D3D1C7"
                      : "2px solid transparent",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
          <input
            type="color"
            title="Custom color"
            onChange={(e) => {
              setColor(e.target.value);
              if (tool === "eraser") setTool("pen");
            }}
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: "none",
            }}
          />
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Brush size */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center"
            style={{ width: 20, height: 20 }}
          >
            <div
              style={{
                width: Math.min(size, 20),
                height: Math.min(size, 20),
                borderRadius: "50%",
                background: tool === "eraser" ? "#D3D1C7" : color,
              }}
            />
          </div>
          <input
            type="range"
            min={1}
            max={40}
            step={1}
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
            className="w-20"
            style={{ accentColor: "#7F77DD" }}
          />
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Actions */}
        <div className="flex gap-1">
          <ToolButton onClick={undo} title="Undo" disabled={historyIndex <= 0}>
            <UndoIcon />
          </ToolButton>
          <ToolButton onClick={clearCanvas} title="Clear">
            <ClearIcon />
          </ToolButton>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="ml-auto px-4 py-1.5 rounded-full text-sm font-medium text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: "#7F77DD" }}
        >
          {onSave ? "Use drawing" : "Save"}
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Canvas */}
      {tutorialHint && (
        <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-700 font-medium">{tutorialHint}</p>
        </div>
      )}
      <div
        className="rounded-xl overflow-hidden border border-gray-100 w-full"
        style={{ cursor: cursorStyle }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            touchAction: "none",
          }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </div>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  title,
  disabled,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="flex items-center justify-center rounded-lg transition-all"
      style={{
        width: 34,
        height: 34,
        border: active ? "1px solid #7F77DD" : "0.5px solid #D3D1C7",
        background: active ? "#EEEDFE" : "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

function PenIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 14l2.5-2.5L12 4l-2-2L2.5 9.5 2 14z" />
      <path d="M10 4l2 2" />
    </svg>
  );
}

function EraserIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="2" y="7" width="12" height="6" rx="1" />
      <path d="M5 7L8 3l5 4" />
    </svg>
  );
}

function FillIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 13h10M4 3l4 8 3-5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 7H10a3 3 0 010 6H7" />
      <path d="M3 7L6 4M3 7l3 3" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  );
}
