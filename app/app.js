// GTA 6 trophy tracker: loads the 55 trophies, renders the checklist, and
// keeps earned ticks in localStorage with export and import. Spoiler mode
// hides hidden story trophies until they are earned. Deep links: #roadmap,
// #missable, #trophy-<id>, #grade-<grade>.
const KEY = 'gta6-trophy-progress-v1';
const listEl = document.getElementById('list');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const kindEl = document.getElementById('kind');
const missableEl = document.getElementById('missable-only');
const hideEarnedEl = document.getElementById('hide-earned');
const spoilerEl = document.getElementById('spoiler');
const detailEl = document.getElementById('detail');

let earned = new Set();
try { earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch { earned = new Set(); }
const doc = await (await fetch('./data/trophies.json')).json();
const trophies = doc.trophies;

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
  document.getElementById('progress-text').textContent =
    `${pct}% earned · ${c.platinum} platinum · ${c.gold} gold · ${c.silver} silver · ${c.bronze} bronze`;
}

function isHidden(t) { return t.hidden && spoilerEl.checked && !earned.has(t.id); }

function matchesFilters(t) {
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
    `Trophy ${t.id} of 55 · ${t.kind} · ${t.hidden ? 'Hidden on PlayStation until earned' : 'Visible'}${t.missable ? ' · POSSIBLY MISSABLE' : ''}${t.target ? ` · Target: ${t.target}` : ''}`;
  document.getElementById('detail-desc').textContent = `Official description: “${t.description}”`;
  document.getElementById('detail-guide').textContent = t.guide;
  document.getElementById('detail-sources').textContent = `Sources: ${t.sources.join('; ')}.`;
  detailEl.hidden = false;
  detailEl.scrollIntoView({ block: 'nearest' });
}

function renderList() {
  listEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (!matchesFilters(t)) continue;
    shown += 1;
    const li = document.createElement('li');
    li.className = 'card' + (earned.has(t.id) ? ' earned' : '');
    li.id = `trophy-${t.id}`;
    const hidden = isHidden(t);
    const row = document.createElement('div');
    row.className = 'row';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      saveProgress(); updateProgress(); renderList();
    });
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
    li.addEventListener('click', (e) => {
      if (e.target === box) return;
      if (!hidden) openDetail(t);
    });
    listEl.append(li);
  }
  document.getElementById('count-line').textContent =
    `Showing ${shown} of ${trophies.length} trophies · ${earned.size} earned · click a trophy for its full guide`;
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
    gradeEl.value = h.slice('#grade-'.length);
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
  el.addEventListener('input', renderList);
  el.addEventListener('change', renderList);
}
document.getElementById('detail-close').addEventListener('click', () => { detailEl.hidden = true; });
window.addEventListener('hashchange', applyHash);

renderRoadmap();
renderList();
applyHash();
