let notes = JSON.parse(localStorage.getItem('obsidian_notes') || '[]');
let activeId = null;
let saveTimeout = null;

function save() {
  localStorage.setItem('obsidian_notes', JSON.stringify(notes));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function createNote() {
  const note = {
    id: genId(),
    title: '',
    content: '',
    tag: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  notes.unshift(note);
  save();
  renderList();
  openNote(note.id);
  setTimeout(() => document.getElementById('noteTitle').focus(), 50);
}

function openNote(id) {
  activeId = id;
  const note = notes.find(n => n.id === id);
  if (!note) return;
  document.getElementById('noteTitle').value = note.title;
  document.getElementById('noteContent').value = note.content;
  document.getElementById('tagSelect').value = note.tag || '';
  updateWordCount();
  setStatus('saved');
  document.getElementById('welcomeScreen').classList.add('hidden');
  document.getElementById('editorPanel').classList.remove('hidden');
  document.getElementById('editorPanel').style.display = 'flex';
  renderList();
}

function onEdit() {
  setStatus('unsaved');
  updateWordCount();
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveCurrentNote(true), 2000);
}

function saveCurrentNote(auto = false) {
  if (!activeId) return;
  const note = notes.find(n => n.id === activeId);
  if (!note) return;
  note.title = document.getElementById('noteTitle').value.trim() || 'Untitled';
  note.content = document.getElementById('noteContent').value;
  note.tag = document.getElementById('tagSelect').value;
  note.updatedAt = Date.now();
  notes = [note, ...notes.filter(n => n.id !== activeId)];
  save();
  renderList();
  setStatus('saved');
  if (!auto) toast('Note saved', 'success');
}

function updateCurrentNoteTag() {
  onEdit();
}

function confirmDelete() {
  if (!activeId) return;
  const note = notes.find(n => n.id === activeId);
  const title = note?.title || 'Untitled';
  document.getElementById('deleteModalBody').textContent =
    `"${title}" will be permanently deleted.`;
  document.getElementById('deleteModal').classList.add('open');
}

function closeModal() {
  document.getElementById('deleteModal').classList.remove('open');
}

function deleteCurrentNote() {
  closeModal();
  if (!activeId) return;
  notes = notes.filter(n => n.id !== activeId);
  save();
  activeId = null;
  document.getElementById('editorPanel').classList.add('hidden');
  document.getElementById('welcomeScreen').classList.remove('hidden');
  renderList();
  toast('Note deleted', 'deleted');
}

function setStatus(state) {
  const dot = document.getElementById('statusDot');
  dot.className = 'status-dot ' + state;
  dot.title = state === 'saved' ? 'All changes saved' : 'Unsaved changes';
}

function updateWordCount() {
  const content = document.getElementById('noteContent').value;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  document.getElementById('wordCount').textContent = words + ' word' + (words !== 1 ? 's' : '');
}

function filterNotes() {
  renderList();
}

function renderList() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  );
  const list = document.getElementById('notesList');
  document.getElementById('noteCount').textContent = filtered.length + ' note' + (filtered.length !== 1 ? 's' : '');

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 40 40"><circle cx="20" cy="16" r="9"/><path d="M9 34c0-6 5-10 11-10s11 4 11 10"/></svg>
      <div>No notes found</div>
    </div>`;
    return;
  }

  list.innerHTML = filtered.map(n => {
    const tagClass = n.tag ? 'tag-' + n.tag : '';
    const tagLabel = n.tag || '';
    const preview = n.content.replace(/\n/g, ' ').slice(0, 60);
    return `<div class="note-item ${n.id === activeId ? 'active' : ''}" onclick="openNote('${n.id}')">
      <div class="note-item-title">${n.title || 'Untitled'}</div>
      <div class="note-item-meta">
        <span class="note-item-date">${formatDate(n.updatedAt)}</span>
        ${tagLabel ? `<span class="note-tag ${tagClass}">${tagLabel}</span>` : ''}
      </div>
      ${preview ? `<div class="note-item-preview">${preview}</div>` : ''}
    </div>`;
  }).join('');
}

function toast(msg, type = 'success') {
  const icons = {
    success: `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><polyline points="5,8 7,10 11,6"/></svg>`,
    deleted: `<svg viewBox="0 0 16 16"><polyline points="2,4 14,4"/><path d="M5 4V2h6v2"/><rect x="3" y="4" width="10" height="9" rx="1"/></svg>`,
  };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = (icons[type] || '') + `<span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    saveCurrentNote();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
    e.preventDefault();
    createNote();
  }
  if (e.key === 'Escape') closeModal();
});

// Seed demo notes if vault is empty
if (!notes.length) {
  const demos = [
    { title: 'Welcome to Obsidian Notes', content: 'This is your personal vault.\n\nStart capturing ideas, notes, and thoughts. Use tags to organize your notes and search to find anything instantly.\n\nKeyboard shortcuts:\n— Ctrl+S / ⌘S to save\n— Ctrl+N / ⌘N for a new note', tag: 'ideas' },
    { title: 'Meeting notes — Q4 planning', content: 'Discussed roadmap priorities for next quarter.\n\nAction items:\n- Finalize feature list by Friday\n- Schedule design review\n- Update stakeholders\n\nNext meeting: Thursday 2pm', tag: 'work' },
    { title: 'Reading list', content: 'Books to read this month:\n\n1. The Pragmatic Programmer\n2. Deep Work – Cal Newport\n3. Shape Up – Ryan Singer\n\nCurrently reading: The Name of the Wind', tag: 'personal' },
  ];
  demos.forEach((d, i) => {
    const ts = Date.now() - i * 3600000 * 5;
    notes.push({ id: genId(), title: d.title, content: d.content, tag: d.tag, createdAt: ts, updatedAt: ts });
  });
  save();
}

renderList();
