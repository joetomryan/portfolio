# Generates the pixel buddy for the home page: python3 tools/buddy-sprite.py
# Prints two SVGs, the standing sprite and the desk scene. Paste them in place of the
# <svg class="buddy"> and <svg class="buddy-desk"> elements in index.html.
#
# Everything is drawn as text, one character per pixel. Shapes are drawn in their fill
# colours; outline() then draws the dark Stardew-style edge around each layer.

PAL = {
  'K': '#2b1c14',                                  # outline
  'H': '#33211a', 'h': '#5b3a28',                  # hair, highlight
  'S': '#c98c62', 's': '#a86f4b',                  # skin, shadow
  'E': '#1b120d', 'M': '#8a3b2b', 'c': '#d77d63',  # eyes, mouth, blush
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
........KKKKKKKKK........
......KKHHHHHHHHHKK......
.....KHHhHHHHHHHhHHK.....
....KHHHHhHHHHHhHHHHK....
....KHHHHHHHhHHHHHHHK....
....KHhHHHHHHHHHHHhHK....
....KHHHHHHHHHHHHHHHK....
....KHHSHHSHHHSHHSHHK....
....KSHSSHSSHSSHSSHSK....
....KSSSSSSSSSSSSSSSK....
....KSSSEESSSSSEESSSK....
....KScSEESSSSSEEScSK....
....KSSSSSSSSSSSSSSSK....
....KSSSSSSMMMSSSSSSK....
.....KSSSSSSSSSSSSSK.....
......KsSSSSSSSSSsK......
........KKKsSSsKKK.......
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

def walk(side):
    g = stand()
    x0, x1 = (6, 11) if side == 'L' else (13, 18)
    for y in range(26, SH):           # lift one foot by a pixel
        for x in range(x0, x1 + 1):
            g[y - 1][x] = g[y][x]
    clear(g, SH - 1, SH - 1, x0, x1)
    return g

STAND_FRAMES = {
    'stand': stand(),
    'wave1': wave(WAVE_UP),
    'wave2': wave(WAVE_DOWN),
    'walk1': walk('L'),
    'walk2': walk('R'),
}

# ---------- the desk scene ----------
# 44 wide, 35 tall, same pixel size as the standing sprite. Layers are listed back to front.

DW, DH = 46, 35
DX = 4  # the character sits at this x offset; his head is at the same rows as when standing

def chair():
    g = grid(DW, DH)
    fill(g, 12, 24, 5, 27, 'D')
    fill(g, 13, 24, 6, 6, 'd')
    return outline(g)

def seated(look):
    g = grid(DW, DH)
    blit(g, rows_of(STAND)[:25], DX)  # head, torso, hands; the desk hides the rest
    clear(g, 19, 24, 22, 24)          # the right arm is drawn separately, reaching to the keyboard
    fill(g, 19, 23, 21, 21, 'K')
    if look == 'screen':              # eyes slide to the right, toward the laptop
        for y in (10, 11):
            for x in (12, 19):
                g[y][x] = 'S'
            for x in (14, 21):
                g[y][x] = 'E'
    else:                             # looks at you, brows down
        paint(g, [(9, 12, 'K'), (9, 13, 'K'), (9, 19, 'K'), (9, 20, 'K')])
    return g

def desk():
    g = grid(DW, DH)
    fill(g, 25, 25, 1, 44, 'T')
    fill(g, 26, 27, 1, 44, 'U')
    fill(g, 28, 33, 2, 4, 'U')
    fill(g, 28, 33, 41, 43, 'U')
    fill(g, 21, 24, 2, 5, 'm')        # a mug, beside his left hand
    fill(g, 23, 23, 2, 5, 'R')
    paint(g, [(22, 6, 'm'), (22, 7, 'm'), (23, 7, 'm'), (24, 7, 'm'), (24, 6, 'm')])
    return outline(g)

def steam():
    g = grid(DW, DH)
    paint(g, [(19, 4, 'q'), (18, 3, 'q'), (18, 5, 'q')])
    return g

def laptop():
    g = grid(DW, DH)
    fill(g, 10, 22, 27, 42, 'L')      # the lid
    fill(g, 11, 21, 29, 40, 'N')      # the screen
    fill(g, 23, 23, 26, 43, 'l')      # keyboard
    fill(g, 24, 24, 26, 43, 'L')      # base
    return outline(g)

CODE = {
    1: [(12, 28, 'vvv'), (12, 32, 'yyyy'), (14, 29, 'AAAA'), (14, 34, 'ooo'), (16, 29, 'GGGGGGG'),
        (18, 28, 'AA'), (18, 31, 'yyyy'), (20, 28, 'vvv')],
    2: [(12, 28, 'vvv'), (12, 32, 'yyy'), (14, 29, 'AAAAA'), (16, 29, 'AA'), (16, 32, 'GGGGGG'),
        (18, 29, 'ooo'), (18, 33, 'yyy'), (20, 28, 'AAAA')],
    3: [(12, 28, 'AA'), (12, 31, 'GGGGG'), (14, 29, 'vvvv'), (14, 34, 'yy'), (16, 29, 'oooooo'),
        (18, 28, 'vvv'), (18, 32, 'AAAAA'), (20, 28, 'yy')],
}

def code(n):
    g = grid(DW, DH)
    for y, x, s in CODE[n]:
        for i, c in enumerate(s):
            g[y][x + 2 + i] = c
    return g

def cursor():
    g = grid(DW, DH)
    g[20][35] = 'C'
    return g

def arm(frame):
    g = grid(DW, DH)
    sleeve = [(19, 22), (19, 23), (20, 23), (20, 24), (21, 24), (21, 25), (22, 25), (22, 26)]
    for y, x in sleeve:
        g[y][x] = 'R'
    g[22][26] = 'r'
    if frame == 1:
        fill(g, 22, 23, 27, 28, 'S')
    else:
        g[22][27] = 'r'
        fill(g, 21, 22, 28, 29, 'S')
    return outline(g)

DESK_LAYERS = [
    ('d-chair', chair()),
    ('d-look look-screen', seated('screen')),
    ('d-look look-you', seated('you')),
    ('d-desk', desk()),
    ('d-steam', steam()),
    ('d-laptop', laptop()),
    ('d-code code-1', code(1)),
    ('d-code code-2', code(2)),
    ('d-code code-3', code(3)),
    ('d-cursor', cursor()),
    ('d-arm type-1', arm(1)),
    ('d-arm type-2', arm(2)),
]

print(f'<svg class="buddy" viewBox="0 0 {SW} {SH}" shape-rendering="crispEdges" data-f="stand" aria-hidden="true">'
      + ''.join(f'<g class="f f-{n}">{rects(g)}</g>' for n, g in STAND_FRAMES.items()) + '</svg>')
print(f'<svg class="buddy-desk" viewBox="0 0 {DW} {DH}" shape-rendering="crispEdges" data-look="screen" data-type="1" '
      'role="button" tabindex="0" aria-label="joe, coding at his desk. click to say hi.">'
      + ''.join(f'<g class="{cls}">{rects(g)}</g>' for cls, g in DESK_LAYERS) + '</svg>')
