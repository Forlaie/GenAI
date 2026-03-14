"""
animate.py  —  Whole-sprite walk cycle animator
================================================
Loads character_clean.png (or any RGBA sprite) and animates it
using affine transforms: no part-splitting required.

Why this works better than sprite rigging for this character:
  - The drawing is in a thinking pose, not a T-pose.
  - Cutting it into parts and rotating them creates gaps/overlaps.
  - Whole-sprite transforms preserve the original art exactly.

Run:
    python animate.py
    python animate.py parts/character_clean.png   # custom sprite path
"""

import sys
import os
import math
import pygame

# ── Config ────────────────────────────────────────────────────────────────────
SPRITE_PATH  = sys.argv[1] if len(sys.argv) > 1 else "parts/character_clean.png"
SCREEN_W     = 960
SCREEN_H     = 540
FPS          = 60
SPRITE_H_PX  = 260           # target height of the character on screen

WALK_SPEED   = 110           # pixels / second

# Walk cycle tuning  (all small intentionally — subtlety > comedy)
BOB_AMP      = 5             # px, vertical bounce per step
BOB_FREQ     = 2.6           # full bobs per second
LEAN_DEG     = 4             # max forward-lean degrees
WOBBLE_DEG   = 1.2           # lateral sway degrees
BREATHE_AMP  = 0.012         # scale pulse (breathing)
SQUASH_AMP   = 0.03          # vertical squash on footfall

# Colours
SKY_TOP      = (220, 235, 255)
SKY_BOT      = (255, 252, 240)
GROUND_COL   = (195, 182, 158)
GROUND_LINE  = (165, 150, 128)
SHADOW_COL   = (0, 0, 0, 55)
HUD_COL      = (130, 118, 100)


# ── Helpers ───────────────────────────────────────────────────────────────────
def _lerp_colour(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def _scale_sprite(surf, target_h):
    """Scale a surface so its height == target_h, keeping aspect ratio."""
    ow, oh = surf.get_size()
    scale  = target_h / oh
    return pygame.transform.smoothscale(surf, (int(ow * scale), target_h))


class Character:
    """
    Single-sprite character driven by a walk-cycle state machine.

    States:  IDLE, WALK
    The same sprite is used for both; motion is achieved entirely through
    position, rotation, and scale transforms applied each frame.
    """

    def __init__(self, sprite_path: str, target_height: int):
        raw = pygame.image.load(sprite_path).convert_alpha()
        self.base = _scale_sprite(raw, target_height)
        self.bw, self.bh = self.base.get_size()

        self.x         = SCREEN_W // 3
        self.direction = 1          # +1 = right,  -1 = left
        self.t         = 0.0        # animation clock (seconds)
        self.speed     = WALK_SPEED

    # ── per-frame update ──────────────────────────────────────────────────────
    def update(self, dt: float, ground_y: int):
        self.t += dt
        self.x += self.direction * self.speed * dt

        # Wrap / bounce
        margin = self.bw // 2 + 20
        if self.x > SCREEN_W - margin:
            self.direction = -1
        if self.x < margin:
            self.direction = 1

    # ── draw ─────────────────────────────────────────────────────────────────
    def draw(self, screen: pygame.Surface, ground_y: int):
        t  = self.t
        d  = self.direction

        # ── walk cycle maths ─────────────────────────────────────────────
        phase   = t * BOB_FREQ * 2 * math.pi          # radians
        bob     = math.sin(phase)                      # –1 … +1
        step    = abs(math.sin(phase * 0.5))           # 0 … 1, peak at footfall

        dy      = bob * BOB_AMP                        # vertical offset
        lean    = -math.cos(phase * 0.5) * LEAN_DEG * d
        wobble  = math.sin(phase * 0.5) * WOBBLE_DEG
        breathe = 1.0 + math.sin(t * 1.8) * BREATHE_AMP
        squash  = 1.0 - step * SQUASH_AMP             # squash on foot-contact

        sx = breathe
        sy = breathe * squash
        angle = lean + wobble

        # ── build transformed surface ─────────────────────────────────────
        # 1. Flip
        sprite = pygame.transform.flip(self.base, d == -1, False)

        # 2. Scale (breathe + squash)
        tw = max(1, int(self.bw * sx))
        th = max(1, int(self.bh * sy))
        sprite = pygame.transform.smoothscale(sprite, (tw, th))

        # 3. Rotate around foot-centre
        sprite = pygame.transform.rotate(sprite, angle)
        rw, rh = sprite.get_size()

        # 4. Position: keep feet planted on ground_y
        draw_x = int(self.x - rw / 2)
        draw_y = int(ground_y - rh + dy)

        # ── shadow (ellipse under feet) ───────────────────────────────────
        shadow_w = int(self.bw * 0.55 * (0.9 + step * 0.1))
        shadow_h = max(6, int(shadow_w * 0.22))
        shad     = pygame.Surface((shadow_w, shadow_h), pygame.SRCALPHA)
        alpha    = max(0, int(SHADOW_COL[3] * (1.0 - step * 0.4)))
        pygame.draw.ellipse(shad, (*SHADOW_COL[:3], alpha),
                            (0, 0, shadow_w, shadow_h))
        screen.blit(shad, (int(self.x - shadow_w / 2),
                           ground_y - shadow_h // 2))

        screen.blit(sprite, (draw_x, draw_y))


# ── Background ────────────────────────────────────────────────────────────────
_bg_cache = None

def _build_bg(w: int, h: int, ground_y: int) -> pygame.Surface:
    global _bg_cache
    if _bg_cache and _bg_cache.get_size() == (w, h):
        return _bg_cache
    surf = pygame.Surface((w, h))
    for y in range(ground_y):
        surf.fill(_lerp_colour(SKY_TOP, SKY_BOT, y / ground_y), (0, y, w, 1))
    surf.fill(GROUND_COL, (0, ground_y, w, h - ground_y))
    # subtle ground texture lines
    for i in range(0, w, 38):
        pygame.draw.line(surf, _lerp_colour(GROUND_COL, GROUND_LINE, 0.35),
                         (i, ground_y + 4), (i + 22, ground_y + 4), 1)
    pygame.draw.line(surf, GROUND_LINE, (0, ground_y), (w, ground_y), 2)
    _bg_cache = surf
    return surf


# ── Main loop ─────────────────────────────────────────────────────────────────
def main():
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_W, SCREEN_H))
    pygame.display.set_caption("Character Walk")
    clock  = pygame.time.Clock()
    font   = pygame.font.SysFont("monospace", 13)

    if not os.path.exists(SPRITE_PATH):
        print(f"Sprite not found: {SPRITE_PATH}")
        print("Run the segmentation pipeline first, or pass a sprite path:")
        print("  python animate.py path/to/sprite.png")
        sys.exit(1)

    ground_y  = SCREEN_H - 90
    character = Character(SPRITE_PATH, SPRITE_H_PX)

    running = True
    while running:
        dt = min(clock.tick(FPS) / 1000.0, 0.05)   # cap dt at 50ms

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False

        character.update(dt, ground_y)

        # Draw
        screen.blit(_build_bg(SCREEN_W, SCREEN_H, ground_y), (0, 0))
        character.draw(screen, ground_y)

        screen.blit(font.render("ESC  quit", True, HUD_COL), (14, 14))
        pygame.display.flip()

    pygame.quit()


if __name__ == "__main__":
    main()