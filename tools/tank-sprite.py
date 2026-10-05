# Generates the pixel aquascape on the life page: python3 tools/tank-sprite.py
# Paste its output in place of the <svg class="scape"> element in index.html.
# Same approach as buddy-sprite.py: a grid of characters, one per pixel, drawn in fill colours,
# with outline() adding the dark edge around solid things (fish, rock, wood).
import random

PAL = {
  'K': '#2b1c14',                                  # outline
  'W': '#bcdad1', 'w': '#d4e8e1',                  # water, the lighter band at the surface
  'D': '#4a3a2c', 'd': '#6a5443', 'e': '#3a2c21',  # soil, pebbles, dark grains
  'G': '#6e6f69', 'g': '#8f908a', 'f': '#55564f',  # rock, highlight, shade
  'B': '#5d3f2a', 'b': '#7a573a',                  # driftwood, highlight
  'L': '#7cbd57', 'l': '#4f8f3a', 'm': '#3b6e2c',  # greens: leaf, stem, deep
  'R': '#d9697c', 'r': '#b9435a',                  # rotala pink tops
  'O': '#e07a4a', 'o': '#c2552f',                  # ludwigia and ember tetras
  'N': '#4fb3e6', 'n': '#e4453f',                  # neon tetra blue stripe, red belly
  'P': '#e9a36a',                                  # rasbora
  'E': '#1b120d',                                  # eyes
  'u': '#eef6f3',                                  # bubbles
}
W, H = 112, 44
SOIL = 37          # first row of substrate
rnd = random.Random(7)

def grid():
    return [['.'] * W for _ in range(H)]

def put(g, y, x, c):
    if 0 <= y < H and 0 <= x < W:
        g[y][x] = c

def fill(g, y0, y1, x0, x1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(g, y, x, c)

def outline(g):
    edge = []
    for y in range(H):
        for x in range(W):
            if g[y][x] != '.':
                continue
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < H and 0 <= xx < W and g[yy][xx] not in '.K':
                    edge.append((y, x))
                    break
    for y, x in edge:
        g[y][x] = 'K'
    return g

def rects(g, cls=None):
    out = []
    for y, row in enumerate(g):
        x = 0
        while x < W:
            c = row[x]
            if c in PAL:
                x2 = x
                while x2 < W and row[x2] == c:
                    x2 += 1
                out.append(f'<rect x="{x}" y="{y}" width="{x2 - x}" height="1" fill="{PAL[c]}"/>')
                x = x2
            else:
                x += 1
    return ''.join(out)

# ---------- the tank ----------

def water():
    g = grid()
    fill(g, 0, SOIL - 1, 0, W - 1, 'W')
    fill(g, 0, 1, 0, W - 1, 'w')
    fill(g, SOIL, H - 1, 0, W - 1, 'D')
    for _ in range(90):               # pebbles and dark grains in the soil
        put(g, rnd.randint(SOIL, H - 1), rnd.randint(0, W - 1), rnd.choice('dde'))
    for x in range(0, W, 3):          # the soil line is uneven
        if rnd.random() < 0.5:
            put(g, SOIL - 1, x, 'D')
    return g

def rock(x0, top, width):
    """A rounded boulder sitting on the soil."""
    g = grid()
    height = SOIL - top
    for i in range(height):
        y = top + i
        shrink = max(0, int((height - 1 - i) * 0.9) - 1) if i < 3 else 0
        fill(g, y, y, x0 + shrink, x0 + width - 1 - shrink, 'G')
    fill(g, top + 1, top + 2, x0 + 3, x0 + 6, 'g')             # a highlight on top
    for y in range(top + 3, SOIL):                              # shade down the right side
        fill(g, y, y, x0 + width - 4, x0 + width - 2, 'f')
    return outline(g)

def wood(x0, y0, length):
    """A branch of driftwood rising to the right, with a twig."""
    g = grid()
    x, y = x0, y0
    for i in range(length):
        fill(g, y, y + 1, x, x + 1, 'B')
        put(g, y, x, 'b')
        x += 1
        if i % 3 != 2:
            y -= 1
    tx, ty = x0 + length // 2, y0 - length // 2 + 2             # the twig
    for i in range(6):
        fill(g, ty - i, ty - i, tx + i, tx + i, 'B')
    return outline(g)

def hairgrass(xs):
    """Short blades across the front, a carpet."""
    g = grid()
    for x in xs:
        h = rnd.randint(3, 6)
        lean = rnd.choice((-1, 0, 1))
        for i in range(h):
            put(g, SOIL - 1 - i, x + (lean if i >= h - 2 else 0), 'l' if i < 2 else 'L')
    return g

def rotala(stems):
    """Tall thin stems with small paired leaves that turn pink toward the light."""
    g = grid()
    for x, h in stems:
        for i in range(h):
            y = SOIL - 1 - i
            top = i / h
            put(g, y, x, 'm' if top < 0.5 else ('l' if top < 0.75 else 'r'))
            if i % 2 == 1 and i > 1:
                leaf = 'L' if top < 0.55 else ('R' if top < 0.9 else 'r')
                put(g, y, x - 1, leaf)
                put(g, y, x + 1, leaf)
        put(g, SOIL - 1 - h, x, 'R')
    return g

def ludwigia(stems):
    """Bushier stems with paired oval leaves, green below and orange-red toward the top."""
    g = grid()
    for x, h in stems:
        for i in range(h):
            y = SOIL - 1 - i
            top = i / h
            put(g, y, x, 'm' if top < 0.6 else 'o')
            if i % 2 == 0 and i > 0:
                leaf = 'L' if top < 0.4 else ('O' if top < 0.8 else 'o')
                fill(g, y, y, x - 2, x - 1, leaf)
                fill(g, y, y, x + 1, x + 2, leaf)
                if i % 4 == 0:                                  # every other pair tilts up a little
                    put(g, y - 1, x - 2, leaf)
                    put(g, y - 1, x + 2, leaf)
        fill(g, SOIL - 1 - h, SOIL - 1 - h, x - 1, x + 1, 'O')  # the crown
        put(g, SOIL - 2 - h, x, 'o')
    return g

def fish(kind):
    """A little fish facing right, outlined: 7 wide and 3 tall before the outline."""
    g = [['.'] * 9 for _ in range(5)]
    body = {'ember': 'O', 'neon': 'N', 'rasbora': 'P'}[kind]
    for x in range(3, 7): g[1][x] = body
    for x in range(1, 8): g[2][x] = body
    for x in range(3, 7): g[3][x] = body
    g[0][1] = body; g[4][1] = body                              # the tail fork
    if kind == 'neon':
        for x in range(2, 7): g[3][x] = 'n'                     # red belly under the blue
    if kind == 'rasbora':
        g[2][5] = 'K'; g[3][5] = 'K'; g[2][6] = 'K'             # the dark wedge
    g[2][7] = 'E'
    h, w = len(g), len(g[0])
    for y in range(h):
        for x in range(w):
            if g[y][x] == '.':
                for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= yy < h and 0 <= xx < w and g[yy][xx] not in '.K':
                        g[y][x] = 'K'
                        break
    return ''.join(f'<rect x="{x}" y="{y}" width="1" height="1" fill="{PAL[c]}"/>'
                   for y, row in enumerate(g) for x, c in enumerate(row) if c in PAL)

layers = [
    ('water', water()),
    ('rock', rock(22, 28, 16)),
    ('plants sway', rotala([(6, 24), (9, 20), (12, 27), (15, 22), (18, 18)])),
    ('plants sway', ludwigia([(48, 16), (53, 20), (58, 14), (63, 18)])),
    ('wood', wood(70, 35, 24)),
    ('plants sway', rotala([(97, 21), (101, 26), (105, 19), (108, 23)])),
    ('plants sway', ludwigia([(82, 12), (87, 15)])),
    ('plants sway', hairgrass([x for x in range(1, W, 2) if not 21 <= x <= 38])),
]
FISH = [  # kind, x, y, swim distance (px), seconds, delay
    ('neon', 24, 6, 60, 14, 0), ('neon', 30, 9, 56, 13, -5), ('neon', 20, 12, 62, 15, -9),
    ('ember', 62, 5, 38, 11, -3), ('ember', 68, 9, 32, 12, -7), ('ember', 74, 3, 30, 10, -1),
    ('rasbora', 40, 17, 44, 16, -6), ('rasbora', 86, 21, 18, 13, -4),
]
svg = [f'<svg class="scape" viewBox="0 0 {W} {H}" shape-rendering="crispEdges" aria-hidden="true">']
for cls, g in layers:
    svg.append(f'<g class="{cls}">{rects(g)}</g>')
for i, (kind, x, y, d, t, delay) in enumerate(FISH):
    svg.append(f'<g transform="translate({x} {y})"><g class="swim" style="--d: {d}px; animation-duration: {t}s; animation-delay: {delay}s">'
               f'<g class="bob" style="animation-delay: {-i * 0.7}s">{fish(kind)}</g></g></g>')
for i, (x, y) in enumerate([(30, 27), (31, 27), (29, 27), (90, 30), (91, 30)]):
    svg.append(f'<g class="bubble" style="animation-delay: {-i * 1.3}s" transform="translate({x} {y})"><rect width="1" height="1" fill="{PAL["u"]}"/></g>')
svg.append('</svg>')
print(''.join(svg))
