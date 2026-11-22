#!/usr/bin/env python3
"""
Server pro hru "Ozoboti z Bolehoště" – režim kola.

Spuštění (na počítači učitele, stačí Python 3, nic se neinstaluje):
    python server.py            (port 8000, PIN učitele 1234)
    python server.py 8000 heslo (vlastní port a PIN)

Děti pak na svých počítačích (ve stejné síti) otevřou adresu, kterou server vypíše,
učitel otevře  /ucitel.html  a spouští kola.
"""
import http.server, socketserver, json, time, os, socket, threading, sys, random, re
from datetime import datetime
try:
    from zoneinfo import ZoneInfo
    PRAGUE = ZoneInfo('Europe/Prague')
except Exception:
    PRAGUE = None

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
PIN = sys.argv[2] if len(sys.argv) > 2 else '1234'
LOCK = threading.Lock()
STATE = {
    'id': 0,            # číslo kola
    'start': 0,         # ms (server) – kdy kolo začíná
    'duration': 300,    # s
    'seed': 0,
    'active': False,    # bylo nějaké kolo spuštěno
    'stopped_at': 0,    # ms – ruční ukončení
}
PLAYERS = {}            # klíč = jméno malými písmeny
HALL_FILE = os.path.join(ROOT, 'data', 'hall.json')
HALL_CAP_CAUGHT = 20
HALL_CAP_ENERGY = 50000
HALL_CAP_MISSIONS = 10
HALL_CAP_PLACES = 15
HALL_CAP_SECONDS = 120
HALL_MAX_PLACES = 80
HALL_MAX_TOTAL = 2000000000
MONTHS_CS = ['', 'leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec']
BATCH_RE = re.compile(r'^[A-Za-z0-9_-]{8,40}$')
PLACE_RE = re.compile(r'^[\w :._-]+$', re.UNICODE)


def now_ms():
    return int(time.time() * 1000)


def round_info():
    n = now_ms()
    s = STATE
    if not s['active']:
        phase = 'idle'
    else:
        end = s['start'] + s['duration'] * 1000
        if s['stopped_at']:
            end = min(end, s['stopped_at'])
        if n < s['start']:
            phase = 'countdown'
        elif n < end:
            phase = 'running'
        else:
            phase = 'ended'
    return {'id': s['id'], 'phase': phase, 'start': s['start'], 'duration': s['duration'],
            'seed': s['seed'], 'stopped_at': s['stopped_at'], 'now': n}


def board():
    rows = []
    for k, p in PLAYERS.items():
        rows.append({'name': p['name'], 'score': p['score'], 'caught': p['caught'],
                     'char': p.get('char'), 'color': p.get('color'), 'seen': p['seen']})
    rows.sort(key=lambda r: (-r['score'], r['name'].lower()))
    return rows


def hall_month():
    if PRAGUE is not None:
        return datetime.now(PRAGUE).strftime('%Y-%m')
    return time.strftime('%Y-%m')


def hall_label(month):
    m = re.fullmatch(r'(\d{4})-(\d{2})', month or '')
    if not m:
        return month
    n = int(m.group(2))
    name = MONTHS_CS[n] if 1 <= n <= 12 else month
    return '%s %s' % (name, m.group(1))


def clean_name(value):
    name = re.sub(r'[\x00-\x1F\x7F]', '', str(value or '')).strip()
    return name[:14]


def hall_key(name):
    return name.casefold()


def clean_place(value):
    if not isinstance(value, str):
        return ''
    s = value.strip()
    if not s or len(s) > 48:
        return ''
    if any(ord(c) < 32 or c in '<>' for c in s):
        return ''
    if PLACE_RE.fullmatch(s) is None:
        return ''
    return s


def hall_delta(value, cap):
    try:
        n = int(float(value))
    except (TypeError, ValueError):
        return 0
    if n < 0:
        return 0
    return min(cap, n)


def load_hall():
    try:
        with open(HALL_FILE, encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, dict) and isinstance(data.get('months'), dict):
            if not isinstance(data.get('aliases'), dict):
                data['aliases'] = {}
            return data
    except Exception:
        pass
    return {'months': {}, 'aliases': {}}


def save_hall(data):
    os.makedirs(os.path.dirname(HALL_FILE), exist_ok=True)
    tmp = HALL_FILE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)
    os.replace(tmp, HALL_FILE)


def hall_public(state):
    month = hall_month()
    bucket = state.get('months', {}).get(month, {})
    players = bucket.get('players', {}) if isinstance(bucket, dict) else {}
    rows = []
    if isinstance(players, dict):
        for p in players.values():
            if not isinstance(p, dict):
                continue
            places = p.get('places')
            rows.append({
                'name': str(p.get('name') or ''),
                'caught': int(p.get('caught') or 0),
                'energy': int(p.get('energy') or 0),
                'missions': int(p.get('missions') or 0),
                'places': len(places) if isinstance(places, list) else 0,
                'seconds': int(p.get('seconds') or 0),
            })
    rows.sort(key=lambda r: (-r['caught'], r['name'].casefold()))
    return {'month': month, 'label': hall_label(month), 'players': rows}


def hall_players(state, month):
    months = state.setdefault('months', {})
    bucket = months.setdefault(month, {'players': {}})
    if not isinstance(bucket, dict):
        bucket = {'players': {}}
        months[month] = bucket
    players = bucket.get('players')
    if not isinstance(players, dict):
        players = {}
        bucket['players'] = players
    return players


def hall_resolve(players, aliases, key):
    seen = set()
    while key in aliases and key not in seen:
        seen.add(key)
        nxt = aliases.get(key)
        if not isinstance(nxt, str) or nxt == '' or nxt == key:
            break
        key = nxt
    if key not in players:
        return ''
    return key


def hall_identity_keys(aliases, key):
    keys = {key}
    changed = True
    while changed:
        changed = False
        for src, dst in list(aliases.items()):
            if isinstance(src, str) and isinstance(dst, str) and dst in keys and src not in keys:
                keys.add(src)
                changed = True
    return keys


def hall_blank(name):
    return {
        'name': name, 'caught': 0, 'energy': 0, 'missions': 0, 'places': [],
        'seconds': 0, 'batch': '', 'accepted': None, 'updated': now_ms(),
    }


def hall_apply(body):
    name = clean_name(body.get('name'))
    if not name:
        return {'error': 'no name'}, 400
    batch = str(body.get('batch') or '')
    if BATCH_RE.fullmatch(batch) is None:
        return {'error': 'batch'}, 400
    caught = hall_delta(body.get('caught', 0), HALL_CAP_CAUGHT)
    energy = hall_delta(body.get('energy', 0), HALL_CAP_ENERGY)
    missions = hall_delta(body.get('missions', 0), HALL_CAP_MISSIONS)
    seconds = hall_delta(body.get('seconds', 0), HALL_CAP_SECONDS)
    raw_places = []
    places = body.get('places')
    if isinstance(places, list):
        for item in places:
            if isinstance(item, str):
                raw_places.append(item)
            if len(raw_places) >= HALL_CAP_PLACES:
                break
    state = load_hall()
    accepted = {
        'caught': caught, 'energy': energy, 'missions': missions,
        'places': raw_places, 'seconds': seconds,
    }
    if hall_key(name) == 'roboto':
        return {'ok': True, 'accepted': accepted, 'hall': hall_public(state)}, 200
    month = hall_month()
    players = hall_players(state, month)
    aliases = state.setdefault('aliases', {})
    if not isinstance(aliases, dict):
        aliases = {}
        state['aliases'] = aliases
    posted = hall_key(name)
    resolved = hall_resolve(players, aliases, posted)
    key = resolved or posted
    player = players.get(key)
    if not isinstance(player, dict):
        player = hall_blank(name)
        players[key] = player
    if not isinstance(player.get('places'), list):
        player['places'] = []
    if player.get('batch') == batch and isinstance(player.get('accepted'), dict):
        return {'ok': True, 'name': player.get('name') or name, 'accepted': player['accepted'], 'hall': hall_public(state)}, 200
    for raw in raw_places:
        clean = clean_place(raw)
        if clean and clean not in player['places'] and len(player['places']) < HALL_MAX_PLACES:
            player['places'].append(clean)
    player['caught'] = min(HALL_MAX_TOTAL, int(player.get('caught') or 0) + caught)
    player['energy'] = min(HALL_MAX_TOTAL, int(player.get('energy') or 0) + energy)
    player['missions'] = min(HALL_MAX_TOTAL, int(player.get('missions') or 0) + missions)
    player['seconds'] = min(HALL_MAX_TOTAL, int(player.get('seconds') or 0) + seconds)
    player['batch'] = batch
    player['accepted'] = accepted
    player['updated'] = now_ms()
    save_hall(state)
    return {'ok': True, 'name': player.get('name') or name, 'accepted': accepted, 'hall': hall_public(state)}, 200


def hall_delete(body):
    name = clean_name(body.get('name'))
    if not name:
        return {'error': 'no name'}, 400
    key = hall_key(name)
    state = load_hall()
    aliases = state.setdefault('aliases', {})
    if not isinstance(aliases, dict):
        aliases = {}
        state['aliases'] = aliases
    keys = hall_identity_keys(aliases, key)
    for bucket in state.get('months', {}).values():
        if isinstance(bucket, dict) and isinstance(bucket.get('players'), dict):
            for drop in keys:
                bucket['players'].pop(drop, None)
    for src, dst in list(aliases.items()):
        if src in keys or dst in keys:
            aliases.pop(src, None)
    save_hall(state)
    return {'ok': True, 'hall': hall_public(state)}, 200


def hall_rename(body):
    name = clean_name(body.get('name'))
    nxt = clean_name(body.get('rename'))
    if not name or not nxt:
        return {'error': 'no name'}, 400
    if hall_key(nxt) == 'roboto':
        return {'error': 'name'}, 400
    state = load_hall()
    month = hall_month()
    players = hall_players(state, month)
    key = hall_key(name)
    next_key = hall_key(nxt)
    if key not in players or not isinstance(players.get(key), dict):
        return {'error': 'missing'}, 404
    if next_key != key and next_key in players:
        return {'error': 'name-taken'}, 409
    rec = players.pop(key)
    rec['name'] = nxt
    players[next_key] = rec
    if next_key != key:
        aliases = state.setdefault('aliases', {})
        if not isinstance(aliases, dict):
            aliases = {}
            state['aliases'] = aliases
        for src, dst in list(aliases.items()):
            if dst == key:
                aliases[src] = next_key
        aliases[key] = next_key
        aliases.pop(next_key, None)
    save_hall(state)
    return {'ok': True, 'hall': hall_public(state)}, 200


def local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return socket.gethostbyname(socket.gethostname())


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, fmt, *args):
        if '/api/' not in (args[0] if args else ''):
            sys.stderr.write('%s - %s\n' % (self.address_string(), fmt % args))

    def _json(self, obj, code=200):
        data = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.startswith('/api/state'):
            with LOCK:
                # odstranit hráče, které jsme dlouho neviděli (mimo skončené kolo)
                info = round_info()
                if info['phase'] in ('idle', 'countdown'):
                    t = now_ms()
                    for k in [k for k, p in PLAYERS.items() if t - p['seen'] > 60000]:
                        del PLAYERS[k]
                self._json({'round': info, 'board': board(), 'ip': local_ip(), 'port': PORT})
            return
        if self.path.startswith('/api/hall'):
            with LOCK:
                self._json(hall_public(load_hall()))
            return
        if self.path.startswith('/data/') or self.path.startswith('/config.local.php'):
            self.send_error(403)
            return
        if self.path == '/' or self.path == '':
            self.path = '/index.html'
        return super().do_GET()

    def do_POST(self):
        try:
            n = int(self.headers.get('Content-Length') or 0)
            body = json.loads(self.rfile.read(n) or b'{}')
        except Exception:
            return self._json({'error': 'bad json'}, 400)
        if self.path.startswith('/api/hall'):
            with LOCK:
                payload, code = hall_apply(body)
                self._json(payload, code)
            return
        if self.path.startswith('/api/score'):
            name = str(body.get('name', '')).strip()[:14]
            if not name:
                return self._json({'error': 'no name'}, 400)
            with LOCK:
                key = name.lower()
                p = PLAYERS.setdefault(key, {'name': name, 'score': 0, 'caught': 0})
                p['name'] = name
                info = round_info()
                # skóre se přijímá jen pro aktuální kolo a jen pokud roste
                if body.get('round') == STATE['id'] and info['phase'] in ('running', 'ended'):
                    p['score'] = max(p['score'], int(body.get('score', 0)))
                    p['caught'] = max(p['caught'], int(body.get('caught', 0)))
                p['char'] = body.get('char')
                p['color'] = body.get('color')
                p['seen'] = now_ms()
                self._json({'ok': True})
            return
        if self.path.startswith('/api/teacher'):
            if str(body.get('pin', '')) != PIN:
                return self._json({'error': 'pin'}, 403)
            act = body.get('action')
            with LOCK:
                if act == 'start':
                    STATE['id'] += 1
                    STATE['active'] = True
                    STATE['duration'] = max(30, min(3600, int(body.get('duration', 300))))
                    STATE['start'] = now_ms() + max(3, min(60, int(body.get('delay', 10)))) * 1000
                    STATE['seed'] = random.randint(1, 2 ** 31 - 1)
                    STATE['stopped_at'] = 0
                    for p in PLAYERS.values():
                        p['score'] = 0
                        p['caught'] = 0
                elif act == 'stop':
                    if STATE['active']:
                        STATE['stopped_at'] = now_ms()
                elif act == 'reset':
                    STATE['active'] = False
                    STATE['stopped_at'] = 0
                    PLAYERS.clear()
                elif act == 'hall-delete':
                    payload, code = hall_delete(body)
                    return self._json(payload, code)
                elif act == 'hall-rename':
                    payload, code = hall_rename(body)
                    return self._json(payload, code)
                else:
                    return self._json({'error': 'action'}, 400)
                self._json({'ok': True, 'round': round_info()})
            return
        self._json({'error': 'not found'}, 404)


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == '__main__':
    ip = local_ip()
    print('=' * 60)
    print(' Ozoboti z Bolehoště – server režimu kola')
    print('=' * 60)
    print(' Děti otevřou:   http://%s:%d/' % (ip, PORT))
    print(' Učitel otevře:  http://%s:%d/ucitel.html   (PIN: %s)' % (ip, PORT, PIN))
    print(' Ukončení: Ctrl+C')
    print('=' * 60)
    try:
        Server(('0.0.0.0', PORT), Handler).serve_forever()
    except KeyboardInterrupt:
        print('\nKonec.')
