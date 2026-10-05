# Generates the pixel buddy SVG on the home page: python3 tools/buddy-sprite.py
# Paste its output in place of the <svg class="buddy"> element in index.html.
# Pixel sprite frames for the walking buddy. 16 x 27 grid, one char per pixel.
PAL = {
  'K': '#231812',                   # outline
  'H': '#23160f', 'h': '#4a3022',   # hair, highlight
  'S': '#c98c62', 's': '#a86f4b',   # skin, shadow
  'E': '#1b120d', 'M': '#8a3b2b', 'c': '#d77d63',  # eyes, mouth, blush
  'T': '#f6f4ef', 't': '#d9d4ca',   # white tee, shadow
  'N': '#151515',                   # swoosh
  'P': '#1d1d21', 'p': '#38383f',   # black pants, highlight
  'B': '#f6f4ef', 'b': '#cfc8bb',   # white sneakers, sole shadow
}
LEFT = [                 # left half (cols 0-7); the right half mirrors it
  "....KKKK",  # 0
  "...KHHHK",  # 1  center part
  "..KHHhHS",  # 2
  "..KHhHHS",  # 3
  ".KHHHHSS",  # 4
  ".KHHHSSS",  # 5
  ".KHSSSSS",  # 6  hair ends at the temples
  ".KSSESSS",  # 7  eyes
  ".KSSESSS",  # 8
  ".KscSSSS",  # 9  blush
  "..KSSSSM",  # 10 mouth
  "...KsSSS",  # 11
  "....KKSS",  # 12 chin
  "......KS",  # 13 neck
  "...KKTTT",  # 14 shoulders
  "..KTTTTT",  # 15
  ".KTTTTTT",  # 16 sleeves
  ".KSKTTTT",  # 17 arms
  ".KSKTTTT",  # 18
  ".KSKtttt",  # 19 hem
  ".KsKPPPP",  # 20 hands, waistband
  "..KKPPPP",  # 21
  "...KPPPK",  # 22 legs
  "...KpPPK",  # 23
  "..KBBBBK",  # 24 sneakers
  "..KbbbbK",  # 25
  "..KKKKKK",  # 26
]
OX = 3            # padding so raised arms fit
W, H = 16 + 2 * OX, len(LEFT)

def base():
    g = []
    for row in LEFT:
        right = row[::-1]
        g.append(list('.' * OX + row + right + '.' * OX))
    # asymmetric details: swoosh on the chest, swooshes on the shoes
    put(g, 16, 10, "N"); put(g, 17, 8, "NN")
    put(g, 24, 4, "N"); put(g, 24, 10, "N")
    return g

def put(g, y, x, s):
    for i, c in enumerate(s):
        g[y][x + OX + i] = c

def copy(g): return [r[:] for r in g]

def lift_leg(g, side):
    """Raise one leg a pixel (walk pose). side: 'L' or 'R' (viewer's left/right)."""
    cols = range(2 + OX, 8 + OX) if side == 'L' else range(8 + OX, 14 + OX)
    for y in range(21, 27):
        for x in cols:
            g[y - 1][x] = g[y][x] if y > 21 else g[y - 1][x]
    for x in cols:
        g[26][x] = '.'
    return g

def swing_arm(g, side):
    """Shift one hand up a pixel so the arms look like they swing."""
    x = tuple(v + OX for v in ((1, 2, 3) if side == 'L' else (12, 13, 14)))
    for y in range(17, 21):
        for xx in x:
            g[y - 1][xx] = g[y][xx] if y > 17 else g[y - 1][xx]
    for xx in x:
        g[20][xx] = '.' if xx in (1 + OX, 14 + OX) else g[20][xx]
    return g

# a raised right arm in body coordinates (the 16-wide body; may spill into the padding)
ARM_UP = {
    'high': [(8, 15, 'K'), (8, 16, 'K'),
             (9, 14, 'K'), (9, 15, 'S'), (9, 16, 'S'), (9, 17, 'K'),
             (10, 14, 'K'), (10, 15, 'S'), (10, 16, 's'), (10, 17, 'K'),
             (11, 14, 'K'), (11, 15, 'S'), (11, 16, 'S'), (11, 17, 'K'),
             (12, 13, 'K'), (12, 14, 'S'), (12, 15, 'S'), (12, 16, 'K'),
             (13, 13, 'K'), (13, 14, 'S'), (13, 15, 'S'), (13, 16, 'K'),
             (14, 13, 'T'), (14, 14, 'T'), (14, 15, 'K'),
             (15, 13, 'T'), (15, 14, 'T'), (15, 15, 'K')],
    'tilt': [(9, 16, 'K'), (9, 17, 'K'),
             (10, 15, 'K'), (10, 16, 'S'), (10, 17, 'S'), (10, 18, 'K'),
             (11, 15, 'K'), (11, 16, 'S'), (11, 17, 's'), (11, 18, 'K'),
             (12, 14, 'K'), (12, 15, 'S'), (12, 16, 'S'), (12, 17, 'K'),
             (13, 13, 'K'), (13, 14, 'S'), (13, 15, 'S'), (13, 16, 'K'),
             (14, 13, 'T'), (14, 14, 'T'), (14, 15, 'K'),
             (15, 13, 'T'), (15, 14, 'T'), (15, 15, 'K')],
}

def raise_arm(g, side, pose):
    """Raise one arm. pose 'high' (hand up) or 'tilt' (hand waving out to the side)."""
    mirror = (lambda x: x) if side == 'R' else (lambda x: 15 - x)
    for y in range(17, 21):            # remove the hanging arm, close the torso edge
        for x in (12, 13, 14):
            g[y][mirror(x) + OX] = '.'
        g[y][mirror(12) + OX] = 'K'
    for y, x, ch in ARM_UP[pose]:
        g[y][mirror(x) + OX] = ch
    return g

def tuck_legs(g):
    """Jump pose: knees up, shoes pulled in."""
    for y in range(22, 27):
        for x in range(W): g[y][x] = '.'
    put(g, 22, 3, "KBBBK..KBBBK")
    put(g, 23, 3, "KbbbK..KbbbK")
    put(g, 24, 3, "KKKKK..KKKKK")
    put(g, 22, 4, "N"); put(g, 22, 11, "N")
    return g

FRAMES = {}
FRAMES['stand'] = base()
FRAMES['walk1'] = swing_arm(lift_leg(base(), 'L'), 'R')
FRAMES['walk2'] = swing_arm(lift_leg(base(), 'R'), 'L')
FRAMES['jump']  = tuck_legs(raise_arm(raise_arm(base(), 'L', 'high'), 'R', 'high'))
FRAMES['wave1'] = raise_arm(base(), 'R', 'high')
FRAMES['wave2'] = raise_arm(base(), 'R', 'tilt')

def rects(g):
    out = []
    for y, row in enumerate(g):
        x = 0
        while x < W:
            c = row[x]
            if c in PAL:
                x2 = x
                while x2 < W and row[x2] == c: x2 += 1
                out.append(f'<rect x="{x}" y="{y}" width="{x2-x}" height="1" fill="{PAL[c]}"/>')
                x = x2
            else:
                x += 1
    return ''.join(out)

svg = [f'<svg class="buddy" viewBox="0 0 {W} {H}" shape-rendering="crispEdges" data-f="stand" aria-hidden="true">']
for name, g in FRAMES.items():
    svg.append(f'<g class="f f-{name}">{rects(g)}</g>')
svg.append('</svg>')
print(''.join(svg))
