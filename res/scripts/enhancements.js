// J-Card Studio — precise image layer controls
// Focus: image size, position and covered area.

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const zones = {
  none: { label: 'Aucune image', left: 0, top: 0, width: 0, height: 0 },
  cover: { label: 'Couverture originale', left: 72.1, top: 0, width: 27.9, height: 63.9 },
  front: { label: 'Face avant complète', left: 72.1, top: 0, width: 27.9, height: 100 },
  spine: { label: 'Tranche seule', left: 66.65, top: 0, width: 5.45, height: 100 },
  frontSpine: { label: 'Face avant + tranche', left: 66.65, top: 0, width: 33.35, height: 100 },
  back: { label: 'Volets arrière', left: 0, top: 0, width: 66.65, height: 100 },
  full: { label: 'Toute la J-card', left: 0, top: 0, width: 100, height: 100 },
  custom: { label: 'Rectangle personnalisé', left: 72.1, top: 0, width: 27.9, height: 63.9 },
};

const state = {
  zone: 'cover',
  fit: 'cover',
  layerLeft: zones.cover.left,
  layerTop: zones.cover.top,
  layerWidth: zones.cover.width,
  layerHeight: zones.cover.height,
  imageX: 50,
  imageY: 50,
  zoom: 100,
  opacity: 1,
  showZone: true,
  hideOriginalCover: true,
  showVerso: false,
  mirrorVerso: true,
};

function originalTemplate() {
  return $('#jcard .template:not(.studio-verso)');
}

function currentCoverSrc() {
  const cover = $('#jcard .template-cover');
  return cover?.getAttribute('src') || '';
}

function currentCoverUrl() {
  const src = currentCoverSrc();
  if (!src) return 'none';
  return `url("${src.replaceAll('"', '%22')}")`;
}

function syncOriginalCoverVisibility() {
  const fillCover = document.getElementById('fill-cover');
  if (fillCover && state.hideOriginalCover) {
    fillCover.checked = false;
    fillCover.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function ensureImageLayer(template) {
  if (!template) return null;
  let layer = $('.studio-image-layer', template);
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'studio-image-layer';
    template.prepend(layer);
  }
  return layer;
}

function removeImageLayer(template) {
  $('.studio-image-layer', template)?.remove();
}

function applyImageLayer(template) {
  if (!template) return;
  const layer = ensureImageLayer(template);
  template.classList.add('studio-image-editor');
  template.classList.toggle('studio-image-none', state.zone === 'none');
  template.classList.toggle('studio-show-zone', state.showZone);
  template.classList.toggle('studio-hide-original-cover', state.hideOriginalCover);

  const size = state.fit === 'manual' ? `${state.zoom}% auto` : state.fit;
  template.style.setProperty('--studio-image-url', currentCoverUrl());
  template.style.setProperty('--studio-layer-left', `${state.layerLeft}%`);
  template.style.setProperty('--studio-layer-top', `${state.layerTop}%`);
  template.style.setProperty('--studio-layer-width', `${state.layerWidth}%`);
  template.style.setProperty('--studio-layer-height', `${state.layerHeight}%`);
  template.style.setProperty('--studio-image-size', size);
  template.style.setProperty('--studio-image-position', `${state.imageX}% ${state.imageY}%`);
  template.style.setProperty('--studio-image-opacity', state.opacity);
  if (layer) layer.setAttribute('aria-hidden', 'true');
}

function applyZone(zoneKey) {
  state.zone = zoneKey;
  if (zoneKey !== 'custom') {
    const zone = zones[zoneKey];
    state.layerLeft = zone.left;
    state.layerTop = zone.top;
    state.layerWidth = zone.width;
    state.layerHeight = zone.height;
  }
  applyAll();
  refreshPanelValues();
}

function rebuildVerso() {
  const root = $('#jcard');
  const template = originalTemplate();
  if (!root || !template) return;

  $$('.studio-verso', root).forEach((node) => node.remove());
  root.classList.toggle('studio-show-verso', state.showVerso);
  root.classList.toggle('studio-print-verso', state.showVerso);

  if (!state.showVerso) return;
  const clone = template.cloneNode(true);
  clone.classList.add('studio-verso');
  clone.classList.toggle('studio-mirror-verso', state.mirrorVerso);
  removeImageLayer(clone);
  root.appendChild(clone);
  applyImageLayer(clone);
}

function applyAll() {
  syncOriginalCoverVisibility();
  applyImageLayer(originalTemplate());
  rebuildVerso();
}

function makeField(labelText, control, helpText = '') {
  const wrap = document.createElement('div');
  wrap.className = 'studio-field';
  const label = document.createElement('label');
  label.textContent = labelText;
  wrap.append(label, control);
  if (helpText) {
    const help = document.createElement('p');
    help.className = 'studio-help';
    help.textContent = helpText;
    wrap.append(help);
  }
  return wrap;
}

function makeSelect(options, value, onChange) {
  const select = document.createElement('select');
  options.forEach(([val, label]) => {
    const option = document.createElement('option');
    option.value = val;
    option.textContent = label;
    select.appendChild(option);
  });
  select.value = value;
  select.addEventListener('change', () => onChange(select.value));
  return select;
}

function makeNumber(value, min, max, step, onChange) {
  const input = document.createElement('input');
  input.type = 'number';
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = round(value);
  input.addEventListener('input', () => {
    const next = clamp(parseFloat(input.value), min, max);
    if (Number.isFinite(next)) onChange(next);
  });
  return input;
}

function makeSlider(value, min, max, step, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'studio-slider-row';
  const range = document.createElement('input');
  range.type = 'range';
  range.min = min;
  range.max = max;
  range.step = step;
  range.value = value;
  const number = makeNumber(value, min, max, step, (next) => {
    range.value = next;
    onChange(next);
  });
  range.addEventListener('input', () => {
    number.value = range.value;
    onChange(parseFloat(range.value));
  });
  wrap.append(range, number);
  return wrap;
}

function makeCheckbox(labelText, value, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'studio-field';
  const row = document.createElement('label');
  row.style.display = 'flex';
  row.style.gap = '.55rem';
  row.style.alignItems = 'center';
  row.style.color = 'var(--studio-panel-fg)';
  row.style.textTransform = 'none';
  row.style.letterSpacing = '0';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = value;
  input.addEventListener('change', () => onChange(input.checked));
  const span = document.createElement('span');
  span.textContent = labelText;
  row.append(input, span);
  wrap.append(row);
  return wrap;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function setCustomFromCurrent() {
  state.zone = 'custom';
}

function buildPanel() {
  $('#jcard-studio-panel')?.remove();
  const panel = document.createElement('section');
  panel.id = 'jcard-studio-panel';
  panel.innerHTML = `
    <div class="studio-header">
      <div>
        <h2 class="studio-title">Image de la J-card</h2>
        <p class="studio-subtitle">Choisis la zone que l’image couvre, puis règle précisément sa position, sa taille, son zoom et son cadrage. Les valeurs sont en pourcentage de la J-card complète.</p>
      </div>
      <span class="studio-badge">Image</span>
    </div>
  `;

  const grid = document.createElement('div');
  grid.className = 'studio-grid';

  grid.append(
    makeField('Zone couverte', makeSelect(Object.entries(zones).map(([key, zone]) => [key, zone.label]), state.zone, applyZone), 'Utilise “rectangle personnalisé” pour couvrir exactement une partie précise des volets.'),
    makeField('Cadrage', makeSelect([
      ['cover', 'Remplir la zone / crop'],
      ['contain', 'Voir l’image entière'],
      ['manual', 'Zoom manuel'],
    ], state.fit, (value) => {
      state.fit = value;
      applyAll();
      refreshPanelValues();
    })),
    makeField('Gauche de la zone %', makeSlider(state.layerLeft, -30, 130, 0.5, (value) => {
      setCustomFromCurrent();
      state.layerLeft = value;
      applyAll();
      refreshPanelValues(false);
    })),
    makeField('Haut de la zone %', makeSlider(state.layerTop, -30, 130, 0.5, (value) => {
      setCustomFromCurrent();
      state.layerTop = value;
      applyAll();
      refreshPanelValues(false);
    })),
    makeField('Largeur de la zone %', makeSlider(state.layerWidth, 1, 160, 0.5, (value) => {
      setCustomFromCurrent();
      state.layerWidth = value;
      applyAll();
      refreshPanelValues(false);
    })),
    makeField('Hauteur de la zone %', makeSlider(state.layerHeight, 1, 160, 0.5, (value) => {
      setCustomFromCurrent();
      state.layerHeight = value;
      applyAll();
      refreshPanelValues(false);
    })),
    makeField('Image X %', makeSlider(state.imageX, 0, 100, 1, (value) => {
      state.imageX = value;
      applyAll();
    }), 'Déplace le point focal de l’image dans la zone.'),
    makeField('Image Y %', makeSlider(state.imageY, 0, 100, 1, (value) => {
      state.imageY = value;
      applyAll();
    })),
    makeField('Zoom manuel %', makeSlider(state.zoom, 10, 400, 1, (value) => {
      state.fit = 'manual';
      state.zoom = value;
      applyAll();
      refreshPanelValues(false);
    })),
    makeField('Opacité', makeSlider(state.opacity, 0.05, 1, 0.05, (value) => {
      state.opacity = value;
      applyAll();
    })),
    makeCheckbox('Afficher le contour de la zone image', state.showZone, (value) => {
      state.showZone = value;
      applyAll();
    }),
    makeCheckbox('Masquer l’image originale de couverture', state.hideOriginalCover, (value) => {
      state.hideOriginalCover = value;
      applyAll();
    }),
    makeCheckbox('Créer une deuxième page verso', state.showVerso, (value) => {
      state.showVerso = value;
      applyAll();
    }),
    makeCheckbox('Inverser horizontalement le verso', state.mirrorVerso, (value) => {
      state.mirrorVerso = value;
      applyAll();
    })
  );

  const actions = document.createElement('div');
  actions.className = 'studio-actions';

  const coverBtn = document.createElement('button');
  coverBtn.type = 'button';
  coverBtn.textContent = 'Zone couverture';
  coverBtn.addEventListener('click', () => applyZone('cover'));

  const fullBtn = document.createElement('button');
  fullBtn.type = 'button';
  fullBtn.textContent = 'Image sur toute la J-card';
  fullBtn.addEventListener('click', () => applyZone('full'));

  const frontBtn = document.createElement('button');
  frontBtn.type = 'button';
  frontBtn.textContent = 'Image face avant';
  frontBtn.addEventListener('click', () => applyZone('front'));

  const printBtn = document.createElement('button');
  printBtn.type = 'button';
  printBtn.dataset.primary = 'true';
  printBtn.textContent = 'Imprimer / PDF';
  printBtn.addEventListener('click', () => window.print());

  actions.append(coverBtn, fullBtn, frontBtn, printBtn);
  panel.append(grid, actions);

  const target = $('#template') || $('#output')?.parentElement || document.body;
  target.insertAdjacentElement('afterend', panel);
}

function refreshPanelValues(rebuild = true) {
  if (rebuild) {
    buildPanel();
    return;
  }
  const zoneSelect = $('#jcard-studio-panel select');
  if (zoneSelect) zoneSelect.value = state.zone;
}

function observeCoverChanges() {
  const cover = $('#jcard .template-cover');
  if (!cover) return;
  const observer = new MutationObserver(() => applyAll());
  observer.observe(cover, { attributes: true, attributeFilter: ['src'] });
}

function boot() {
  buildPanel();
  observeCoverChanges();
  applyAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
