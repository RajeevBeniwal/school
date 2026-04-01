/* common.js – GGHS Kagdana shared utilities */

// ── Active nav link ──
(function () {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

// ── Hamburger menu ──
const ham = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (ham && navLinks) {
  ham.addEventListener('click', () => navLinks.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!ham.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
    }
  });
}

// ── Storage helpers ──
const DB = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
  }
};

// ── Grade helper ──
function getGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}
function gradeClass(g) {
  if (g.startsWith('A')) return 'grade-A';
  if (g.startsWith('B')) return 'grade-B';
  if (g.startsWith('C')) return 'grade-C';
  if (g.startsWith('D')) return 'grade-D';
  return 'grade-F';
}

// ── Default contact info ──
const DEFAULT_CONTACT = {
  address: 'Village Kagdana, Tehsil Dabwali, Sirsa, Haryana – 125104',
  phone: '',
  email: 'gghs.kagdana@gmail.com',
  hours: 'Mon – Sat: 8:00 AM – 2:00 PM'
};

function getContact() {
  return DB.get('school_contact', DEFAULT_CONTACT);
}

// ── Load school logo dynamically ──
function loadSchoolLogo() {
  const logoData = localStorage.getItem('school_logo');
  document.querySelectorAll('.school-logo').forEach(el => {
    if (logoData) {
      el.innerHTML = `<img src="${logoData}" style="width:100%;height:100%;object-fit:contain;border-radius:50%;" alt="School Logo" />`;
    } else {
      if (!el.innerHTML.trim()) el.innerHTML = '🏫';
    }
  });
}

// ── Load contact details into topbar/footer ──
function loadContactInfo() {
  const c = getContact();
  document.querySelectorAll('.topbar-address').forEach(el => {
    el.textContent = '📍 ' + c.address;
  });
  document.querySelectorAll('.topbar-contact').forEach(el => {
    const parts = [];
    if (c.phone) parts.push('📞 ' + c.phone);
    if (c.email) parts.push('📧 ' + c.email);
    el.textContent = parts.join(' | ');
  });
  document.querySelectorAll('.footer-address').forEach(el => {
    el.innerHTML = `Govt. Girls High School Kagdana<br>${c.address}`;
  });
  document.querySelectorAll('.footer-contact-info').forEach(el => {
    let html = '';
    if (c.email) html += `📧 ${c.email}<br>`;
    if (c.phone) html += `📞 ${c.phone}<br>`;
    if (c.address) html += `📍 ${c.address.split(',')[0]}<br>`;
    if (c.hours) html += `🕐 ${c.hours}`;
    el.innerHTML = html;
  });
}

// ── Ticker init ──
function initTicker() {
  const activities = DB.get('activities', []);
  const el = document.getElementById('tickerText');
  if (!el) return;
  if (!activities.length) { el.textContent = '🌟 Welcome to Govt Girls High School Kagdana, Sirsa • Nurturing Excellence in Education'; return; }
  el.textContent = activities.map(a => `📌 ${a.title}  •  `).join('  ');
}

// ── Toast notification ──
function toast(msg, type = 'success') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 24px;border-radius:8px;font-family:Nunito,sans-serif;font-weight:700;font-size:.88rem;box-shadow:0 4px 16px rgba(0,0,0,.2);transform:translateY(20px);opacity:0;transition:all .3s;max-width:360px;';
    document.body.appendChild(t);
  }
  const colors = { success: ['#d4edda','#155724'], danger: ['#f8d7da','#721c24'], info: ['#d1ecf1','#0c5460'] };
  const [bg, color] = colors[type] || colors.info;
  t.style.background = bg; t.style.color = color;
  t.textContent = msg;
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(20px)'; }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  initTicker();
  loadSchoolLogo();
  loadContactInfo();
});
