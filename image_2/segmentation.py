import torch
import cv2
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from segment_anything import sam_model_registry, SamAutomaticMaskGenerator

# -----------------------------
# Load SAM model
# -----------------------------
sam_checkpoint = "sam_vit_b.pth"
model_type = "vit_b"
device = "cpu"

sam = sam_model_registry[model_type](checkpoint=sam_checkpoint)
sam.to(device)

# -----------------------------
# Load Image
# -----------------------------
image = cv2.imread("penguin.png")
image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# -----------------------------
# Automatic Mask Generator
# (detects all objects)
# -----------------------------
mask_generator = SamAutomaticMaskGenerator(
    sam,
    points_per_side=16,            # faster on laptops
    pred_iou_thresh=0.86,
    stability_score_thresh=0.92,
)

masks = mask_generator.generate(image)

print(f"Found {len(masks)} masks")

# -----------------------------
# Choose the largest object
# -----------------------------
largest_mask = max(masks, key=lambda x: x["area"])["segmentation"]

# Show mask
plt.imshow(largest_mask)
plt.title("Detected Mask")
plt.axis("off")
plt.show()

# -----------------------------
# Apply mask to image
# -----------------------------
masked = image.copy()
masked[~largest_mask] = 0

plt.imshow(masked)
plt.title("Segmented Character")
plt.axis("off")
plt.show()

# -----------------------------
# Save transparent PNG
# -----------------------------
rgba = np.dstack((masked, largest_mask * 255))
Image.fromarray(rgba.astype(np.uint8)).save("character.png")

print("Saved segmented character as character.png")