<?php

declare(strict_types=1);

/**
 * PHP náhrada server.py — režim kola pro Ozoboti z Bolehoště.
 *
 * Endpointy (přes .htaccess / router.php):
 *   GET  /ozoboti/api/state
 *   POST /ozoboti/api/score
 *   GET  /ozoboti/api/hall
 *   POST /ozoboti/api/hall
 *   POST /ozoboti/api/teacher
 *   POST /ozoboti/api/presence
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const STATE_FILE = __DIR__ . '/data/state.json';
const PRESENCE_FILE = __DIR__ . '/data/presence.json';
const HALL_FILE = __DIR__ . '/data/hall.json';
const HALL_CAP_CAUGHT = 20;
const HALL_CAP_ENERGY = 50_000;
const HALL_CAP_MISSIONS = 10;
const HALL_CAP_PLACES = 15;
const HALL_CAP_SECONDS = 120;
const HALL_MAX_PLACES = 80;
const HALL_MAX_TOTAL = 2_000_000_000;
const PLAYER_STALE_MS = 60_000;
const PRESENCE_KEEP_MS = 60_000;
const PRESENCE_AWAY_MS = 2_000;
const PRESENCE_MAX = 40;
const MAP_X0 = -465.0;
const MAP_X1 = 490.0;
const MAP_Z0 = -612.0;
const MAP_Z1 = 462.0;
const CHAR_IDS = ['kuba', 'bara', 'sportak', 'robot', 'dino', 'kocka', 'astro', 'hasic', 'dracek', 'hasicka'];

$action = (string) ($_GET['action'] ?? '');
if ($action === '') {
    $uri = (string) (parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '');
    if (preg_match('#/api/(state|score|teacher|presence|hall)/?$#', $uri, $m)) {
        $action = $m[1];
    }
}

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

try {
    if ($action === 'state' && $method === 'GET') {
        json_out(handle_state());
    }
    if ($action === 'score' && $method === 'POST') {
        json_out(handle_score(read_json_body()));
    }
    if ($action === 'hall' && $method === 'GET') {
        json_out(handle_hall_get());
    }
    if ($action === 'hall' && $method === 'POST') {
        json_out(handle_hall_post(read_json_body()));
    }
    if ($action === 'teacher' && $method === 'POST') {
        json_out(handle_teacher(read_json_body()));
    }
    if ($action === 'presence' && $method === 'POST') {
        json_out(handle_presence(read_json_body()));
    }
    json_out(['error' => 'not found'], 404);
} catch (Throwable $e) {
    json_out(['error' => 'server', 'message' => $e->getMessage()], 500);
}

function json_out(array $payload, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_out(['error' => 'bad json'], 400);
    }

    return $data;
}

function teacher_pin(): string
{
    $cfgFile = __DIR__ . '/config.local.php';
    if (is_file($cfgFile)) {
        $cfg = require $cfgFile;
        if (is_array($cfg) && isset($cfg['teacher_pin'])) {
            return (string) $cfg['teacher_pin'];
        }
    }

    return '1234';
}

function default_state(): array
{
    return [
        'round' => [
            'id' => 0,
            'start' => 0,
            'duration' => 300,
            'seed' => 0,
            'active' => false,
            'stopped_at' => 0,
        ],
        'players' => [],
    ];
}

function now_ms(): int
{
    return (int) round(microtime(true) * 1000);
}

/**
 * @template T
 * @param callable(array): T $fn
 * @return T
 */
function with_state(bool $exclusive, callable $fn): mixed
{
    $dir = dirname(STATE_FILE);
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        throw new RuntimeException('Nelze vytvořit data/.');
    }

    $fh = fopen(STATE_FILE, 'c+');
    if ($fh === false) {
        throw new RuntimeException('Nelze otevřít state.json.');
    }

    if (!flock($fh, $exclusive ? LOCK_EX : LOCK_SH)) {
        fclose($fh);
        throw new RuntimeException('Nelze zamknout state.json.');
    }

    try {
        rewind($fh);
        $raw = stream_get_contents($fh);
        $state = default_state();
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $state = array_replace_recursive($state, $decoded);
            }
        }

        $result = $fn($state);

        if ($exclusive) {
            $json = json_encode($state, JSON_UNESCAPED_UNICODE);
            if ($json === false) {
                throw new RuntimeException('JSON encode selhal.');
            }
            ftruncate($fh, 0);
            rewind($fh);
            fwrite($fh, $json);
            fflush($fh);
        }

        return $result;
    } finally {
        flock($fh, LOCK_UN);
        fclose($fh);
    }
}

function round_info(array $round): array
{
    $n = now_ms();
    $active = !empty($round['active']);
    if (!$active) {
        $phase = 'idle';
    } else {
        $end = (int) $round['start'] + (int) $round['duration'] * 1000;
        $stopped = (int) ($round['stopped_at'] ?? 0);
        if ($stopped > 0) {
            $end = min($end, $stopped);
        }
        if ($n < (int) $round['start']) {
            $phase = 'countdown';
        } elseif ($n < $end) {
            $phase = 'running';
        } else {
            $phase = 'ended';
        }
    }

    return [
        'id' => (int) $round['id'],
        'phase' => $phase,
        'start' => (int) $round['start'],
        'duration' => (int) $round['duration'],
        'seed' => (int) $round['seed'],
        'stopped_at' => (int) ($round['stopped_at'] ?? 0),
        'now' => $n,
    ];
}

function board(array $players): array
{
    $rows = [];
    foreach ($players as $p) {
        if (!is_array($p)) {
            continue;
        }
        $rows[] = [
            'name' => (string) ($p['name'] ?? ''),
            'score' => (int) ($p['score'] ?? 0),
            'caught' => (int) ($p['caught'] ?? 0),
            'char' => $p['char'] ?? null,
            'color' => $p['color'] ?? null,
            'seen' => (int) ($p['seen'] ?? 0),
        ];
    }
    usort($rows, static function (array $a, array $b): int {
        if ($a['score'] !== $b['score']) {
            return $b['score'] <=> $a['score'];
        }

        return strcasecmp($a['name'], $b['name']);
    });

    return $rows;
}

function handle_state(): array
{
    return with_state(true, static function (array &$state): array {
        $info = round_info($state['round']);
        if (in_array($info['phase'], ['idle', 'countdown'], true)) {
            $t = now_ms();
            foreach ($state['players'] as $key => $p) {
                if (!is_array($p) || ($t - (int) ($p['seen'] ?? 0)) > PLAYER_STALE_MS) {
                    unset($state['players'][$key]);
                }
            }
        }

        $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || ((int) ($_SERVER['SERVER_PORT'] ?? 80) === 443);

        return [
            'round' => $info,
            'board' => board($state['players']),
            'ip' => $host,
            'port' => $https ? 443 : (int) ($_SERVER['SERVER_PORT'] ?? 80),
        ];
    });
}

function handle_score(array $body): array
{
    $name = trim(mb_substr((string) ($body['name'] ?? ''), 0, 14));
    if ($name === '') {
        json_out(['error' => 'no name'], 400);
    }

    return with_state(true, static function (array &$state) use ($body, $name): array {
        $key = mb_strtolower($name);
        $players = &$state['players'];
        if (!isset($players[$key]) || !is_array($players[$key])) {
            $players[$key] = ['name' => $name, 'score' => 0, 'caught' => 0];
        }
        $p = &$players[$key];
        $p['name'] = $name;
        $info = round_info($state['round']);
        $roundId = (int) ($body['round'] ?? -1);
        if ($roundId === (int) $state['round']['id'] && in_array($info['phase'], ['running', 'ended'], true)) {
            $p['score'] = max((int) $p['score'], (int) ($body['score'] ?? 0));
            $p['caught'] = max((int) $p['caught'], (int) ($body['caught'] ?? 0));
        }
        if (array_key_exists('char', $body)) {
            $p['char'] = $body['char'];
        }
        if (array_key_exists('color', $body)) {
            $p['color'] = $body['color'];
        }
        $p['seen'] = now_ms();

        return ['ok' => true];
    });
}

function default_hall(): array
{
    return ['months' => [], 'aliases' => []];
}

/**
 * @template T
 * @param callable(array): T $fn
 * @return T
 */
function with_hall(bool $exclusive, callable $fn): mixed
{
    $dir = dirname(HALL_FILE);
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        throw new RuntimeException('Nelze vytvořit data/.');
    }

    $fh = fopen(HALL_FILE, 'c+');
    if ($fh === false) {
        throw new RuntimeException('Nelze otevřít hall.json.');
    }

    if (!flock($fh, $exclusive ? LOCK_EX : LOCK_SH)) {
        fclose($fh);
        throw new RuntimeException('Nelze zamknout hall.json.');
    }

    try {
        rewind($fh);
        $raw = stream_get_contents($fh);
        $state = default_hall();
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded) && isset($decoded['months']) && is_array($decoded['months'])) {
                $state = $decoded;
                if (!isset($state['aliases']) || !is_array($state['aliases'])) {
                    $state['aliases'] = [];
                }
            }
        }

        $result = $fn($state);

        if ($exclusive) {
            $json = json_encode($state, JSON_UNESCAPED_UNICODE);
            if ($json === false) {
                throw new RuntimeException('JSON encode selhal.');
            }
            ftruncate($fh, 0);
            rewind($fh);
            fwrite($fh, $json);
            fflush($fh);
        }

        return $result;
    } finally {
        flock($fh, LOCK_UN);
        fclose($fh);
    }
}

function hall_month(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('Europe/Prague')))->format('Y-m');
}

function hall_label(string $month): string
{
    $names = [
        1 => 'leden',
        2 => 'únor',
        3 => 'březen',
        4 => 'duben',
        5 => 'květen',
        6 => 'červen',
        7 => 'červenec',
        8 => 'srpen',
        9 => 'září',
        10 => 'říjen',
        11 => 'listopad',
        12 => 'prosinec',
    ];
    if (preg_match('/^(\d{4})-(\d{2})$/', $month, $m) !== 1) {
        return $month;
    }
    $n = (int) $m[2];

    return ($names[$n] ?? $month) . ' ' . $m[1];
}

function hall_delta(mixed $value, int $cap): int
{
    if (is_string($value) && is_numeric($value)) {
        $value = $value + 0;
    }
    if (!is_int($value) && !is_float($value)) {
        return 0;
    }
    $n = (int) floor((float) $value);
    if ($n < 0) {
        return 0;
    }

    return min($cap, $n);
}

function clean_place(mixed $value): string
{
    $id = trim((string) $value);
    if ($id === '' || mb_strlen($id, 'UTF-8') > 48) {
        return '';
    }
    if (preg_match('/[\x00-\x1F\x7F<>]/u', $id) === 1) {
        return '';
    }
    if (preg_match('/^[\p{L}\p{N} :._-]+$/u', $id) !== 1) {
        return '';
    }

    return $id;
}

function hall_key(string $name): string
{
    return mb_strtolower($name, 'UTF-8');
}

/** @param array<string, mixed> $state */
function hall_public(array $state): array
{
    $month = hall_month();
    $rows = [];
    $players = $state['months'][$month]['players'] ?? null;
    if (is_array($players)) {
        foreach ($players as $p) {
            if (!is_array($p)) {
                continue;
            }
            $places = isset($p['places']) && is_array($p['places']) ? count($p['places']) : 0;
            $rows[] = [
                'name' => (string) ($p['name'] ?? ''),
                'caught' => (int) ($p['caught'] ?? 0),
                'energy' => (int) ($p['energy'] ?? 0),
                'missions' => (int) ($p['missions'] ?? 0),
                'places' => $places,
                'seconds' => (int) ($p['seconds'] ?? 0),
            ];
        }
    }
    usort($rows, static function (array $a, array $b): int {
        if ($a['caught'] !== $b['caught']) {
            return $b['caught'] <=> $a['caught'];
        }

        return strcasecmp($a['name'], $b['name']);
    });

    return [
        'month' => $month,
        'label' => hall_label($month),
        'players' => $rows,
    ];
}

/** @param array<string, string> $aliases */
function hall_resolve(array $players, array $aliases, string $key): string
{
    $seen = [];
    while (isset($aliases[$key]) && is_string($aliases[$key]) && !isset($seen[$key])) {
        $seen[$key] = true;
        $next = $aliases[$key];
        if ($next === '' || $next === $key) {
            break;
        }
        $key = $next;
    }
    if (!isset($players[$key])) {
        return '';
    }

    return $key;
}

/** @param array<string, string> $aliases
 *  @return list<string>
 */
function hall_identity_keys(array $aliases, string $key): array
{
    $keys = [$key => true];
    $changed = true;
    while ($changed) {
        $changed = false;
        foreach ($aliases as $from => $to) {
            if (is_string($from) && is_string($to) && isset($keys[$to]) && !isset($keys[$from])) {
                $keys[$from] = true;
                $changed = true;
            }
        }
    }

    return array_keys($keys);
}

/** @param array<string, mixed> $state */
function &hall_players(array &$state, string $month): array
{
    if (!isset($state['months']) || !is_array($state['months'])) {
        $state['months'] = [];
    }
    if (!isset($state['months'][$month]) || !is_array($state['months'][$month])) {
        $state['months'][$month] = ['players' => []];
    }
    if (!isset($state['months'][$month]['players']) || !is_array($state['months'][$month]['players'])) {
        $state['months'][$month]['players'] = [];
    }

    return $state['months'][$month]['players'];
}

/** @param array<string, mixed> $current */
function hall_blank(string $name): array
{
    return [
        'name' => $name,
        'caught' => 0,
        'energy' => 0,
        'missions' => 0,
        'places' => [],
        'seconds' => 0,
        'batch' => '',
        'accepted' => null,
        'updated' => now_ms(),
    ];
}

function handle_hall_get(): array
{
    return with_hall(false, static function (array &$state): array {
        return hall_public($state);
    });
}

function handle_hall_post(array $body): array
{
    $name = clean_name($body['name'] ?? '');
    if ($name === '') {
        json_out(['error' => 'no name'], 400);
    }
    $batch = (string) ($body['batch'] ?? '');
    if (preg_match('/^[A-Za-z0-9_-]{8,40}$/', $batch) !== 1) {
        json_out(['error' => 'batch'], 400);
    }
    $caught = hall_delta($body['caught'] ?? 0, HALL_CAP_CAUGHT);
    $energy = hall_delta($body['energy'] ?? 0, HALL_CAP_ENERGY);
    $missions = hall_delta($body['missions'] ?? 0, HALL_CAP_MISSIONS);
    $seconds = hall_delta($body['seconds'] ?? 0, HALL_CAP_SECONDS);
    $rawPlaces = [];
    if (isset($body['places']) && is_array($body['places'])) {
        foreach ($body['places'] as $id) {
            if (!is_string($id) && !is_int($id)) {
                continue;
            }
            $rawPlaces[] = (string) $id;
            if (count($rawPlaces) >= HALL_CAP_PLACES) {
                break;
            }
        }
    }

    return with_hall(true, static function (array &$state) use ($name, $batch, $caught, $energy, $missions, $seconds, $rawPlaces): array {
        $empty = [
            'caught' => $caught,
            'energy' => $energy,
            'missions' => $missions,
            'places' => $rawPlaces,
            'seconds' => $seconds,
        ];
        if (hall_key($name) === 'roboto') {
            return ['ok' => true, 'accepted' => $empty, 'hall' => hall_public($state)];
        }

        $month = hall_month();
        $players = &hall_players($state, $month);
        if (!isset($state['aliases']) || !is_array($state['aliases'])) {
            $state['aliases'] = [];
        }
        $posted = hall_key($name);
        $resolved = hall_resolve($players, $state['aliases'], $posted);
        $key = $resolved !== '' ? $resolved : $posted;
        if (!isset($players[$key]) || !is_array($players[$key])) {
            $players[$key] = hall_blank($name);
        }
        $player = &$players[$key];
        if (!isset($player['places']) || !is_array($player['places'])) {
            $player['places'] = [];
        }

        if ((string) ($player['batch'] ?? '') === $batch && is_array($player['accepted'] ?? null)) {
            return ['ok' => true, 'name' => (string) $player['name'], 'accepted' => $player['accepted'], 'hall' => hall_public($state)];
        }

        $acceptedPlaces = [];
        foreach ($rawPlaces as $raw) {
            $acceptedPlaces[] = $raw;
            $clean = clean_place($raw);
            if ($clean === '') {
                continue;
            }
            if (!in_array($clean, $player['places'], true) && count($player['places']) < HALL_MAX_PLACES) {
                $player['places'][] = $clean;
            }
        }
        $player['caught'] = min(HALL_MAX_TOTAL, (int) ($player['caught'] ?? 0) + $caught);
        $player['energy'] = min(HALL_MAX_TOTAL, (int) ($player['energy'] ?? 0) + $energy);
        $player['missions'] = min(HALL_MAX_TOTAL, (int) ($player['missions'] ?? 0) + $missions);
        $player['seconds'] = min(HALL_MAX_TOTAL, (int) ($player['seconds'] ?? 0) + $seconds);
        $accepted = [
            'caught' => $caught,
            'energy' => $energy,
            'missions' => $missions,
            'places' => $acceptedPlaces,
            'seconds' => $seconds,
        ];
        $player['batch'] = $batch;
        $player['accepted'] = $accepted;
        $player['updated'] = now_ms();

        return ['ok' => true, 'name' => (string) $player['name'], 'accepted' => $accepted, 'hall' => hall_public($state)];
    });
}

function hall_admin_delete(array $body): array
{
    $name = clean_name($body['name'] ?? '');
    if ($name === '') {
        json_out(['error' => 'no name'], 400);
    }
    $key = hall_key($name);

    return with_hall(true, static function (array &$state) use ($key): array {
        $aliases = (isset($state['aliases']) && is_array($state['aliases'])) ? $state['aliases'] : [];
        $keys = hall_identity_keys($aliases, $key);
        if (isset($state['months']) && is_array($state['months'])) {
            foreach ($state['months'] as &$bucket) {
                if (is_array($bucket) && isset($bucket['players']) && is_array($bucket['players'])) {
                    foreach ($keys as $drop) {
                        unset($bucket['players'][$drop]);
                    }
                }
            }
            unset($bucket);
        }
        foreach ($aliases as $from => $to) {
            if (in_array($from, $keys, true) || in_array($to, $keys, true)) {
                unset($aliases[$from]);
            }
        }
        $state['aliases'] = $aliases;

        return ['ok' => true, 'hall' => hall_public($state)];
    });
}

function hall_admin_rename(array $body): array
{
    $name = clean_name($body['name'] ?? '');
    $next = clean_name($body['rename'] ?? '');
    if ($name === '' || $next === '') {
        json_out(['error' => 'no name'], 400);
    }
    if (hall_key($next) === 'roboto') {
        json_out(['error' => 'name'], 400);
    }
    $key = hall_key($name);
    $nextKey = hall_key($next);

    return with_hall(true, static function (array &$state) use ($key, $next, $nextKey): array {
        $month = hall_month();
        $players = &hall_players($state, $month);
        if (!isset($players[$key]) || !is_array($players[$key])) {
            json_out(['error' => 'missing'], 404);
        }
        if ($nextKey !== $key && isset($players[$nextKey])) {
            json_out(['error' => 'name-taken'], 409);
        }
        $rec = $players[$key];
        unset($players[$key]);
        $rec['name'] = $next;
        $players[$nextKey] = $rec;
        if ($nextKey !== $key) {
            if (!isset($state['aliases']) || !is_array($state['aliases'])) {
                $state['aliases'] = [];
            }
            foreach ($state['aliases'] as $from => $to) {
                if ($to === $key) {
                    $state['aliases'][$from] = $nextKey;
                }
            }
            $state['aliases'][$key] = $nextKey;
            unset($state['aliases'][$nextKey]);
        }

        return ['ok' => true, 'hall' => hall_public($state)];
    });
}

function handle_teacher(array $body): array
{
    if ((string) ($body['pin'] ?? '') !== teacher_pin()) {
        json_out(['error' => 'pin'], 403);
    }

    $act = (string) ($body['action'] ?? '');
    if ($act === 'auth') {
        return ['ok' => true];
    }
    if ($act === 'hall-delete') {
        return hall_admin_delete($body);
    }
    if ($act === 'hall-rename') {
        return hall_admin_rename($body);
    }

    return with_state(true, static function (array &$state) use ($body, $act): array {
        $round = &$state['round'];
        if ($act === 'start') {
            $round['id'] = (int) $round['id'] + 1;
            $round['active'] = true;
            $round['duration'] = max(30, min(3600, (int) ($body['duration'] ?? 300)));
            $delay = max(3, min(60, (int) ($body['delay'] ?? 10)));
            $round['start'] = now_ms() + $delay * 1000;
            $round['seed'] = random_int(1, 2_147_483_647);
            $round['stopped_at'] = 0;
            foreach ($state['players'] as &$p) {
                if (is_array($p)) {
                    $p['score'] = 0;
                    $p['caught'] = 0;
                }
            }
            unset($p);
        } elseif ($act === 'stop') {
            if (!empty($round['active'])) {
                $round['stopped_at'] = now_ms();
            }
        } elseif ($act === 'reset') {
            $round['active'] = false;
            $round['stopped_at'] = 0;
            $state['players'] = [];
        } else {
            json_out(['error' => 'action'], 400);
        }

        return ['ok' => true, 'round' => round_info($round)];
    });
}

function default_presence(): array
{
    return ['players' => []];
}

/**
 * @template T
 * @param callable(array): T $fn
 * @return T
 */
function with_presence(callable $fn): mixed
{
    $dir = dirname(PRESENCE_FILE);
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        throw new RuntimeException('Nelze vytvořit data/.');
    }

    $fh = fopen(PRESENCE_FILE, 'c+');
    if ($fh === false) {
        throw new RuntimeException('Nelze otevřít presence.json.');
    }

    if (!flock($fh, LOCK_EX)) {
        fclose($fh);
        throw new RuntimeException('Nelze zamknout presence.json.');
    }

    try {
        rewind($fh);
        $raw = stream_get_contents($fh);
        $state = default_presence();
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded) && isset($decoded['players']) && is_array($decoded['players'])) {
                $state = $decoded;
            }
        }

        $result = $fn($state);

        $json = json_encode($state, JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            throw new RuntimeException('JSON encode selhal.');
        }
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, $json);
        fflush($fh);

        return $result;
    } finally {
        flock($fh, LOCK_UN);
        fclose($fh);
    }
}

function clamp_num(mixed $value, float $min, float $max, float $fallback): float
{
    if (!is_int($value) && !is_float($value)) {
        return $fallback;
    }
    $n = (float) $value;
    if (!is_finite($n)) {
        return $fallback;
    }

    return max($min, min($max, $n));
}

function wrap_angle(float $angle): float
{
    $angle = fmod($angle, 2 * M_PI);
    if ($angle > M_PI) {
        $angle -= 2 * M_PI;
    }
    if ($angle < -M_PI) {
        $angle += 2 * M_PI;
    }

    return $angle;
}

function clean_name(mixed $value): string
{
    $name = trim(preg_replace('/[\x00-\x1F\x7F]/u', '', (string) $value) ?? '');

    return mb_substr($name, 0, 14);
}

function prune_presence(array &$players, int $now): void
{
    foreach ($players as $key => $p) {
        if (!is_array($p) || ($now - (int) ($p['seen'] ?? 0)) > PRESENCE_KEEP_MS) {
            unset($players[$key]);
        }
    }
    while (count($players) > PRESENCE_MAX) {
        $oldest = null;
        $oldestSeen = PHP_INT_MAX;
        foreach ($players as $key => $p) {
            $seen = (int) ($p['seen'] ?? 0);
            if ($seen < $oldestSeen) {
                $oldestSeen = $seen;
                $oldest = $key;
            }
        }
        if ($oldest === null) {
            break;
        }
        unset($players[$oldest]);
    }
}

function presence_rows(array $players, string $selfId, int $now): array
{
    $rows = [];
    foreach ($players as $p) {
        if (!is_array($p)) {
            continue;
        }
        $id = (string) ($p['id'] ?? '');
        if ($id === '' || $id === $selfId) {
            continue;
        }
        $seen = (int) ($p['seen'] ?? 0);
        $rows[] = [
            'id' => $id,
            'name' => (string) ($p['name'] ?? ''),
            'char' => (string) ($p['char'] ?? 'kuba'),
            'color' => array_key_exists('color', $p) ? $p['color'] : null,
            'x' => (float) ($p['x'] ?? 0),
            'z' => (float) ($p['z'] ?? 0),
            'y' => (float) ($p['y'] ?? 0),
            'face' => (float) ($p['face'] ?? 0),
            'veh' => (int) ($p['veh'] ?? -1),
            'score' => (int) ($p['score'] ?? 0),
            'seen' => $seen,
            'away' => !empty($p['away']) || ($now - $seen) > PRESENCE_AWAY_MS,
        ];
    }

    return $rows;
}

function handle_presence(array $body): array
{
    $id = (string) ($body['id'] ?? '');
    if (preg_match('/^[A-Za-z0-9_-]{8,40}$/', $id) !== 1) {
        json_out(['error' => 'bad id'], 400);
    }
    $seq = max(0, (int) ($body['seq'] ?? 0));
    $bye = !empty($body['bye']);

    $result = with_presence(static function (array &$state) use ($body, $id, $seq, $bye): array {
        $now = now_ms();
        $players = &$state['players'];
        prune_presence($players, $now);

        $current = (isset($players[$id]) && is_array($players[$id])) ? $players[$id] : null;
        $currentSeq = (int) ($current['seq'] ?? 0);
        if ($seq < $currentSeq) {
            return ['ok' => true, 'players' => presence_rows($players, $id, $now)];
        }

        if ($bye) {
            if ($current !== null) {
                $current['away'] = true;
                $current['seq'] = $seq;
                $players[$id] = $current;
            }
        } else {
            $name = clean_name($body['name'] ?? '');
            if ($name === '') {
                $name = $current !== null ? (string) ($current['name'] ?? '') : '';
            }
            if ($name === '') {
                return ['error' => 'no name'];
            }
            $char = (string) ($body['char'] ?? '');
            if ($char === '' && $current !== null) {
                $char = (string) ($current['char'] ?? '');
            }
            if (!in_array($char, CHAR_IDS, true)) {
                $char = 'kuba';
            }
            $color = null;
            if (array_key_exists('color', $body) && $body['color'] !== null) {
                $color = (int) clamp_num($body['color'], 0, 0xFFFFFF, 0);
            } elseif ($current !== null && array_key_exists('color', $current)) {
                $color = $current['color'];
            }
            $players[$id] = [
                'id' => $id,
                'name' => $name,
                'char' => $char,
                'color' => $color,
                'x' => clamp_num($body['x'] ?? null, MAP_X0, MAP_X1, (float) ($current['x'] ?? 0)),
                'z' => clamp_num($body['z'] ?? null, MAP_Z0, MAP_Z1, (float) ($current['z'] ?? 0)),
                'y' => clamp_num($body['y'] ?? null, 0, 12, 0),
                'face' => wrap_angle(clamp_num($body['face'] ?? null, -100, 100, 0)),
                'veh' => (int) clamp_num($body['veh'] ?? null, -1, 15, -1),
                'score' => (int) clamp_num($body['score'] ?? null, 0, 1000000, (float) ($current['score'] ?? 0)),
                'seen' => $now,
                'away' => false,
                'seq' => $seq,
            ];
            prune_presence($players, $now);
        }

        return ['ok' => true, 'players' => presence_rows($players, $id, $now)];
    });
    if (isset($result['error'])) {
        json_out($result, 400);
    }

    return $result;
}
