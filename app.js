const input = document.querySelector('#signalInput');
const processButton = document.querySelector('#processButton');
const charCount = document.querySelector('#charCount');
const emptyState = document.querySelector('#emptyState');
const analysisContent = document.querySelector('#analysisContent');
const actionContent = document.querySelector('#actionContent');
const confidenceText = document.querySelector('#confidenceText');
const toast = document.querySelector('#toast');

const scenarios = {
  flood: { title: 'Community flood risk', summary: 'Rapidly rising water is blocking a key crossing, with a potentially vulnerable resident in the affected zone.', location: 'East bank · Oak district', time: 'Next 2 hours', people: '1 vulnerable resident', tags: ['WATER LEVEL', 'ACCESS BLOCKED', 'VULNERABLE PERSON'], actions: [['01', 'Check on the resident', 'Request a welfare check at the lower house on the east bank.', 'Notify response'], ['02', 'Close the footbridge', 'Alert the district team to block access and post a visible warning.', 'Send alert'], ['03', 'Open a safe route', 'Share the elevated route via Pine Road with nearby households.', 'Share route']] },
  air: { title: 'Local air quality alert', summary: 'A suspected hazardous material event is affecting visibility and breathing conditions near a school entrance.', location: 'Oak Street · North campus', time: 'Now · active exposure', people: 'School community', tags: ['AIR QUALITY', 'SCHOOL ZONE', 'LOW VISIBILITY'], actions: [['01', 'Move people indoors', 'Notify the school lead and recommend sheltering away from the source.', 'Notify school'], ['02', 'Request air check', 'Create an incident request for the environmental response team.', 'Create request'], ['03', 'Share clear guidance', 'Publish a short, verified exposure update to nearby residents.', 'Draft update']] },
  care: { title: 'Care access interruption', summary: 'A time-sensitive medication refill is at risk because a patient cannot reach their clinic through the usual channel.', location: 'Unconfirmed · remote patient', time: 'Within 24 hours', people: '1 patient', tags: ['MEDICATION', 'ACCESS GAP', 'TIME SENSITIVE'], actions: [['01', 'Route to care team', 'Escalate the refill request to the on-call clinic coordinator.', 'Escalate'], ['02', 'Find a pickup option', 'Match the patient with a nearby pharmacy and accessible transport.', 'Find support'], ['03', 'Confirm continuity', 'Send a check-in request after the refill has been collected.', 'Set reminder']] }
};

function getScenario(value) {
  const text = value.toLowerCase();
  if (text.includes('air') || text.includes('cough') || text.includes('smell') || text.includes('plastic')) return scenarios.air;
  if (text.includes('prescription') || text.includes('clinic') || text.includes('medication') || text.includes('refill')) return scenarios.care;
  if (text.includes('flood') || text.includes('river') || text.includes('water') || text.includes('rain') || text.includes('bridge')) return scenarios.flood;
  const words = value.trim().split(/\s+/).filter(Boolean);
  const title = words.slice(0, 5).join(' ').replace(/^[a-z]/, letter => letter.toUpperCase()) || 'Unclassified community signal';
  const tags = [...new Set(words.filter(word => word.length > 5).slice(0, 3).map(word => word.replace(/[^a-z0-9]/gi, '').toUpperCase()))];
  return { title, summary: 'A new signal has been structured from the details you provided. Confirm the facts below before taking action.', location: 'Not specified', time: 'Needs confirmation', people: 'Needs confirmation', tags: tags.length ? tags : ['USER REPORT', 'NEEDS REVIEW'], actions: [['01', 'Verify the situation', 'Confirm the location, timing, and people affected with a trusted source.', 'Start verification'], ['02', 'Choose a response owner', 'Route this signal to the person or team best placed to help.', 'Assign owner'], ['03', 'Record the outcome', 'Document what changed so the next decision has reliable context.', 'Log outcome']] };
}

function personalizeScenario(scenario, value) {
  const text = value.toLowerCase();
  const words = value.trim().split(/\s+/).filter(Boolean);
  const evidenceTerms = ['location', 'street', 'road', 'school', 'clinic', 'bridge', 'people', 'resident', 'tomorrow', 'tonight', 'now', 'urgent', 'elderly', 'child', 'injured', 'blocked', 'reported', 'several'];
  const evidence = evidenceTerms.filter(term => text.includes(term)).length;
  const confidence = Math.min(98, Math.max(54, 56 + Math.min(18, Math.floor(words.length / 6) * 3) + evidence * 2));
  const urgency = ['now', 'urgent', 'immediately', 'danger', 'injured', 'underwater', 'cough', 'burnt', 'tomorrow'].some(term => text.includes(term));
  const peopleMatch = value.match(/\b(\d+)\s+(?:people|persons|residents|children|patients)\b/i);
  const locationMatch = value.match(/\b(?:near|at|on|in|beside|by)\s+([A-Z][\w-]*(?:\s+[A-Z][\w-]*){0,2})/);
  const detailTags = [...new Set(words.filter(word => word.length > 5).slice(0, 4).map(word => word.replace(/[^a-z0-9]/gi, '').toUpperCase()))];
  return { ...scenario, confidence, priority: urgency ? 'HIGH PRIORITY' : confidence >= 78 ? 'MEDIUM PRIORITY' : 'REVIEW NEEDED', sourceQuality: evidence >= 3 ? '● Corroborated' : evidence >= 1 ? '● Partially verified' : '● Unverified', location: locationMatch ? locationMatch[1] : scenario.location, time: urgency ? 'Immediate attention' : scenario.time, people: peopleMatch ? `${peopleMatch[1]} people` : scenario.people, tags: scenario.title === 'Unclassified community signal' ? detailTags : scenario.tags, summary: scenario.title === 'Unclassified community signal' ? `Based on ${words.length} words of user-provided context. Confirm the highlighted details before taking action.` : scenario.summary };
}

function renderScenario(scenario) {
  document.querySelector('#incidentTitle').textContent = scenario.title;
  document.querySelector('#incidentSummary').textContent = scenario.summary;
  document.querySelector('#locationFact').textContent = scenario.location;
  document.querySelector('#timeFact').textContent = scenario.time;
  document.querySelector('#peopleFact').textContent = scenario.people;
  document.querySelector('#priorityBadge').textContent = scenario.priority || 'HIGH PRIORITY';
  document.querySelector('#sourceFact').textContent = scenario.sourceQuality || '● Corroborated';
  document.querySelector('.signal-tags').innerHTML = scenario.tags.map(tag => `<span>${tag}</span>`).join('');
  actionContent.innerHTML = scenario.actions.map(action => `<article class="action-card"><span class="action-index">${action[0]}</span><h3>${action[1]}</h3><p>${action[2]}</p><button>${action[3]} ↗</button></article>`).join('');
  document.querySelectorAll('.action-card button').forEach(button => button.addEventListener('click', () => { const card = button.closest('.action-card'); card.classList.toggle('done'); button.textContent = card.classList.contains('done') ? 'Completed ✓' : `${button.textContent.replace('Completed ✓', '').replace(' ↗', '')} ↗`; }));
}

async function analyzeWithGemini(value) {
  const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signal: value }) });
  if (!response.ok) throw new Error('Gemini service unavailable');
  return response.json();
}

async function processSignal() {
  if (!input.value.trim()) { input.focus(); input.placeholder = 'Add a few details so Signal Bridge can help...'; return; }
  let scenario;
  processButton.classList.add('processing');
  processButton.querySelector('span').textContent = 'Structuring signal...';
  try { scenario = await analyzeWithGemini(input.value); showToast('Gemini analysis complete'); } catch { scenario = personalizeScenario(getScenario(input.value), input.value); showToast('Local analysis used'); }
  renderScenario(scenario); emptyState.classList.add('hidden'); analysisContent.classList.remove('hidden'); confidenceText.textContent = `${scenario.confidence}% CONFIDENCE`; actionContent.classList.remove('action-placeholder'); document.querySelector('#actionCount').textContent = '3 ACTIONS READY'; processButton.querySelector('span').textContent = 'Signal translated'; processButton.classList.remove('processing');
}

input.addEventListener('input', () => { charCount.textContent = `${input.value.length} / 500`; if (input.value.length > 500) input.value = input.value.slice(0, 500); });
processButton.addEventListener('click', processSignal);
input.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') processSignal(); });
document.querySelectorAll('.sample-chip').forEach(chip => chip.addEventListener('click', () => { input.value = chip.dataset.sample; input.dispatchEvent(new Event('input')); input.focus(); }));
document.querySelectorAll('.source-tab').forEach(tab => tab.addEventListener('click', () => { document.querySelectorAll('.source-tab').forEach(item => item.classList.remove('active')); tab.classList.add('active'); const source = tab.dataset.source; if (source === 'voice') { input.placeholder = 'Voice capture ready. Describe what you are seeing...'; const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechRecognition) return showToast('Voice input is not supported in this browser'); const recognition = new SpeechRecognition(); recognition.lang = 'en-US'; recognition.onresult = event => { input.value += `${input.value ? ' ' : ''}${event.results[0][0].transcript}`; input.dispatchEvent(new Event('input')); }; recognition.onerror = () => showToast('Voice capture could not start'); recognition.start(); } else if (source === 'photo') { input.placeholder = 'Add a photo, then describe what needs attention...'; fileInput.accept = 'image/*'; fileInput.click(); } else if (source === 'file') { input.placeholder = 'Paste a report or upload its contents here...'; fileInput.accept = '.txt,.csv,.md,.json,.log'; fileInput.click(); } else input.placeholder = 'Describe a situation, concern, or observation...'; }));

function showToast(message) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600); }
function showModal(title, body) { const backdrop = document.createElement('div'); backdrop.className = 'modal-backdrop'; backdrop.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h3>${title}</h3><p>${body}</p><button class="modal-close">Close</button></div>`; document.body.appendChild(backdrop); const close = () => backdrop.remove(); backdrop.addEventListener('click', event => { if (event.target === backdrop) close(); }); backdrop.querySelector('.modal-close').addEventListener('click', close); }
function openMenu() { const existing = document.querySelector('.menu-popover'); if (existing) return existing.remove(); const menu = document.createElement('div'); menu.className = 'menu-popover'; menu.innerHTML = '<button data-menu="new">New signal</button><button data-menu="export">Export current brief</button><button data-menu="about">About Signal Bridge</button>'; document.body.appendChild(menu); menu.addEventListener('click', event => { const action = event.target.dataset.menu; if (action === 'new') { input.value = ''; input.dispatchEvent(new Event('input')); emptyState.classList.remove('hidden'); analysisContent.classList.add('hidden'); actionContent.innerHTML = '<div class="action-placeholder">Process a signal to generate a prioritized action plan.</div>'; confidenceText.textContent = 'WAITING FOR INPUT'; } if (action === 'export') { const text = `Signal Bridge brief\n\n${document.querySelector('#incidentTitle').textContent}\n${document.querySelector('#incidentSummary').textContent}`; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); link.download = 'signal-bridge-brief.txt'; link.click(); showToast('Brief exported'); } if (action === 'about') showModal('About Signal Bridge', 'A local-first interface for turning messy human reports into structured, reviewable action. No API key is required for this browser demo.'); menu.remove(); }); }

const fileInput = document.querySelector('#fileInput');
document.querySelector('#fileInput').addEventListener('change', () => { const file = fileInput.files[0]; if (!file) return; if (file.type.startsWith('image/')) input.value = `Photo attached: ${file.name}. Describe what needs attention in this image.`; else { const reader = new FileReader(); reader.onload = () => { input.value = String(reader.result).slice(0, 500); input.dispatchEvent(new Event('input')); }; reader.readAsText(file); } input.dispatchEvent(new Event('input')); showToast(`${file.name} added to signal`); });
document.querySelector('.icon-button').addEventListener('click', openMenu);
document.querySelector('.help').addEventListener('click', () => showModal('How Signal Bridge works', 'Add a note, voice capture, photo, or text file. Translate it into a structured brief, review the confidence and source quality, then complete the suggested actions one at a time.'));
document.querySelector('.avatar').addEventListener('click', () => showModal('Ava Kim', 'Operator mode is active. Human review stays in the loop before any external action is taken.'));
document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
document.querySelector('.small-link').addEventListener('click', () => showModal('Verification sources', 'This demo uses local signal heuristics and does not contact external services. Connect a Gemini API endpoint to replace this with live citations and verification data.'));
