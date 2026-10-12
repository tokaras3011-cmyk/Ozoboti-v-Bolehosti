#!/usr/bin/env python3
"""
Server pro hru "Ozoboti z Bolehoště" – režim kola.

Spuštění (na počítači učitele, stačí Python 3, nic se neinstaluje):
    python server.py            (port 8000, PIN učitele 1234)
    python server.py 8000 heslo (vlastní port a PIN)

Děti pak na svých počítačích (ve stejné síti) otevřou adresu, kterou server vypíše,
učitel otevře  /ucitel.html  a spouští kola.
"""
import http.server, socketserver, json, time, os, socket, threading, sys, random

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
        if self.path == '/' or self.path == '':
            self.path = '/index.html'
        return super().do_GET()

    def do_POST(self):
        try:
            n = int(self.headers.get('Content-Length') or 0)
            body = json.loads(self.rfile.read(n) or b'{}')
        except Exception:
            return self._json({'error': 'bad json'}, 400)
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
