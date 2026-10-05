# Generates the pixel buddy on the home page: python3 tools/buddy-sprite.py
# Paste its output in place of the <svg class="buddy"> element in index.html.
# One character per pixel. The body is drawn on a 24-wide grid, then padded so raised arms fit.
PAL = {
  'K': '#2b1c14',                                  # outline
  'H': '#33211a', 'h': '#5b3a28',                  # hair, highlight
  'S': '#c98c62', 's': '#a86f4b',                  # skin, shadow
  'E': '#1b120d', 'M': '#8a3b2b', 'c': '#d77d63',  # eyes, mouth, blush
  'R': '#8b2e1f', 'r': '#6c2216',                  # red hoodie, shadow
  'W': '#efe6d6',                                  # hoodie drawstrings
  'P': '#34466b', 'p': '#26344f',                  # jeans
  'B': '#f1ece2', 'b': '#c4bcae',                  # sneakers
}
BODY = """
......KKKKKK............
....KKHHHHhhKK..........
...KHHHHHhhHHHK.........
..KHHHHHHHHHHHHK........
..KHHHHHHHHHHHHK........
..KHHHHHHHSHHHHK........
..KHSSHSSSSSSSHK........
..KSSSESSSSESSSK........
.KsSSSESSSSESSSK........
.KsScSSSSSSSScSK........
..KSSSSSMMSSSSK.........
...KsSSSSSSSSsK.........
....KKKSSSSKKK..........
......KsSSsK............
..KKKKRRRRRRRRKKKKK.....
.KRRKRRRWRRWRRRRKRRK....
.KRRKRRRWRRWRRRRKRRK....
.KRRKRRRRRRRRRRRKRRK....
.KRRKRRRRRRRRRRRKRRK....
.KrRKrRRRRRRRRRrKRrK....
.KSSKrrrrrrrrrrrKSSK....
..KKKPPPPPPPPPPPKKK.....
....KPPPPPpPPPPPK.......
.....KPPPPKPPPPPK.......
.....KPPPKKKPPPK........
.....KPPPK.KPPPK........
.....KPPPK.KPPPK........
.....KpPPK.KPPpK........
....KBBBBK.KBBBBK.......
....KbbbbK.KbbbbK.......
....KKKKKK.KKKKKK.......
"""
# right arm raised for the wave: two positions (from the original avatar)
WAVE_A = {1: (16, "KKK"), 2: (15, "KSSSK"), 3: (15, "KSSSK"), 4: (15, "KsSSK"), 5: (16, "KSK"),
          6: (15, "KRRK"), 7: (15, "KRRK"), 8: (14, "KRRK"), 9: (14, "KRRK"), 10: (14, "KRK")}
WAVE_B = {1: (18, "KKK"), 2: (17, "KSSSK"), 3: (17, "KSSSK"), 4: (17, "KSSsK"), 5: (17, "KSK"),
          6: (16, "KRRK"), 7: (16, "KRRK"), 8: (15, "KRRK"), 9: (14, "KRRK"), 10: (14, "KRK")}
OX = 3                                   # left padding so a mirrored raised arm fits
CENTER2 = 17                             # mirror axis (x -> 17 - x) in body coordinates
ROWS = BODY.strip('\n').split('\n')
H = len(ROWS)

def base():
    W = 24 + OX + 2
    return [list('.' * OX + r + '.' * (W - OX - len(r))) for r in ROWS]

def put(g, y, x, s):
    for i, c in enumerate(s):
        if c != '.': g[y][x + OX + i] = c

def lower_arm(g, side):
    """Remove a hanging arm (for raising it). side 'R' or 'L' (viewer's right/left)."""
    cols = (17, 18, 19) if side == 'R' else (1, 2, 3)
    for y in range(14, 22):
        for x in cols:
            g[y][x + OX] = '.'
    edge = 16 if side == 'R' else 4
    for y in range(15, 21):
        g[y][edge + OX] = 'K'
    return g

def raise_arm(g, side, wave):
    lower_arm(g, side)
    for y, (x, s) in wave.items():
        if side == 'R':
            put(g, y, x, s)
        else:  # mirror the raised arm onto the left side
            put(g, y, CENTER2 - (x + len(s) - 1), s[::-1])
    return g

def lift_leg(g, side):
    """Walking: raise one leg by a pixel."""
    cols = range(4, 11) if side == 'L' else range(10, 18)
    for y in range(24, H):
        for x in cols:
            g[y - 1][x + OX] = g[y][x + OX]
    for x in cols:
        g[H - 1][x + OX] = '.'
    return g

def tuck(g):
    """Jumping: pull the legs up."""
    for _ in range(2):
        for side in ('L', 'R'):
            lift_leg(g, side)
    return g

FRAMES = {
    'stand': base(),
    'walk1': lift_leg(base(), 'L'),
    'walk2': lift_leg(base(), 'R'),
    'jump':  tuck(raise_arm(raise_arm(base(), 'R', WAVE_A), 'L', WAVE_A)),
    'wave1': raise_arm(base(), 'R', WAVE_A),
    'wave2': raise_arm(base(), 'R', WAVE_B),
}
W = max(max((x for x, c in enumerate(row) if c != '.'), default=0) for g in FRAMES.values() for row in g) + 1

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

print(f'<svg class="buddy" viewBox="0 0 {W} {H}" shape-rendering="crispEdges" data-f="stand" aria-hidden="true">'
      + ''.join(f'<g class="f f-{n}">{rects(g)}</g>' for n, g in FRAMES.items()) + '</svg>')
