import { game, bind } from './context.js';

export const api = {};

const CAP = {caught: 20, energy: 50000, missions: 10, seconds: 120, places: 15};
const STORE = 'ozo_hall';

export function initHall() {
  const fileMode = location.protocol === 'file:';
  const endpoint = new URL('api/hall', location.href).href;
  const esc = s => String(s).replace(/[&<>]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[c]));

  function pragueMonth() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit'
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === 'year');
    const m = parts.find(p => p.type === 'month');
    return (y ? y.value : '0000') + '-' + (m ? m.value : '01');
  }

  function emptyPending() {
    return {caught: 0, energy: 0, missions: 0, places: [], seconds: 0};
  }

  function loadState() {
    const blank = {month: pragueMonth(), name: '', skip: false, joined: false, shown: '', pending: emptyPending(), inflight: null};
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (!s || typeof s !== 'object') return blank;
      const p = s.pending || {};
      return {
        month: typeof s.month === 'string' ? s.month : blank.month,
        name: typeof s.name === 'string' ? s.name : '',
        skip: !!s.skip,
        joined: !!s.joined,
        shown: typeof s.shown === 'string' ? s.shown : '',
        pending: {
          caught: Math.max(0, +p.caught || 0),
          energy: Math.max(0, +p.energy || 0),
          missions: Math.max(0, +p.missions || 0),
          places: Array.isArray(p.places) ? p.places.filter(id => typeof id === 'string' && id) : [],
          seconds: Math.max(0, +p.seconds || 0)
        },
        inflight: s.inflight && typeof s.inflight.id === 'string' ? s.inflight : null
      };
    } catch (e) {
      return blank;
    }
  }

  const state = loadState();
  let board = {month: '', label: '', players: []};
  let serverMonth = '';
  let chain = Promise.resolve();
  let acc = 0;
  let saveAcc = 0;
  let placeAcc = 0;
  let hudSig = '';

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }

  function enqueue(fn) {
    const run = chain.then(fn, fn);
    chain = run.then(() => {}, () => {});
    return run;
  }

  function newId() {
    let s = '';
    while (s.length < 16) s += Math.random().toString(36).slice(2);
    return s.slice(0, 16);
  }

  function takeInflight() {
    const p = state.pending;
    const places = p.places.slice(0, CAP.places);
    const snap = {
      id: newId(),
      caught: Math.min(CAP.caught, Math.floor(p.caught) || 0),
      energy: Math.min(CAP.energy, Math.floor(p.energy) || 0),
      missions: Math.min(CAP.missions, Math.floor(p.missions) || 0),
      seconds: Math.min(CAP.seconds, Math.floor(p.seconds) || 0),
      places
    };
    const empty = !snap.caught && !snap.energy && !snap.missions && !snap.seconds && !snap.places.length;
    if (empty && state.joined) return null;
    return snap;
  }

  function applyAccepted(accRow) {
    if (!accRow) return;
    state.pending.caught = Math.max(0, state.pending.caught - (accRow.caught | 0));
    state.pending.energy = Math.max(0, state.pending.energy - (+accRow.energy || 0));
    state.pending.missions = Math.max(0, state.pending.missions - (accRow.missions | 0));
    state.pending.seconds = Math.max(0, state.pending.seconds - (accRow.seconds | 0));
    const done = new Set(Array.isArray(accRow.places) ? accRow.places : []);
    state.pending.places = state.pending.places.filter(id => !done.has(id));
  }

  function rollLocal() {
    const month = pragueMonth();
    if (state.month && state.month !== month) {
      state.pending = emptyPending();
      state.inflight = null;
      state.joined = false;
    }
    state.month = month;
  }

  function payload(snap) {
    return {
      name: state.name,
      batch: snap.id,
      caught: snap.caught,
      energy: snap.energy,
      missions: snap.missions,
      places: snap.places,
      seconds: snap.seconds
    };
  }

  async function syncInner() {
    if (fileMode || state.skip || !state.name) return;
    rollLocal();
    if (!state.inflight) {
      state.inflight = takeInflight();
      if (!state.inflight) return;
      save();
    }
    let data = null;
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload(state.inflight)),
        cache: 'no-store'
      });
      data = await r.json();
      if (!r.ok || !data || !data.ok) data = null;
    } catch (e) {
      data = null;
    }
    if (!data) return;
    applyAccepted(data.accepted);
    state.inflight = null;
    state.joined = true;
    if (typeof data.name === 'string' && data.name) state.shown = data.name;
    if (data.hall && data.hall.month) {
      serverMonth = data.hall.month;
      state.month = data.hall.month;
      board = data.hall;
      paint();
    }
    save();
  }

  function sync() {
    return enqueue(() => syncInner());
  }

  function join(name) {
    const n = String(name || '').trim().slice(0, 14);
    return enqueue(async () => {
      if (state.name && n.toLowerCase() !== state.name.toLowerCase()) {
        await syncInner();
        state.pending = emptyPending();
        state.inflight = null;
        state.joined = false;
        state.shown = n;
      }
      state.name = n;
      if (!state.shown) state.shown = n;
      state.skip = n.toLowerCase() === 'roboto';
      save();
      if (!state.skip) await syncInner();
    });
  }

  function noteCatch() {
    if (state.skip || !state.name) return;
    state.pending.caught += 1;
    save();
  }

  function noteEnergy(n) {
    if (state.skip || !state.name) return;
    n = +n;
    if (!(n > 0)) return;
    state.pending.energy += n;
  }

  function noteMission() {
    if (state.skip || !state.name) return;
    state.pending.missions += 1;
    save();
  }

  function notePlace(id) {
    if (state.skip || !state.name) return;
    id = String(id || '');
    if (!id || state.pending.places.indexOf(id) >= 0) return;
    state.pending.places.push(id);
    save();
  }

  function leave() {
    if (fileMode || state.skip || !state.name) return;
    rollLocal();
    if (!state.inflight) {
      state.inflight = takeInflight();
      if (!state.inflight) return;
      save();
    }
    const body = JSON.stringify(payload(state.inflight));
    const blob = new Blob([body], {type: 'application/json'});
    if (!(navigator.sendBeacon && navigator.sendBeacon(endpoint, blob))) {
      fetch(endpoint, {method: 'POST', headers: {'Content-Type': 'application/json'}, body, keepalive: true}).catch(() => {});
    }
  }

  function isMe(name) {
    const n = String(name).toLowerCase();
    if (state.shown && state.shown.toLowerCase() === n) return true;
    return !!(game.S && game.S.name && game.S.name.toLowerCase() === n);
  }

  function fmtDur(sec) {
    sec = Math.max(0, Math.floor(+sec || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return h + ' h ' + m + ' min';
    return m + ' min';
  }

  function fmtEnergy(n) {
    n = Math.floor(+n || 0);
    return game.fmt ? game.fmt(n) : String(n);
  }

  const css = document.createElement('style');
  css.textContent = `
  #hall{right:12px;top:276px;width:210px;font-size:14px;line-height:1.25;font-weight:700;background:#0a1a3acc;padding:8px 10px;border-radius:12px;display:none;pointer-events:auto;text-shadow:0 1px 2px #000a;z-index:6;cursor:pointer}
  #hall .xh{color:#ffe94a;font-size:14px;margin:0 0 4px}
  #hall .xu{display:block;color:#c9d6ea;font-size:11px;font-weight:700}
  #hall .xe{opacity:.8;font-size:13px}
  #hall .xr{display:flex;gap:6px;align-items:baseline;padding:2px 4px;border-radius:6px}
  #hall .xr.me{background:#ffe94a33}
  #hall .xk{width:1.6em;flex:0 0 auto;opacity:.85}
  #hall .xn{flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #hall .xs{flex:0 0 auto;font-variant-numeric:tabular-nums}
  body.touch-play #hall{width:168px;font-size:12px;max-height:22vh;overflow:auto}
  .halltable{width:100%;border-collapse:collapse;font-size:14px}
  .halltable th,.halltable td{padding:4px 6px;border-bottom:1px solid #e3e3e3;text-align:right;white-space:nowrap}
  .halltable th:nth-child(2),.halltable td:nth-child(2){text-align:left}
  .halltable tr.me{background:#fff3c4;font-weight:800}
  `;
  document.head.appendChild(css);
  const el = document.createElement('div');
  el.id = 'hall';
  el.className = 'hud';
  el.title = 'Klikni pro celou síň slávy';
  document.body.appendChild(el);
  el.addEventListener('click', ev => {
    ev.stopPropagation();
    openFull();
  });

  function placeBox() {
    if (!game.started) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';
    let top = 276;
    const boardEl = game.elBoard;
    if (boardEl && boardEl.style.display !== 'none') {
      const r = boardEl.getBoundingClientRect();
      if (r.height > 8) top = Math.round(r.bottom + 8);
    }
    el.style.top = top + 'px';
  }

  function paintHud() {
    if (!game.started) {
      el.style.display = 'none';
      return;
    }
    const top = (board.players || []).slice(0, 3);
    const sig = (board.label || '') + '|' + top.map(p => (isMe(p.name) ? '*' : '') + p.name + ':' + p.caught).join(';');
    placeBox();
    if (sig === hudSig && el.innerHTML) return;
    hudSig = sig;
    let html = '<div class="xh">🏆 Síň slávy<span class="xu">' + esc(board.label || '') + '</span></div>';
    if (!top.length) html += '<div class="xe">Zatím nikdo</div>';
    top.forEach((p, i) => {
      html += '<div class="xr' + (isMe(p.name) ? ' me' : '') + '"><span class="xk">' + (i + 1) + '.</span><span class="xn">' + esc(p.name) + '</span><span class="xs">' + (p.caught | 0) + '</span></div>';
    });
    el.innerHTML = html;
  }

  function paintStart() {
    const box = game.$ ? game.$('board') : document.getElementById('board');
    if (!box) return;
    const top = (board.players || []).slice(0, 3);
    const label = board.label ? '<small>' + esc(board.label) + '</small><br>' : '';
    box.innerHTML = label + (top.length
      ? top.map((p, i) => (i + 1) + '. ' + esc(p.name) + ' – ' + (p.caught | 0)).join('<br>')
      : '<i>zatím nikdo – buď první!</i>');
  }

  function paint() {
    hudSig = '';
    paintHud();
    paintStart();
  }

  function openFull() {
    if (!game.openModal) return;
    game.openModal('🏆 Síň slávy', node => {
      const rows = board.players || [];
      let h = '<p>Měsíc: <b>' + esc(board.label || '') + '</b>. Pořadí je podle chycených Ozobotů.</p>';
      if (!rows.length) {
        h += '<p>Zatím nikdo. Kdo dá Hrát, objeví se tady.</p>';
      } else {
        h += '<table class="halltable"><tr><th>#</th><th>Jméno</th><th>Chyceno</th><th>Energie</th><th>Mise</th><th>Místa</th><th>Čas</th></tr>';
        rows.forEach((p, i) => {
          h += '<tr class="' + (isMe(p.name) ? 'me' : '') + '"><td>' + (i + 1) + '.</td><td>' + esc(p.name) + '</td><td>' + (p.caught | 0) + '</td><td>⚡' + esc(fmtEnergy(p.energy)) + '</td><td>' + (p.missions | 0) + '</td><td>' + (p.places | 0) + '</td><td>' + esc(fmtDur(p.seconds)) + '</td></tr>';
        });
        h += '</table>';
      }
      node.innerHTML = h;
    }, false);
  }

  async function refresh() {
    if (fileMode) {
      paint();
      return;
    }
    try {
      const r = await fetch(endpoint, {cache: 'no-store'});
      const data = await r.json();
      if (!r.ok || !data || !data.month) return;
      serverMonth = data.month;
      if (state.month && state.month !== data.month) {
        state.pending = emptyPending();
        state.inflight = null;
        state.joined = false;
        state.month = data.month;
        save();
      } else if (!state.month) {
        state.month = data.month;
      }
      board = data;
      paint();
    } catch (e) {}
  }

  function tick(dt) {
    if (fileMode) return;
    if (game.started && state.name && !state.skip && document.visibilityState === 'visible') {
      state.pending.seconds += dt;
      saveAcc += dt;
      if (saveAcc >= 5) {
        saveAcc = 0;
        save();
      }
      acc += dt;
      if (acc >= 20) {
        acc = 0;
        sync();
      }
    }
    placeAcc += dt;
    if (game.started && (el.style.display === 'none' || placeAcc >= 0.25)) {
      placeAcc = 0;
      paintHud();
    } else if (!game.started && el.style.display !== 'none') el.style.display = 'none';
  }

  const start = document.getElementById('hallstart');
  if (start) start.addEventListener('click', ev => {
    ev.preventDefault();
    openFull();
  });
  addEventListener('pagehide', leave);
  bind(game, 'hallCatch', () => noteCatch);
  bind(game, 'hallEnergy', () => noteEnergy);
  bind(game, 'hallMission', () => noteMission);
  bind(game, 'hallPlace', () => notePlace);
  bind(game, 'hallJoin', () => join);
  bind(game, 'hallPaintStart', () => paintStart);
  refresh();
  api.tick = tick;
}
