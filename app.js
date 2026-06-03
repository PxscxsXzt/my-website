// ===== Constants =====
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const START_HOUR = 8;
const START_MIN = 0;
const END_HOUR = 22;
const END_MIN = 0;
const TOTAL_SLOTS = 28; // 8:00 to 22:00 is 14 hours = 28 slots
const COLOR_COUNT = 10;

const STICKERS = [
    '📚','📖','✏️','🎓','💡','⭐','🌟','❤️','🔥','✨',
    '📝','🎯','💪','🏆','👑','🌈','🎨','🎵','☕','🍎',
    '📌','📎','🔔','💎','🦋','🌸','🌺','🍀','🐱','🐶',
    '😊','😎','🤓','🥳','💖','💜','💙','💚','🧡','❄️',
    '🎀','🎁','🎈','🎉','🌙','☀️','🌊','🍭','🧸','🦄',
];

// ===== State =====
let subjects = JSON.parse(localStorage.getItem('scheduler_subjects') || '[]');
let colorIndex = parseInt(localStorage.getItem('scheduler_colorIndex') || '0');
let decorations = JSON.parse(localStorage.getItem('scheduler_decorations') || '[]');
let editingId = null;
let contextSubjectId = null;
let dragTarget = null;
let dragOffset = { x: 0, y: 0 };

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    buildTimetable();
    populateTimeSelects();
    renderSubjects();
    renderExams();
    initColorPicker();
    initStickers();
    renderDecorations();
    loadSavedFrame();
    loadBgImage();

    document.addEventListener('click', () => {
        document.getElementById('context-menu').classList.remove('active');
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('context-menu').classList.remove('active');
            closeModal();
        }
    });

    // Global drag handlers for decorations
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
});

// ===== Background Color =====
function initColorPicker() {
    const saved = localStorage.getItem('scheduler_bgColor') || '#ffffff';
    applyBgColor(saved, false);
    document.getElementById('bg-color-picker').value = saved;
    document.getElementById('bg-color-picker').addEventListener('input', (e) => applyBgColor(e.target.value));
    document.querySelectorAll('.color-preset').forEach(p => {
        p.addEventListener('click', () => {
            applyBgColor(p.dataset.color);
            document.getElementById('bg-color-picker').value = p.dataset.color;
        });
    });
}

function applyBgColor(color, save = true) {
    const root = document.documentElement;
    const dark = isColorDark(color);
    document.querySelectorAll('.color-preset').forEach(p => p.classList.toggle('active', p.dataset.color === color));
    const preview = document.getElementById('color-picker-preview');
    if (preview) preview.style.background = color;

    if (dark) {
        root.style.setProperty('--bg-primary', color);
        root.style.setProperty('--bg-secondary', lighten(color, 8));
        root.style.setProperty('--bg-card', lighten(color, 12));
        root.style.setProperty('--bg-card-hover', lighten(color, 18));
        root.style.setProperty('--bg-surface', lighten(color, 15));
        root.style.setProperty('--bg-modal', lighten(color, 10));
        root.style.setProperty('--text-primary', '#f0f2f8');
        root.style.setProperty('--text-secondary', '#8892b0');
        root.style.setProperty('--text-muted', '#5a6380');
        root.style.setProperty('--border-color', 'rgba(255,255,255,0.08)');
        root.style.setProperty('--border-light', 'rgba(255,255,255,0.12)');
        root.style.setProperty('--gradient-header', `linear-gradient(135deg, ${color} 0%, ${lighten(color, 10)} 100%)`);
        root.style.setProperty('--gradient-midterm', 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)');
        root.style.setProperty('--gradient-final', 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(244,63,94,0.1) 100%)');
        for (let i = 0; i < COLOR_COUNT; i++) root.style.setProperty(`--color-${i}-bg`, hexToRgba(getComputedStyle(root).getPropertyValue(`--color-${i}`).trim() || '#6c63ff', 0.2));
    } else {
        root.style.setProperty('--bg-primary', color);
        root.style.setProperty('--bg-secondary', darken(color, 3));
        root.style.setProperty('--bg-card', color);
        root.style.setProperty('--bg-card-hover', darken(color, 5));
        root.style.setProperty('--bg-surface', darken(color, 4));
        root.style.setProperty('--bg-modal', '#ffffff');
        root.style.setProperty('--text-primary', '#1a1d2e');
        root.style.setProperty('--text-secondary', '#5a6078');
        root.style.setProperty('--text-muted', '#9ca3b8');
        root.style.setProperty('--border-color', 'rgba(0,0,0,0.08)');
        root.style.setProperty('--border-light', 'rgba(0,0,0,0.12)');
        root.style.setProperty('--gradient-header', `linear-gradient(135deg, ${color} 0%, ${darken(color, 3)} 100%)`);
        root.style.setProperty('--gradient-midterm', 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)');
        root.style.setProperty('--gradient-final', 'linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(244,63,94,0.05) 100%)');
        for (let i = 0; i < COLOR_COUNT; i++) root.style.setProperty(`--color-${i}-bg`, hexToRgba(getComputedStyle(root).getPropertyValue(`--color-${i}`).trim() || '#6c63ff', 0.12));
    }
    if (save) localStorage.setItem('scheduler_bgColor', color);
}

function isColorDark(hex) {
    const rgb = hexToRgb(hex);
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 < 128;
}
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    return { r: parseInt(hex.substring(0, 2), 16), g: parseInt(hex.substring(2, 4), 16), b: parseInt(hex.substring(4, 6), 16) };
}
function hexToRgba(hex, a) { const rgb = hexToRgb(hex); return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`; }
function lighten(hex, pct) {
    const rgb = hexToRgb(hex);
    const f = pct / 100 * 255;
    return '#' + [rgb.r, rgb.g, rgb.b].map(c => Math.min(255, c + Math.round(f)).toString(16).padStart(2, '0')).join('');
}
function darken(hex, pct) {
    const rgb = hexToRgb(hex);
    const f = pct / 100 * 255;
    return '#' + [rgb.r, rgb.g, rgb.b].map(c => Math.max(0, c - Math.round(f)).toString(16).padStart(2, '0')).join('');
}

// ===== Timetable =====
function buildTimetable() {
    const t = document.getElementById('timetable');
    t.innerHTML = '';
    
    // Corner cell
    const corner = document.createElement('div');
    corner.className = 'timetable-header corner';
    corner.textContent = 'Day';
    t.appendChild(corner);

    // Time headers (horizontal, 1 hour ranges)
    for (let slot = 0; slot < TOTAL_SLOTS; slot += 2) {
        const hour = START_HOUR + (slot / 2);
        const lbl = document.createElement('div');
        lbl.className = 'time-label hour-start';
        lbl.style.gridColumn = 'span 2';
        lbl.textContent = `${String(hour).padStart(2, '0')}.00`;
        t.appendChild(lbl);
    }

    // Days (vertical)
    DAYS.forEach((day, i) => {
        // Day label
        const h = document.createElement('div');
        h.className = 'timetable-header day-header';
        h.textContent = day;
        h.dataset.day = i;
        t.appendChild(h);

        // Cells for this day
        for (let slot = 0; slot < TOTAL_SLOTS; slot++) {
            const isHourEnd = (slot % 2) === 1;
            const cell = document.createElement('div');
            cell.className = `timetable-cell ${isHourEnd ? 'hour-end' : ''}`;
            cell.dataset.day = i;
            cell.dataset.slot = slot;
            t.appendChild(cell);
        }
    });
}

function populateTimeSelects() {
    const ids = ['start-time', 'end-time', 'midterm-time', 'midterm-end-time', 'final-time', 'final-end-time'];
    const elements = ids.map(id => document.getElementById(id));
    elements.forEach(e => {
        if (e) e.innerHTML = '<option value="">Select time</option>';
    });

    for (let h = START_HOUR; h <= END_HOUR; h++) {
        for (let m = 0; m < 60; m += 30) {
            if (h === START_HOUR && m < START_MIN) continue;
            if (h === END_HOUR && m > END_MIN) break;
            const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const label = `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
            elements.forEach(e => {
                if (e) e.appendChild(new Option(label, val));
            });
        }
    }
}

function timeToSlot(t) { 
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number); 
    const totalMin = h * 60 + m;
    const startMin = START_HOUR * 60 + START_MIN;
    return Math.max(0, Math.floor((totalMin - startMin) / 30));
}

// ===== Render Subjects =====
function renderSubjects() {
    document.querySelectorAll('.subject-block').forEach(el => el.remove());
    subjects.forEach(sub => {
        const start = timeToSlot(sub.startTime);
        const end = timeToSlot(sub.endTime);
        const span = end - start;
        if (span <= 0) return;
        const ci = sub.colorIndex % COLOR_COUNT;
        const block = document.createElement('div');
        block.className = 'subject-block';
        block.dataset.subjectId = sub.id;
        block.style.gridRow = `${sub.day + 2}`;
        block.style.gridColumn = `${start + 2} / ${end + 2}`;
        block.style.background = `var(--color-${ci}-bg)`;
        block.style.borderLeftColor = `var(--color-${ci})`;
        block.style.color = `var(--color-${ci})`;
        block.innerHTML = `<button class="delete-subject-btn" onclick="deleteSubjectById('${sub.id}', event)" title="Delete subject">✕</button><span class="subject-code">${sub.code}</span>${span >= 2 ? `<span class="subject-name">${sub.name}</span>` : ''}${span >= 3 && sub.room ? `<span class="subject-room">📍 ${sub.room}</span>` : ''}`;
        block.addEventListener('contextmenu', (e) => { e.preventDefault(); contextSubjectId = sub.id; showContextMenu(e.clientX, e.clientY); });
        block.addEventListener('click', () => editSubject(sub.id));
        document.getElementById('timetable').appendChild(block);
    });
}

// ===== Render Exams =====
function renderExams() {
    const ml = document.getElementById('midterm-list');
    const fl = document.getElementById('final-list');
    const ms = subjects.filter(s => s.midtermDate || s.midtermDay);
    const fs = subjects.filter(s => s.finalDate || s.finalDay);

    const formatTime = (t) => t ? t.replace(':', '.') : '';

    ml.innerHTML = ms.length === 0 ? '<div class="exam-empty">No exams scheduled</div>' : ms.map(s => {
        const ci = s.colorIndex % COLOR_COUNT;
        const timeStr = `${formatTime(s.midtermTime)}${s.midtermEndTime ? ' - ' + formatTime(s.midtermEndTime) : ''}`;
        const dayStr = s.midtermDay ? `${s.midtermDay}, ` : '';
        const dateStr = formatDate(s.midtermDate);
        return `<div class="exam-item"><div class="exam-color-dot" style="background:var(--color-${ci})"></div><div class="exam-info"><div class="exam-subject">${s.name}<span class="exam-code">${s.code}</span></div><div class="exam-datetime"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>${dayStr}${dateStr}${timeStr ? ' · ' + timeStr : ''}</div></div></div>`;
    }).join('');

    fl.innerHTML = fs.length === 0 ? '<div class="exam-empty">No exams scheduled</div>' : fs.map(s => {
        const ci = s.colorIndex % COLOR_COUNT;
        const timeStr = `${formatTime(s.finalTime)}${s.finalEndTime ? ' - ' + formatTime(s.finalEndTime) : ''}`;
        const dayStr = s.finalDay ? `${s.finalDay}, ` : '';
        const dateStr = formatDate(s.finalDate);
        return `<div class="exam-item"><div class="exam-color-dot" style="background:var(--color-${ci})"></div><div class="exam-info"><div class="exam-subject">${s.name}<span class="exam-code">${s.code}</span></div><div class="exam-datetime"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>${dayStr}${dateStr}${timeStr ? ' · ' + timeStr : ''}</div></div></div>`;
    }).join('');
}

function formatDate(ds) {
    if (!ds) return '';
    const d = new Date(ds + 'T00:00:00');
    if (isNaN(d.getTime())) return ds;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ===== Modal =====
function openModal() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Add Subject';
    document.getElementById('btn-submit').innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Save';
    document.getElementById('btn-delete').style.display = 'none';
    document.getElementById('subject-form').reset();
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('modal-overlay').classList.remove('active');
    editingId = null;
}

function editSubject(id) {
    const s = subjects.find(x => x.id === id);
    if (!s) return;
    editingId = id;
    document.getElementById('modal-title').textContent = 'Edit Subject';
    document.getElementById('btn-submit').innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Update';
    document.getElementById('subject-code').value = s.code;
    document.getElementById('subject-name').value = s.name;
    document.getElementById('subject-day').value = s.day;
    document.getElementById('subject-room').value = s.room || '';
    document.getElementById('start-time').value = s.startTime;
    document.getElementById('end-time').value = s.endTime;
    document.getElementById('midterm-day').value = s.midtermDay || '';
    document.getElementById('midterm-date').value = s.midtermDate || '';
    document.getElementById('midterm-time').value = s.midtermTime || '';
    document.getElementById('midterm-end-time').value = s.midtermEndTime || '';
    document.getElementById('final-day').value = s.finalDay || '';
    document.getElementById('final-date').value = s.finalDate || '';
    document.getElementById('final-time').value = s.finalTime || '';
    document.getElementById('final-end-time').value = s.finalEndTime || '';
    document.getElementById('btn-delete').style.display = 'block';
    document.getElementById('modal-overlay').classList.add('active');
}

function handleSubmit(event) {
    event.preventDefault();
    const code = document.getElementById('subject-code').value.trim();
    const name = document.getElementById('subject-name').value.trim();
    const day = parseInt(document.getElementById('subject-day').value);
    const room = document.getElementById('subject-room').value.trim();
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const midtermDay = document.getElementById('midterm-day').value;
    const midtermDate = document.getElementById('midterm-date').value;
    const midtermTime = document.getElementById('midterm-time').value;
    const midtermEndTime = document.getElementById('midterm-end-time').value;
    const finalDay = document.getElementById('final-day').value;
    const finalDate = document.getElementById('final-date').value;
    const finalTime = document.getElementById('final-time').value;
    const finalEndTime = document.getElementById('final-end-time').value;

    if (!code) { showToast('Please enter a course code', 'error'); return; }
    if (!name) { showToast('Please enter a course name', 'error'); return; }
    if (isNaN(day)) { showToast('Please select a day for the class', 'error'); return; }
    if (!startTime || !endTime) { showToast('Please select class start and end times', 'error'); return; }

    if (startTime >= endTime) { showToast('Class start time must be before end time', 'error'); return; }

    if (midtermTime && midtermEndTime && midtermTime >= midtermEndTime) { 
        showToast('Midterm start time must be before end time', 'error'); 
        return; 
    }
    if (finalTime && finalEndTime && finalTime >= finalEndTime) { 
        showToast('Final start time must be before end time', 'error'); 
        return; 
    }

    const overlap = subjects.find(s => {
        if (editingId && s.id === editingId) return false;
        if (s.day !== day) return false;
        return startTime < s.endTime && endTime > s.startTime;
    });
    if (overlap) { showToast(`Time conflict with ${overlap.code} ${overlap.name}`, 'error'); return; }

    if (editingId) {
        const idx = subjects.findIndex(s => s.id === editingId);
        if (idx !== -1) subjects[idx] = { ...subjects[idx], code, name, day, room, startTime, endTime, midtermDay, midtermDate, midtermTime, midtermEndTime, finalDay, finalDate, finalTime, finalEndTime };
        showToast('Subject updated', 'success');
    } else {
        subjects.push({ id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5), code, name, day, room, startTime, endTime, midtermDay, midtermDate, midtermTime, midtermEndTime, finalDay, finalDate, finalTime, finalEndTime, colorIndex: colorIndex });
        colorIndex = (colorIndex + 1) % COLOR_COUNT;
        localStorage.setItem('scheduler_colorIndex', String(colorIndex));
        showToast('Subject added', 'success');
    }
    saveSubjects(); renderSubjects(); renderExams(); closeModal();
}

function deleteSubject() {
    if (!contextSubjectId) return;
    deleteSubjectById(contextSubjectId);
    document.getElementById('context-menu').classList.remove('active');
    contextSubjectId = null;
}

function deleteSubjectById(id, event) {
    if (event) event.stopPropagation();
    subjects = subjects.filter(s => s.id !== id);
    saveSubjects(); renderSubjects(); renderExams();
    showToast('Subject deleted', 'success');
}

function deleteCurrentSubject() {
    if (editingId) {
        deleteSubjectById(editingId);
        closeModal();
    }
}

function showContextMenu(x, y) {
    const m = document.getElementById('context-menu');
    m.style.left = `${x}px`; m.style.top = `${y}px`;
    m.classList.add('active');
    const r = m.getBoundingClientRect();
    if (r.right > window.innerWidth) m.style.left = `${x - r.width}px`;
    if (r.bottom > window.innerHeight) m.style.top = `${y - r.height}px`;
}

function saveSubjects() { localStorage.setItem('scheduler_subjects', JSON.stringify(subjects)); }

// ===== Decorate Panel =====
function toggleDecoratePanel() {
    const panel = document.getElementById('decorate-panel');
    const btn = document.getElementById('btn-decorate');
    panel.classList.toggle('open');
    btn.classList.toggle('active');
}

function switchDecorateTab(tab) {
    document.querySelectorAll('.decorate-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.decorate-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
}

// ===== Stickers =====
function initStickers() {
    const grid = document.getElementById('sticker-grid');
    STICKERS.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'sticker-btn';
        btn.textContent = emoji;
        btn.title = `Add ${emoji}`;
        btn.addEventListener('click', () => addSticker(emoji));
        grid.appendChild(btn);
    });
}

function addSticker(emoji) {
    const wrapper = document.getElementById('timetable-wrapper');
    const rect = wrapper.getBoundingClientRect();
    const deco = {
        id: 'deco_' + Date.now(),
        type: 'sticker',
        emoji: emoji,
        x: 50 + Math.random() * (rect.width - 100),
        y: 40 + Math.random() * (rect.height - 80),
    };
    decorations.push(deco);
    saveDecorations();
    renderDecorations();
    showToast(`${emoji} added!`, 'success');
}

// ===== Text Decoration =====
function addTextDecoration() {
    const text = document.getElementById('deco-text-input').value.trim();
    if (!text) { showToast('Please enter some text', 'error'); return; }
    const size = document.getElementById('deco-text-size').value;
    const color = document.getElementById('deco-text-color').value;
    const bold = document.getElementById('deco-text-bold').checked;
    const wrapper = document.getElementById('timetable-wrapper');
    const rect = wrapper.getBoundingClientRect();
    const deco = {
        id: 'deco_' + Date.now(),
        type: 'text',
        text, size: parseInt(size), color, bold,
        x: 60 + Math.random() * (rect.width - 150),
        y: 40 + Math.random() * (rect.height - 80),
    };
    decorations.push(deco);
    saveDecorations();
    renderDecorations();
    document.getElementById('deco-text-input').value = '';
    showToast('Text added!', 'success');
}

// ===== Render Decorations =====
function renderDecorations() {
    const layer = document.getElementById('decorations-layer');
    layer.innerHTML = '';
    decorations.forEach(deco => {
        const el = document.createElement('div');
        el.className = 'deco-item';
        el.dataset.decoId = deco.id;
        el.style.left = `${deco.x}px`;
        el.style.top = `${deco.y}px`;

        if (deco.type === 'sticker') {
            el.classList.add('deco-sticker');
            el.textContent = deco.emoji;
        } else if (deco.type === 'text') {
            el.classList.add('deco-text');
            el.textContent = deco.text;
            el.style.fontSize = `${deco.size}px`;
            el.style.color = deco.color;
            el.style.fontWeight = deco.bold ? '700' : '400';
        }

        // Drag
        el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragTarget = el;
            const r = el.getBoundingClientRect();
            dragOffset.x = e.clientX - r.left;
            dragOffset.y = e.clientY - r.top;
        });

        // Double-click to remove
        el.addEventListener('dblclick', () => {
            decorations = decorations.filter(d => d.id !== deco.id);
            saveDecorations();
            renderDecorations();
            showToast('Decoration removed', 'success');
        });

        layer.appendChild(el);
    });
}

function handleDragMove(e) {
    if (!dragTarget) return;
    const layer = document.getElementById('decorations-layer');
    const rect = layer.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    dragTarget.style.left = `${Math.max(0, Math.min(rect.width - 30, x))}px`;
    dragTarget.style.top = `${Math.max(0, Math.min(rect.height - 30, y))}px`;
}

function handleDragEnd() {
    if (!dragTarget) return;
    const id = dragTarget.dataset.decoId;
    const deco = decorations.find(d => d.id === id);
    if (deco) {
        deco.x = parseInt(dragTarget.style.left);
        deco.y = parseInt(dragTarget.style.top);
        saveDecorations();
    }
    dragTarget = null;
}

function saveDecorations() { localStorage.setItem('scheduler_decorations', JSON.stringify(decorations)); }

// ===== Background Image (behind timetable) =====
function handleBgImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const url = e.target.result;
        localStorage.setItem('scheduler_bgImage', url);
        applyBgImage(url);
        document.getElementById('btn-remove-bg').style.display = '';
        showToast('Background image set', 'success');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function loadBgImage() {
    const url = localStorage.getItem('scheduler_bgImage');
    const opacity = localStorage.getItem('scheduler_bgOpacity') || '20';
    if (url) {
        applyBgImage(url);
        document.getElementById('btn-remove-bg').style.display = '';
        document.getElementById('bg-opacity').value = opacity;
        document.getElementById('bg-opacity-val').textContent = opacity + '%';
    }
}

function applyBgImage(url) {
    const el = document.getElementById('timetable-bg-image');
    el.style.backgroundImage = `url(${url})`;
    const opacity = (localStorage.getItem('scheduler_bgOpacity') || '20');
    el.style.opacity = parseInt(opacity) / 100;
}

function updateBgOpacity(val) {
    document.getElementById('bg-opacity-val').textContent = val + '%';
    document.getElementById('timetable-bg-image').style.opacity = parseInt(val) / 100;
    localStorage.setItem('scheduler_bgOpacity', val);
}

function removeBgImage() {
    localStorage.removeItem('scheduler_bgImage');
    document.getElementById('timetable-bg-image').style.backgroundImage = '';
    document.getElementById('btn-remove-bg').style.display = 'none';
    showToast('Background image removed', 'success');
}

// ===== Frame Styles =====
function applyFrame(frame) {
    const wrapper = document.getElementById('timetable-wrapper');
    wrapper.className = 'timetable-wrapper';
    if (frame !== 'none') wrapper.classList.add(`frame-${frame}`);
    document.querySelectorAll('.frame-option').forEach(o => o.classList.toggle('active', o.dataset.frame === frame));
    localStorage.setItem('scheduler_frame', frame);
}

function loadSavedFrame() {
    const frame = localStorage.getItem('scheduler_frame') || 'none';
    applyFrame(frame);
}

// ===== Import Schedule Image with Data =====
function handleImageImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const buffer = e.target.result;
        const text = new TextDecoder().decode(buffer);
        const idx = text.lastIndexOf("___SCHEDULE_DATA___");
        
        if (idx !== -1) {
            const jsonStr = text.substring(idx + "___SCHEDULE_DATA___".length);
            try {
                subjects = JSON.parse(jsonStr);
                saveSubjects();
                renderSubjects();
                renderExams();
                showToast('Schedule data imported successfully!', 'success');
            } catch (err) {
                console.error(err);
                showToast('Failed to parse schedule data.', 'error');
            }
        } else {
            showToast('No schedule data found in this image. Please upload an image exported from this app.', 'error');
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
}

// ===== Download =====
async function downloadImage() {
    const btn = document.getElementById('btn-download');
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:pulse 1s infinite"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Exporting...';
    btn.disabled = true;
    try {
        const area = document.getElementById('capture-area');
        const bg = localStorage.getItem('scheduler_bgColor') || '#ffffff';
        const canvas = await html2canvas(area, { backgroundColor: bg, scale: 2, useCORS: true, logging: false });
        const dataUrl = canvas.toDataURL('image/png');
        
        // Extract base64 and convert to binary
        const base64 = dataUrl.split(',')[1];
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        
        // Append JSON payload
        const jsonStr = JSON.stringify(subjects);
        const payload = "___SCHEDULE_DATA___" + jsonStr;
        const payloadBytes = new TextEncoder().encode(payload);
        
        const blob = new Blob([bytes, payloadBytes], { type: 'image/png' });
        const link = document.createElement('a');
        link.download = `Class Schedule.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        
        showToast('Image downloaded with embedded data!', 'success');
    } catch (err) {
        console.error(err);
        showToast('Export failed', 'error');
    } finally {
        btn.innerHTML = orig;
        btn.disabled = false;
    }
}

// ===== Toast =====
function showToast(msg, type = 'success') {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icon = type === 'success'
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    t.innerHTML = `${icon} ${msg}`;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2500);
}
