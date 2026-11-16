(() => {
  'use strict';
  const photos = window.PHOTOS;
  const groups = {
    transit: { title: 'Between departures', zh: 'IN TRANSIT', note: 'For a moment, strangers share the same direction.', selected: [21, 9, 35], sequence: [29,21,9,35,12,10,11,6,15,19,25,38,40,47] },
    street: { title: 'An unfinished street', zh: 'STREET', note: 'The city speaks in things it leaves behind.', selected: [4, 18, 32], sequence: [4,18,32,2,3,5,8,17,24,27,30,34,36,41,42,43,44,46,1,22,45] },
    still: { title: 'A little longer', zh: 'STILLNESS', note: 'Stay until the ordinary starts to change.', selected: [16, 31, 14], sequence: [16,31,14,7,13,20,23,26,28,33,37,39] },
    line: { title: 'On the line', zh: 'AFTER HOURS', note: 'Signs rise. Drums answer. The night keeps its voice.', selected: [61, 53, 56, 62], sequence: [61,53,50,48,49,52,51,54,56,55,58,57,59,62,60] }
  };
  const selectedSequence = [29, ...Object.values(groups).flatMap(g => g.selected)];
  const allSequence = Object.values(groups).flatMap(g => g.sequence);
  const byId = id => photos.find(p => p.id === Number(id));
  const pad = (n, length = 2) => String(n).padStart(length, '0');
  const escape = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const selectedView = document.getElementById('selected-view');
  const archiveView = document.getElementById('archive-view');
  const grid = document.getElementById('photo-grid');
  const viewer = document.getElementById('viewer');
  let currentFilter = 'all';
  let viewingSequence = selectedSequence;
  let viewingIndex = 0;
  let lastFocus = null;
  let touchX = null;
  let renderedFilter = null;

  function figure(id, index = false) {
    const p = byId(id), category = groups[p.group];
    return `<figure${index ? ' class="index-photo"' : ''}><button class="photo-button" data-photo="${p.id}" aria-label="${escape('View photograph: ' + p.alt)}"><img src="images/${pad(p.id)}${index ? '-small' : ''}.jpg" ${index ? '' : `srcset="images/${pad(p.id)}-small.jpg 700w, images/${pad(p.id)}.jpg ${p.width}w" sizes="(max-width: 700px) 90vw, 58vw"`} width="${p.width}" height="${p.height}" alt="${escape(p.alt)}" loading="lazy" decoding="async"><span class="enlarge" aria-hidden="true">VIEW PHOTOGRAPH ↗</span></button><figcaption><span>${pad(p.id, 3)}${index ? '' : ' / ' + category.title.toUpperCase()}</span><span>${index ? category.title : category.zh}</span></figcaption></figure>`;
  }

  document.getElementById('chapters').innerHTML = Object.entries(groups).map(([key, g], i) => `<section id="${key}" class="chapter chapter-${key}" aria-labelledby="title-${key}"><div class="chapter-heading"><span class="chapter-num">${pad(i+1)}</span><div><h2 id="title-${key}">${g.title}<span>${g.zh}</span></h2><p>${g.note}</p></div><a href="#index/${key}" class="text-link">Enter chapter <span>${pad(g.sequence.length)} ↗</span></a></div><div class="chapter-spread">${g.selected.map(id => figure(id)).join('')}</div></section>`).join('');

  function renderIndex(filter) {
    currentFilter = groups[filter] ? filter : 'all';
    if (renderedFilter !== currentFilter) {
      const sequence = currentFilter === 'all' ? allSequence : groups[currentFilter].sequence;
      grid.innerHTML = sequence.map(id => figure(id, true)).join('');
      document.getElementById('result-count').textContent = `${pad(sequence.length)} PHOTOGRAPHS`;
      renderedFilter = currentFilter;
    }
    document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === currentFilter)));
  }

  function route(initial = false) {
    const hash = location.hash.slice(1);
    const isIndex = hash === 'index' || hash.startsWith('index/');
    const wasIndex = !archiveView.hidden;
    archiveView.hidden = !isIndex;
    selectedView.hidden = isIndex;
    document.querySelectorAll('[data-nav]').forEach(link => {
      const active = isIndex ? link.dataset.nav === 'index' : hash === 'about' ? link.dataset.nav === 'about' : link.dataset.nav === 'work';
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    if (isIndex) {
      renderIndex(hash.split('/')[1] || 'all');
      if (!wasIndex || initial) { window.scrollTo({top:0,behavior:'instant'}); if (!initial) document.getElementById('archive-title').focus({preventScroll:true}); }
      document.title = `Pavel Hu — ${currentFilter === 'all' ? 'The index' : groups[currentFilter].title}`;
    } else {
      document.title = 'Pavel Hu — Here, then gone.';
      if (hash) { const target = document.getElementById(hash); if (target) requestAnimationFrame(() => target.scrollIntoView({behavior:initial || wasIndex ? 'instant' : 'smooth'})); }
      else if (!initial || wasIndex) window.scrollTo({top:0,behavior:'instant'});
    }
  }

  function updateViewer() {
    const p = byId(viewingSequence[viewingIndex]);
    const image = document.getElementById('viewer-image');
    image.src = `images/${pad(p.id)}.jpg`;
    image.alt = p.alt;
    image.width = p.width;
    image.height = p.height;
    document.getElementById('viewer-caption').textContent = p.alt;
    document.getElementById('viewer-category').textContent = `${groups[p.group].title.toUpperCase()} / ${groups[p.group].zh}`;
    document.getElementById('viewer-count').textContent = `${pad(viewingIndex+1)} / ${pad(viewingSequence.length)}`;
    document.getElementById('viewer-prev').disabled = viewingIndex === 0;
    document.getElementById('viewer-next').disabled = viewingIndex === viewingSequence.length-1;
    for (const offset of [-1,1]) { const id = viewingSequence[viewingIndex+offset]; if(id) { const prefetch = new Image(); prefetch.src = `images/${pad(id)}.jpg`; } }
  }

  function step(direction) {
    viewingIndex = Math.min(viewingSequence.length-1, Math.max(0, viewingIndex+direction));
    updateViewer();
  }

  document.addEventListener('click', event => {
    if (event.target.closest('.skip')) {
      event.preventDefault();
      const main = document.getElementById('main');
      main.focus({preventScroll:true});
      main.scrollIntoView({behavior:'instant'});
      return;
    }
    if (event.target.closest('.footer-top')) {
      event.preventDefault();
      window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
      return;
    }
    const photo = event.target.closest('[data-photo]');
    if (photo) {
      lastFocus = photo;
      viewingSequence = archiveView.hidden ? selectedSequence : currentFilter === 'all' ? allSequence : groups[currentFilter].sequence;
      viewingIndex = viewingSequence.indexOf(Number(photo.dataset.photo));
      if (viewingIndex < 0) return;
      updateViewer();
      viewer.showModal();
      document.body.classList.add('viewer-open');
      document.getElementById('viewer-close').focus();
    }
    const filter = event.target.closest('[data-filter]');
    if (filter) location.hash = filter.dataset.filter === 'all' ? 'index' : `index/${filter.dataset.filter}`;
  });
  document.getElementById('viewer-close').addEventListener('click', () => viewer.close());
  document.getElementById('viewer-prev').addEventListener('click', () => step(-1));
  document.getElementById('viewer-next').addEventListener('click', () => step(1));
  viewer.addEventListener('close', () => { document.body.classList.remove('viewer-open'); if (lastFocus) lastFocus.focus({preventScroll:true}); });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    if (event.key === 'Home') { event.preventDefault(); viewingIndex=0; updateViewer(); }
    if (event.key === 'End') { event.preventDefault(); viewingIndex=viewingSequence.length-1; updateViewer(); }
  });
  viewer.addEventListener('touchstart', e => {touchX=e.changedTouches[0].clientX;},{passive:true});
  viewer.addEventListener('touchend', e => { if (touchX===null) return; const difference=e.changedTouches[0].clientX-touchX; if(Math.abs(difference)>65)step(difference>0?-1:1);touchX=null;},{passive:true});
  window.addEventListener('hashchange', () => route());
  route(true);
})();
