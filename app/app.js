// GTA 6 trophy tracker: loads the 55 trophies, renders the checklist, and
// keeps earned ticks in localStorage with export and import. Spoiler mode
// hides hidden story trophies until they are earned. Deep links: #roadmap,
// #missable, #trophy-<id>, #grade-<grade>.
//
// Round 2 changes:
// - Cards are keyboard-operable (focusable, Enter/Space opens the guide) and
//   ticking a trophy updates only that card in place, so focus never drops
//   to <body> (U3).
// - Trophies whose method is unconfirmed (ids 44, 49, 50, 51) carry a visible
//   "Method unconfirmed" badge on the card and in the detail panel (U2).
// - A bad #grade-<x> deep link empties the list with an explanation instead
//   of failing silently (U4).
// - The detail panel manages focus: opening it focuses its close button and
//   closing (or Escape) returns focus to the card that opened it (U5).
// - The progress bar is a real progressbar with aria-valuenow and a
//   polite live region for its text (U6).
const KEY = 'gta6-trophy-progress-v1';
const VALID_GRADES = new Set(['platinum', 'gold', 'silver', 'bronze']);
const listEl = document.getElementById('list');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const kindEl = document.getElementById('kind');
const missableEl = document.getElementById('missable-only');
const hideEarnedEl = document.getElementById('hide-earned');
const spoilerEl = document.getElementById('spoiler');
const detailEl = document.getElementById('detail');
const emptyEl = document.getElementById('empty-state');
const countEl = document.getElementById('count-line');
const progressBarEl = document.getElementById('progress-bar');

let earned = new Set();
try { earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch { earned = new Set(); }
const doc = await (await fetch('./data/trophies.json')).json();
const trophies = doc.trophies;

// Grade from a bad #grade-<x> deep link: while set, nothing matches, and the
// empty state explains why instead of showing a bare empty list (U4).
let invalidGrade = null;
// Element that had focus when the detail panel opened, for focus restore.
let detailReturnFocus = null;

function saveProgress() {
  localStorage.setItem(KEY, JSON.stringify([...earned].sort()));
}

function gradeCounts() {
  const c = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (earned.has(t.id)) c[t.grade] += 1;
  return c;
}

function updateProgress() {
  const c = gradeCounts();
  const pct = Math.round((earned.size / trophies.length) * 100);
  document.getElementById('progress-big').textContent = `${earned.size} / ${trophies.length}`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  progressBarEl.setAttribute('aria-valuenow', String(earned.size));
  progressBarEl.setAttribute('aria-valuetext', `${earned.size} of ${trophies.length} trophies earned, ${pct} percent`);
  document.getElementById('progress-text').textContent =
    `${pct}% earned · ${c.platinum} platinum · ${c.gold} gold · ${c.silver} silver · ${c.bronze} bronze`;
}

function isHidden(t) { return t.hidden && spoilerEl.checked && !earned.has(t.id); }

function matchesFilters(t) {
  if (invalidGrade) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (kindEl.value !== 'all' && t.kind !== kindEl.value) return false;
  if (missableEl.checked && !t.missable) return false;
  if (hideEarnedEl.checked && earned.has(t.id)) return false;
  if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) ||
    t.guide.toLowerCase().includes(q) || (t.target ?? '').toLowerCase().includes(q))) return false;
  return true;
}

function openDetail(t) {
  document.getElementById('detail-name').textContent = `${t.name} — ${t.grade}`;
  document.getElementById('detail-meta').textContent =
    `Trophy ${t.id} of 55 · ${t.kind} · ${t.hidden ? 'Hidden on PlayStation until earned' : 'Visible'}${t.missable ? ' · POSSIBLY MISSABLE' : ''}${t.unconfirmed ? ' · METHOD UNCONFIRMED' : ''}${t.target ? ` · Target: ${t.target}` : ''}`;
  document.getElementById('detail-desc').textContent = `Official description: “${t.description}”`;
  document.getElementById('detail-guide').textContent = t.guide;
  document.getElementById('detail-sources').textContent = `Sources: ${t.sources.join('; ')}.`;
  document.getElementById('detail-unconfirmed').hidden = !t.unconfirmed;
  detailReturnFocus = document.activeElement;
  detailEl.hidden = false;
  document.getElementById('detail-close').focus();
}

function closeDetail() {
  if (detailEl.hidden) return;
  detailEl.hidden = true;
  // Return focus to the card (or control) that opened the panel, if it is
  // still on the page; otherwise fall back to the list itself.
  const back = detailReturnFocus;
  detailReturnFocus = null;
  if (back && document.contains(back)) back.focus();
  else {
    // Fall back to the first card still in the list, if there is one.
    const first = listEl.querySelector('.card');
    if (first) first.focus();
  }
}

function updateCountLine(shown) {
  countEl.textContent =
    `Showing ${shown} of ${trophies.length} trophies · ${earned.size} earned · click a trophy for its full guide`;
}

// Rebuild one card's contents in place (same DOM node, same id), used when a
// tick changes that card — the list is never rebuilt for a tick, so keyboard
// focus stays exactly where it was (U3).
function refreshCard(li, t) {
  li.replaceChildren();
  li.className = 'card' + (earned.has(t.id) ? ' earned' : '');
  const hidden = isHidden(t);
  li.setAttribute('aria-label', hidden ? 'Hidden trophy — earn it to reveal' : `Open the guide for ${t.name}`);
  const row = document.createElement('div');
  row.className = 'row';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.setAttribute('aria-label', `Mark ${t.name} as earned`);
  box.addEventListener('change', () => onToggle(t, li, box));
  const badge = document.createElement('span');
  badge.className = `badge ${t.grade}`;
  badge.textContent = t.grade;
  const kindTag = document.createElement('span');
  kindTag.className = 'tag kind';
  kindTag.textContent = t.kind;
  row.append(box, badge, kindTag);
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'tag miss';
    m.textContent = 'Possibly missable';
    row.append(m);
  }
  if (t.unconfirmed) {
    const u = document.createElement('span');
    u.className = 'tag unconfirmed';
    u.textContent = 'Method unconfirmed';
    row.append(u);
  }
  const name = document.createElement('h3');
  name.textContent = hidden ? 'Hidden trophy — earn it to reveal' : t.name;
  if (hidden) name.className = 'hidden-name';
  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = hidden ? 'This story trophy is hidden on PlayStation until earned. Tick it off when you earn it.' : t.description;
  li.append(row, name, desc);
  if (!hidden) {
    if (t.target) {
      const tg = document.createElement('p');
      tg.className = 'target';
      tg.textContent = `Target: ${t.target}`;
      li.append(tg);
    }
    const guide = document.createElement('p');
    guide.className = 'guide';
    guide.textContent = t.guide;
    const src = document.createElement('p');
    src.className = 'src';
    src.textContent = `Sources: ${t.sources.join('; ')}.`;
    li.append(guide, src);
  }
  // Focus is restored by the caller (onToggle), which knows which element
  // had it before this card was rebuilt.
  return box;
}

function onToggle(t, li, box) {
  if (box.checked) earned.add(t.id); else earned.delete(t.id);
  saveProgress();
  updateProgress();
  // Hide-earned is on and this one is now earned: remove just this card.
  if (hideEarnedEl.checked && earned.has(t.id)) {
    const hadFocus = li.contains(document.activeElement);
    li.remove();
    updateCountLine(listEl.children.length);
    if (hadFocus) {
      const next = listEl.querySelector('.card');
      if (next) next.focus();
    }
    return;
  }
  // Otherwise update only this card, in place — the list is not rebuilt and
  // the checkbox keeps (or regains) focus.
  const wasCheckboxFocused = document.activeElement === box;
  const newBox = refreshCard(li, t);
  if (wasCheckboxFocused) newBox.focus();
  updateCountLine(listEl.children.length);
}

function createCard(t) {
  const li = document.createElement('li');
  li.id = `trophy-${t.id}`;
  li.tabIndex = 0;
  li.setAttribute('aria-label', isHidden(t) ? 'Hidden trophy — earn it to reveal' : `Open the guide for ${t.name}`);
  refreshCard(li, t);
  // Click anywhere but the checkbox opens the full guide panel.
  li.addEventListener('click', (e) => {
    if (e.target instanceof HTMLInputElement) return;
    if (!isHidden(t)) openDetail(t);
  });
  // Keyboard: Enter or Space on the card itself opens the guide (U3).
  // Key presses aimed at the checkbox are left alone — Space there ticks it.
  li.addEventListener('keydown', (e) => {
    if (e.target !== li) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isHidden(t)) openDetail(t);
    }
  });
  return li;
}

function renderList() {
  listEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (!matchesFilters(t)) continue;
    shown += 1;
    listEl.append(createCard(t));
  }
  if (shown === 0) {
    emptyEl.hidden = false;
    emptyEl.textContent = invalidGrade
      ? `No trophies match “#grade-${invalidGrade}” — there is no grade called “${invalidGrade}”. Choose a grade from the filter above to see the list.`
      : 'No trophies match these filters. Try clearing the search or choosing a different grade or kind.';
  } else {
    emptyEl.hidden = true;
    emptyEl.textContent = '';
  }
  updateCountLine(shown);
  updateProgress();
}

function renderRoadmap() {
  const steps = document.getElementById('roadmap-steps');
  steps.replaceChildren();
  for (const s of doc.roadmap) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = `Step ${s.step}: ${s.title}`;
    const p = document.createElement('span');
    p.textContent = s.text;
    li.append(strong, p);
    steps.append(li);
  }
  const tips = document.getElementById('tips');
  tips.replaceChildren();
  for (const tip of doc.tips) {
    const li = document.createElement('li');
    li.textContent = tip;
    tips.append(li);
  }
  const srcList = document.getElementById('source-list');
  srcList.replaceChildren();
  for (const s of doc.sources) {
    const li = document.createElement('li');
    li.textContent = `${s.name} (${s.site})`;
    srcList.append(li);
  }
}

function applyHash() {
  const h = location.hash;
  if (h.startsWith('#trophy-')) {
    const id = Number(h.slice('#trophy-'.length));
    const t = trophies.find((x) => x.id === id);
    if (t && !isHidden(t)) openDetail(t);
    return;
  }
  if (h.startsWith('#grade-')) {
    const g = h.slice('#grade-'.length);
    if (VALID_GRADES.has(g)) {
      invalidGrade = null;
      gradeEl.value = g;
    } else {
      invalidGrade = g;
      gradeEl.value = 'all';
    }
    renderList();
    return;
  }
  if (h === '#missable') {
    missableEl.checked = true;
    renderList();
  }
}

document.getElementById('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ game: 'GTA 6', earned: [...earned].sort() }, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    const valid = new Set(trophies.map((t) => t.id));
    earned = new Set(ids.filter((id) => valid.has(Number(id))).map(Number));
    saveProgress(); renderList();
  } catch { alert('That file is not a valid progress export.'); }
  e.target.value = '';
});
for (const el of [searchEl, gradeEl, kindEl, missableEl, hideEarnedEl, spoilerEl]) {
  el.addEventListener('input', () => { invalidGrade = null; renderList(); });
  el.addEventListener('change', () => { invalidGrade = null; renderList(); });
}
// Turning spoilers off while a #trophy-<id> deep link is showing should
// reveal that trophy's guide: the hash itself does not change, so no
// hashchange fires and applyHash would otherwise never re-run.
spoilerEl.addEventListener('change', () => {
  if (!spoilerEl.checked && location.hash.startsWith('#trophy-')) applyHash();
});
document.getElementById('detail-close').addEventListener('click', closeDetail);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !detailEl.hidden) closeDetail();
});
window.addEventListener('hashchange', applyHash);

renderRoadmap();
renderList();
applyHash();
