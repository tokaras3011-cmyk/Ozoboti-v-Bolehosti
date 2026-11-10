import { game, bind } from './context.js';

export const api = {};

const SEND_EVERY = 0.25;
const RENDER_DELAY = 280;
const SNAP = 90;

export function initPresence() {
  const fileMode = location.protocol === 'file:';
  const endpoint = new URL('api/presence', new URL('.', location.href).href).href;
  const peers = [];
  const byId = new Map();
  let seqN = 0;
  let acc = SEND_EVERY;
  let busy = false;
  let gone = false;
  let id = '';

  function pid() {
    if (id) return id;
    try { id = sessionStorage.getItem('ozoboti-pid') || ''; } catch (e) { id = ''; }
    if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) {
      const raw = (crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2)));
      id = raw.replace(/-/g, '').slice(0, 32);
      try { sessionStorage.setItem('ozoboti-pid', id); } catch (e) {}
    }
    return id;
  }

  function shirt(charId, color) {
    const ch = game.CHARS.find(c => c.id === charId) || game.CHARS[0];
    const c = color == null ? ch.shirt : (color >>> 0);
    return '#' + (c & 0xffffff).toString(16).padStart(6, '0');
  }

  function drop(mesh) {
    mesh.g.traverse(o => {
      if (o.isSprite && o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    game.scene.remove(mesh.g);
  }

  function removePeer(key) {
    const peer = byId.get(key);
    if (peer && peer.mesh) drop(peer.mesh);
    byId.delete(key);
  }

  function ensure(peer, p) {
    const colorKey = String(p.color);
    const same = peer.mesh && peer.char === p.char && peer.colorKey === colorKey && peer.name === p.name;
    peer.char = p.char;
    peer.colorKey = colorKey;
    peer.name = String(p.name || '');
    peer.css = shirt(p.char, p.color);
    if (!same) {
      if (peer.mesh) drop(peer.mesh);
      peer.mesh = game.buildRemote(p.char, p.color, peer.name);
      peer.mesh.setVeh(p.veh | 0);
      game.scene.add(peer.mesh.g);
    } else if ((p.veh | 0) !== peer.mesh.veh) {
      peer.mesh.setVeh(p.veh | 0);
    }
  }

  function pushSample(peer, x, z, y, face) {
    const t = performance.now();
    const last = peer.samples[peer.samples.length - 1];
    if (last && Math.hypot(x - last.x, z - last.z) > SNAP) {
      peer.samples = [{t, x, z, y, face}];
      return;
    }
    if (last && Math.hypot(x - last.x, z - last.z) < 0.04 && Math.abs(y - last.y) < 0.04) {
      let d = face - last.face;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      if (Math.abs(d) < 0.03) return;
    }
    peer.samples.push({t, x, z, y, face});
    if (peer.samples.length > 8) peer.samples.shift();
  }

  function sampleAt(peer) {
    const s = peer.samples;
    if (!s.length) return null;
    const last = s[s.length - 1];
    if (peer.away) return {x: last.x, z: last.z, y: last.y, face: last.face, speed: 0};
    const renderT = performance.now() - RENDER_DELAY;
    if (s.length === 1 || renderT <= s[0].t) return {x: s[0].x, z: s[0].z, y: s[0].y, face: s[0].face, speed: 0};
    if (renderT >= last.t) return {x: last.x, z: last.z, y: last.y, face: last.face, speed: 0};
    for (let i = 1; i < s.length; i++) {
      if (renderT > s[i].t) continue;
      const a = s[i - 1], b = s[i];
      const span = b.t - a.t;
      const u = span > 0 ? (renderT - a.t) / span : 1;
      let d = b.face - a.face;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const dt = span / 1000;
      return {
        x: a.x + (b.x - a.x) * u,
        z: a.z + (b.z - a.z) * u,
        y: a.y + (b.y - a.y) * u,
        face: a.face + d * u,
        speed: dt > 0 ? Math.hypot(b.x - a.x, b.z - a.z) / dt : 0
      };
    }
    return {x: last.x, z: last.z, y: last.y, face: last.face, speed: 0};
  }

  function place(peer, dt) {
    const pose = sampleAt(peer);
    if (!pose || !peer.mesh) return;
    const ground = game.gy(pose.x, pose.z);
    peer.mesh.g.position.set(pose.x, ground + pose.y, pose.z);
    peer.mesh.g.rotation.y = pose.face;
    const av = peer.mesh.av;
    const onFoot = peer.mesh.veh < 0;
    if (onFoot) {
      const moving = !peer.away && pose.speed > 1.2;
      if (moving) peer.walk += dt * pose.speed * 0.9;
      const sw = moving ? Math.sin(peer.walk) * 0.9 : 0;
      av.legL.rotation.x = sw;
      av.legR.rotation.x = -sw;
      const arms = pose.y > 0.1 ? -2.6 : -sw;
      av.armL.rotation.x = arms;
      av.armR.rotation.x = pose.y > 0.1 ? -2.6 : sw;
    } else if (!peer.away && pose.speed > 0.4) {
      peer.mesh.wheels.forEach(w => { w.p.rotation.x += pose.speed * dt / w.r; });
    }
    peer.mesh.hour.visible = !!peer.away;
    if (peer.away) peer.mesh.hour.material.opacity = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(game.time * 4));
  }

  function apply(list) {
    const seen = new Set();
    for (const p of list) {
      if (!p || typeof p.id !== 'string') continue;
      seen.add(p.id);
      let peer = byId.get(p.id);
      if (!peer) {
        peer = {samples: [], walk: 0, mesh: null, char: '', colorKey: '', name: '', css: '#fff', away: false, score: 0};
        byId.set(p.id, peer);
      }
      peer.away = !!p.away;
      peer.score = Number.isFinite(+p.score) ? Math.max(0, Math.min(1000000, Math.floor(+p.score))) : 0;
      ensure(peer, p);
      const x = Number.isFinite(+p.x) ? +p.x : 0;
      const z = Number.isFinite(+p.z) ? +p.z : 0;
      const y = Number.isFinite(+p.y) ? +p.y : 0;
      const face = Number.isFinite(+p.face) ? +p.face : 0;
      pushSample(peer, x, z, y, face);
      place(peer, 0);
    }
    for (const key of [...byId.keys()]) {
      if (!seen.has(key)) removePeer(key);
    }
  }

  async function post() {
    busy = true;
    const body = {
      id: pid(),
      seq: ++seqN,
      name: game.S.name,
      char: game.S.char,
      color: game.S.color,
      x: game.pv.x,
      z: game.pv.z,
      y: game.pv.y,
      face: game.pv.face,
      veh: game.curVeh | 0,
      score: liveScore()
    };
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
        cache: 'no-store',
        signal: AbortSignal.timeout(2500)
      });
      const data = await r.json();
      if (!gone && r.ok && data && Array.isArray(data.players)) apply(data.players);
    } catch (e) {}
    busy = false;
  }

  function leave() {
    if (gone || fileMode || !game.started) return;
    gone = true;
    const body = JSON.stringify({id: pid(), bye: true, seq: ++seqN});
    const blob = new Blob([body], {type: 'application/json'});
    if (!(navigator.sendBeacon && navigator.sendBeacon(endpoint, blob))) {
      fetch(endpoint, {method: 'POST', headers: {'Content-Type': 'application/json'}, body, keepalive: true}).catch(() => {});
    }
  }

  function liveScore() {
    if (game.inRound && game.inRound() && game.Round) return Math.floor(game.Round.score);
    return game.S && game.S.caught ? (game.S.caught | 0) : 0;
  }

  function roundListOn() {
    return !!(game.inRound && game.inRound() && game.Net && (game.Net.phase === 'countdown' || game.Net.phase === 'running'));
  }

  function paintActive() {
    if (!game.paintSideList || !game.elBoard) return;
    if (roundListOn()) return;
    if (!game.started || !game.S) {
      game.elBoard.style.display = 'none';
      return;
    }
    const rows = [{name: game.S.name, score: liveScore(), me: true}];
    for (const peer of byId.values()) {
      if (peer.away || !peer.name) continue;
      rows.push({name: peer.name, score: peer.score | 0, me: false});
    }
    rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'cs'));
    game.paintSideList('Aktivní hráči', 'chyceno', rows);
  }

  function tick(dt) {
    if (fileMode) return;
    if (game.started && !gone && game.S && game.pv) {
      acc += dt;
      if (!busy && acc >= SEND_EVERY) {
        acc = 0;
        post();
      }
    }
    for (const peer of byId.values()) place(peer, dt);
    peers.length = 0;
    for (const peer of byId.values()) {
      if (!peer.mesh) continue;
      peers.push({x: peer.mesh.g.position.x, z: peer.mesh.g.position.z, name: peer.name, color: peer.css, away: !!peer.away});
    }
    paintActive();
  }

  addEventListener('pagehide', leave);
  bind(game, 'peers', () => peers);
  api.tick = tick;
}
