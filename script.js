// ===========================
// PRE-DISEASE SIGNAL ATLAS - FULL SCRIPT
// ===========================

const SIGNAL_FILES = [
  'signal_ovarian.md',
  'signal_pancreatic.md',
  'signal_lupus.md',
  'signal_rheumatoid_arthritis.md',
  'signal_endometriosis.md',
  'signal_colon_cancer.md',
  'signal_breast_cancer.md',
  'signal_stomach_cancer.md',
  'signal_multiple_sclerosis.md'
];

const signalGrid = document.getElementById('signalGrid');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModal');

let allSignals = [];

// ----- 3D Tilt on Cards -----
function applyTilt() {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 8;
      const rotateY = (centerX - x) / 8;
      card.style.transform = `translateY(-5px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ----- Load and render signals -----
async function loadSignals() {
  const promises = SIGNAL_FILES.map(async (file) => {
    try {
      const response = await fetch(`signals/${file}`);
      const text = await response.text();
      const html = marked.parse(text);
      const titleMatch = text.match(/^# (.+)$/m);
      const title = titleMatch ? titleMatch[1] : file.replace('.md','').replace('signal_','').replace(/_/g,' ');
      const paragraphs = text.split('\n\n');
      let summary = '';
      for (let p of paragraphs) {
        if (p.trim().startsWith('##') || p.trim().startsWith('#') || p.trim() === '') continue;
        summary = p.replace(/\*\*/g, '').substring(0, 150).trim() + '...';
        break;
      }
      return { file, title, summary, html, raw: text };
    } catch (err) {
      return null;
    }
  });
  const results = await Promise.all(promises);
  allSignals = results.filter(Boolean);
  renderCards(allSignals);
}

function renderCards(signals) {
  signalGrid.innerHTML = '';
  if (signals.length === 0) {
    signalGrid.innerHTML = '<p class="no-results">No signals found matching your search.</p>';
    return;
  }
  signals.forEach(signal => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-title">${signal.title}</div>
      <div class="card-summary">${signal.summary}</div>
      <div class="card-footer">
        <span>📄 Signal Note</span>
        <span class="card-badge">CC BY 4.0</span>
      </div>
    `;
    card.addEventListener('click', () => openModal(signal));
    signalGrid.appendChild(card);
  });
  applyTilt();
}

// ----- Modal with citation & share -----
function openModal(signal) {
  modalBody.innerHTML = signal.html;
  const actionDiv = document.createElement('div');
  actionDiv.className = 'modal-actions';
  actionDiv.innerHTML = `
    <button class="btn-citation">📋 Copy Citation</button>
    <button class="btn-share">🐦 Tweet This Signal</button>
  `;
  modalBody.appendChild(actionDiv);

  modalBody.querySelector('.btn-citation').addEventListener('click', () => {
    const citation = `${signal.title}. Pre-Disease Signal Atlas. CC BY 4.0. ${window.location.origin}${window.location.pathname}signals/${signal.file}`;
    navigator.clipboard.writeText(citation).then(() => alert('Citation copied!'));
  });

  modalBody.querySelector('.btn-share').addEventListener('click', () => {
    const tweetText = encodeURIComponent(`Early warning signal for ${signal.title.split('–')[0].trim()}: ${signal.summary} ${window.location.href}signals/${signal.file}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  });

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

closeModalBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
});
modal.querySelector('.modal-backdrop').addEventListener('click', () => {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { modal.classList.add('hidden'); document.body.style.overflow = ''; } });

// ----- Search filter -----
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allSignals.filter(s =>
    s.title.toLowerCase().includes(query) ||
    s.summary.toLowerCase().includes(query) ||
    s.file.toLowerCase().includes(query)
  );
  renderCards(filtered);
});

// ----- Dark/Light mode toggle -----
const modeToggle = document.createElement('button');
modeToggle.className = 'mode-toggle';
modeToggle.innerHTML = '☀️';
modeToggle.title = 'Toggle light/dark mode';
document.body.appendChild(modeToggle);
modeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  modeToggle.innerHTML = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
});

// ----- Start everything -----
loadSignals();
