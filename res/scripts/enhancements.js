// J-Card Studio enhancements
// Non-destructive UI and print customisation layer for the original template.

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const state = {
  preset: 'clean',
  font: 'Alte Haas Grotesk',
  imageMode: 'cover',
  imageFit: 'cover',
  imagePosition: 'center center',
  imageOpacity: 1,
  cardColor: '#ffffff',
  textColor: '#000000',
  markerColor: '#000000',
  accentColor: '#ffb703',
  showVerso: false,
  versoMode: 'blank',
  mirrorVerso: true,
};

const presets = {
  clean: {
    cardColor: '#ffffff',
    textColor: '#111111',
    markerColor: '#111111',
    accentColor: '#111111',
    font: 'Inter, Arial, sans-serif',
  },
  vintage: {
    cardColor: '#f4ead7',
    textColor: '#2d2118',
    markerColor: '#7b5f3e',
    accentColor: '#c47f2c',
    font: 'Georgia, Times New Roman, serif',
  },
  zine: {
    cardColor: '#f8f8f8',
    textColor: '#050505',
    markerColor: '#050505',
    accentColor: '#050505',
    font: 'Arial Black, Impact, sans-serif',
  },
  pop: {
    cardColor: '#ffe45e',
    textColor: '#111111',
    markerColor: '#111111',
    accentColor: '#ff4d6d',
    font: 'Trebuchet MS, Arial, sans-serif',
  },
  minimal: {
    cardColor: '#f6f3ee',
    textColor: '#222222',
    markerColor: '#b7aea2',
    accentColor: '#6c757d',
    font: 'Helvetica Neue, Helvetica, Arial, sans-serif',
  },
};

function originalTemplate() {
  return $('#jcard .template:not(.studio-verso)');
}

function currentCoverUrl() {
  const cover = $('#jcard .template-cover');
  if (!cover || !cover.getAttribute('src')) return 'none';
  return `url("${cover.getAttribute('src').replaceAll('"', '%22')}")`;
}

function setNativeValue(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function setCheckboxValue(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  element.checked = Boolean(value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function syncToOriginalControls() {
  setNativeValue('card-color', state.cardColor);
  setNativeValue('text-color', state.textColor);
  setNativeValue('font-family', state.font);
  setCheckboxValue('fill-cover', state.imageMode === 'cover' && state.imageFit === 'cover');
}

function removePresetClasses(template) {
  template.classList.remove(
    'studio-preset-clean',
    'studio-preset-vintage',
    'studio-preset-zine',
    'studio-preset-pop',
    'studio-preset-minimal'
  );
}

function applyTemplateClasses(template) {
  if (!template) return;
  removePresetClasses(template);
  template.classList.add('studio-modern', `studio-preset-${state.preset}`);
  template.classList.remove(
    'studio-has-bg',
    'studio-image-cover',
    'studio-image-front',
    'studio-image-front-spine',
    'studio-image-full',
    'studio-image-back',
    'studio-image-none'
  );
  template.classList.add(`studio-image-${state.imageMode}`);
  if (state.imageMode !== 'cover' && state.imageMode !== 'none') {
    template.classList.add('studio-has-bg');
  }
  template.style.setProperty('--studio-image-url', currentCoverUrl());
  template.style.setProperty('--studio-image-size', state.imageFit);
  template.style.setProperty('--studio-image-position', state.imagePosition);
  template.style.setProperty('--studio-image-opacity', state.imageOpacity);
  template.style.setProperty('--studio-marker-color', state.markerColor);
  template.style.setProperty('--jCardCardColor', state.cardColor);
  template.style.setProperty('--jCardTextColor', state.textColor);
  template.style.setProperty('--jCardFontFamily', state.font);
}

function rebuildVerso() {
  const root = $('#jcard');
  const template = originalTemplate();
  if (!root || !template) return;
  $$('.studio-verso', root).forEach((node) => node.remove());
  if (!state.showVerso) {
    root.classList.remove('studio-show-verso', 'studio-print-verso');
    return;
  }
  const clone = template.cloneNode(true);
  clone.classList.add('studio-verso', `studio-verso-${state.versoMode}`);
  if (state.mirrorVerso) clone.classList.add('studio-mirror-verso');
  if (state.versoMode === 'image-only') {
    clone.classList.remove('studio-image-none', 'studio-image-cover');
    clone.classList.add('studio-has-bg', 'studio-image-full');
  }
  root.appendChild(clone);
  root.classList.add('studio-show-verso', 'studio-print-verso');
  applyTemplateClasses(clone);
}

function applyAll({ sync = true } = {}) {
  if (sync) syncToOriginalControls();
  const template = originalTemplate();
  applyTemplateClasses(template);
  document.documentElement.style.setProperty('--studio-panel-accent', state.accentColor);
  rebuildVerso();
}

function makeField(labelText, control) {
  const wrap = document.createElement('div');
  wrap.className = 'studio-field';
  const label = document.createElement('label');
  label.textContent = labelText;
  wrap.append(label, control);
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

function makeColor(value, onChange) {
  const input = document.createElement('input');
  input.type = 'color';
  input.value = value;
  input.addEventListener('input', () => onChange(input.value));
  return input;
}

function makeRange(value, min, max, step, onChange) {
  const input = document.createElement('input');
  input.type = 'range';
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = value;
  input.addEventListener('input', () => onChange(input.value));
  return input;
}

function makeCheckbox(labelText, value, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'studio-check';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = value;
  const label = document.createElement('label');
  label.textContent = labelText;
  input.addEventListener('change', () => onChange(input.checked));
  wrap.append(input, label);
  return wrap;
}

function buildPanel() {
  if ($('#jcard-studio-panel')) return;
  const panel = document.createElement('section');
  panel.id = 'jcard-studio-panel';
  panel.innerHTML = `
    <div class="studio-header">
      <div>
        <h2 class="studio-title">J-Card Studio</h2>
        <p class="studio-subtitle">Design moderne, image par zones et option recto-verso sans modifier le moteur original.</p>
      </div>
      <span class="studio-badge">V1</span>
    </div>
  `;
  const grid = document.createElement('div');
  grid.className = 'studio-grid';

  grid.append(
    makeField('Preset', makeSelect([
      ['clean', 'Clean label'],
      ['vintage', 'Vintage cream'],
      ['zine', 'Black zine'],
      ['pop', 'Pop color'],
      ['minimal', 'Minimal soft'],
    ], state.preset, (value) => {
      state.preset = value;
      Object.assign(state, presets[value]);
      applyAll();
      refreshPanelValues();
    })),
    makeField('Typo', makeSelect([
      ['Alte Haas Grotesk', 'Originale'],
      ['Inter, Arial, sans-serif', 'Inter / moderne'],
      ['Helvetica Neue, Helvetica, Arial, sans-serif', 'Helvetica'],
      ['Georgia, Times New Roman, serif', 'Serif vintage'],
      ['Courier New, monospace', 'Typewriter'],
      ['Arial Black, Impact, sans-serif', 'Poster bold'],
    ], state.font, (value) => {
      state.font = value;
      applyAll();
    })),
    makeField('Image', makeSelect([
      ['cover', 'Couverture originale'],
      ['front', 'Toute la face avant'],
      ['front-spine', 'Face avant + tranche'],
      ['full', 'Toute la J-card'],
      ['back', 'Volets arrière seulement'],
      ['none', 'Aucune image'],
    ], state.imageMode, (value) => {
      state.imageMode = value;
      applyAll();
    })),
    makeField('Cadrage image', makeSelect([
      ['cover', 'Remplir / crop'],
      ['contain', 'Contenir entier'],
      ['auto', 'Taille réelle'],
    ], state.imageFit, (value) => {
      state.imageFit = value;
      applyAll(false);
    })),
    makeField('Position image', makeSelect([
      ['center center', 'Centre'],
      ['top center', 'Haut'],
      ['bottom center', 'Bas'],
      ['center left', 'Gauche'],
      ['center right', 'Droite'],
    ], state.imagePosition, (value) => {
      state.imagePosition = value;
      applyAll(false);
    })),
    makeField('Opacité image', makeRange(state.imageOpacity, 0.15, 1, 0.05, (value) => {
      state.imageOpacity = value;
      applyAll(false);
    })),
    makeField('Fond', makeColor(state.cardColor, (value) => {
      state.cardColor = value;
      applyAll();
    })),
    makeField('Texte', makeColor(state.textColor, (value) => {
      state.textColor = value;
      applyAll();
    })),
    makeField('Repères', makeColor(state.markerColor, (value) => {
      state.markerColor = value;
      applyAll(false);
    })),
    makeField('Accent UI', makeColor(state.accentColor, (value) => {
      state.accentColor = value;
      applyAll(false);
    })),
    makeCheckbox('Ajouter une page verso pour le recto-verso', state.showVerso, (value) => {
      state.showVerso = value;
      applyAll(false);
    }),
    makeField('Type de verso', makeSelect([
      ['blank', 'Verso vierge + repères'],
      ['same', 'Verso identique'],
      ['image-only', 'Verso image seule'],
    ], state.versoMode, (value) => {
      state.versoMode = value;
      applyAll(false);
    })),
    makeCheckbox('Inverser horizontalement le verso', state.mirrorVerso, (value) => {
      state.mirrorVerso = value;
      applyAll(false);
    })
  );

  const actions = document.createElement('div');
  actions.className = 'studio-actions';
  const printBtn = document.createElement('button');
  printBtn.type = 'button';
  printBtn.dataset.primary = 'true';
  printBtn.textContent = 'Imprimer / PDF';
  printBtn.addEventListener('click', () => window.print());
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.textContent = 'Reset studio';
  resetBtn.addEventListener('click', () => {
    Object.assign(state, {
      preset: 'clean',
      imageMode: 'cover',
      imageFit: 'cover',
      imagePosition: 'center center',
      imageOpacity: 1,
      showVerso: false,
      versoMode: 'blank',
      mirrorVerso: true,
    }, presets.clean);
    refreshPanelValues();
    applyAll();
  });
  actions.append(printBtn, resetBtn);
  panel.append(grid, actions);

  const target = $('#template') || $('#output')?.parentElement || document.body;
  target.insertAdjacentElement('afterend', panel);
}

function refreshPanelValues() {
  const panel = $('#jcard-studio-panel');
  if (!panel) return;
  const controls = $$('select, input', panel);
  const values = [
    state.preset,
    state.font,
    state.imageMode,
    state.imageFit,
    state.imagePosition,
    String(state.imageOpacity),
    state.cardColor,
    state.textColor,
    state.markerColor,
    state.accentColor,
    state.showVerso,
    state.versoMode,
    state.mirrorVerso,
  ];
  controls.forEach((control, index) => {
    if (control.type === 'checkbox') control.checked = Boolean(values[index]);
    else control.value = values[index];
  });
}

function observeCoverChanges() {
  const cover = $('#jcard .template-cover');
  if (!cover) return;
  const observer = new MutationObserver(() => applyAll(false));
  observer.observe(cover, { attributes: true, attributeFilter: ['src'] });
}

function boot() {
  Object.assign(state, presets.clean);
  buildPanel();
  observeCoverChanges();
  applyAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
