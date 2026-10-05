# Generates the pixel buddy for the home page: python3 tools/buddy-sprite.py
# Prints two SVGs, the standing sprite and the desk scene. Paste them in place of the
# <svg class="buddy"> and <svg class="buddy-desk"> elements in index.html.
#
# Everything is drawn as text, one character per pixel. Shapes are drawn in their fill
# colours; outline() then draws the dark Stardew-style edge around each layer.

PAL = {
  'K': '#2b1c14',                                  # outline
  'H': '#201b1f', 'h': '#45393f', 'g': '#0e0b0d',  # black hair, highlight strands, shadow (also the brows)
  'S': '#d4a47c', 's': '#b3835c',                  # skin, shadow
  'E': '#1b120d', 'M': '#a8604a',                  # eyes, mouth
  'R': '#8b2e1f', 'r': '#6c2216', 'W': '#efe6d6',  # red hoodie, shadow, drawstrings
  'P': '#34466b', 'p': '#26344f',                  # jeans
  'B': '#f1ece2', 'b': '#c4bcae',                  # sneakers
  'D': '#5a3a22', 'd': '#7a5230',                  # chair
  'T': '#c08a52', 'U': '#9c6b3c',                  # desk top, desk body
  'L': '#9a9aa3', 'l': '#5f5f66', 'N': '#1c2030',  # laptop body, keyboard, screen
  'v': '#c678dd', 'y': '#e5c07b', 'A': '#61afef',  # code: purple, yellow, blue
  'G': '#98c379', 'o': '#d19a66', 'C': '#e6e9f0',  # code: green, orange, cursor
  'm': '#efe7d6', 'q': '#b9b4a8',                  # mug, steam
}

# The standing body, 25 wide. Hair rows 7-8 are the textured fringe: uneven tufts with skin showing between them.
STAND = """
.......KKKKKKKKKK.......
.....KKHhHHHhHHHHKK.....
....KHhHHHhHHHhHHHHKK...
...KHHhHHhHHHHHhHHhHHK..
...KHhHHHHhHHhHHHHHhHK..
...KHHhHHHHHgHHHhHHHHK..
...KHHHHHgSSgHHhHHhHHK..
...KHhHHSSSSSgHHHHHHhK..
...KHHHSSSSSSSgHhHHHHK..
...KHHSSSSSSSSSSgHHhHK..
...KHSSggSSSSSSggSHHHK..
...KHSSEESSSSSSEESHhHK..
...KHSSSSSSSsSSSSSHHHK..
....KHSSSSSSSSSSSSHhK...
.....KSSSSSMMSSSSSHK....
......KsSSSSSSSSSsK.....
........KKKsSSsKKK......
........KKRRRRRKK........
......KKRRRWRWRRRKK......
....KRRKRRRRWRWRRRRKRRK..
....KRRKRRRRRRRRRRRKRRK..
....KRRKRRRRRRRRRRRKRRK..
....KrRKrRRRRRRRRRrKRrK..
....KSSKrrrrrrrrrrrKSSK..
....KKKKPPPPPPPPPKKKK....
.......KPPPPpPPPPK.......
.......KPPPPKPPPPK.......
.......KPPPKKKPPPK.......
.......KPPPK.KPPPK.......
.......KpPPK.KPPpK.......
......KBBBBK.KBBBBK......
......KbbbbK.KbbbbK......
......KKKKKK.KKKKKK......
"""
SW, SH = 25, 33

def grid(w, h):
    return [['.'] * w for _ in range(h)]

def rows_of(text):
    return [r.ljust(SW, '.') for r in text.strip('\n').split('\n')]

def blit(g, rows, dx=0, dy=0):
    for y, row in enumerate(rows):
        for x, c in enumerate(row):
            if c != '.':
                g[y + dy][x + dx] = c

def paint(g, cells):
    for y, x, c in cells:
        g[y][x] = c

def fill(g, y0, y1, x0, x1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            g[y][x] = c

def clear(g, y0, y1, x0, x1):
    fill(g, y0, y1, x0, x1, '.')

def outline(g):
    """Draw the dark edge: every empty cell next to a coloured one becomes outline."""
    h, w = len(g), len(g[0])
    edge = []
    for y in range(h):
        for x in range(w):
            if g[y][x] != '.':
                continue
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < h and 0 <= xx < w and g[yy][xx] not in '.K':
                    edge.append((y, x))
                    break
    for y, x in edge:
        g[y][x] = 'K'
    return g

def rects(g):
    out = []
    for y, row in enumerate(g):
        x = 0
        while x < len(row):
            c = row[x]
            if c in PAL:
                x2 = x
                while x2 < len(row) and row[x2] == c:
                    x2 += 1
                out.append(f'<rect x="{x}" y="{y}" width="{x2 - x}" height="1" fill="{PAL[c]}"/>')
                x = x2
            else:
                x += 1
    return ''.join(out)

# ---------- standing frames ----------

def stand():
    g = grid(SW, SH)
    blit(g, rows_of(STAND))
    return g

# the right arm raised from the shoulder, outside the head; hand up, and hand bobbed down
WAVE_UP = [(8, 22, 'K'), (8, 23, 'K'),
           (9, 22, 'S'), (9, 23, 'S'), (10, 22, 'S'), (10, 23, 'S'), (11, 22, 's'), (11, 23, 'S'),
           (12, 22, 'R'), (12, 23, 'R'), (13, 22, 'R'), (13, 23, 'R'), (14, 22, 'R'), (14, 23, 'R'),
           (15, 21, 'R'), (15, 22, 'R'), (16, 21, 'R'), (16, 22, 'R'),
           (17, 20, 'R'), (17, 21, 'R'), (18, 18, 'R'), (18, 19, 'R'), (18, 20, 'R')]
WAVE_DOWN = [(10, 22, 'K'), (10, 23, 'K'),
             (11, 22, 'S'), (11, 23, 'S'), (12, 22, 'S'), (12, 23, 'S'), (13, 22, 's'), (13, 23, 'S'),
             (14, 22, 'R'), (14, 23, 'R'), (15, 22, 'R'), (15, 23, 'R'),
             (16, 21, 'R'), (16, 22, 'R'), (17, 20, 'R'), (17, 21, 'R'),
             (18, 18, 'R'), (18, 19, 'R'), (18, 20, 'R')]

def wave(cells):
    g = stand()
    clear(g, 19, 24, 18, 22)          # drop the hanging right arm
    fill(g, 19, 23, 17, 17, 'K')      # close the side of the torso
    arm = grid(SW, SH)
    paint(arm, cells)
    outline(arm)
    blit(g, [''.join(r) for r in arm])
    return g

# Him from the side, facing right: hair at the back, the fringe falling over his forehead at the front.
PROFILE = """
.....KKKKKKKK...
...KKHhHHHhHHKK.
..KHhHHHHhHHHhHK
.KHHhHHhHHHHHHHK
.KHhHHHhHHHHhHHK
.KHHHhHHHhHHgHHK
.KHhHHHHhHHgSHHK
.KHHHhHHHHgSSSHK
.KHHHHHhHgSSSSSK
.KHhHHHHHSSSggSK
.KHHHhHHgSSSEESK
.KsHHHHhHSSSSSSK
.KsHhHHHgSSSSsSK
.KHHHHhHSSSSSSMK
..KHhHHHSSSSSSK.
...KHHsSSSSSSK..
.....KKsSSKKK...
.....KRRRRRRK...
....KRRRRWRRRK..
....KRRRRWRRRRK.
...KRRKRRRRRRRK.
...KRRKRRRRRRRK.
...KRRKRRRRRRRK.
...KrRKrRRRRRrK.
...KSSKrrrrrrrK.
....KKPPPPPPPK..
.....KPPPpPPPK..
.....KPPPPPPPK..
.....KPPPPPPPK..
.....KpPPPPPpK..
.....KBBBBBBBBK.
.....KbbbbbbbbK.
.....KKKKKKKKKK.
"""
PX = 4  # the profile sits at this offset in the 25-wide frame, so his head starts where it does face-on

def profile_rows():
    return [r.ljust(16, '.') for r in PROFILE.strip('\n').split('\n')]

def side():
    g = grid(SW, SH)
    blit(g, profile_rows(), PX)
    return g

def side_walk(step):
    """Legs apart: the back leg swings back, the front leg forward."""
    g = side()
    legs = [row[:] for row in g]
    clear(g, 26, SH - 1, PX + 5, PX + 14)
    back = -1 if step == 1 else 0
    front = 1 if step == 1 else 0
    for y in range(26, SH):
        for x in range(PX + 5, PX + 10):
            if legs[y][x] != '.': g[y][x + back] = legs[y][x]
        for x in range(PX + 10, PX + 15):
            if legs[y][x] != '.': g[y][x + front] = legs[y][x]
    if step == 2:                     # the other stride: front foot lifts
        for y in range(27, SH):
            for x in range(PX + 10, PX + 15):
                g[y - 1][x] = g[y][x]
        clear(g, SH - 1, SH - 1, PX + 10, PX + 14)
    return outline(g)

STAND_FRAMES = {
    'stand': stand(),
    'wave1': wave(WAVE_UP),
    'wave2': wave(WAVE_DOWN),
    'side': side(),
    'walk1': side_walk(1),
    'walk2': side_walk(2),
}

# ---------- the desk scene, from the side ----------
# 34 wide, 33 tall, same pixel size as the standing sprite. He sits facing right, away from the name,
# with the laptop in front of him. Layers are listed back to front.

DW, DH = 34, 33
DX, DY = 1, 5  # where his head lands when he sits: a little lower than standing

def chair():
    g = grid(DW, DH)
    fill(g, 14, 29, 3, 4, 'D')        # the back
    fill(g, 13, 13, 3, 4, 'd')
    fill(g, 28, 29, 3, 17, 'D')       # the seat
    fill(g, 30, 32, 5, 6, 'D')        # legs
    fill(g, 30, 32, 15, 16, 'D')
    return outline(g)

def seated(look):
    g = grid(DW, DH)
    blit(g, profile_rows()[:17], DX, DY)                      # head and neck
    rows = [
        (22, 6, 'KRRRRRRK'),
        (23, 5, 'KRRRRWRRRK'),
        (24, 5, 'KRRRRWRRRRK'),
        (25, 5, 'KRRRRRRRRRK'),
        (26, 5, 'KrRRRRRRRRPPPPPPPK'),                          # hem, then the thighs under the desk
        (27, 5, 'KPPPPPPPPPPPPPPPK'),
        (28, 17, 'KPPPK'),                                      # the lower leg
        (29, 17, 'KpPPK'),
        (30, 17, 'KBBBBBBK'),                                   # the shoe
        (31, 17, 'KbbbbbbK'),
        (32, 17, 'KKKKKKKK'),
    ]
    for y, x, t in rows:
        for i, c in enumerate(t):
            g[y][x + i] = c
    if look == 'you':                                           # brow down: he's been interrupted
        paint(g, [(DY + 9, DX + 12, 'K'), (DY + 9, DX + 13, 'K'), (DY + 9, DX + 11, 'g')])
    return g

def desk():
    g = grid(DW, DH)
    fill(g, 24, 24, 15, 32, 'T')
    fill(g, 25, 25, 15, 32, 'U')
    fill(g, 26, 32, 30, 32, 'U')      # the far leg; the near one is behind him
    return outline(g)

def laptop():
    g = grid(DW, DH)
    fill(g, 22, 22, 18, 28, 'l')      # keyboard
    fill(g, 23, 23, 18, 28, 'L')      # base
    fill(g, 11, 21, 25, 31, 'L')      # the lid, turned a little toward us so the screen shows
    fill(g, 12, 20, 26, 30, 'N')
    return outline(g)

CODE = {
    1: [(13, 26, 'vv'), (13, 29, 'yy'), (15, 27, 'AAA'), (17, 27, 'GGGG'), (19, 26, 'AA')],
    2: [(13, 26, 'vv'), (13, 29, 'y'), (15, 27, 'AAAA'), (17, 27, 'oo'), (19, 26, 'AAA')],
    3: [(13, 26, 'AA'), (13, 29, 'GG'), (15, 27, 'vvv'), (17, 27, 'yyyy'), (19, 26, 'v')],
}

def code(n):
    g = grid(DW, DH)
    for y, x, t in CODE[n]:
        for i, c in enumerate(t):
            g[y][x + i] = c
    return g

def cursor():
    g = grid(DW, DH)
    g[19][29] = 'C'
    return g

def arm(frame):
    """The near arm, reaching forward to the keyboard."""
    g = grid(DW, DH)
    fill(g, 22, 23, 12, 17, 'R')
    g[23][12] = 'r'
    if frame == 1:
        fill(g, 21, 22, 18, 19, 'S')  # hand hovering over the keys
    else:
        g[22][18] = 'r'
        fill(g, 22, 23, 19, 20, 'S')  # hand down on the keys
    return outline(g)

DESK_LAYERS = [
    ('d-chair', chair()),
    ('d-look look-screen', seated('screen')),
    ('d-look look-you', seated('you')),
    ('d-desk', desk()),
    ('d-laptop', laptop()),
    ('d-code code-1', code(1)),
    ('d-code code-2', code(2)),
    ('d-code code-3', code(3)),
    ('d-cursor', cursor()),
    ('d-arm type-1', arm(1)),
    ('d-arm type-2', arm(2)),
]

print(f'<svg class="buddy" viewBox="0 0 {SW} {SH}" shape-rendering="crispEdges" data-f="stand" '
      'role="button" tabindex="0" aria-label="joe. click to say hi.">'
      + ''.join(f'<g class="f f-{n}">{rects(g)}</g>' for n, g in STAND_FRAMES.items()) + '</svg>')
print(f'<svg class="buddy-desk" viewBox="0 0 {DW} {DH}" shape-rendering="crispEdges" data-look="screen" data-type="1" '
      'role="button" tabindex="0" aria-label="joe, coding at his desk. click to say hi.">'
      + ''.join(f'<g class="{cls}">{rects(g)}</g>' for cls, g in DESK_LAYERS) + '</svg>')
