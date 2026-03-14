"""
Drawing Animation Pipeline
===========================
Steps:
  1. Extract character from background (thresholding)
  2. Detect pose keypoints with MediaPipe
  3. Segment body parts using SAM + keypoints as prompts
  4. Save each part as a transparent PNG sprite
  5. Animate the parts in Pygame

Install dependencies:
  pip install opencv-python mediapipe segment-anything torch pygame numpy pillow

Download SAM checkpoint:
  wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth
"""

import os
import sys
import math
import numpy as np
import cv2
import pygame
from PIL import Image

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG — edit these
# ─────────────────────────────────────────────────────────────────────────────
IMAGE_PATH      = "stick.png"        # your drawing
SAM_CHECKPOINT  = "sam_vit_b_01ec64.pth"
SAM_MODEL_TYPE  = "vit_b"
DEVICE          = "cpu"              # "cuda" if you have a GPU
OUTPUT_DIR      = "parts"           # folder where part PNGs are saved
DARK_BACKGROUND = False             # set True if your drawing has a dark bg (Image 2)

# ─────────────────────────────────────────────────────────────────────────────
# STEP 0 — imports that require pip packages
# ─────────────────────────────────────────────────────────────────────────────
try:
    import mediapipe as mp
    # Detect which MediaPipe API is available
    # ≥0.10 moved pose out of mp.solutions into mp.tasks
    _MP_NEW_API = not hasattr(mp, "solutions") or not hasattr(mp.solutions, "pose")
except ImportError:
    sys.exit("mediapipe not installed. Run: pip install mediapipe")

try:
    import torch
    from segment_anything import sam_model_registry, SamPredictor
except ImportError:
    sys.exit("segment_anything not installed. See: https://github.com/facebookresearch/segment-anything")


os.makedirs(OUTPUT_DIR, exist_ok=True)


# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — Extract character from background
# ─────────────────────────────────────────────────────────────────────────────
def extract_character(image_path: str, dark_background: bool = False) -> tuple:
    """
    Returns:
        image_rgb  : (H, W, 3) uint8 — original colour image
        char_mask  : (H, W)    uint8 — 255 = character pixel, 0 = background
    """
    image_bgr = cv2.imread(image_path)
    if image_bgr is None:
        sys.exit(f"Could not open image: {image_path}")

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    gray      = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    if dark_background:
        # light character on dark background → keep bright pixels
        _, char_mask = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY)
    else:
        # dark character on light background → invert so lines become white
        _, char_mask = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)

    # Close small gaps in strokes (makes SAM's job easier)
    kernel    = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    char_mask = cv2.morphologyEx(char_mask, cv2.MORPH_CLOSE, kernel)

    # Save clean cutout with transparency
    rgba = np.dstack((image_rgb, char_mask))
    out  = os.path.join(OUTPUT_DIR, "character_clean.png")
    Image.fromarray(rgba.astype(np.uint8)).save(out)
    print(f"[Step 1] Character extracted → {out}")

    return image_rgb, char_mask


# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — Detect pose keypoints with MediaPipe
# ─────────────────────────────────────────────────────────────────────────────
PART_KEYPOINT_MAP = {
    # part name  : list of MediaPipe landmark indices that define its centre
    # Full landmark list: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
    "head":      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],   # nose + eyes + ears + mouth
    "torso":     [11, 12, 23, 24],                        # shoulders + hips
    "left_arm":  [11, 13, 15],                            # L shoulder → elbow → wrist
    "right_arm": [12, 14, 16],                            # R shoulder → elbow → wrist
    "left_leg":  [23, 25, 27, 29, 31],                   # L hip → knee → ankle → foot
    "right_leg": [24, 26, 28, 30, 32],                   # R hip → knee → ankle → foot
}


def _grid_fallback(h: int, w: int, reason: str) -> dict:
    """Return evenly-spaced click points when pose detection fails."""
    print(f"[Step 2] {reason} — using fallback grid points")
    cx = w // 2
    pts = {
        "head":      (cx,                  int(h * 0.10)),
        "torso":     (cx,                  int(h * 0.35)),
        "left_arm":  (int(cx - w * 0.20),  int(h * 0.30)),
        "right_arm": (int(cx + w * 0.20),  int(h * 0.30)),
        "left_leg":  (int(cx - w * 0.10),  int(h * 0.70)),
        "right_leg": (int(cx + w * 0.10),  int(h * 0.70)),
    }
    print(f"[Step 2] Fallback points: {pts}")
    return pts


def _keypoints_from_landmarks(landmarks, h: int, w: int) -> dict:
    """Shared logic: convert a landmark list into part-centroid dict."""
    part_points = {}
    for part, indices in PART_KEYPOINT_MAP.items():
        xs, ys = [], []
        for i in indices:
            lm = landmarks[i]
            vis = getattr(lm, "visibility", 1.0)   # tasks API may lack visibility
            if vis > 0.2:
                xs.append(lm.x * w)
                ys.append(lm.y * h)
        if xs and ys:
            part_points[part] = (int(np.mean(xs)), int(np.mean(ys)))
    return part_points


def _run_mediapipe_legacy(image_rgb: np.ndarray) -> list | None:
    """Use the old mp.solutions.pose API (mediapipe < 0.10)."""
    mp_pose = mp.solutions.pose
    with mp_pose.Pose(
        static_image_mode=True,
        model_complexity=2,
        enable_segmentation=False,
        min_detection_confidence=0.3,
    ) as pose:
        results = pose.process(image_rgb)
    if results.pose_landmarks is None:
        return None
    return list(results.pose_landmarks.landmark)


def _run_mediapipe_new(image_rgb: np.ndarray) -> list | None:
    """
    Use the new mp.tasks API (mediapipe ≥ 0.10).
    Requires the 'pose_landmarker_full.task' model file.
    Downloads it automatically if missing.
    """
    import urllib.request
    model_path = "pose_landmarker_full.task"
    if not os.path.exists(model_path):
        url = ("https://storage.googleapis.com/mediapipe-models/"
               "pose_landmarker/pose_landmarker_full/float16/latest/"
               "pose_landmarker_full.task")
        print(f"[Step 2] Downloading MediaPipe model from {url} …")
        try:
            urllib.request.urlretrieve(url, model_path)
        except Exception as e:
            print(f"[Step 2] Download failed: {e}")
            return None

    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision

    base_opts = mp_python.BaseOptions(model_asset_path=model_path)
    options   = mp_vision.PoseLandmarkerOptions(
        base_options=base_opts,
        output_segmentation_masks=False,
    )
    with mp_vision.PoseLandmarker.create_from_options(options) as landmarker:
        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=image_rgb,
        )
        result = landmarker.detect(mp_image)

    if not result.pose_landmarks:
        return None

    # tasks API returns normalised landmarks directly (no .landmark list)
    return result.pose_landmarks[0]


def detect_keypoints(image_rgb: np.ndarray) -> dict:
    """
    Returns { part_name: (x_pixel, y_pixel) }.
    Tries MediaPipe (old then new API), falls back to a grid if nothing works.
    """
    h, w = image_rgb.shape[:2]

    landmarks = None

    if not _MP_NEW_API:
        # ── legacy API (mediapipe < 0.10) ────────────────────────────────
        try:
            landmarks = _run_mediapipe_legacy(image_rgb)
        except Exception as e:
            print(f"[Step 2] Legacy MediaPipe error: {e}")
    else:
        # ── new tasks API (mediapipe ≥ 0.10) ─────────────────────────────
        try:
            landmarks = _run_mediapipe_new(image_rgb)
        except Exception as e:
            print(f"[Step 2] New MediaPipe API error: {e}")

    if landmarks is None:
        return _grid_fallback(h, w, "MediaPipe found no landmarks")

    part_points = _keypoints_from_landmarks(landmarks, h, w)

    if not part_points:
        return _grid_fallback(h, w, "All landmarks had low visibility")

    print(f"[Step 2] Detected keypoints: {part_points}")

    # Debug image
    debug = image_rgb.copy()
    for part, pt in part_points.items():
        cv2.circle(debug, pt, 6, (255, 0, 0), -1)
        cv2.putText(debug, part, (pt[0] + 8, pt[1]), cv2.FONT_HERSHEY_SIMPLEX,
                    0.4, (255, 0, 0), 1)
    dbg_path = os.path.join(OUTPUT_DIR, "keypoints_debug.png")
    cv2.imwrite(dbg_path, cv2.cvtColor(debug, cv2.COLOR_RGB2BGR))
    print(f"[Step 2] Keypoint debug image → {dbg_path}")

    return part_points


# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — Segment body parts with SAM
# ─────────────────────────────────────────────────────────────────────────────
def segment_parts(image_rgb: np.ndarray, char_mask: np.ndarray,
                  part_points: dict) -> dict:
    """
    For each part, run SAM with its centroid as a foreground prompt.
    Returns { part_name: binary_mask (H, W, bool) }
    """
    print("[Step 3] Loading SAM …")
    sam = sam_model_registry[SAM_MODEL_TYPE](checkpoint=SAM_CHECKPOINT)
    sam.to(DEVICE)
    predictor = SamPredictor(sam)
    predictor.set_image(image_rgb)

    part_masks = {}

    for part, point in part_points.items():
        masks, scores, _ = predictor.predict(
            point_coords=np.array([list(point)]),
            point_labels=np.array([1]),          # 1 = foreground
            multimask_output=True,               # SAM returns 3 candidates
        )

        # Keep the best-scoring mask, intersected with the character area
        best_idx  = int(np.argmax(scores))
        best_mask = masks[best_idx]

        # Restrict to actual character pixels (avoids leaking into background)
        best_mask = best_mask & (char_mask > 0)

        if best_mask.sum() < 50:
            print(f"[Step 3]   {part}: mask too small, skipping")
            continue

        part_masks[part] = best_mask
        print(f"[Step 3]   {part}: score={scores[best_idx]:.3f}  "
              f"pixels={best_mask.sum()}")

    return part_masks


# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Save each part as a transparent PNG sprite
# ─────────────────────────────────────────────────────────────────────────────
def save_sprites(image_rgb: np.ndarray, part_masks: dict) -> dict:
    """
    Crops each part to its bounding box and saves as RGBA PNG.
    Returns { part_name: { "path": str, "bbox": (x, y, w, h) } }
    """
    sprite_info = {}

    for part, mask in part_masks.items():
        # Bounding box of the mask
        rows = np.any(mask, axis=1)
        cols = np.any(mask, axis=0)
        rmin, rmax = np.where(rows)[0][[0, -1]]
        cmin, cmax = np.where(cols)[0][[0, -1]]

        # Crop with small padding
        pad  = 4
        rmin = max(0, rmin - pad)
        rmax = min(mask.shape[0] - 1, rmax + pad)
        cmin = max(0, cmin - pad)
        cmax = min(mask.shape[1] - 1, cmax + pad)

        cropped_rgb  = image_rgb[rmin:rmax+1, cmin:cmax+1]
        cropped_mask = mask[rmin:rmax+1, cmin:cmax+1]
        alpha        = (cropped_mask * 255).astype(np.uint8)
        rgba         = np.dstack((cropped_rgb, alpha))

        path = os.path.join(OUTPUT_DIR, f"{part}.png")
        Image.fromarray(rgba.astype(np.uint8)).save(path)

        sprite_info[part] = {
            "path": path,
            "bbox": (cmin, rmin, cmax - cmin + 1, rmax - rmin + 1),
        }
        print(f"[Step 4]   {part} → {path}  bbox={sprite_info[part]['bbox']}")

    return sprite_info


# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 — Animate in Pygame
# ─────────────────────────────────────────────────────────────────────────────

# Joint hierarchy: each part rotates around a parent anchor point
# Anchor = (normalised offset within the sprite, 0-1) from top-left
JOINT_CONFIG = {
    #  part        parent    my_anchor        parent_anchor
    "torso":      (None,     (0.5, 0.5),      None),
    "head":       ("torso",  (0.5, 0.9),      (0.5, 0.05)),   # head bottom → torso top
    "left_arm":   ("torso",  (0.9, 0.1),      (0.1, 0.15)),
    "right_arm":  ("torso",  (0.1, 0.1),      (0.9, 0.15)),
    "left_leg":   ("torso",  (0.6, 0.05),     (0.35, 0.95)),
    "right_leg":  ("torso",  (0.4, 0.05),     (0.65, 0.95)),
}


class BodyPart:
    def __init__(self, name, surface, bbox):
        self.name    = name
        self.surface = surface       # pygame.Surface with alpha
        self.bbox    = bbox          # (x, y, w, h) in original image coords
        self.angle   = 0.0          # current rotation degrees
        self.config  = JOINT_CONFIG.get(name, (None, (0.5, 0.5), None))

    @property
    def w(self): return self.surface.get_width()

    @property
    def h(self): return self.surface.get_height()

    def get_anchor_px(self, norm):
        """Convert normalised anchor to pixel offset within sprite."""
        return (norm[0] * self.w, norm[1] * self.h)

    def draw(self, screen, parts: dict, torso_world_pos):
        """
        Recursively draw this part at the correct world position.
        torso_world_pos: pixel position of the torso centre in screen space.
        """
        parent_name, my_anchor_norm, parent_anchor_norm = self.config

        if parent_name is None:
            # Torso is the root — draw at torso_world_pos
            world_pos = torso_world_pos
            my_anchor = self.get_anchor_px(my_anchor_norm)
            topleft   = (world_pos[0] - my_anchor[0],
                         world_pos[1] - my_anchor[1])
            rotated   = pygame.transform.rotate(self.surface, self.angle)
            screen.blit(rotated, topleft)
            self._world_anchor = world_pos
        else:
            parent = parts.get(parent_name)
            if parent is None or not hasattr(parent, "_world_anchor"):
                return

            # Where on the parent the joint attaches
            p_anchor_norm = parent_anchor_norm
            p_surf_w      = parent.surface.get_width()
            p_surf_h      = parent.surface.get_height()
            joint_world   = (
                parent._world_anchor[0] + (p_anchor_norm[0] - 0.5) * p_surf_w,
                parent._world_anchor[1] + (p_anchor_norm[1] - 0.5) * p_surf_h,
            )

            my_anchor = self.get_anchor_px(my_anchor_norm)
            topleft   = (joint_world[0] - my_anchor[0],
                         joint_world[1] - my_anchor[1])

            rotated = pygame.transform.rotate(self.surface, self.angle)
            screen.blit(rotated, topleft)
            # Store own world anchor for children
            my_an_norm = my_anchor_norm
            self._world_anchor = (
                topleft[0] + my_an_norm[0] * self.w,
                topleft[1] + my_an_norm[1] * self.h,
            )


def animate(sprite_info: dict, original_image_rgb: np.ndarray):
    """Pygame animation loop."""
    pygame.init()
    W, H = 800, 600
    screen = pygame.display.set_mode((W, H))
    pygame.display.set_caption("Drawing Animation Pipeline")
    clock  = pygame.time.Clock()

    # Load sprites into pygame Surfaces
    parts = {}
    for name, info in sprite_info.items():
        img = pygame.image.load(info["path"]).convert_alpha()
        parts[name] = BodyPart(name, img, info["bbox"])

    draw_order = ["torso", "left_leg", "right_leg",
                  "left_arm", "right_arm", "head"]

    t            = 0.0
    walk_speed   = 120        # pixels/second
    direction    = 1          # 1 = right, -1 = left
    char_x       = W // 4
    char_y       = H // 2 + 40
    bg_color     = (240, 240, 230)

    # Simple ground line
    ground_y = char_y + 80

    running = True
    while running:
        dt = clock.tick(60) / 1000.0
        t += dt

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                running = False

        # ── Walk animation ──────────────────────────────────────────────────
        char_x += direction * walk_speed * dt

        # Bounce at screen edges
        if char_x > W - 80:
            direction = -1
        if char_x < 80:
            direction = 1

        # Leg swing
        swing = math.sin(t * 5) * 18
        if "left_leg"  in parts: parts["left_leg"].angle  =  swing
        if "right_leg" in parts: parts["right_leg"].angle = -swing

        # Arm counter-swing
        if "left_arm"  in parts: parts["left_arm"].angle  = -swing * 0.6
        if "right_arm" in parts: parts["right_arm"].angle =  swing * 0.6

        # Subtle body bob
        bob = math.sin(t * 10) * 2
        torso_pos = (int(char_x), int(char_y + bob))

        # Flip sprites when walking left
        for name, part in parts.items():
            if direction == -1:
                part.surface = pygame.transform.flip(
                    pygame.image.load(sprite_info[name]["path"]).convert_alpha(),
                    True, False
                )
            else:
                part.surface = pygame.image.load(
                    sprite_info[name]["path"]).convert_alpha()

        # ── Draw ─────────────────────────────────────────────────────────────
        screen.fill(bg_color)
        pygame.draw.line(screen, (180, 160, 140), (0, ground_y), (W, ground_y), 2)

        # Draw parts in order (torso first so limbs render on top)
        for name in draw_order:
            if name in parts:
                parts[name].draw(screen, parts, torso_pos)

        # HUD
        font = pygame.font.SysFont("monospace", 14)
        screen.blit(font.render("ESC to quit", True, (120, 120, 120)), (10, 10))
        screen.blit(font.render(f"Parts loaded: {list(parts.keys())}", True,
                                (120, 120, 120)), (10, 28))

        pygame.display.flip()

    pygame.quit()


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  Drawing Animation Pipeline")
    print("=" * 60)

    # 1. Extract character
    image_rgb, char_mask = extract_character(IMAGE_PATH, DARK_BACKGROUND)

    # 2. Detect keypoints
    part_points = detect_keypoints(image_rgb)

    if not part_points:
        sys.exit("No keypoints found and fallback failed. Check your image path.")

    # 3. Segment with SAM
    if not os.path.exists(SAM_CHECKPOINT):
        print(f"\n[!] SAM checkpoint not found at '{SAM_CHECKPOINT}'")
        print("    Download with:")
        print("    wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth\n")
        sys.exit(1)

    part_masks = segment_parts(image_rgb, char_mask, part_points)

    if not part_masks:
        sys.exit("SAM found no valid part masks. Try adjusting DARK_BACKGROUND or image contrast.")

    # 4. Save sprites
    sprite_info = save_sprites(image_rgb, part_masks)

    print(f"\n[Done] {len(sprite_info)} sprites saved to '{OUTPUT_DIR}/'")
    print("       Starting Pygame animation … (press ESC to quit)\n")

    # 5. Animate
    animate(sprite_info, image_rgb)


if __name__ == "__main__":
    main()