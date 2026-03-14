"""
rig_character.py  —  Character Rigger & Web Animator
=====================================================
Segments any upright character drawing into clean, non-overlapping body
parts and generates an animated HTML page.

Key design decisions
--------------------
- Each pixel belongs to EXACTLY one part (no overlap/ghosting).
- Seams at joints are feathered with a soft alpha gradient (6px).
- Shoulder seams are hidden by rendering torso ON TOP of arms (higher z).
- Torso x-bounds are auto-detected by scanning for the narrowest point in
  the mid-body silhouette (the armpit region).
- A Pygame joint editor lets you fine-tune y-cut positions if auto fails.

Usage
-----
    pip install opencv-python pillow numpy scipy scikit-image rembg pygame
    python rig_character.py your_drawing.png
    python rig_character.py your_drawing.png --out my_char --no-editor

    # Then open <out>/index.html in a browser!

Controls in joint editor
------------------------
  Click          — place next joint
  Drag           — reposition existing joint
  Right-click    — remove nearest joint
  R              — reset all
  ENTER          — confirm and export
  ESC            — quit
"""

import os, sys, json, argparse, math
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage

try:
    import pygame
    HAS_PYGAME = True
except ImportError:
    HAS_PYGAME = False

try:
    from rembg import remove as rembg_remove
    HAS_REMBG = True
except ImportError:
    HAS_REMBG = False


# ─────────────────────────────────────────────────────────────────────────────
# 1. Background removal
# ─────────────────────────────────────────────────────────────────────────────

def remove_background(image_path: str) -> np.ndarray:
    """Returns H×W×4 RGBA numpy array with background removed."""
    img_pil = Image.open(image_path).convert("RGBA")

    if HAS_REMBG:
        print("[1] Removing background with rembg (AI)...")
        return np.array(rembg_remove(img_pil))

    print("[1] Removing background with adaptive threshold...")
    img  = np.array(img_pil)
    gray = cv2.cvtColor(img[:, :, :3], cv2.COLOR_RGB2GRAY)

    border = np.concatenate([gray[:8,:].ravel(), gray[-8:,:].ravel(),
                              gray[:,:8].ravel(), gray[:,-8:].ravel()])
    bg_med = float(np.median(border))

    if bg_med > 180:
        mask = cv2.adaptiveThreshold(gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 10)
    else:
        _, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)

    k    = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    mask = cv2.dilate(mask, k)
    mask = ndimage.binary_fill_holes(mask > 0).astype(np.uint8) * 255

    lbl, n = ndimage.label(mask)
    if n > 1:
        szs  = ndimage.sum(mask, lbl, range(1, n+1))
        mask = (lbl == (int(np.argmax(szs)) + 1)).astype(np.uint8) * 255

    result = img.copy()
    result[:, :, 3] = mask
    return result


# ─────────────────────────────────────────────────────────────────────────────
# 2. Auto-detect torso x-bounds from silhouette narrowing
# ─────────────────────────────────────────────────────────────────────────────

def detect_torso_x(alpha: np.ndarray, y_top_frac=0.42, y_bot_frac=0.56):
    """
    Scans the silhouette between y_top_frac and y_bot_frac to find the
    narrowest horizontal span — this is the torso (arms have extended past it).
    Returns (x_left, x_right).
    """
    ih, iw = alpha.shape
    y0 = int(ih * y_top_frac)
    y1 = int(ih * y_bot_frac)

    left_edges, right_edges = [], []
    for y in range(y0, y1):
        row = alpha[y, :]
        nz  = np.where(row > 30)[0]
        if len(nz) > 10:
            left_edges.append(nz[0])
            right_edges.append(nz[-1])

    if not left_edges:
        return int(iw * 0.25), int(iw * 0.75)

    # Use median of middle 50% to ignore outliers
    def mid_median(arr):
        arr = sorted(arr)
        q1, q3 = len(arr)//4, 3*len(arr)//4
        return int(np.median(arr[q1:q3]))

    return mid_median(left_edges) + 4, mid_median(right_edges) - 4


# ─────────────────────────────────────────────────────────────────────────────
# 3. Joint editor (Pygame)
# ─────────────────────────────────────────────────────────────────────────────

JOINT_ORDER = [
    "head_top", "neck",
    "shoulder_left", "shoulder_right",
    "hip_left", "hip_right",
    "foot_left", "foot_right",
]
JOINT_COLORS = {
    "head_top":       (255,  80,  80),
    "neck":           (255, 160,  60),
    "shoulder_left":  ( 60, 200,  80),
    "shoulder_right": ( 60, 200,  80),
    "hip_left":       ( 80, 160, 255),
    "hip_right":      ( 80, 160, 255),
    "foot_left":      (255, 220,  40),
    "foot_right":     (255, 220,  40),
}
JOINT_LABELS = {
    "head_top":       "Head top",
    "neck":           "Neck / chin",
    "shoulder_left":  "Left shoulder",
    "shoulder_right": "Right shoulder",
    "hip_left":       "Left hip",
    "hip_right":      "Right hip",
    "foot_left":      "Left foot",
    "foot_right":     "Right foot",
}


def run_joint_editor(rgba: np.ndarray) -> dict:
    if not HAS_PYGAME:
        print("[!] pygame not installed — skipping editor, using auto joints")
        return {}

    pygame.init()
    ih, iw = rgba.shape[:2]
    scale  = min(680/ih, 560/iw, 1.0)
    dw, dh = int(iw*scale), int(ih*scale)
    PANEL  = 230
    screen = pygame.display.set_mode((dw+PANEL, max(dh, 520)))
    pygame.display.set_caption("Place joints → ENTER to confirm  |  R=reset  |  ESC=quit")

    # Build checker composite
    checker = np.zeros((ih, iw, 3), dtype=np.uint8)
    for r in range(0, ih, 16):
        for c in range(0, iw, 16):
            v = 200 if ((r//16+c//16)%2==0) else 155
            checker[r:r+16, c:c+16] = v
    rgb = rgba[:,:,:3]; a3 = rgba[:,:,3:4]/255.0
    comp = (rgb*a3 + checker*(1-a3)).astype(np.uint8)
    small = cv2.resize(comp, (dw, dh), interpolation=cv2.INTER_AREA)
    surf  = pygame.surfarray.make_surface(small.transpose(1,0,2))

    fb = pygame.font.SysFont("monospace", 14, bold=True)
    fs = pygame.font.SysFont("monospace", 12)

    joints     = {}
    drag_joint = None
    win_h      = screen.get_height()

    def i2s(x, y): return int(x*scale), int(y*scale)
    def s2i(sx,sy): return sx/scale, sy/scale

    def nearest(sx, sy, r=14):
        best, bd = None, r
        for n,(jx,jy) in joints.items():
            sx2,sy2 = i2s(jx,jy)
            d = math.hypot(sx-sx2, sy-sy2)
            if d < bd: best,bd = n,d
        return best

    def next_idx():
        return next((i for i,n in enumerate(JOINT_ORDER) if n not in joints), len(JOINT_ORDER))

    while True:
        # Draw
        screen.fill((38,38,42))
        screen.blit(surf, (0,0))

        for a,b in [("head_top","neck"),("neck","shoulder_left"),("neck","shoulder_right"),
                    ("neck","hip_left"),("neck","hip_right"),("hip_left","foot_left"),("hip_right","foot_right")]:
            if a in joints and b in joints:
                pygame.draw.line(screen,(255,255,255),i2s(*joints[a]),i2s(*joints[b]),2)

        for n,(jx,jy) in joints.items():
            sx,sy = i2s(jx,jy)
            c = JOINT_COLORS.get(n,(200,200,200))
            pygame.draw.circle(screen,c,(sx,sy),8)
            pygame.draw.circle(screen,(255,255,255),(sx,sy),8,2)
            screen.blit(fs.render(JOINT_LABELS[n],True,c),(sx+11,sy-7))

        pygame.draw.rect(screen,(28,28,32),(dw,0,PANEL,win_h))
        pygame.draw.line(screen,(65,65,75),(dw,0),(dw,win_h),1)
        px,y = dw+10, 12
        screen.blit(fb.render("JOINT EDITOR",True,(210,210,210)),(px,y)); y+=22
        for t in ["Click  = place","Drag   = move","RClick = remove","R = reset","ENTER  = done"]:
            screen.blit(fs.render(t,True,(110,110,110)),(px,y)); y+=15
        y += 8
        screen.blit(fb.render("JOINTS:",True,(200,200,200)),(px,y)); y+=18
        ni = next_idx()
        for i,n in enumerate(JOINT_ORDER):
            c  = JOINT_COLORS[n] if n in joints else (65,65,65)
            px2 = "✓ " if n in joints else ("→ " if i==ni else "  ")
            screen.blit(fs.render(px2+JOINT_LABELS[n],True,c),(px,y)); y+=16

        if ni < len(JOINT_ORDER):
            msg = "Place: "+JOINT_LABELS[JOINT_ORDER[ni]]
            mc  = JOINT_COLORS[JOINT_ORDER[ni]]
        else:
            msg,mc = "All done — press ENTER",(80,255,120)
        screen.blit(fb.render(msg,True,mc),(8,win_h-22))
        pygame.display.flip()

        for ev in pygame.event.get():
            if ev.type == pygame.QUIT: pygame.quit(); sys.exit()
            elif ev.type == pygame.KEYDOWN:
                if ev.key == pygame.K_ESCAPE: pygame.quit(); sys.exit()
                elif ev.key == pygame.K_r: joints.clear()
                elif ev.key == pygame.K_RETURN:
                    if len(joints) >= 4: pygame.quit(); return joints
            elif ev.type == pygame.MOUSEBUTTONDOWN:
                sx,sy = ev.pos
                if sx >= dw: continue
                if ev.button == 3:
                    h = nearest(sx,sy)
                    if h: del joints[h]
                elif ev.button == 1:
                    h = nearest(sx,sy)
                    if h: drag_joint = h
                    elif next_idx() < len(JOINT_ORDER):
                        joints[JOINT_ORDER[next_idx()]] = s2i(sx,sy)
            elif ev.type == pygame.MOUSEBUTTONUP:
                if ev.button == 1: drag_joint = None
            elif ev.type == pygame.MOUSEMOTION:
                if drag_joint and pygame.mouse.get_pressed()[0]:
                    sx,sy = ev.pos
                    if sx < dw: joints[drag_joint] = s2i(sx,sy)

    return joints


# ─────────────────────────────────────────────────────────────────────────────
# 4. Segmentation — clean alpha masks, no overlap
# ─────────────────────────────────────────────────────────────────────────────

FEATHER = 6   # px — soft edge width at seams


def _hmask(ih, iw, y0, y1):
    """Horizontal band mask: 1 inside [y0..y1], feathered at edges."""
    ys = np.arange(ih, dtype=float)
    m  = np.clip((ys-y0)/FEATHER, 0, 1) * np.clip((y1-ys)/FEATHER, 0, 1)
    return m.reshape(ih, 1) * np.ones((1, iw))

def _lof(ih, iw, x_edge):
    """Left-of mask: 1 left of x_edge, feathered."""
    xs = np.arange(iw, dtype=float)
    return (np.clip((x_edge-xs)/FEATHER, 0, 1)).reshape(1, iw) * np.ones((ih, 1))

def _rof(ih, iw, x_edge):
    """Right-of mask: 1 right of x_edge, feathered."""
    xs = np.arange(iw, dtype=float)
    return (np.clip((xs-x_edge)/FEATHER, 0, 1)).reshape(1, iw) * np.ones((ih, 1))


def segment_parts(rgba: np.ndarray, joints: dict) -> tuple:
    """
    Slices the character into 6 body parts with clean, non-overlapping alpha masks.

    Layer order (z): torso(4) > head(6) > arms(2) > legs(1)
    Torso renders ON TOP of arms — shoulder seam is hidden underneath.

    Returns (parts_dict, (char_x0, char_y0, char_x1, char_y1)).
    """
    ih, iw = rgba.shape[:2]
    alpha  = rgba[:, :, 3]

    def jy(n, fb): return joints[n][1] if n in joints else ih * fb
    def jx(n, fb): return joints[n][0] if n in joints else iw * fb

    y_neck     = jy("neck",          0.285)
    y_shoulder = min(jy("shoulder_left", 0.33), jy("shoulder_right", 0.33))
    y_hip      = min(jy("hip_left",  0.575), jy("hip_right", 0.575))
    y_foot     = max(jy("foot_left", 0.97),  jy("foot_right", 0.97))
    x_mid      = iw / 2

    # Auto-detect torso x bounds from silhouette narrowing
    x_tl, x_tr = detect_torso_x(alpha)
    print(f"[4] Torso x bounds: {x_tl}..{x_tr}  (of {iw}px width)")

    H, W = ih, iw

    # ── Build masks ────────────────────────────────────────────────────────
    # Head: top of character → neck
    head_mask = _hmask(H, W, 0, y_neck)

    # Torso: neck → hip, within torso x bounds (narrow waist region)
    torso_mask = (_hmask(H, W, y_neck, y_hip)
                  * _rof(H, W, x_tl)
                  * _lof(H, W, x_tr))

    # Arms: shoulder height → hip height, OUTSIDE torso x (no inner x clamp)
    # Torso (higher z) will cover the shoulder join area
    arm_band = _hmask(H, W, y_shoulder, y_hip)
    arm_left_mask  = arm_band * _lof(H, W, x_tl + FEATHER*2)
    arm_right_mask = arm_band * _rof(H, W, x_tr - FEATHER*2)

    # Legs: hip → foot, split at centre
    leg_band = _hmask(H, W, y_hip, y_foot)
    leg_left_mask  = leg_band * _lof(H, W, x_mid)
    leg_right_mask = leg_band * _rof(H, W, x_mid)

    def crop(x0, y0, x1, y1, mask, pxf=0.5, pyf=0.0, z=1):
        x0i, y0i = max(0, int(x0)), max(0, int(y0))
        x1i, y1i = min(W, int(x1)), min(H, int(y1))
        c = rgba[y0i:y1i, x0i:x1i].copy().astype(float)
        c[:, :, 3] *= mask[y0i:y1i, x0i:x1i]
        c = np.clip(c, 0, 255).astype(np.uint8)
        ph, pw = c.shape[:2]
        return {"img": c, "world_pos": (x0i, y0i),
                "pivot": (int(pw*pxf), int(ph*pyf)), "z": z}

    F = FEATHER
    parts = {
        "head":      crop(0,       0,          W,          y_neck+F,   head_mask,      0.5, 1.0, 6),
        "torso":     crop(x_tl,    y_neck,     x_tr,       y_hip+F,    torso_mask,     0.5, 0.0, 4),
        "arm_left":  crop(0,       y_shoulder, x_tl+F*3,  y_hip,      arm_left_mask,  1.0, 0.0, 2),
        "arm_right": crop(x_tr-F*3,y_shoulder, W,          y_hip,      arm_right_mask, 0.0, 0.0, 2),
        "leg_left":  crop(0,       y_hip,      x_mid+F,    y_foot,     leg_left_mask,  0.8, 0.0, 1),
        "leg_right": crop(x_mid-F, y_hip,      W,          y_foot,     leg_right_mask, 0.2, 0.0, 1),
    }

    bounds = (0, 0, W, int(y_foot))
    print(f"[4] Segmented {len(parts)} parts")
    return parts, bounds


# ─────────────────────────────────────────────────────────────────────────────
# 5. Save parts + rig JSON
# ─────────────────────────────────────────────────────────────────────────────

def save_outputs(parts: dict, bounds: tuple, out_dir: str) -> dict:
    parts_dir = os.path.join(out_dir, "parts")
    os.makedirs(parts_dir, exist_ok=True)

    x0, y0, x1, y1 = bounds
    char_w = max(x1-x0, 1)
    char_h = max(y1-y0, 1)
    rig = {"character": {"width": char_w, "height": char_h}, "parts": {}}

    for name, data in parts.items():
        arr  = data["img"]
        pil  = Image.fromarray(arr, "RGBA") if arr.shape[2] == 4 \
               else Image.fromarray(arr).convert("RGBA")
        pil.save(os.path.join(parts_dir, f"{name}.png"))

        wx, wy = data["world_pos"]
        px, py = data["pivot"]
        ih2, iw2 = arr.shape[:2]
        rig["parts"][name] = {
            "file": f"parts/{name}.png",
            "x": wx - x0, "y": wy - y0,
            "width": iw2, "height": ih2,
            "pivot_x": px, "pivot_y": py,
            "z": data["z"]
        }

    with open(os.path.join(out_dir, "rig.json"), "w") as f:
        json.dump(rig, f, indent=2)
    print(f"[5] Saved parts + rig.json → {out_dir}/")
    return rig


# ─────────────────────────────────────────────────────────────────────────────
# 6. HTML animator
# ─────────────────────────────────────────────────────────────────────────────

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Character Animator</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#f0ece4;--ground:#c8b89a;--gl:#a89070;--text:#2a2016;--accent:#e8622a;--bb:#2a2016;--bt:#f0ece4}
body{font-family:'Space Mono',monospace;background:var(--bg);color:var(--text);min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:2rem 1rem}
h1{font-size:1rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;margin-bottom:1.5rem;opacity:.5}
.stage{width:100%;max-width:800px;height:380px;position:relative;overflow:hidden;border-radius:4px;border:1.5px solid var(--gl);background:linear-gradient(to bottom,#d4e8f7 0%,#eee8de 68%,var(--ground) 68%)}
.gline{position:absolute;bottom:80px;left:0;right:0;height:2px;background:var(--gl)}
.gline::after{content:'';position:absolute;top:2px;left:0;right:0;height:40px;background:repeating-linear-gradient(90deg,transparent,transparent 38px,rgba(0,0,0,.07) 38px,rgba(0,0,0,.07) 40px)}
#char{position:absolute;bottom:82px;left:50%;transform:translateX(-50%)}
.part{position:absolute;transform-origin:var(--px) var(--py)}
.part img{display:block;width:100%;height:100%}
#shadow{position:absolute;bottom:76px;left:50%;transform:translateX(-50%);width:60px;height:10px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,.18) 0%,transparent 70%)}
.ctrls{margin-top:1.2rem;display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center;max-width:800px}
.btn{font-family:'Space Mono',monospace;font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.45rem .9rem;border:1.5px solid var(--bb);background:transparent;color:var(--bb);cursor:pointer;border-radius:2px;transition:background .12s,color .12s}
.btn:hover{background:var(--bb);color:var(--bt)}
.btn.active{border-color:var(--accent);background:var(--accent);color:#fff}
</style>
</head>
<body>
<h1>Character Animator</h1>
<div class="stage" id="stage">
  <div class="gline"></div>
  <div id="shadow"></div>
  <div id="char"></div>
</div>
<div class="ctrls" id="btns"></div>
<script>
const RIG=__RIG_JSON__;
const A={
  idle:{l:"Idle",fn(t){const b=Math.sin(t*2)*2,s=Math.sin(t*1.2)*1.5;return{head:{ty:b,r:s*.5},torso:{ty:b,r:s*.3},arm_left:{r:-8+Math.sin(t*1.8)*4,ty:b},arm_right:{r:8+Math.sin(t*1.8+Math.PI)*4,ty:b},leg_left:{r:2,ty:b},leg_right:{r:-2,ty:b}}}},
  walk:{l:"Walk",walk:true,spd:120,fn(t){const p=t*Math.PI*2*1.8,b=Math.abs(Math.sin(p))*-4,s=28;return{head:{ty:b,r:Math.sin(p)*2},torso:{ty:b,r:Math.sin(p)*3},arm_left:{r:Math.sin(p)*s*.7,ty:b},arm_right:{r:Math.sin(p+Math.PI)*s*.7,ty:b},leg_left:{r:Math.sin(p)*s,ty:b},leg_right:{r:Math.sin(p+Math.PI)*s,ty:b}}}},
  run:{l:"Run",walk:true,spd:260,fn(t){const p=t*Math.PI*2*3.2,b=Math.abs(Math.sin(p))*-8,s=44;return{head:{ty:b,r:Math.sin(p)*4},torso:{ty:b,r:Math.sin(p)*5},arm_left:{r:Math.sin(p+Math.PI)*s,ty:b},arm_right:{r:Math.sin(p)*s,ty:b},leg_left:{r:Math.sin(p)*s*1.2,ty:b},leg_right:{r:Math.sin(p+Math.PI)*s*1.2,ty:b}}}},
  wave:{l:"Wave",fn(t){const b=Math.sin(t*2)*2,w=Math.sin(t*6)*35-55;return{head:{ty:b,r:Math.sin(t*2)*5},torso:{ty:b},arm_left:{r:-10,ty:b},arm_right:{r:w,ty:b},leg_left:{r:4,ty:b},leg_right:{r:-4,ty:b}}}},
  bounce:{l:"Bounce",fn(t){const p=t*Math.PI*2*2,sq=Math.max(0,Math.sin(p)),ty=-sq*30,sX=1+sq*.06;return{head:{ty,sX},torso:{ty,sX},arm_left:{ty,r:Math.sin(p)*20},arm_right:{ty,r:-Math.sin(p)*20},leg_left:{ty:ty*.5,r:Math.sin(p)*10},leg_right:{ty:ty*.5,r:-Math.sin(p)*10}}}},
  dance:{l:"Dance",fn(t){const p=t*Math.PI*2*1.4,h=Math.abs(Math.sin(p))*-15,s=Math.sin(p)*12,n=Math.sin(p*2)*20;return{head:{r:s*.6,ty:h},torso:{r:s*.4,ty:h},arm_left:{r:-40+n,ty:h},arm_right:{r:40-n,ty:h},leg_left:{r:s*.8,ty:h*.5},leg_right:{r:-s*.8,ty:h*.5}}}},
  jump:{l:"Jump",fn(t){const ph=(t%1.2)/1.2,arc=Math.sin(ph*Math.PI)*-70,tk=ph>.2&&ph<.8,lr=tk?30:0,ar=tk?-80:10;return{head:{ty:arc},torso:{ty:arc},arm_left:{r:ar,ty:arc},arm_right:{r:-ar,ty:arc},leg_left:{r:lr,ty:arc},leg_right:{r:-lr,ty:arc}}}},
  spin:{l:"Spin",fn(t){const sX=Math.cos(t*Math.PI*2*.8);return{head:{sX},torso:{sX},arm_left:{sX},arm_right:{sX},leg_left:{sX},leg_right:{sX}}}},
};
const charEl=document.getElementById('char'),shadow=document.getElementById('shadow'),stage=document.getElementById('stage');
const cH=RIG.character.height,cW=RIG.character.width,sc=Math.min(230/cH,330/cW,1);
charEl.style.cssText=`width:${cW*sc}px;height:${cH*sc}px`;
const sorted=Object.entries(RIG.parts).sort((a,b)=>a[1].z-b[1].z);
const pels={};
for(const[n,p]of sorted){
  const el=document.createElement('div');
  el.className='part';el.id='p-'+n;
  const pw=(p.pivot_x/p.width*100).toFixed(1),ph=(p.pivot_y/p.height*100).toFixed(1);
  el.style.cssText=`left:${p.x*sc}px;top:${p.y*sc}px;width:${p.width*sc}px;height:${p.height*sc}px;--px:${pw}%;--py:${ph}%;z-index:${p.z}`;
  const img=document.createElement('img');img.src=p.file;img.draggable=false;
  el.appendChild(img);charEl.appendChild(el);pels[n]=el;
}
const bc=document.getElementById('btns');
let cur='idle',cx=-1,dir=1;
// Always read offsetWidth fresh — avoids stale value at parse time
function sw(){return stage.offsetWidth}
for(const[k,a]of Object.entries(A)){
  const b=document.createElement('button');
  b.className='btn'+(k==='idle'?' active':'');b.textContent=a.l;b.dataset.k=k;
  b.addEventListener('click',()=>{
    cur=k;dir=1;
    // Clamp cx into current stage bounds immediately
    const hw=cW*sc/2;
    cx=Math.max(hw+20, Math.min(sw()-hw-20, cx<0?sw()/2:cx));
    document.querySelectorAll('.btn').forEach(x=>x.classList.toggle('active',x.dataset.k===k));
  });
  bc.appendChild(b);
}
function pose(p){
  for(const[n,el]of Object.entries(pels)){
    const v=p[n]||{};
    el.style.transform=`translateX(${v.tx||0}px) translateY(${v.ty||0}px) rotate(${v.r||0}deg) scaleX(${v.sX||1})`;
  }
}
let t0=null;
function tick(ts){
  // Init cx on first frame so offsetWidth is definitely ready
  if(!t0){t0=ts;cx=sw()/2}
  const t=(ts-t0)/1000,dt=Math.min((ts-(tick._l??ts))/1000,.05);
  tick._l=ts;
  const a=A[cur]; pose(a.fn(t,dir));
  if(a.walk){
    cx+=dir*a.spd*dt;
    const hw=cW*sc/2, W=sw();
    // Bounce off walls with a margin of one character-half-width
    if(cx>W-hw)  {cx=W-hw;  dir=-1;}
    if(cx<hw)    {cx=hw;    dir= 1;}
    charEl.style.transform=`translateX(calc(${cx}px - 50%)) scaleX(${dir<0?-1:1})`;
    shadow.style.left=cx+'px';
  } else {
    charEl.style.transform='translateX(-50%)';shadow.style.left='50%';
  }
  shadow.style.width=(50+Math.sin(t*4)*5)+'px';
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
</script>
</body>
</html>
"""


def generate_html(rig: dict, out_dir: str) -> str:
    path = os.path.join(out_dir, "index.html")
    with open(path, "w") as f:
        f.write(HTML.replace("__RIG_JSON__", json.dumps(rig, indent=2)))
    print(f"[6] Generated {path}")
    return path


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main(image_path: str, out_dir: str = None, use_editor: bool = True):
    if out_dir is None:
        out_dir = os.path.splitext(os.path.basename(image_path))[0] + "_animated"
    os.makedirs(out_dir, exist_ok=True)

    print("=" * 56)
    print("  Character Rigger & Web Animator")
    print("=" * 56)
    print(f"  Input:  {image_path}")
    print(f"  Output: {out_dir}/\n")

    rgba = remove_background(image_path)

    joints = {}
    if use_editor and HAS_PYGAME:
        print("[2] Opening joint editor — place joints then press ENTER...")
        joints = run_joint_editor(rgba)
        print(f"    Joints: {list(joints.keys())}")
    else:
        print("[2] Skipping editor — using auto-detected proportions")

    parts, bounds = segment_parts(rgba, joints)
    rig           = save_outputs(parts, bounds, out_dir)
    html_path     = generate_html(rig, out_dir)

    print("\n" + "=" * 56)
    print("  Done! Open in your browser:")
    print(f"  {os.path.abspath(html_path)}")
    print("=" * 56)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Character Rigger & Web Animator")
    p.add_argument("image",        help="Input image (PNG, JPG)")
    p.add_argument("--out",        default=None, help="Output directory")
    p.add_argument("--no-editor",  action="store_true", help="Skip joint editor, use auto-proportions")
    args = p.parse_args()

    if not os.path.exists(args.image):
        print(f"File not found: {args.image}"); sys.exit(1)

    main(args.image, args.out, use_editor=not args.no_editor)