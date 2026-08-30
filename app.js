import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs,
  updateDoc, query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

/* ----------------------------------------------------------------------------
   1. FIREBASE INITIALIZATION & STATE
   -------------------------------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyBLw02lEFjAZeTbaipXhGxHhkfPS6aNldo",
  authDomain: "project-28d2d.firebaseapp.com",
  databaseURL: "https://project-28d2d-default-rtdb.firebaseio.com",
  projectId: "project-28d2d",
  storageBucket: "project-28d2d.firebasestorage.app",
  messagingSenderId: "946923856849",
  appId: "1:946923856849:web:27df790a61ee05d27c36f0",
  measurementId: "G-YCR9ZZ81FT"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

const state = {
  selectedRole: 'customer',
  authMode: 'login',
  currentUser: null,       
  providers: [],            
  myComplaints: [],          
  providerComplaints: [],    
  activeProviderId: null,  
  activeComplaintId: null,   
  customerTab: 'browse',
};

const SERVICES = [
  "Web Development", "Mobile App Development", "UI/UX Design",
  "IT Support", "Cloud & DevOps", "Cybersecurity", "Digital Marketing", "QA & Testing"
];

/* ----------------------------------------------------------------------------
   2. GENERIC UI & UTILITY HELPERS
   -------------------------------------------------------------------------- */
function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

const swalToastMixin = window.Swal ? Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timerProgressBar: true,
  background: '#121729',
  color: '#E9ECF7',
  didOpen: (el) => {
    el.addEventListener('mouseenter', Swal.stopTimer);
    el.addEventListener('mouseleave', Swal.resumeTimer);
  }
}) : null;

function toast(message, type = 'info', timeout = 4200) {
  const icon = type === 'success' ? 'success' : type === 'error' ? 'error' : 'info';
  if (swalToastMixin) {
    swalToastMixin.fire({ icon, title: message, timer: timeout });
  } else {
    console.log(`[${type}]`, message);
  }
}

async function confirmDialog({ title, text, icon = 'question', confirmText = 'Yes', confirmColor = '#6366F1' }) {
  if (!window.Swal) return window.confirm(text || title);
  const result = await Swal.fire({
    title, text, icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    confirmButtonColor: confirmColor,
    cancelButtonColor: '#232B45',
    background: '#121729', color: '#E9ECF7',
    reverseButtons: true
  });
  return result.isConfirmed;
}

function ensureModalRoot() {
  let root = document.getElementById('modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'modal-root';
    document.body.appendChild(root);
  }
  return root;
}

function openModal(innerHtml, opts = {}) {
  const root = ensureModalRoot();
  const width = opts.width || 'max-w-lg';
  root.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal-panel glass ${width} w-full rounded-3xl p-6 sm:p-7 my-auto relative">
        <button onclick="app.closeModal()" aria-label="Close" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
        </button>
        ${innerHtml}
      </div>
    </div>
  `;
  const backdrop = document.getElementById('modal-backdrop');
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
  document.body.style.overflow = '';
}

function generateComplaintId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `CMP-2026-${code}`;
}

function starsHtml(rating, size = 14) {
  const r = Math.round(rating || 0);
  let out = '<span class="inline-flex items-center gap-0.5">';
  for (let i = 1; i <= 5; i++) {
    out += `<svg class="star ${i <= r ? 'filled' : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.8 7.1-.7z"/></svg>`;
  }
  return out + '</span>';
}

function availabilityDot(av) {
  const color = av === 'Available' ? 'var(--success)' : av === 'Busy' ? 'var(--warning)' : 'var(--danger)';
  return `<span class="inline-flex items-center gap-1.5 text-[11px] font-semibold" style="color:${color}"><span style="width:6px;height:6px;border-radius:999px;background:${color};box-shadow:0 0 6px ${color}"></span>${escapeHtml(av)}</span>`;
}

let revealObserver = null;
function initScrollReveal(root = document) {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }
  $$('.reveal, .reveal-scale', root).forEach((el, i) => {
    if (!el.classList.contains('reveal-visible')) {
      el.style.transitionDelay = `${Math.min(i * 60, 360)}ms`;
      revealObserver.observe(el);
    }
  });
}

function setLoading(containerEl, count = 3, height = 220) {
  if (!containerEl) return;
  containerEl.innerHTML = Array.from({ length: count }).map(() =>
    `<div class="skeleton" style="height:${height}px;border-radius:20px;"></div>`
  ).join('');
}

function emptyState(title, sub, icon) {
  return `
    <div class="empty-state col-span-full py-14 px-6 text-center reveal reveal-visible">
      <div class="w-14 h-14 mx-auto rounded-2xl bg-slate-800/70 flex items-center justify-center mb-4 text-indigo-400">
        ${icon || '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.8"/></svg>'}
      </div>
      <h3 class="text-slate-200 font-bold">${escapeHtml(title)}</h3>
      <p class="text-slate-500 text-sm mt-1">${escapeHtml(sub)}</p>
    </div>`;
}

/* ----------------------------------------------------------------------------
   3. AUTHENTICATION MODULE
   -------------------------------------------------------------------------- */
function setRole(role) {
  state.selectedRole = role;
  const custBtn = document.getElementById('role-customer');
  const provBtn = document.getElementById('role-provider');
  if (!custBtn || !provBtn) return;
  const active = "role-card border-2 border-indigo-500 bg-indigo-500/10 text-white rounded-2xl p-4 text-center cursor-pointer";
  const inactive = "role-card border-2 border-slate-700/70 bg-slate-900/40 text-slate-400 rounded-2xl p-4 text-center cursor-pointer";
  custBtn.className = role === 'customer' ? active : inactive;
  provBtn.className = role === 'provider' ? active : inactive;
}

function setMode(mode) {
  state.authMode = mode;
  const loginBtn = document.getElementById('tab-login');
  const signupBtn = document.getElementById('tab-signup');
  const nameField = document.getElementById('field-name');
  const confirmField = document.getElementById('field-confirm');
  const submitBtn = document.getElementById('submit-btn');
  const onTab = "flex-1 pb-3 border-b-2 border-indigo-500 text-indigo-400 font-bold text-sm transition-all cursor-pointer";
  const offTab = "flex-1 pb-3 border-b-2 border-transparent text-slate-500 font-bold text-sm transition-all cursor-pointer hover:text-slate-300";
  if (loginBtn && signupBtn) {
    loginBtn.className = mode === 'login' ? onTab : offTab;
    signupBtn.className = mode === 'signup' ? onTab : offTab;
  }
  if (nameField) nameField.classList.toggle('hidden', mode !== 'signup');
  if (confirmField) confirmField.classList.toggle('hidden', mode !== 'signup');
  if (submitBtn) submitBtn.innerHTML = mode === 'login'
    ? 'Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : 'Create Account <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function defaultProviderProfile(uid, name) {
  return {
    id: uid, ownerUid: uid, name, isDemo: false,
    service: "Web Development", skills: ["Web Development", "IT Support"],
    location: "Remote", experience: "New on Serviro", price: "$25/hr",
    rating: 0, reviewCount: 0, availability: "Available",
    about: `${name} recently joined Serviro as a service provider and is ready to take on new projects.`,
    image: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1`,
    portfolio: [], createdAt: serverTimestamp()
  };
}

async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email')?.value.trim();
  const password = document.getElementById('auth-password')?.value;
  const submitBtn = document.getElementById('submit-btn');
  const originalLabel = submitBtn ? submitBtn.innerHTML : '';

  if (!email || !password) { toast('Email & password are required.', 'error'); return; }

  if (state.authMode === 'signup') {
    const name = document.getElementById('auth-name')?.value.trim();
    const confirm = document.getElementById('auth-confirm')?.value;
    if (!name) { toast('Please enter your full name.', 'error'); return; }
    if (password.length < 6) { toast('Password must be at least 6 characters.', 'error'); return; }
    if (password !== confirm) { toast('Passwords do not match.', 'error'); return; }

    try {
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creating account…'; }
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid, name, email,
        role: state.selectedRole, createdAt: serverTimestamp()
      });
      if (state.selectedRole === 'provider') {
        await setDoc(doc(db, "providers", cred.user.uid), defaultProviderProfile(cred.user.uid, name));
      }
      toast(`Welcome to Serviro, ${name.split(' ')[0]}!`, 'success');
      redirectToPage(state.selectedRole);
    } catch (err) {
      toast(cleanFirebaseError(err), 'error');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalLabel; }
    }
  } else {
    try {
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Signing in…'; }
      await signInWithEmailAndPassword(auth, email, password);
      toast('Signed in successfully.', 'success');
    } catch (err) {
      toast(cleanFirebaseError(err), 'error');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalLabel; }
    }
  }
}

function cleanFirebaseError(err) {
  const msg = (err && err.message) || 'Something went wrong.';
  return msg.replace('Firebase:', '').replace(/\(auth\/[a-z-]+\)\.?/i, '').trim();
}

function listenAuth() {
  onAuthStateChanged(auth, async (user) => {
    const page = document.body.dataset.page || 'index';
    const isAuthPage = page === 'index';

    if (user) {
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const data = userSnap.exists() ? userSnap.data() : { name: user.email, role: 'customer' };
        state.currentUser = { uid: user.uid, email: user.email, name: data.name, role: data.role };

        $$('.user-email-slot').forEach(el => el.textContent = user.email);
        $$('.user-name-slot').forEach(el => el.textContent = data.name || user.email);
        $$('.user-avatar-slot').forEach(el => {
          el.src = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(data.name || user.email)}&backgroundColor=6366f1`;
        });

        if (isAuthPage) { redirectToPage(data.role); return; }

        if (page === 'customer' && data.role !== 'customer') { redirectToPage(data.role); return; }
        if (page === 'provider' && data.role !== 'provider') { redirectToPage(data.role); return; }

        if (page === 'customer') initCustomerDashboard();
        if (page === 'provider') initProviderDashboard();
      } catch (e) {
        console.error("Auth session error:", e);
        toast('Could not load your account. Please try again.', 'error');
      }
    } else {
      if (!isAuthPage) window.location.href = "index.html";
    }
  });
}

function redirectToPage(role) {
  if (role === 'customer') window.location.href = "customer.html";
  else if (role === 'provider') window.location.href = "provider.html";
  else window.location.href = "customer.html";
}

async function logout() {
  const ok = await confirmDialog({
    title: 'Log out?',
    text: 'You will need to sign in again to access your dashboard.',
    icon: 'question',
    confirmText: 'Log out',
    confirmColor: '#6366F1'
  });
  if (!ok) return;
  try { await signOut(auth); } catch (e) { /* no-op */ }
  window.location.href = "index.html";
}

/* ----------------------------------------------------------------------------
   4. CUSTOMER VIEW & COMPLAINT CREATION ENGINE
   -------------------------------------------------------------------------- */
async function initCustomerDashboard() {
  populateServiceFilter();
  initScrollReveal();
  await loadProviders();
  await loadMyComplaints();
}

function populateServiceFilter() {
  const sel = document.getElementById('filter-service');
  if (!sel || sel.dataset.filled) return;
  sel.innerHTML = '<option value="">All services</option>' + SERVICES.map(s => `<option value="${s}">${s}</option>`).join('');
  sel.dataset.filled = '1';
}

async function loadProviders() {
  const grid = document.getElementById('providers-grid');
  setLoading(grid, 6, 340);
  try {
    const snap = await getDocs(collection(db, "providers"));
    state.providers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProviders(state.providers);
  } catch (e) {
    console.error(e);
    if (grid) grid.innerHTML = emptyState('Could not load providers', 'Check your connection and try refreshing the page.');
  }
}

function renderProviders(list) {
  const grid = document.getElementById('providers-grid');
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = emptyState('No providers match your search', 'Try a different keyword or clear the filters.');
    return;
  }
  grid.innerHTML = list.map(p => `
    <div class="card reveal reveal-scale rounded-3xl p-5 flex flex-col">
      <div class="flex items-start gap-3">
        <div class="avatar-ring shrink-0"><img src="${p.image}" alt="${escapeHtml(p.name)}" class="w-14 h-14 rounded-full bg-slate-900 object-cover"></div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <h3 class="font-display font-bold text-white truncate">${escapeHtml(p.name)}</h3>
            ${p.isDemo ? `<span class="chip !text-[9px] !py-0.5" style="border-color:rgba(251,191,36,0.35); color:#FBBF24;">Demo</span>` : ''}
          </div>
          <p class="text-xs text-indigo-300 font-semibold truncate">${escapeHtml(p.service)}</p>
          <div class="mt-1">${availabilityDot(p.availability)}</div>
        </div>
      </div>

      <div class="flex items-center gap-2 mt-3 text-xs text-slate-400">
        ${starsHtml(p.rating, 13)}<span class="font-mono text-slate-300">${(p.rating || 0).toFixed(1)}</span>
        <span class="text-slate-600">·</span><span>${p.reviewCount || 0} reviews</span>
      </div>

      <div class="flex flex-wrap gap-1.5 mt-3">
        ${(p.skills || []).slice(0, 3).map(s => `<span class="chip">${escapeHtml(s)}</span>`).join('')}
      </div>

      <div class="divider my-4"></div>

      <div class="flex items-center justify-between text-xs text-slate-400">
        <span class="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-6.1-7-11a7 7 0 1114 0c0 4.9-7 11-7 11z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.4" stroke="currentColor" stroke-width="1.8"/></svg>${escapeHtml(p.location)}</span>
        <span class="font-mono font-bold text-cyan-300">${escapeHtml(p.price)}</span>
      </div>
      <p class="text-[11px] text-slate-500 mt-1">${escapeHtml(p.experience)} experience</p>

      <div class="flex gap-2 mt-4">
        <button onclick="app.openProviderProfile('${p.id}')" class="btn btn-secondary flex-1">View Profile</button>
        <button onclick="app.openComplaintForm('${p.id}')" class="btn btn-primary flex-1">File Complaint</button>
      </div>
    </div>
  `).join('');
  initScrollReveal(grid);
}

function filterProviders() {
  const q = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const service = document.getElementById('filter-service')?.value || '';
  const filtered = state.providers.filter(p => {
    const matchesQuery = !q || p.name.toLowerCase().includes(q) ||
      p.service.toLowerCase().includes(q) ||
      (p.skills || []).some(s => s.toLowerCase().includes(q));
    const matchesService = !service || p.service === service;
    return matchesQuery && matchesService;
  });
  renderProviders(filtered);
}

async function openProviderProfile(providerId) {
  state.activeProviderId = providerId;
  openModal(`<div class="py-10 text-center text-slate-400 text-sm">Loading profile…</div>`, { width: 'max-w-2xl' });
  try {
    const snap = await getDoc(doc(db, "providers", providerId));
    if (!snap.exists()) { toast('Provider not found.', 'error'); closeModal(); return; }
    const p = { id: snap.id, ...snap.data() };

    openModal(`
      <div class="flex items-start gap-4 pr-8">
        <div class="avatar-ring shrink-0"><img src="${p.image}" class="w-16 h-16 rounded-full bg-slate-900 object-cover"></div>
        <div class="min-w-0">
          <h2 class="font-display text-xl font-bold text-white">${escapeHtml(p.name)}</h2>
          <p class="text-sm text-indigo-300 font-semibold">${escapeHtml(p.service)}</p>
          <div class="flex items-center gap-2 mt-1.5">${starsHtml(p.rating)}<span class="text-xs font-mono text-slate-400">${(p.rating || 0).toFixed(1)} (${p.reviewCount || 0})</span></div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 mt-5">
        <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Experience</p>
          <p class="text-sm font-bold text-slate-200 mt-1">${escapeHtml(p.experience)}</p>
        </div>
        <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Rate</p>
          <p class="text-sm font-bold text-cyan-300 mt-1 font-mono">${escapeHtml(p.price)}</p>
        </div>
        <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Status</p>
          <p class="text-sm font-bold mt-1">${availabilityDot(p.availability)}</p>
        </div>
      </div>

      <p class="text-xs uppercase tracking-wider text-slate-500 font-bold mt-5 mb-2">About</p>
      <p class="text-sm text-slate-300 leading-relaxed">${escapeHtml(p.about)}</p>

      <button onclick="app.closeModal(); app.openComplaintForm('${p.id}')" class="btn btn-primary w-full mt-6">
        File a Complaint
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    `, { width: 'max-w-2xl' });
  } catch (e) {
    console.error(e);
    toast('Could not load this profile.', 'error');
    closeModal();
  }
}

function openComplaintForm(providerId) {
  const p = state.providers.find(x => x.id === providerId);
  if (!p) { toast('Provider not found.', 'error'); return; }
  state.activeProviderId = providerId;
  const today = new Date().toISOString().split('T')[0];

  openModal(`
    <h2 class="font-display text-xl font-bold text-white">File Complaint</h2>
    <p class="text-xs text-slate-400 mt-1">Lodge an official ticket regarding provider: <strong class="text-indigo-300">${escapeHtml(p.name)}</strong></p>
    
    <form id="complaint-form" class="mt-5 space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Issue Subject</label>
        <input type="text" id="cmp-subject" class="input" placeholder="e.g. Unfinished Deliverable or Breach of Agreement" required>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Detailed Explanation</label>
        <textarea id="cmp-description" class="input h-28 py-2.5" placeholder="Provide full context about the problem..." required></textarea>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Incident Date</label>
          <input type="date" id="cmp-date" class="input" value="${today}" required>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Urgency Level</label>
          <select id="cmp-urgency" class="input">
            <option value="Low">Low</option>
            <option value="Medium" selected>Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      <div class="pt-2 flex gap-3">
        <button type="button" onclick="app.closeModal()" class="btn btn-secondary flex-1">Cancel</button>
        <button type="submit" id="submit-complaint-btn" class="btn btn-primary flex-1">Submit Ticket</button>
      </div>
    </form>
  `);

  $('#complaint-form').addEventListener('submit', submitComplaint);
}

async function submitComplaint(e) {
  e.preventDefault();
  const subject = $('#cmp-subject')?.value.trim();
  const description = $('#cmp-description')?.value.trim();
  const date = $('#cmp-date')?.value;
  const urgency = $('#cmp-urgency')?.value;
  const submitBtn = $('#submit-complaint-btn');

  if (!subject || !description) { toast('Please complete all required fields.', 'error'); return; }

  const p = state.providers.find(x => x.id === state.activeProviderId);
  const complaintId = generateComplaintId();

  try {
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; }

    const complaintDoc = {
      complaintId,
      customerId: state.currentUser.uid,
      customerName: state.currentUser.name || state.currentUser.email,
      customerEmail: state.currentUser.email,
      providerId: p.id,
      providerName: p.name,
      providerService: p.service,
      subject,
      description,
      incidentDate: date,
      urgency,
      status: 'Pending',
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, "complaints", complaintId), complaintDoc);
    toast(`Complaint lodged successfully! Ref ID: ${complaintId}`, 'success');
    closeModal();
    await loadMyComplaints();
  } catch (err) {
    console.error(err);
    toast('Failed to record complaint ticket.', 'error');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Ticket'; }
  }
}

async function loadMyComplaints() {
  if (!state.currentUser) return;
  try {
    const q = query(
      collection(db, "complaints"),
      where("customerId", "==", state.currentUser.uid)
    );
    const snap = await getDocs(q);
    state.myComplaints = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Failed to load customer complaints:", e);
  }
}

/* ----------------------------------------------------------------------------
   5. PROVIDER DASHBOARD MODULE
   -------------------------------------------------------------------------- */
async function initProviderDashboard() {
  initScrollReveal();
  await loadProviderComplaints();
}

async function loadProviderComplaints() {
  if (!state.currentUser) return;
  const grid = document.getElementById('provider-complaints-grid');
  setLoading(grid, 3, 200);
  try {
    const q = query(
      collection(db, "complaints"),
      where("providerId", "==", state.currentUser.uid)
    );
    const snap = await getDocs(q);
    state.providerComplaints = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProviderComplaints(state.providerComplaints);
  } catch (e) {
    console.error(e);
    if (grid) grid.innerHTML = emptyState('Could not load complaints assigned to you.', 'Check connection.');
  }
}

function renderProviderComplaints(list) {
  const grid = document.getElementById('provider-complaints-grid');
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = emptyState('No Complaints Filed', 'Your record is completely clean.');
    return;
  }
  grid.innerHTML = list.map(c => `
    <div class="card p-5 rounded-2xl flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-2">
          <span class="font-mono text-xs text-indigo-400 font-bold">${escapeHtml(c.complaintId)}</span>
          <span class="badge badge-pending">${escapeHtml(c.status)}</span>
        </div>
        <h4 class="font-bold text-white text-base mt-2">${escapeHtml(c.subject)}</h4>
        <p class="text-xs text-slate-400 mt-1 line-clamp-2">${escapeHtml(c.description)}</p>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>From: ${escapeHtml(c.customerName)}</span>
        <span>Urgency: ${escapeHtml(c.urgency)}</span>
      </div>
    </div>
  `).join('');
}

/* ----------------------------------------------------------------------------
   6. GLOBAL APP MOUNT & INITIALIZATION
   -------------------------------------------------------------------------- */
window.app = {
  setRole, setMode, handleAuth, logout,
  openProviderProfile, openComplaintForm,
  filterProviders, closeModal
};

document.addEventListener('DOMContentLoaded', () => {
  listenAuth();
});