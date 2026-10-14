<?php

declare(strict_types=1);

/**
 * PHP náhrada server.py — režim kola pro Ozoboti z Bolehoště.
 *
 * Endpointy (přes .htaccess / router.php):
 *   GET  /ozoboti/api/state
 *   POST /ozoboti/api/score
 *   POST /ozoboti/api/teacher
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const STATE_FILE = __DIR__ . '/data/state.json';
const PLAYER_STALE_MS = 60_000;

$action = (string) ($_GET['action'] ?? '');
if ($action === '') {
    $uri = (string) (parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '');
    if (preg_match('#/api/(state|score|teacher)/?$#', $uri, $m)) {
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
    if ($action === 'teacher' && $method === 'POST') {
        json_out(handle_teacher(read_json_body()));
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

function handle_teacher(array $body): array
{
    if ((string) ($body['pin'] ?? '') !== teacher_pin()) {
        json_out(['error' => 'pin'], 403);
    }

    $act = (string) ($body['action'] ?? '');
    if ($act === 'auth') {
        return ['ok' => true];
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
