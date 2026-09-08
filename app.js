/* ============================================================================
   SERVIRO — app.js
   ALL application logic lives in this one file, organized by section:
     1.  Firebase setup (primary + secondary "seed" instance)
     2.  Seed data (demo admin + 6 demo providers, all REAL Firebase Auth
         accounts so they can log in like anyone else)
     3.  Generic utilities (dom, toast, format, ids)
     4.  Theme (light/white ⇄ dark/black, same accent, persisted)
     5.  Modal helpers
     6.  Scroll-reveal (IntersectionObserver)
     7.  Auth: role/mode UI, signup/login, route guard, logout
     8.  One-time data seeding
     9.  Customer dashboard: discover, filters, booking, reviews
     10. Provider dashboard: incoming bookings, workflow actions
     11. Admin dashboard: stats + full view/edit/delete across collections
     12. Bootstrap
   ============================================================================ */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  addDoc, collection, query, where, onSnapshot, serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ============================================================================
   1. FIREBASE SETUP
   ============================================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyBLw02lEFjAZeTbaipXhGxHhkfPS6aNldo",
  authDomain: "project-28d2d.firebaseapp.com",
  databaseURL: "https://project-28d2d-default-rtdb.firebaseio.com",
  projectId: "project-28d2d",
  storageBucket: "project-28d2d.firebasestorage.app",
  messagingSenderId: "946923856849",
  appId: "1:946923856849:web:27df790a61ee05d27c36f0"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

// Secondary, isolated Firebase app instance used ONLY for seeding demo
// accounts, so creating them never hijacks whoever is currently signed in.
const seedApp = initializeApp(firebaseConfig, "seed-instance");
const seedAuth = getAuth(seedApp);
const seedDb = getFirestore(seedApp);

/* ============================================================================
   2. SEED DATA — real, login-able demo accounts
   ============================================================================ */
const ADMIN_SEED = {
  email: "admin@serviro.com",
  password: "Serviro@Admin123",
  name: "Serviro Admin"
};

const DEMO_PROVIDERS = [
  {
    email: "sarah.khan@serviro.io", password: "Provider@123",
    name: "Sarah Khan", service: "Full-Stack Web Development",
    skills: ["React", "Node.js", "MongoDB", "Tailwind CSS"],
    location: "Karachi, Pakistan", experience: 5, price: 45,
    rating: 4.9, reviewCount: 3, availability: "Available Now",
    completedProjects: 38,
    about: "Full-stack engineer specializing in fast, scalable web apps. I've shipped e-commerce platforms, SaaS dashboards, and booking systems end to end — from database design to pixel-perfect UI.",
    portfolio: [
      { title: "Retail Analytics Dashboard", url: "https://tailwindcss.com" },
      { title: "Multi-vendor Marketplace", url: "https://vercel.com" }
    ]
  },
  {
    email: "ali.ahmed@serviro.io", password: "Provider@123",
    name: "Ali Ahmed", service: "UI/UX & Frontend Design",
    skills: ["Figma", "Tailwind CSS", "React", "Framer Motion"],
    location: "Lahore, Pakistan", experience: 4, price: 35,
    rating: 4.8, reviewCount: 2, availability: "Available Now",
    completedProjects: 29,
    about: "Product designer turned frontend developer. I design in Figma and ship the real, responsive interface myself — no handoff gaps, no lost detail.",
    portfolio: [
      { title: "Fintech Onboarding Flow", url: "https://stripe.com" },
      { title: "SaaS Landing Redesign", url: "https://framer.com" }
    ]
  },
  {
    email: "hamza.malik@serviro.io", password: "Provider@123",
    name: "Hamza Malik", service: "Mobile App Development",
    skills: ["Flutter", "Firebase", "Dart", "REST APIs"],
    location: "Islamabad, Pakistan", experience: 6, price: 50,
    rating: 4.9, reviewCount: 4, availability: "Busy",
    completedProjects: 44,
    about: "Cross-platform mobile developer with 6 years building Flutter apps backed by Firebase — from MVPs to apps with 100k+ downloads.",
    portfolio: [
      { title: "On-demand Delivery App", url: "https://flutter.dev" },
      { title: "Fitness Tracking App", url: "https://firebase.google.com" }
    ]
  },
  {
    email: "ayesha.noor@serviro.io", password: "Provider@123",
    name: "Ayesha Noor", service: "WordPress & CMS Development",
    skills: ["WordPress", "PHP", "WooCommerce", "MySQL"],
    location: "Karachi, Pakistan", experience: 3, price: 25,
    rating: 4.7, reviewCount: 2, availability: "Available Now",
    completedProjects: 21,
    about: "I build fast, SEO-friendly WordPress sites and WooCommerce stores for small businesses — clean code, no bloated page builders.",
    portfolio: [
      { title: "Boutique E-commerce Store", url: "https://woocommerce.com" },
      { title: "Restaurant Booking Site", url: "https://wordpress.org" }
    ]
  },
  {
    email: "usman.raza@serviro.io", password: "Provider@123",
    name: "Usman Raza", service: "DevOps & Cloud Infrastructure",
    skills: ["AWS", "Docker", "CI/CD", "Kubernetes"],
    location: "Lahore, Pakistan", experience: 7, price: 60,
    rating: 5.0, reviewCount: 3, availability: "Available Now",
    completedProjects: 52,
    about: "DevOps engineer helping teams ship reliably — CI/CD pipelines, containerized deployments, and AWS cost optimization.",
    portfolio: [
      { title: "Zero-downtime CI/CD Pipeline", url: "https://aws.amazon.com" },
      { title: "Kubernetes Cluster Migration", url: "https://kubernetes.io" }
    ]
  },
  {
    email: "zainab.fatima@serviro.io", password: "Provider@123",
    name: "Zainab Fatima", service: "Digital Marketing & SEO",
    skills: ["SEO", "Google Ads", "Analytics", "Content Strategy"],
    location: "Islamabad, Pakistan", experience: 4, price: 30,
    rating: 4.8, reviewCount: 2, availability: "Available Now",
    completedProjects: 33,
    about: "Growth marketer focused on organic search and paid acquisition. I've taken multiple sites from page 3 to page 1 on Google.",
    portfolio: [
      { title: "SaaS SEO Growth Campaign", url: "https://analytics.google.com" },
      { title: "E-commerce Ad Funnel", url: "https://ads.google.com" }
    ]
  }
];

/* ============================================================================
   3. GENERIC UTILITIES
   ============================================================================ */
const $ = (id) => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=fb7a2a&color=fff&bold=true&font-size=0.4`;
}

function generateBookingId() {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `SRV-${year}-${rand}`;
}

function toDate(ts) {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

function formatDate(ts) {
  const d = toDate(ts);
  if (!d || isNaN(d)) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatTime12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, "0")} ${period}`;
}

function money(n) {
  const num = Number(n) || 0;
  return `$${num.toLocaleString()}`;
}

function starsHtml(rating, size = "text-sm") {
  const r = Math.round(Number(rating) || 0);
  let out = `<span class="${size}" style="color:var(--warning); letter-spacing:1px;">`;
  for (let i = 1; i <= 5; i++) out += i <= r ? "★" : "☆";
  out += "</span>";
  return out;
}

const STATUS_CLASS = {
  "Pending": "badge-pending",
  "Accepted": "badge-accepted",
  "In Progress": "badge-inprogress",
  "Completed": "badge-completed",
  "Rejected": "badge-rejected"
};

function statusBadge(status) {
  const cls = STATUS_CLASS[status] || "badge-pending";
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${escapeHtml(status)}</span>`;
}

function isValidHttpUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}

/* ---- Toasts ---- */
function toast(message, type = "info", title = "") {
  const root = $("toast-root");
  if (!root) return;
  const icons = { success: "✅", error: "⚠️", info: "ℹ️" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `
    <span class="text-base leading-none">${icons[type] || icons.info}</span>
    <div class="min-w-0">
      ${title ? `<p class="text-sm font-bold text-body">${escapeHtml(title)}</p>` : ""}
      <p class="text-xs text-dim mt-0.5">${escapeHtml(message)}</p>
    </div>`;
  root.appendChild(el);
  setTimeout(() => {
    el.classList.add("closing");
    setTimeout(() => el.remove(), 320);
  }, 4200);
}

/* ============================================================================
   4. THEME
   ============================================================================ */
function applyThemeIcons() {
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  $$("#icon-sun").forEach(el => el.classList.toggle("hidden", !isLight));
  $$("#icon-moon").forEach(el => el.classList.toggle("hidden", isLight));
}
function initTheme() {
  const saved = localStorage.getItem("serviro-theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  applyThemeIcons();
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("serviro-theme", next);
  applyThemeIcons();
}

/* ============================================================================
   5. MODAL HELPERS
   ============================================================================ */
function openModal(id) {
  const el = $(id);
  if (!el) return;
  el.classList.remove("hidden");
  el.classList.add("flex");
  document.body.style.overflow = "hidden";
}
function closeModal(id) {
  const el = $(id);
  if (!el) return;
  el.classList.add("hidden");
  el.classList.remove("flex");
  document.body.style.overflow = "";
}

/* ============================================================================
   6. SCROLL REVEAL
   ============================================================================ */
let revealObserver = null;
function initRevealObserver() {
  if (revealObserver) return revealObserver;
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  return revealObserver;
}
function observeReveals(root = document) {
  const obs = initRevealObserver();
  $$(".reveal:not(.reveal-visible), .reveal-scale:not(.reveal-visible)", root).forEach(el => obs.observe(el));
}

/* ============================================================================
   STATE
   ============================================================================ */
const state = {
  selectedRole: "customer",
  authMode: "login",
  currentUser: null,   // { uid, name, email, role }
  customer: {
    providers: [],
    bookings: [],
    reviewedBookingIds: new Set(),
    tab: "discover",
    starSelection: 0
  },
  provider: {
    bookings: [],
    profile: null,
    statusFilter: "All",
    pendingRejectId: null
  },
  admin: {
    users: [], providers: [], bookings: [], reviews: [],
    tab: "users",
    activityFilterUid: null,
    editing: null // {type, id}
  }
};

/* ============================================================================
   7. AUTH
   ============================================================================ */
const app = {

  async init() {
    initTheme();
    observeReveals();
    this.wireStaticButtons();
    await this.seedIfNeeded();
    this.listenAuth();
  },

  wireStaticButtons() {
    // nothing extra needed — buttons use inline onclick, kept for future wiring
  },

  setRole(role) {
    state.selectedRole = role;
    const custBtn = $("role-customer");
    const provBtn = $("role-provider");
    if (custBtn && provBtn) {
      custBtn.classList.toggle("active", role === "customer");
      provBtn.classList.toggle("active", role === "provider");
    }
  },

  setMode(mode) {
    state.authMode = mode;
    const loginTab = $("tab-login");
    const signupTab = $("tab-signup");
    const nameField = $("field-name");
    const confirmField = $("field-confirm");
    const submitText = $("submit-text");
    const authHeading = $("auth-heading");
    const authSub = $("auth-subheading");

    const isLogin = mode === "login";
    if (loginTab && signupTab) {
      loginTab.style.borderColor = isLogin ? "var(--accent)" : "transparent";
      loginTab.style.color = isLogin ? "var(--accent)" : "";
      loginTab.classList.toggle("text-muted", !isLogin);
      signupTab.style.borderColor = !isLogin ? "var(--accent)" : "transparent";
      signupTab.style.color = !isLogin ? "var(--accent)" : "";
      signupTab.classList.toggle("text-muted", isLogin);
    }
    if (nameField) nameField.classList.toggle("hidden", isLogin);
    if (confirmField) confirmField.classList.toggle("hidden", isLogin);
    if (submitText) submitText.textContent = isLogin ? "Sign In" : "Create Account";
    if (authHeading) authHeading.textContent = isLogin ? "Welcome back" : "Create your account";
    if (authSub) authSub.textContent = isLogin ? "Sign in to continue to your workspace." : "Join Serviro in seconds.";
    this.clearAuthError();
  },

  clearAuthError() {
    const err = $("auth-error");
    if (err) { err.classList.add("hidden"); err.textContent = ""; }
  },

  showAuthError(msg) {
    const err = $("auth-error");
    if (err) { err.textContent = msg; err.classList.remove("hidden"); }
  },

  async handleAuth(e) {
    e.preventDefault();
    this.clearAuthError();
    const email = $("auth-email")?.value.trim();
    const password = $("auth-password")?.value;
    const submitBtn = $("submit-btn");

    if (!email || !password) { this.showAuthError("Email & password are required."); return; }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.querySelector("#submit-text").innerHTML = `<span class="spinner"></span>`; }

    try {
      if (state.authMode === "signup") {
        const name = $("auth-name")?.value.trim();
        const confirm = $("auth-confirm")?.value;
        if (!name) throw { message: "Please enter your full name." };
        if (password.length < 6) throw { message: "Password must be at least 6 characters." };
        if (password !== confirm) throw { message: "Passwords do not match." };

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid, name, email, role: state.selectedRole,
          createdAt: serverTimestamp()
        });

        if (state.selectedRole === "provider") {
          await setDoc(doc(db, "providers", cred.user.uid), {
            uid: cred.user.uid, name, email,
            service: "General IT Services", skills: [],
            location: "Remote", experience: 1, price: 20,
            rating: 0, reviewCount: 0, availability: "Available Now",
            about: "New on Serviro — profile in progress.",
            completedProjects: 0, portfolio: [], isSeed: false,
            createdAt: serverTimestamp()
          });
        }
        toast("Your account is ready.", "success", "Welcome to Serviro");
        this.redirectToRole(state.selectedRole);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", cred.user.uid));
        const role = userDoc.exists() ? userDoc.data().role : "customer";
        this.redirectToRole(role);
      }
    } catch (err) {
      this.showAuthError((err.message || "Something went wrong.").replace("Firebase:", "").trim());
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        const st = $("submit-text");
        if (st) st.textContent = state.authMode === "login" ? "Sign In" : "Create Account";
      }
    }
  },

  redirectToRole(role) {
    if (role === "provider") window.location.href = "provider.html";
    else if (role === "admin") window.location.href = "admin.html";
    else window.location.href = "customer.html";
  },

  listenAuth() {
    onAuthStateChanged(auth, async (user) => {
      const page = document.body.dataset.page || "index";

      if (!user) {
        if (page !== "index") window.location.href = "index.html";
        return;
      }

      let role = "customer", name = user.email, userDoc;
      try {
        userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) { role = userDoc.data().role || "customer"; name = userDoc.data().name || name; }
      } catch (e) { /* ignore */ }

      state.currentUser = { uid: user.uid, name, email: user.email, role };

      if (page === "index") { this.redirectToRole(role); return; }

      const expected = { customer: "customer", provider: "provider", admin: "admin" }[role];
      if (expected !== page) { this.redirectToRole(role); return; }

      this.paintUserChrome();

      if (page === "customer") this.loadCustomerDashboard();
      if (page === "provider") this.loadProviderDashboard();
      if (page === "admin") this.loadAdminDashboard();
    });
  },

  paintUserChrome() {
    const { name, email } = state.currentUser;
    $$(".user-name-slot").forEach(el => el.textContent = name);
    $$(".user-email-slot").forEach(el => el.textContent = email);
    $$(".user-avatar-slot").forEach(el => el.src = avatarUrl(name));
    const heroName = $("hero-name");
    if (heroName) heroName.textContent = name.split(" ")[0];
  },

  toggleTheme() { toggleTheme(); },

  toggleMobileMenu() {
    const menu = $("mobile-menu");
    if (menu) menu.classList.toggle("hidden");
  },

  async logout() {
    try { await signOut(auth); } catch (e) { /* ignore */ }
    window.location.href = "index.html";
  },

  openModal(id) { openModal(id); },
  closeModal(id) { closeModal(id); },

  /* ==========================================================================
     8. SEEDING
     ========================================================================== */
  async seedIfNeeded() {
    try {
      const flagRef = doc(db, "system", "seed_status");
      const flagSnap = await getDoc(flagRef);
      if (flagSnap.exists() && flagSnap.data()?.seeded) return;

      // Admin
      await this._upsertSeedAccount(ADMIN_SEED.email, ADMIN_SEED.password, async (uid) => {
        await setDoc(doc(seedDb, "users", uid), {
          uid, name: ADMIN_SEED.name, email: ADMIN_SEED.email, role: "admin",
          createdAt: serverTimestamp()
        }, { merge: true });
      });

      // Providers
      for (const p of DEMO_PROVIDERS) {
        await this._upsertSeedAccount(p.email, p.password, async (uid) => {
          await setDoc(doc(seedDb, "users", uid), {
            uid, name: p.name, email: p.email, role: "provider",
            createdAt: serverTimestamp()
          }, { merge: true });
          await setDoc(doc(seedDb, "providers", uid), {
            uid, name: p.name, email: p.email, service: p.service,
            skills: p.skills, location: p.location, experience: p.experience,
            price: p.price, rating: p.rating, reviewCount: p.reviewCount,
            availability: p.availability, about: p.about,
            completedProjects: p.completedProjects, portfolio: p.portfolio,
            isSeed: true, createdAt: serverTimestamp()
          }, { merge: true });
        });
      }

      try { await signOut(seedAuth); } catch (e) { /* ignore */ }
      await setDoc(flagRef, { seeded: true, seededAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.warn("Serviro seed skipped:", e.message);
    }
  },

  async _upsertSeedAccount(email, password, writeFn) {
    try {
      const cred = await createUserWithEmailAndPassword(seedAuth, email, password);
      await writeFn(cred.user.uid);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        try {
          const cred = await signInWithEmailAndPassword(seedAuth, email, password);
          await writeFn(cred.user.uid);
        } catch (e2) { /* seed account exists with different password — skip */ }
      }
    }
  },

  /* ==========================================================================
     9. CUSTOMER DASHBOARD
     ========================================================================== */
  loadCustomerDashboard() {
    onSnapshot(collection(db, "providers"), (snap) => {
      state.customer.providers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.populateServiceFilter();
      this.filterProviders();
    });

    const uid = state.currentUser.uid;
    onSnapshot(query(collection(db, "bookings"), where("customerId", "==", uid)), (snap) => {
      state.customer.bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0));
      this.renderCustomerStats();
      this.renderMyBookings();
    });

    onSnapshot(query(collection(db, "reviews"), where("customerId", "==", uid)), (snap) => {
      state.customer.reviewedBookingIds = new Set(snap.docs.map(d => d.data().bookingId));
      this.renderMyBookings();
    });

    this.setCustomerTab(state.customer.tab);
  },

  populateServiceFilter() {
    const sel = $("filter-service");
    if (!sel) return;
    const current = sel.value;
    const services = [...new Set(state.customer.providers.map(p => p.service).filter(Boolean))].sort();
    sel.innerHTML = `<option value="">All Services</option>` + services.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
    sel.value = current;
  },

  setCustomerTab(tab) {
    state.customer.tab = tab;
    $("tab-discover")?.classList.toggle("hidden", tab !== "discover");
    $("tab-bookings")?.classList.toggle("hidden", tab !== "bookings");
    $$("[data-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tab));
    $$("[data-mtab]").forEach(btn => {
      const active = btn.dataset.mtab === tab;
      btn.style.background = active ? "var(--accent-soft)" : "";
      btn.style.color = active ? "var(--accent)" : "";
      btn.classList.toggle("text-dim", !active);
    });
    $("mobile-menu")?.classList.add("hidden");
    if (tab === "bookings") this.renderMyBookings();
    observeReveals();
  },

  filterProviders() {
    const term = ($("search-input")?.value || "").toLowerCase().trim();
    const service = $("filter-service")?.value || "";
    const availability = $("filter-availability")?.value || "";
    const sort = $("filter-sort")?.value || "rating";

    let list = state.customer.providers.filter(p => {
      const hay = `${p.name} ${p.service} ${(p.skills || []).join(" ")}`.toLowerCase();
      const matchesTerm = !term || hay.includes(term);
      const matchesService = !service || p.service === service;
      const matchesAvail = !availability || p.availability === availability;
      return matchesTerm && matchesService && matchesAvail;
    });

    list.sort((a, b) => {
      if (sort === "price-low") return (a.price || 0) - (b.price || 0);
      if (sort === "price-high") return (b.price || 0) - (a.price || 0);
      if (sort === "experience") return (b.experience || 0) - (a.experience || 0);
      return (b.rating || 0) - (a.rating || 0);
    });

    $("results-count").textContent = `${list.length} provider${list.length === 1 ? "" : "s"} found`;
    this.renderProviders(list);
  },

  renderProviders(list) {
    const grid = $("providers-grid");
    const empty = $("providers-empty");
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = "";
      empty?.classList.remove("hidden");
      return;
    }
    empty?.classList.add("hidden");

    grid.innerHTML = list.map((p, i) => `
      <div class="card card-glow reveal rounded-2xl p-5 flex flex-col" style="transition-delay:${Math.min(i, 6) * 50}ms">
        <div class="flex items-start gap-3">
          <img src="${avatarUrl(p.name)}" class="w-14 h-14 rounded-xl avatar-ring flex-shrink-0" alt="${escapeHtml(p.name)}">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <h3 class="font-display font-bold text-body truncate">${escapeHtml(p.name)}</h3>
              ${p.isSeed ? `<span class="chip !text-[9px] !py-0.5">Verified</span>` : ""}
            </div>
            <p class="text-xs text-dim truncate">${escapeHtml(p.service || "")}</p>
            <div class="flex items-center gap-1.5 mt-1">
              ${starsHtml(p.rating, "text-xs")}
              <span class="text-[11px] text-muted">${(p.rating || 0).toFixed(1)} (${p.reviewCount || 0})</span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5 mt-3">
          ${(p.skills || []).slice(0, 3).map(s => `<span class="text-[10px] px-2 py-1 rounded-md surface-2 text-dim font-semibold">${escapeHtml(s)}</span>`).join("")}
        </div>

        <div class="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div class="surface-2 rounded-lg px-2.5 py-2">
            <p class="text-muted text-[10px] uppercase font-bold">Experience</p>
            <p class="font-semibold text-body mt-0.5">${p.experience || 0} yrs</p>
          </div>
          <div class="surface-2 rounded-lg px-2.5 py-2">
            <p class="text-muted text-[10px] uppercase font-bold">Rate</p>
            <p class="font-semibold text-body mt-0.5">${money(p.price)}/hr</p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 mt-3 text-xs text-dim">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" class="flex-shrink-0"><path d="M12 21s7-6.5 7-11.5A7 7 0 105 9.5C5 14.5 12 21 12 21z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9.5" r="2.3" stroke="currentColor" stroke-width="1.8"/></svg>
          <span class="truncate">${escapeHtml(p.location || "Remote")}</span>
          <span class="ml-auto badge ${p.availability === 'Busy' ? 'badge-rejected' : 'badge-completed'} !text-[10px] !py-1">
            <span class="badge-dot"></span>${escapeHtml(p.availability || "Available Now")}
          </span>
        </div>

        <div class="flex gap-2 mt-4 pt-4 border-t divider">
          <button onclick="app.openProviderProfile('${p.id}')" class="btn btn-ghost btn-sm flex-1">View Profile</button>
          <button onclick="app.openBookingModal('${p.id}')" class="btn btn-primary btn-sm flex-1">Book Now</button>
        </div>
      </div>
    `).join("");
    observeReveals();
  },

  renderCustomerStats() {
    const bookings = state.customer.bookings;
    $("stat-total").textContent = bookings.length;
    $("stat-progress").textContent = bookings.filter(b => b.status === "In Progress").length;
    $("stat-completed").textContent = bookings.filter(b => b.status === "Completed").length;
    $("stat-pending").textContent = bookings.filter(b => b.status === "Completed" && !state.customer.reviewedBookingIds.has(b.id)).length;
  },

  openProviderProfile(id) {
    const p = state.customer.providers.find(x => x.id === id);
    if (!p) return;
    const content = $("profile-content");

    getDocs(query(collection(db, "reviews"), where("providerId", "==", id))).then(snap => {
      const reviews = snap.docs.map(d => d.data()).sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0));

      content.innerHTML = `
        <div class="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 flex-shrink-0 border-b divider flex items-start justify-between">
          <div class="flex items-start gap-4">
            <img src="${avatarUrl(p.name)}" class="w-20 h-20 rounded-2xl avatar-ring" alt="${escapeHtml(p.name)}">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="font-display font-bold text-xl text-body">${escapeHtml(p.name)}</h2>
                ${p.isSeed ? `<span class="chip">Verified</span>` : ""}
              </div>
              <p class="text-dim text-sm">${escapeHtml(p.service || "")}</p>
              <div class="flex items-center gap-2 mt-1.5">
                ${starsHtml(p.rating)}
                <span class="text-xs text-muted">${(p.rating || 0).toFixed(1)} · ${p.reviewCount || 0} reviews</span>
              </div>
            </div>
          </div>
          <button onclick="app.closeModal('modal-profile')" class="btn btn-ghost btn-icon !rounded-full">✕</button>
        </div>

        <div class="px-6 sm:px-8 py-5 overflow-y-auto no-scrollbar flex-1 min-h-0">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="surface-2 rounded-xl px-3 py-2.5 text-center">
            <p class="font-display font-bold text-body">${p.experience || 0}</p>
            <p class="text-[10px] text-muted uppercase font-bold mt-0.5">Years Exp.</p>
          </div>
          <div class="surface-2 rounded-xl px-3 py-2.5 text-center">
            <p class="font-display font-bold text-body">${money(p.price)}</p>
            <p class="text-[10px] text-muted uppercase font-bold mt-0.5">Per Hour</p>
          </div>
          <div class="surface-2 rounded-xl px-3 py-2.5 text-center">
            <p class="font-display font-bold text-body">${p.completedProjects || 0}</p>
            <p class="text-[10px] text-muted uppercase font-bold mt-0.5">Projects</p>
          </div>
          <div class="surface-2 rounded-xl px-3 py-2.5 text-center">
            <p class="font-display font-bold text-body truncate">${escapeHtml((p.availability || "").split(" ")[0])}</p>
            <p class="text-[10px] text-muted uppercase font-bold mt-0.5">Status</p>
          </div>
        </div>

        <div class="mt-6">
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted mb-2">About</h4>
          <p class="text-sm text-dim leading-relaxed">${escapeHtml(p.about || "No bio provided yet.")}</p>
        </div>

        <div class="mt-5">
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted mb-2">Skills</h4>
          <div class="flex flex-wrap gap-1.5">
            ${(p.skills || []).map(s => `<span class="chip">${escapeHtml(s)}</span>`).join("") || `<span class="text-sm text-muted">Not specified</span>`}
          </div>
        </div>

        <div class="mt-5">
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted mb-2">Location</h4>
          <p class="text-sm text-dim">${escapeHtml(p.location || "Remote")}</p>
        </div>

        ${(p.portfolio && p.portfolio.length) ? `
        <div class="mt-6">
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted mb-2">Portfolio</h4>
          <div class="grid sm:grid-cols-2 gap-3">
            ${p.portfolio.map(item => `
              <div class="surface-2 rounded-xl p-3.5 flex items-center justify-between gap-2">
                <p class="text-sm font-semibold text-body truncate">${escapeHtml(item.title)}</p>
                <button onclick="window.open('${escapeHtml(item.url)}', '_blank', 'noopener')" class="btn btn-outline btn-sm flex-shrink-0">Live ↗</button>
              </div>
            `).join("")}
          </div>
        </div>` : ""}

        <div class="mt-6">
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted mb-2">Reviews (${reviews.length})</h4>
          ${reviews.length ? `
            <div class="space-y-3 max-h-52 overflow-y-auto no-scrollbar pr-1">
              ${reviews.map(r => `
                <div class="surface-2 rounded-xl p-3.5">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-semibold text-body">${escapeHtml(r.customerName || "Customer")}</p>
                    ${starsHtml(r.rating, "text-xs")}
                  </div>
                  <p class="text-xs text-dim mt-1.5 leading-relaxed">${escapeHtml(r.text)}</p>
                </div>
              `).join("")}
            </div>
          ` : `<p class="text-sm text-muted">No reviews yet — be the first to work with ${escapeHtml(p.name.split(" ")[0])}.</p>`}
        </div>
        </div>

        <div class="px-6 sm:px-8 py-5 border-t divider flex-shrink-0">
          <button onclick="app.closeModal('modal-profile'); app.openBookingModal('${p.id}')" class="btn btn-primary btn-block !py-3.5">Book This Provider</button>
        </div>
      `;
      openModal("modal-profile");
      observeReveals(content);
    });
  },

  openBookingModal(providerId) {
    const p = state.customer.providers.find(x => x.id === providerId);
    if (!p) return;
    $("bk-provider-id").value = providerId;
    $("booking-provider-label").textContent = `with ${p.name} — ${p.service}`;
    $("bk-service").value = p.service || "";
    $("booking-form").reset();
    $("bk-provider-id").value = providerId;
    $("bk-service").value = p.service || "";
    $("booking-error").classList.add("hidden");
    const dateInput = $("bk-date");
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];
    closeModal("modal-profile");
    openModal("modal-booking");
  },

  async submitBooking(e) {
    e.preventDefault();
    const errEl = $("booking-error");
    errEl.classList.add("hidden");

    const providerId = $("bk-provider-id").value;
    const provider = state.customer.providers.find(x => x.id === providerId);
    const service = $("bk-service").value.trim();
    const title = $("bk-title").value.trim();
    const date = $("bk-date").value;
    const time = $("bk-time").value;
    const location = $("bk-location").value.trim();
    const budget = Number($("bk-budget").value);
    const description = $("bk-description").value.trim();
    const requirements = $("bk-requirements").value.trim();

    if (!provider || !service || !title || !date || !time || !location || !budget || !description) {
      errEl.textContent = "Please fill in all required fields.";
      errEl.classList.remove("hidden");
      return;
    }
    if (budget <= 0) {
      errEl.textContent = "Budget must be greater than zero.";
      errEl.classList.remove("hidden");
      return;
    }

    const btn = $("booking-submit-btn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Submitting…`;

    try {
      const bookingId = generateBookingId();
      await setDoc(doc(db, "bookings", bookingId), {
        bookingId,
        customerId: state.currentUser.uid,
        customerName: state.currentUser.name,
        customerEmail: state.currentUser.email,
        providerId, providerName: provider.name,
        service, title, date, time, location, budget, description, requirements,
        status: "Pending",
        createdAt: serverTimestamp()
      });

      closeModal("modal-booking");
      $("success-booking-id").textContent = bookingId;
      openModal("modal-success");
      toast("Your provider will respond shortly.", "success", "Booking submitted");
    } catch (err) {
      errEl.textContent = err.message || "Could not submit booking. Please try again.";
      errEl.classList.remove("hidden");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span>Submit Booking Request</span>`;
    }
  },

  closeSuccessModal() {
    closeModal("modal-success");
    this.setCustomerTab("bookings");
  },

  renderMyBookings() {
    if (state.customer.tab !== "bookings") return;
    const bookings = state.customer.bookings;
    const filterBar = $("booking-status-filters");
    const statuses = ["All", "Pending", "Accepted", "In Progress", "Completed", "Rejected"];
    const active = this._customerStatusFilter || "All";
    filterBar.innerHTML = statuses.map(s => `
      <button onclick="app.setCustomerBookingFilter('${s}')" class="filter-chip ${active === s ? "active" : ""}">${s}</button>
    `).join("");

    const filtered = active === "All" ? bookings : bookings.filter(b => b.status === active);
    const grid = $("bookings-grid");
    const empty = $("bookings-empty");

    if (!filtered.length) {
      grid.innerHTML = "";
      empty?.classList.toggle("hidden", bookings.length > 0);
      if (bookings.length > 0) grid.innerHTML = `<p class="text-sm text-muted col-span-2 text-center py-10">No bookings with status "${escapeHtml(active)}".</p>`;
      return;
    }
    empty?.classList.add("hidden");

    grid.innerHTML = filtered.map((b, i) => {
      const reviewed = state.customer.reviewedBookingIds.has(b.id);
      return `
      <div class="card card-glow reveal rounded-2xl p-5" style="transition-delay:${Math.min(i, 6) * 40}ms">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="font-mono text-[11px] text-accent font-semibold">${escapeHtml(b.bookingId)}</p>
            <h3 class="font-display font-bold text-body mt-0.5 truncate">${escapeHtml(b.title)}</h3>
            <p class="text-xs text-dim mt-0.5">with ${escapeHtml(b.providerName)} · ${escapeHtml(b.service)}</p>
          </div>
          ${statusBadge(b.status)}
        </div>

        <div class="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div class="surface-2 rounded-lg px-2.5 py-2"><p class="text-muted text-[10px] uppercase font-bold">Date</p><p class="font-semibold text-body mt-0.5">${formatDateShort(b.date)}</p></div>
          <div class="surface-2 rounded-lg px-2.5 py-2"><p class="text-muted text-[10px] uppercase font-bold">Budget</p><p class="font-semibold text-body mt-0.5">${money(b.budget)}</p></div>
        </div>

        <p class="text-xs text-dim mt-3 line-clamp-2">${escapeHtml(b.description)}</p>

        ${b.status === "Rejected" ? `<div class="mt-4 text-xs px-3 py-2 rounded-lg" style="background:var(--danger-soft); color:var(--danger);">This request was declined by the provider.</div>` : ""}

        ${b.status === "Completed" ? `
          <div class="mt-4 pt-4 border-t divider flex flex-col gap-2">
            ${b.completionNote ? `<p class="text-xs text-dim italic">"${escapeHtml(b.completionNote)}"</p>` : ""}
            <div class="flex gap-2">
              ${b.completionUrl ? `<button onclick="window.open('${escapeHtml(b.completionUrl)}','_blank','noopener')" class="btn btn-primary btn-sm flex-1">Open Live Project ↗</button>` : ""}
              ${reviewed
                ? `<span class="btn btn-ghost btn-sm flex-1 !cursor-default">Reviewed ✓</span>`
                : `<button onclick="app.openReviewModal('${b.id}','${b.providerId}','${escapeHtml(b.providerName).replace(/'/g, "\\'")}')" class="btn btn-outline btn-sm flex-1">Leave Review</button>`}
            </div>
          </div>` : ""}
      </div>`;
    }).join("");
    observeReveals();
  },

  setCustomerBookingFilter(status) {
    this._customerStatusFilter = status;
    this.renderMyBookings();
  },

  openReviewModal(bookingId, providerId, providerName) {
    $("rv-booking-id").value = bookingId;
    $("rv-provider-id").value = providerId;
    $("review-provider-label").textContent = `for ${providerName}`;
    $("review-form").reset();
    $("review-error").classList.add("hidden");
    state.customer.starSelection = 0;
    this.renderStarInput();
    openModal("modal-review");
  },

  renderStarInput() {
    const box = $("star-input");
    if (!box) return;
    box.innerHTML = [1, 2, 3, 4, 5].map(n => `
      <span class="star-btn" onclick="app.setStarRating(${n})" style="color:${n <= state.customer.starSelection ? "var(--warning)" : "var(--border)"}">★</span>
    `).join("");
  },

  setStarRating(n) {
    state.customer.starSelection = n;
    this.renderStarInput();
  },

  async submitReview(e) {
    e.preventDefault();
    const errEl = $("review-error");
    errEl.classList.add("hidden");

    const bookingId = $("rv-booking-id").value;
    const providerId = $("rv-provider-id").value;
    const text = $("rv-text").value.trim();
    const rating = state.customer.starSelection;

    if (!rating) { errEl.textContent = "Please select a star rating."; errEl.classList.remove("hidden"); return; }
    if (!text) { errEl.textContent = "Please write your feedback."; errEl.classList.remove("hidden"); return; }

    try {
      const existing = await getDoc(doc(db, "reviews", bookingId));
      if (existing.exists()) { errEl.textContent = "You've already reviewed this booking."; errEl.classList.remove("hidden"); return; }

      await setDoc(doc(db, "reviews", bookingId), {
        bookingId, providerId,
        customerId: state.currentUser.uid, customerName: state.currentUser.name,
        rating, text, createdAt: serverTimestamp()
      });

      await this._recomputeProviderRating(providerId);
      closeModal("modal-review");
      toast("Thanks for your feedback!", "success", "Review submitted");
    } catch (err) {
      errEl.textContent = err.message || "Could not submit review.";
      errEl.classList.remove("hidden");
    }
  },

  async _recomputeProviderRating(providerId) {
    const snap = await getDocs(query(collection(db, "reviews"), where("providerId", "==", providerId)));
    const reviews = snap.docs.map(d => d.data());
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / count : 0;
    await updateDoc(doc(db, "providers", providerId), {
      rating: Math.round(avg * 10) / 10, reviewCount: count
    }).catch(() => {});
  },

  /* ==========================================================================
     10. PROVIDER DASHBOARD
     ========================================================================== */
  async loadProviderDashboard() {
    const uid = state.currentUser.uid;

    let profileSnap = await getDoc(doc(db, "providers", uid));
    if (!profileSnap.exists()) {
      await setDoc(doc(db, "providers", uid), {
        uid, name: state.currentUser.name, email: state.currentUser.email,
        service: "General IT Services", skills: [], location: "Remote",
        experience: 1, price: 20, rating: 0, reviewCount: 0,
        availability: "Available Now", about: "New on Serviro — profile in progress.",
        completedProjects: 0, portfolio: [], isSeed: false,
        createdAt: serverTimestamp()
      });
    }

    onSnapshot(doc(db, "providers", uid), (snap) => {
      state.provider.profile = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      this.renderProviderBadge();
    });

    onSnapshot(query(collection(db, "bookings"), where("providerId", "==", uid)), (snap) => {
      state.provider.bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0));
      this.renderProviderStats();
      this.renderProviderBookings();
    });
  },

  renderProviderBadge() {
    const el = $("provider-profile-badge");
    const p = state.provider.profile;
    if (!el || !p) return;
    el.classList.remove("hidden");
    el.classList.add("flex");
    el.innerHTML = `
      <img src="${avatarUrl(p.name)}" class="w-8 h-8 rounded-lg avatar-ring">
      <div class="text-left">
        <p class="text-xs font-semibold text-body leading-tight">${escapeHtml(p.service || "")}</p>
        <p class="text-[10px] text-muted leading-tight mt-0.5">${starsHtml(p.rating, "text-[9px]")} ${(p.rating || 0).toFixed(1)} · ${p.reviewCount || 0} reviews</p>
      </div>`;
  },

  renderProviderStats() {
    const b = state.provider.bookings;
    $("stat-pending").textContent = b.filter(x => x.status === "Pending").length;
    $("stat-accepted").textContent = b.filter(x => x.status === "Accepted").length;
    $("stat-progress").textContent = b.filter(x => x.status === "In Progress").length;
    $("stat-completed").textContent = b.filter(x => x.status === "Completed").length;
    $("stat-rejected").textContent = b.filter(x => x.status === "Rejected").length;
  },

  renderProviderBookings() {
    const statuses = ["All", "Pending", "Accepted", "In Progress", "Completed", "Rejected"];
    const active = state.provider.statusFilter;
    $("status-filters").innerHTML = statuses.map(s => `
      <button onclick="app.setProviderStatusFilter('${s}')" class="filter-chip ${active === s ? "active" : ""}">${s}</button>
    `).join("");

    const bookings = state.provider.bookings;
    const filtered = active === "All" ? bookings : bookings.filter(b => b.status === active);
    const grid = $("bookings-grid");
    const empty = $("bookings-empty");

    if (!bookings.length) { grid.innerHTML = ""; empty?.classList.remove("hidden"); return; }
    empty?.classList.add("hidden");

    if (!filtered.length) {
      grid.innerHTML = `<p class="text-sm text-muted col-span-full text-center py-10">No bookings with status "${escapeHtml(active)}".</p>`;
      return;
    }

    grid.innerHTML = filtered.map((b, i) => `
      <div class="card card-glow reveal rounded-2xl p-5" style="transition-delay:${Math.min(i, 6) * 40}ms">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="font-mono text-[11px] text-accent font-semibold">${escapeHtml(b.bookingId)}</p>
            <h3 class="font-display font-bold text-body mt-0.5 truncate">${escapeHtml(b.title)}</h3>
            <p class="text-xs text-dim mt-0.5">${escapeHtml(b.customerName)} · ${escapeHtml(b.customerEmail || "")}</p>
          </div>
          ${statusBadge(b.status)}
        </div>

        <div class="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div class="surface-2 rounded-lg px-2.5 py-2"><p class="text-muted text-[10px] uppercase font-bold">Date &amp; Time</p><p class="font-semibold text-body mt-0.5">${formatDateShort(b.date)} · ${formatTime12(b.time)}</p></div>
          <div class="surface-2 rounded-lg px-2.5 py-2"><p class="text-muted text-[10px] uppercase font-bold">Budget</p><p class="font-semibold text-body mt-0.5">${money(b.budget)}</p></div>
          <div class="surface-2 rounded-lg px-2.5 py-2 col-span-2"><p class="text-muted text-[10px] uppercase font-bold">Location</p><p class="font-semibold text-body mt-0.5 truncate">${escapeHtml(b.location)}</p></div>
        </div>

        <p class="text-xs text-dim mt-3 line-clamp-3">${escapeHtml(b.description)}</p>
        ${b.requirements ? `<p class="text-xs text-muted mt-1.5 italic line-clamp-2">Notes: ${escapeHtml(b.requirements)}</p>` : ""}

        <div class="flex gap-2 mt-4 pt-4 border-t divider">
          ${b.status === "Pending" ? `
            <button onclick="app.acceptBooking('${b.id}')" class="btn btn-success btn-sm flex-1">Accept</button>
            <button onclick="app.openRejectModal('${b.id}')" class="btn btn-danger btn-sm flex-1">Reject</button>
          ` : ""}
          ${b.status === "Accepted" ? `<button onclick="app.startProject('${b.id}')" class="btn btn-secondary btn-sm flex-1">Start Project</button>` : ""}
          ${b.status === "In Progress" ? `<button onclick="app.openCompleteModal('${b.id}')" class="btn btn-success btn-sm flex-1">Complete Project</button>` : ""}
          ${b.status === "Completed" ? `<button onclick="window.open('${escapeHtml(b.completionUrl || "#")}','_blank','noopener')" class="btn btn-ghost btn-sm flex-1">View Delivered URL ↗</button>` : ""}
          ${b.status === "Rejected" ? `<span class="text-xs text-muted py-2">You declined this request.</span>` : ""}
        </div>
      </div>
    `).join("");
    observeReveals();
  },

  setProviderStatusFilter(status) {
    state.provider.statusFilter = status;
    this.renderProviderBookings();
  },

  async acceptBooking(id) {
    try {
      await updateDoc(doc(db, "bookings", id), { status: "Accepted", acceptedAt: serverTimestamp() });
      toast("The customer has been notified.", "success", "Booking accepted");
    } catch (e) { toast(e.message, "error", "Failed"); }
  },

  openRejectModal(id) {
    state.provider.pendingRejectId = id;
    $("confirm-reject-btn").onclick = () => this.rejectBooking(id);
    openModal("modal-reject");
  },

  async rejectBooking(id) {
    try {
      await updateDoc(doc(db, "bookings", id), { status: "Rejected", rejectedAt: serverTimestamp() });
      closeModal("modal-reject");
      toast("The booking has been declined.", "info", "Booking rejected");
    } catch (e) { toast(e.message, "error", "Failed"); }
  },

  async startProject(id) {
    try {
      await updateDoc(doc(db, "bookings", id), { status: "In Progress", startedAt: serverTimestamp() });
      toast("Status moved to In Progress.", "success", "Project started");
    } catch (e) { toast(e.message, "error", "Failed"); }
  },

  openCompleteModal(id) {
    $("cp-booking-id").value = id;
    $("complete-form").reset();
    $("complete-error").classList.add("hidden");
    openModal("modal-complete");
  },

  async submitCompletion(e) {
    e.preventDefault();
    const errEl = $("complete-error");
    errEl.classList.add("hidden");
    const id = $("cp-booking-id").value;
    const url = $("cp-url").value.trim();
    const note = $("cp-note").value.trim();

    if (!isValidHttpUrl(url)) { errEl.textContent = "Please enter a valid http(s) URL."; errEl.classList.remove("hidden"); return; }
    if (!note) { errEl.textContent = "Please add a completion note."; errEl.classList.remove("hidden"); return; }

    try {
      await updateDoc(doc(db, "bookings", id), {
        status: "Completed", completionUrl: url, completionNote: note, completedAt: serverTimestamp()
      });

      const bookingSnap = await getDoc(doc(db, "bookings", id));
      if (bookingSnap.exists()) {
        const providerId = bookingSnap.data().providerId;
        const providerRef = doc(db, "providers", providerId);
        const providerSnap = await getDoc(providerRef);
        if (providerSnap.exists()) {
          await updateDoc(providerRef, { completedProjects: (providerSnap.data().completedProjects || 0) + 1 });
        }
      }

      closeModal("modal-complete");
      toast("The customer can now view the live project.", "success", "Project completed");
    } catch (err) {
      errEl.textContent = err.message || "Could not complete project.";
      errEl.classList.remove("hidden");
    }
  },

  /* ==========================================================================
     11. ADMIN DASHBOARD
     ========================================================================== */
  loadAdminDashboard() {
    onSnapshot(collection(db, "users"), (snap) => {
      state.admin.users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.renderAdminStats();
      if (state.admin.tab === "users") this.renderAdminTab();
    });
    onSnapshot(collection(db, "providers"), (snap) => {
      state.admin.providers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.renderAdminStats();
      if (state.admin.tab === "providers") this.renderAdminTab();
    });
    onSnapshot(collection(db, "bookings"), (snap) => {
      state.admin.bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0));
      this.renderAdminStats();
      if (state.admin.tab === "bookings") this.renderAdminTab();
    });
    onSnapshot(collection(db, "reviews"), (snap) => {
      state.admin.reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0));
      this.renderAdminStats();
      if (state.admin.tab === "reviews") this.renderAdminTab();
    });
    this.setAdminTab("users");
  },

  renderAdminStats() {
    const { users, providers, bookings, reviews } = state.admin;
    $("stat-users").textContent = users.length;
    $("stat-customers").textContent = users.filter(u => u.role === "customer").length;
    $("stat-providers").textContent = providers.length;
    $("stat-bookings").textContent = bookings.length;
    $("stat-reviews").textContent = reviews.length;
    $("stat-b-pending").textContent = bookings.filter(b => b.status === "Pending").length;
    $("stat-b-accepted").textContent = bookings.filter(b => b.status === "Accepted").length;
    $("stat-b-progress").textContent = bookings.filter(b => b.status === "In Progress").length;
    $("stat-b-completed").textContent = bookings.filter(b => b.status === "Completed").length;
    $("stat-b-rejected").textContent = bookings.filter(b => b.status === "Rejected").length;
  },

  setAdminTab(tab) {
    state.admin.tab = tab;
    if (tab !== "bookings") state.admin.activityFilterUid = null;
    $$("[data-admin-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.adminTab === tab));
    this.renderAdminTab();
  },

  viewActivity(uid) {
    state.admin.activityFilterUid = uid;
    this.setAdminTab("bookings");
  },

  renderAdminTab() {
    const tab = state.admin.tab;
    const thead = $("admin-thead");
    const tbody = $("admin-tbody");
    const emptyEl = $("admin-empty");
    const cellCls = "px-4 py-3 align-middle";

    let rows = [];
    let headCols = [];

    if (tab === "users") {
      headCols = ["User", "Role", "Joined", "Actions"];
      rows = state.admin.users.map(u => `
        <tr class="table-row">
          <td class="${cellCls}">
            <div class="flex items-center gap-2.5">
              <img src="${avatarUrl(u.name)}" class="w-8 h-8 rounded-lg avatar-ring">
              <div class="min-w-0"><p class="font-semibold text-body text-sm truncate">${escapeHtml(u.name)}</p><p class="text-[11px] text-muted truncate">${escapeHtml(u.email)}</p></div>
            </div>
          </td>
          <td class="${cellCls}"><span class="badge badge-role-${u.role}">${escapeHtml(u.role)}</span></td>
          <td class="${cellCls} text-dim text-xs">${formatDate(u.createdAt)}</td>
          <td class="${cellCls}">
            <div class="flex gap-1.5">
              <button onclick="app.openEditUser('${u.id}')" class="btn btn-ghost btn-sm">Edit</button>
              ${u.role !== "admin" ? `<button onclick="app.viewActivity('${u.id}')" class="btn btn-ghost btn-sm">Activity</button>` : ""}
            </div>
          </td>
        </tr>`);
    }

    if (tab === "providers") {
      headCols = ["Provider", "Service", "Rate", "Rating", "Availability", "Actions"];
      rows = state.admin.providers.map(p => `
        <tr class="table-row">
          <td class="${cellCls}">
            <div class="flex items-center gap-2.5">
              <img src="${avatarUrl(p.name)}" class="w-8 h-8 rounded-lg avatar-ring">
              <p class="font-semibold text-body text-sm truncate">${escapeHtml(p.name)}</p>
            </div>
          </td>
          <td class="${cellCls} text-dim text-xs">${escapeHtml(p.service || "")}</td>
          <td class="${cellCls} text-body text-xs font-semibold">${money(p.price)}/hr</td>
          <td class="${cellCls} text-xs">${starsHtml(p.rating, "text-xs")} <span class="text-muted">(${p.reviewCount || 0})</span></td>
          <td class="${cellCls}"><span class="badge ${p.availability === 'Busy' ? 'badge-rejected' : 'badge-completed'}"><span class="badge-dot"></span>${escapeHtml(p.availability || "")}</span></td>
          <td class="${cellCls}">
            <div class="flex gap-1.5">
              <button onclick="app.openEditProvider('${p.id}')" class="btn btn-ghost btn-sm">Edit</button>
              <button onclick="app.confirmDelete('providers','${p.id}','provider profile')" class="btn btn-ghost btn-sm" style="color:var(--danger);">Delete</button>
            </div>
          </td>
        </tr>`);
    }

    if (tab === "bookings") {
      let list = state.admin.bookings;
      const uidFilter = state.admin.activityFilterUid;
      if (uidFilter) list = list.filter(b => b.customerId === uidFilter || b.providerId === uidFilter);

      headCols = ["Booking", "Customer", "Provider", "Status", "Budget", "Actions"];
      const filterNote = uidFilter ? `
        <tr><td colspan="6" class="px-4 py-2.5 text-xs" style="background:var(--accent-soft); color:var(--accent);">
          Filtered by activity — <button onclick="app.setAdminTab('bookings')" class="underline font-semibold">clear filter</button>
        </td></tr>` : "";

      rows = [filterNote, ...list.map(b => `
        <tr class="table-row">
          <td class="${cellCls}"><p class="font-mono text-xs text-accent font-semibold">${escapeHtml(b.bookingId)}</p><p class="text-[11px] text-dim mt-0.5 truncate max-w-[160px]">${escapeHtml(b.title)}</p></td>
          <td class="${cellCls} text-dim text-xs">${escapeHtml(b.customerName)}</td>
          <td class="${cellCls} text-dim text-xs">${escapeHtml(b.providerName)}</td>
          <td class="${cellCls}">${statusBadge(b.status)}</td>
          <td class="${cellCls} text-body text-xs font-semibold">${money(b.budget)}</td>
          <td class="${cellCls}">
            <div class="flex gap-1.5">
              <button onclick="app.openEditBooking('${b.id}')" class="btn btn-ghost btn-sm">Manage</button>
              <button onclick="app.confirmDelete('bookings','${b.id}','booking')" class="btn btn-ghost btn-sm" style="color:var(--danger);">Delete</button>
            </div>
          </td>
        </tr>`)];
    }

    if (tab === "reviews") {
      headCols = ["Rating", "Reviewer", "Provider", "Feedback", "Actions"];
      rows = state.admin.reviews.map(r => `
        <tr class="table-row">
          <td class="${cellCls}">${starsHtml(r.rating, "text-xs")}</td>
          <td class="${cellCls} text-dim text-xs">${escapeHtml(r.customerName)}</td>
          <td class="${cellCls} text-dim text-xs">${escapeHtml((state.admin.providers.find(p => p.id === r.providerId) || {}).name || "—")}</td>
          <td class="${cellCls} text-body text-xs max-w-[280px] truncate">${escapeHtml(r.text)}</td>
          <td class="${cellCls}"><button onclick="app.confirmDelete('reviews','${r.id}','review')" class="btn btn-ghost btn-sm" style="color:var(--danger);">Delete</button></td>
        </tr>`);
    }

    thead.innerHTML = `<tr>${headCols.map(h => `<th class="px-4 py-3 font-bold">${h}</th>`).join("")}</tr>`;
    tbody.innerHTML = rows.join("");
    emptyEl.classList.toggle("hidden", rows.filter(r => r).length > 0);
  },

  openEditUser(uid) {
    const u = state.admin.users.find(x => x.id === uid);
    if (!u) return;
    $("edit-content").innerHTML = `
      <div class="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 flex-shrink-0 border-b divider flex items-start justify-between">
        <h3 class="font-display font-bold text-xl text-body">Edit user</h3>
        <button onclick="app.closeModal('modal-edit')" class="btn btn-ghost btn-icon !rounded-full">✕</button>
      </div>
      <form id="edit-user-form" class="flex flex-col flex-1 min-h-0" onsubmit="app.saveEditUser(event,'${uid}')">
        <div class="px-6 sm:px-8 py-5 space-y-4 overflow-y-auto no-scrollbar flex-1 min-h-0">
          <div><label class="label">Full Name</label><input id="eu-name" class="input" value="${escapeHtml(u.name)}" required></div>
          <div><label class="label">Email</label><input class="input" value="${escapeHtml(u.email)}" disabled></div>
          <div><label class="label">Role</label>
            <select id="eu-role" class="input">
              <option value="customer" ${u.role === "customer" ? "selected" : ""}>Customer</option>
              <option value="provider" ${u.role === "provider" ? "selected" : ""}>Provider</option>
              <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
            </select>
          </div>
        </div>
        <div class="px-6 sm:px-8 py-5 border-t divider flex-shrink-0">
          <button type="submit" class="btn btn-primary btn-block !py-3">Save Changes</button>
        </div>
      </form>`;
    openModal("modal-edit");
  },

  async saveEditUser(e, uid) {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "users", uid), {
        name: $("eu-name").value.trim(), role: $("eu-role").value
      });
      closeModal("modal-edit");
      toast("User details updated.", "success", "Saved");
    } catch (err) { toast(err.message, "error", "Failed"); }
  },

  openEditProvider(id) {
    const p = state.admin.providers.find(x => x.id === id);
    if (!p) return;
    $("edit-content").innerHTML = `
      <div class="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 flex-shrink-0 border-b divider flex items-start justify-between">
        <h3 class="font-display font-bold text-xl text-body">Edit provider</h3>
        <button onclick="app.closeModal('modal-edit')" class="btn btn-ghost btn-icon !rounded-full">✕</button>
      </div>
      <form class="flex flex-col flex-1 min-h-0" onsubmit="app.saveEditProvider(event,'${id}')">
        <div class="px-6 sm:px-8 py-5 space-y-4 overflow-y-auto no-scrollbar flex-1 min-h-0">
          <div><label class="label">Name</label><input id="ep-name" class="input" value="${escapeHtml(p.name)}" required></div>
          <div><label class="label">Service</label><input id="ep-service" class="input" value="${escapeHtml(p.service || "")}" required></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Rate (USD/hr)</label><input id="ep-price" type="number" min="1" class="input" value="${p.price || 0}" required></div>
            <div><label class="label">Experience (yrs)</label><input id="ep-experience" type="number" min="0" class="input" value="${p.experience || 0}" required></div>
          </div>
          <div><label class="label">Location</label><input id="ep-location" class="input" value="${escapeHtml(p.location || "")}"></div>
          <div><label class="label">Availability</label>
            <select id="ep-availability" class="input">
              <option value="Available Now" ${p.availability === "Available Now" ? "selected" : ""}>Available Now</option>
              <option value="Busy" ${p.availability === "Busy" ? "selected" : ""}>Busy</option>
            </select>
          </div>
          <div><label class="label">Skills (comma separated)</label><input id="ep-skills" class="input" value="${escapeHtml((p.skills || []).join(", "))}"></div>
          <div><label class="label">About</label><textarea id="ep-about" rows="3" class="input">${escapeHtml(p.about || "")}</textarea></div>
        </div>
        <div class="px-6 sm:px-8 py-5 border-t divider flex-shrink-0">
          <button type="submit" class="btn btn-primary btn-block !py-3">Save Changes</button>
        </div>
      </form>`;
    openModal("modal-edit");
  },

  async saveEditProvider(e, id) {
    e.preventDefault();
    try {
      const skills = $("ep-skills").value.split(",").map(s => s.trim()).filter(Boolean);
      await updateDoc(doc(db, "providers", id), {
        name: $("ep-name").value.trim(),
        service: $("ep-service").value.trim(),
        price: Number($("ep-price").value),
        experience: Number($("ep-experience").value),
        location: $("ep-location").value.trim(),
        availability: $("ep-availability").value,
        skills, about: $("ep-about").value.trim()
      });
      closeModal("modal-edit");
      toast("Provider profile updated.", "success", "Saved");
    } catch (err) { toast(err.message, "error", "Failed"); }
  },

  openEditBooking(id) {
    const b = state.admin.bookings.find(x => x.id === id);
    if (!b) return;
    const statuses = ["Pending", "Accepted", "In Progress", "Completed", "Rejected"];
    $("edit-content").innerHTML = `
      <div class="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 flex-shrink-0 border-b divider flex items-start justify-between">
        <div>
          <h3 class="font-display font-bold text-xl text-body">Manage booking</h3>
          <p class="font-mono text-xs text-accent mt-1">${escapeHtml(b.bookingId)}</p>
        </div>
        <button onclick="app.closeModal('modal-edit')" class="btn btn-ghost btn-icon !rounded-full">✕</button>
      </div>

      <form class="flex flex-col flex-1 min-h-0" onsubmit="app.saveEditBooking(event,'${id}')">
        <div class="px-6 sm:px-8 py-5 overflow-y-auto no-scrollbar flex-1 min-h-0 space-y-4">
          <div class="space-y-2 text-sm">
            <p class="text-body font-semibold">${escapeHtml(b.title)}</p>
            <p class="text-dim text-xs">${escapeHtml(b.customerName)} → ${escapeHtml(b.providerName)} · ${escapeHtml(b.service)}</p>
            <p class="text-dim text-xs">${formatDateShort(b.date)} at ${formatTime12(b.time)} · ${escapeHtml(b.location)} · ${money(b.budget)}</p>
            <p class="text-dim text-xs mt-2">${escapeHtml(b.description)}</p>
            ${b.completionUrl ? `<p class="text-xs mt-2"><span class="text-muted">Delivered URL:</span> <a class="text-accent underline" href="${escapeHtml(b.completionUrl)}" target="_blank" rel="noopener">${escapeHtml(b.completionUrl)}</a></p>` : ""}
          </div>
          <div><label class="label">Status</label>
            <select id="eb-status" class="input">
              ${statuses.map(s => `<option value="${s}" ${b.status === s ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="px-6 sm:px-8 py-5 border-t divider flex-shrink-0">
          <button type="submit" class="btn btn-primary btn-block !py-3">Save Status</button>
        </div>
      </form>`;
    openModal("modal-edit");
  },

  async saveEditBooking(e, id) {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "bookings", id), { status: $("eb-status").value });
      closeModal("modal-edit");
      toast("Booking status updated.", "success", "Saved");
    } catch (err) { toast(err.message, "error", "Failed"); }
  },

  confirmDelete(collectionName, id, label) {
    $("delete-title").textContent = `Delete this ${label}?`;
    $("confirm-delete-btn").onclick = async () => {
      try {
        await deleteDoc(doc(db, collectionName, id));
        closeModal("modal-delete");
        toast(`The ${label} has been removed.`, "success", "Deleted");
      } catch (err) { toast(err.message, "error", "Failed"); }
    };
    openModal("modal-delete");
  }
};

/* ============================================================================
   12. BOOTSTRAP
   ============================================================================ */
window.app = app;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => app.init());
} else {
  app.init();
}
