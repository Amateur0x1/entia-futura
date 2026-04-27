from PIL import Image, ImageFilter
import numpy as np

img = Image.open('public/brand/entia-logo-cyan.png').convert('RGBA')
data = np.array(img, dtype=np.float32)

r, g, b, a = data[...,0], data[...,1], data[...,2], data[...,3]

# ── Step 1: identify the cyan circle region ──────────────────────────────
# Cyan pixels: low R, high G, high B
is_cyan = (r < 80) & (g > 160) & (b > 160) & (a > 10)
print(f"Cyan pixels: {is_cyan.sum()}")

# Convert cyan mask to PIL Image for morphological operations
cyan_mask_img = Image.fromarray((is_cyan * 255).astype(np.uint8), 'L')

# Fill holes: use a large max-filter to "close" any holes inside the circle,
# then apply multiple dilate passes to cover anti-aliased edges of lines
# Step A: fill holes by taking the convex region
# We do this by flood-filling from the border (outside) then inverting
cyan_arr = np.array(cyan_mask_img)
H, W = cyan_arr.shape

# Simple flood fill from all 4 border edges to find "outside" pixels
from collections import deque

outside = np.zeros((H, W), dtype=bool)
queue = deque()

# Seed from all border pixels that are NOT cyan
for x in range(W):
    if not is_cyan[0, x]:
        outside[0, x] = True
        queue.append((0, x))
    if not is_cyan[H-1, x]:
        outside[H-1, x] = True
        queue.append((H-1, x))
for y in range(H):
    if not is_cyan[y, 0]:
        outside[y, 0] = True
        queue.append((y, 0))
    if not is_cyan[y, W-1]:
        outside[y, W-1] = True
        queue.append((y, W-1))

# BFS flood fill through non-cyan pixels
while queue:
    y, x = queue.popleft()
    for dy, dx in ((-1,0),(1,0),(0,-1),(0,1)):
        ny, nx = y+dy, x+dx
        if 0 <= ny < H and 0 <= nx < W and not outside[ny, nx] and not is_cyan[ny, nx]:
            outside[ny, nx] = True
            queue.append((ny, nx))

# Inside = not outside and not originally cyan → these are "holes" inside circle
# The cyan circle itself is already is_cyan
# Filled circle = is_cyan OR (not outside, meaning enclosed by cyan)
cyan_filled = is_cyan | (~outside)
print(f"Cyan filled region: {cyan_filled.sum()}")

# Dilate by ~24px using PIL max filter to cover border anti-alias + line edges
cyan_filled_img = Image.fromarray((cyan_filled * 255).astype(np.uint8), 'L')
# Each MaxFilter pass of size 3 = 1px dilation; do many passes efficiently
# Use a larger kernel directly: size=49 ≈ 24px dilation
cyan_region_img = cyan_filled_img.filter(ImageFilter.MaxFilter(size=49))
cyan_region = np.array(cyan_region_img) > 128
print(f"Cyan region (after fill+dilate): {cyan_region.sum()}")

# ── Step 2: classify pixels ───────────────────────────────────────────────
is_dark = (r < 110) & (g < 110) & (b < 110) & (a > 10)
is_white_bg = (r > 215) & (g > 215) & (b > 215) & (a > 10) & (~is_cyan)

dark_inside_cyan  = is_dark & cyan_region
dark_outside_cyan = is_dark & (~cyan_region)
print(f"Dark inside cyan (keep black): {dark_inside_cyan.sum()}")
print(f"Dark outside cyan (→ white):   {dark_outside_cyan.sum()}")

out = data.copy()

# White background → transparent
out[is_white_bg, 3] = 0

# Dark lines outside cyan → white
out[dark_outside_cyan, 0] = 255
out[dark_outside_cyan, 1] = 255
out[dark_outside_cyan, 2] = 255

# Anti-aliased grey pixels outside cyan circle → invert to near-white
is_grey_outside = (
    (r < 200) & (g < 200) & (b < 200) &
    (a > 10) & (~cyan_region) & (~is_white_bg) & (~is_dark)
)
grey_brightness = (r + g + b) / 3.0
new_brightness = np.clip(255 - grey_brightness, 180, 255)
out[is_grey_outside, 0] = new_brightness[is_grey_outside]
out[is_grey_outside, 1] = new_brightness[is_grey_outside]
out[is_grey_outside, 2] = new_brightness[is_grey_outside]
print(f"Grey anti-alias outside (→ near-white): {is_grey_outside.sum()}")

result = Image.fromarray(out.astype(np.uint8), 'RGBA')
result.save('public/brand/entia-logo-white-lines.png')
print("Saved entia-logo-white-lines.png")
