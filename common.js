/* common.js – GGHS Kagdana shared utilities
   Data sync: reads data.json from GitHub repo root.
   Admin edits via admin panel → downloads data.json → commits to GitHub → all visitors get updates.
*/

// ── Active nav link ──
(function () {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === page || (page === '' && a.getAttribute('href') === 'index.html'))
      a.classList.add('active');
  });
})();

// ── Hamburger menu ──
const ham = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (ham && navLinks) {
  ham.addEventListener('click', () => navLinks.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!ham.contains(e.target) && !navLinks.contains(e.target)) navLinks.classList.remove('open');
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

// ── data.json sync ──
// Fetches data.json committed to the GitHub repo and caches to localStorage.
// All public visitors automatically get the latest data on page load.
async function loadDataJson() {
  try {
    const res = await fetch('data.json?_=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.results)    && data.results.length)    DB.set('results',        data.results);
    if (Array.isArray(data.teachers)   && data.teachers.length)   DB.set('teachers',       data.teachers);
    if (Array.isArray(data.activities) && data.activities.length) DB.set('activities',     data.activities);
    if (Array.isArray(data.gallery)    && data.gallery.length)    DB.set('gallery',        data.gallery);
    if (data.contact && data.contact.email)                       DB.set('school_contact', data.contact);
    if (data.logo)                                                 localStorage.setItem('school_logo', data.logo);
  } catch (_) {
    // Offline or local file – silently use localStorage
  }
}

// ── Grade helpers ──
function getGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  if (pct >= 33) return 'E';
  return 'F';
}
function gradeClass(g) {
  if (g.startsWith('A')) return 'grade-A';
  if (g.startsWith('B')) return 'grade-B';
  if (g.startsWith('C')) return 'grade-C';
  if (g.startsWith('D')) return 'grade-D';
  if (g.startsWith('E')) return 'grade-E';
  return 'grade-F';
}

// ── Contact helpers ──
const DEFAULT_CONTACT = {
  address: 'Village Kagdana, Sirsa, Haryana',
  phone: '', email: 'gghs.kagdana@gmail.com',
  hours: 'Mon \u2013 Sat: 8:00 AM \u2013 2:00 PM'
};
function getContact() { return DB.get('school_contact', DEFAULT_CONTACT); }

// ── Dynamic logo ──
function loadSchoolLogo() {
  const logoData = localStorage.getItem('school_logo');
  document.querySelectorAll('.school-logo').forEach(el => {
    el.innerHTML = logoData
      ? `<img src="${logoData}" style="width:100%;height:100%;object-fit:contain;border-radius:50%;" alt="School Logo" />`
      : '🏫';
  });
}

// ── Dynamic contact info ──
function loadContactInfo() {
  const c = getContact();
  document.querySelectorAll('.topbar-address').forEach(el => el.textContent = '\uD83D\uDCCD ' + c.address);
  document.querySelectorAll('.topbar-contact').forEach(el => {
    const parts = [];
    if (c.phone) parts.push('\uD83D\uDCDE ' + c.phone);
    if (c.email) parts.push('\uD83D\uDCE7 ' + c.email);
    el.textContent = parts.join('  |  ');
  });
  document.querySelectorAll('.footer-address').forEach(el => {
    el.innerHTML = `Govt. Girls High School Kagdana<br>${c.address}`;
  });
  document.querySelectorAll('.footer-contact-info').forEach(el => {
    let h = '';
    if (c.email)   h += `\uD83D\uDCE7 ${c.email}<br>`;
    if (c.phone)   h += `\uD83D\uDCDE ${c.phone}<br>`;
    if (c.address) h += `\uD83D\uDCCD ${c.address.split(',')[0]}<br>`;
    if (c.hours)   h += `\uD83D\uDD50 ${c.hours}`;
    el.innerHTML = h;
  });
}

// ── Ticker ──
function initTicker() {
  const activities = DB.get('activities', []);
  const el = document.getElementById('tickerText');
  if (!el) return;
  el.textContent = activities.length
    ? activities.map(a => '\uD83D\uDCCC ' + a.title + '  \u2022  ').join('  ')
    : '\uD83C\uDF1F Welcome to Govt Girls High School Kagdana, Sirsa \u2022 Nurturing Excellence in Education';
}

// ── Toast notification ──
function toast(msg, type = 'success') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 24px;border-radius:8px;font-family:Nunito,sans-serif;font-weight:700;font-size:.88rem;box-shadow:0 4px 16px rgba(0,0,0,.2);transform:translateY(20px);opacity:0;transition:all .3s;max-width:360px;';
    document.body.appendChild(t);
  }
  const colors = { success:['#d4edda','#155724'], danger:['#f8d7da','#721c24'], info:['#d1ecf1','#0c5460'] };
  const [bg,color] = colors[type] || colors.info;
  t.style.background=bg; t.style.color=color; t.textContent=msg;
  requestAnimationFrame(()=>{ t.style.opacity='1'; t.style.transform='translateY(0)'; });
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(20px)'; }, 3000);
}

// ── Print result card (A4-sized, non-blank) ──
function printResultCard(r) {
  const subs = r.subjects || {};
  let totalMax = 0, totalObt = 0, failedSubjects = 0;
  const subRows = Object.entries(subs).map(([name, v]) => {
    const mx = Number(v.max)||100, ob = Number(v.obt)||0;
    totalMax += mx;
    const pass = ob >= mx * 0.33;
    if (pass) totalObt += ob;
    if (!pass) failedSubjects++;
    const subPct = mx ? ob / mx * 100 : 0;
    const subGrade = getGrade(subPct);
    return `<tr>
      <td>${name}</td>
      <td style="text-align:center">${mx}</td>
      <td style="text-align:center;font-weight:700">${ob}</td>
      <td style="text-align:center;font-weight:700">${subGrade}</td>
      <td style="text-align:center;font-weight:700;color:${pass?'#155724':'#721c24'}">${pass?'Pass':'Fail'}</td>
    </tr>`;
  }).join('');
  const pct = totalMax ? (totalObt/totalMax*100).toFixed(1) : 0;
  const grade = getGrade(Number(pct));
  const isPass = Number(pct) >= 33 && failedSubjects < 1;
  const c = getContact();

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"/>
<title>Result Card \u2013 ${r.name}</title>
<style>
  @page { size:A4 portrait; margin:12mm 14mm 12mm 14mm; }
  *{ box-sizing:border-box; margin:0; padding:0; }
  body{ font-family:'Segoe UI',Arial,sans-serif; font-size:11.5pt; color:#2a1a1a; background:#fff; }
  .page-header{ background:#4a0a12; color:#fff; padding:14px 18px; border-radius:6px 6px 0 0; display:flex; align-items:center; gap:14px; }
  .page-header .logo{ font-size:38pt; line-height:1; }
  .page-header h1{ font-size:14.5pt; font-weight:700; line-height:1.2; }
  .page-header p{ font-size:8.5pt; color:#e8c97e; margin-top:3px; }
  .ribbon{ background:#6b0f1a; color:#e8b84b; padding:6px 18px; font-size:9pt; font-weight:700; letter-spacing:.04em; }
  .section{ padding:12px 18px; border:1px solid #ddd; border-top:none; }
  .sec-title{ font-size:10.5pt; font-weight:800; color:#6b0f1a; border-bottom:2px solid #c9950a; padding-bottom:4px; margin-bottom:10px; }
  .meta-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:7px; }
  .meta-item{ background:#fdf3d7; border-radius:4px; padding:6px 10px; }
  .meta-item .lbl{ font-size:7pt; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#999; }
  .meta-item .val{ font-size:10pt; font-weight:700; margin-top:2px; }
  table{ width:100%; border-collapse:collapse; font-size:11pt; }
  th{ background:#6b0f1a; color:#fff; padding:7px 10px; text-align:left; font-size:9pt; font-weight:700; }
  td{ padding:5px 10px; border-bottom:1px solid #eee; }
  tr:nth-child(even) td{ background:#fafafa; }
  .summary{ display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding:12px 18px; border:1px solid #ddd; border-top:none; }
  .sum-box{ border-radius:5px; padding:10px 6px; text-align:center; background:#fdf3d7; border:1px solid #e8d48b; }
  .sum-box.pass{ background:#d4edda; border-color:#c3e6cb; }
  .sum-box.fail{ background:#f8d7da; border-color:#f5c6cb; }
  .sum-box .num{ font-size:15pt; font-weight:800; color:#4a0a12; line-height:1.1; }
  .sum-box .lbl{ font-size:7pt; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#888; margin-top:3px; }
  .remarks-bar{ padding:8px 18px; border:1px solid #ddd; border-top:none; background:#fffbef; font-size:10pt; }
  .footer-bar{ background:#4a0a12; color:#e8c97e; padding:7px 18px; border-radius:0 0 6px 6px; display:flex; justify-content:space-between; font-size:7.5pt; margin-top:0; }
  .sign-row{ display:grid; grid-template-columns:1fr 1fr; gap:20px; padding:16px 18px 8px; border:1px solid #ddd; border-top:none; }
  .sign-box{ text-align:center; }
  .sign-line{ border-top:1px solid #999; margin-top:32px; padding-top:4px; font-size:8.5pt; color:#666; }
  @media print{
    body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    button{ display:none !important; }
  }
</style>
</head><body>

<div class="page-header">
  <div class="logo">&#127979;</div>
  <div>
    <h1>Govt. Girls High School Kagdana</h1>
    <p>Education Department, Haryana &nbsp;&bull;&nbsp; ${c.address}</p>
    ${c.phone ? `<p style="color:#f0d9a0;margin-top:2px">&#128222; ${c.phone} &nbsp;&bull;&nbsp; &#128231; ${c.email||''}</p>` : ''}
  </div>
</div>
<div class="ribbon">&#128202; Annual Examination &mdash; Result Card</div>

<div class="section">
  <div class="sec-title">Student Information</div>
  <div class="meta-grid">
    <div class="meta-item"><div class="lbl">Student Name</div><div class="val">${r.name}</div></div>
    <div class="meta-item"><div class="lbl">Roll Number</div><div class="val">${r.rollNo}</div></div>
    <div class="meta-item"><div class="lbl">SRN</div><div class="val">${r.srn||'&mdash;'}</div></div>
    <div class="meta-item"><div class="lbl">Class</div><div class="val">Class ${r.class}${r.section?' ('+r.section+')':''}</div></div>
    <div class="meta-item"><div class="lbl">Exam Year</div><div class="val">${r.year||'&mdash;'}</div></div>
    <div class="meta-item"><div class="lbl">Date of Birth</div><div class="val">${r.dob||'&mdash;'}</div></div>
    <div class="meta-item"><div class="lbl">Father&rsquo;s Name</div><div class="val">${r.fatherName||'&mdash;'}</div></div>
    <div class="meta-item"><div class="lbl">Mother&rsquo;s Name</div><div class="val">${r.motherName||'&mdash;'}</div></div>
    <div class="meta-item"><div class="lbl">Class Rank</div><div class="val">${r.position||'&mdash;'}</div></div>
  </div>
</div>

<div class="section" style="padding-top:12px">
  <div class="sec-title">Subject-wise Marks</div>
  <table>
    <thead>
      <tr>
        <th>Subject</th>
        <th style="text-align:center;width:120px">Maximum Marks</th>
        <th style="text-align:center;width:120px">Marks Obtained</th>
        <th style="text-align:center;width:70px">Grade</th>
        <th style="text-align:center;width:80px">Status</th>
      </tr>
    </thead>
    <tbody>${subRows || '<tr><td colspan="5" style="text-align:center;color:#888;padding:16px">No subject data available</td></tr>'}</tbody>
  </table>
</div>

<div class="summary">
  <div class="sum-box"><div class="num">${totalObt}/${totalMax}</div><div class="lbl">Total Marks</div></div>
  <div class="sum-box"><div class="num">${pct}%</div><div class="lbl">Percentage</div></div>
  <div class="sum-box"><div class="num">${grade}</div><div class="lbl">Grade</div></div>
  <div class="sum-box ${isPass?'pass':'fail'}"><div class="num" style="font-size:12pt">${isPass?'PASS':'FAIL'}</div><div class="lbl">Result</div></div>
</div>

${r.remarks ? `<div class="remarks-bar"><strong style="color:#6b0f1a">Remarks:</strong> ${r.remarks}</div>` : ''}

<div class="sign-row">
  <div class="sign-box"><div class="sign-line">Class Teacher&rsquo;s Signature</div></div>
  <div class="sign-box"><div class="sign-line">Principal&rsquo;s Signature &amp; Seal</div></div>
</div>

<div class="footer-bar">
  <span>Govt. Girls High School Kagdana, Sirsa, Haryana &mdash; Affiliated with HBSE, Bhiwani</span>
  <span>Printed: ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</span>
</div>

<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Please allow pop-ups to print the result card.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

// ── WhatsApp result sender ──
function buildWhatsAppMessage(r) {
  const subs = r.subjects || {};
  let totalMax = 0, totalObt = 0, failedSubjects = 0;
  const lines = [];
  Object.entries(subs).forEach(([name, v]) => {
    const mx = Number(v.max)||100, ob = Number(v.obt)||0;
    totalMax += mx;
    const subPass = ob >= mx * 0.33;
    if (subPass) totalObt += ob;
    if (!subPass) failedSubjects++;
    const subPct = mx ? ob / mx * 100 : 0;
    const subGrade = getGrade(subPct);
    lines.push(`  ${name}: ${ob}/${mx}  [${subGrade}] ${subPass?'✅':'❌'}`);
  });
  const pct  = totalMax ? (totalObt/totalMax*100).toFixed(1) : 0;
  const grade = getGrade(Number(pct));
  const pass  = Number(pct) >= 33 && failedSubjects < 2;

  return `*Govt. Girls High School Kagdana, Sirsa*\n` +
    `*Annual Examination Result Card*\n` +
    `─────────────────────────────\n` +
    `*Student:* ${r.name}\n` +
    `*Roll No:* ${r.rollNo}${r.srn ? '  |  *SRN:* ' + r.srn : ''}\n` +
    `*Class:* ${r.class}${r.section?' ('+r.section+')':''}  |  *Year:* ${r.year||'—'}\n` +
    (r.fatherName ? `*Father:* ${r.fatherName}\n` : '') +
    (r.motherName ? `*Mother:* ${r.motherName}\n` : '') +
    (r.dob        ? `*DOB:* ${r.dob}\n` : '') +
    `─────────────────────────────\n` +
    `*Subject-wise Marks:*\n` +
    lines.join('\n') + '\n' +
    `─────────────────────────────\n` +
    `*Total:* ${totalObt}/${totalMax}  |  *Percentage:* ${pct}%\n` +
    `*Grade:* ${grade}  |  *Result:* ${pass ? 'PASS ✅' : 'FAIL ❌'}\n` +
    (r.remarks ? `*Remarks:* ${r.remarks}\n` : '') +
    `─────────────────────────────\n` +
    `_Govt. Girls High School Kagdana_\n` +
    `_Education Dept., Haryana_`;
}

function whatsappResult(r) {
  const mob = (r.mobile || '').replace(/\D/g, '');
  const msg = buildWhatsAppMessage(r);
  const url = `https://wa.me/${mob.length === 10 ? '91' + mob : mob}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ── WhatsApp Bulk Sender — smooth auto-advance modal ──
function whatsappBulk(results) {
  const valid = results.filter(r => r.mobile && r.mobile.replace(/\D/g,'').length >= 10);
  const invalid = results.length - valid.length;

  const old = document.getElementById('waBulkModal');
  if (old) old.remove();

  // ── State ──
  let waIdx = 0;
  let autoMode = false;
  let autoDelay = 20; // seconds
  let countdown = autoDelay;
  let countInterval = null;
  let sentLog = []; // {name, status:'sent'|'skipped'}

  const WA_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

  // ── Build modal HTML ──
  const modal = document.createElement('div');
  modal.id = 'waBulkModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Nunito,sans-serif';

  if (valid.length === 0) {
    modal.innerHTML = `<div style="background:#fff;border-radius:14px;box-shadow:0 8px 48px rgba(0,0,0,.3);width:100%;max-width:480px;overflow:hidden">
      <div style="background:#4a0a12;color:#fff;padding:18px 24px;display:flex;justify-content:space-between;align-items:center">
        <div style="font-weight:800;font-size:1.05rem">💬 Bulk WhatsApp Sender</div>
        <button onclick="document.getElementById('waBulkModal').remove()" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:30px;height:30px;border-radius:50%;font-size:1rem;cursor:pointer">✕</button>
      </div>
      <div style="padding:32px;text-align:center;color:#888">
        <div style="font-size:3rem;margin-bottom:12px">⚠️</div>
        <p style="font-size:.95rem">No students have mobile numbers stored.</p>
        <small>Add a <strong>Mobile</strong> column to your Excel and re-upload.</small>
      </div>
    </div>`;
    document.body.appendChild(modal);
    return;
  }

  modal.innerHTML = `
  <div style="background:#fff;border-radius:14px;box-shadow:0 8px 48px rgba(0,0,0,.35);width:100%;max-width:600px;overflow:hidden;max-height:96vh;display:flex;flex-direction:column">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4a0a12,#6b0f1a);color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0">
      <div>
        <div style="font-weight:800;font-size:1.05rem;display:flex;align-items:center;gap:8px">${WA_ICON} Bulk WhatsApp Sender</div>
        <div style="font-size:.75rem;color:rgba(255,255,255,.65);margin-top:3px" id="waHeaderSub">${valid.length} students ready${invalid ? ' · ' + invalid + ' skipped (no mobile)' : ''}</div>
      </div>
      <button onclick="waBulkClose()" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:30px;height:30px;border-radius:50%;font-size:1rem;cursor:pointer;flex-shrink:0">✕</button>
    </div>

    <!-- Progress bar -->
    <div style="height:5px;background:#f0e8e8;flex-shrink:0">
      <div id="waBulkBar" style="height:100%;background:linear-gradient(90deg,#25D366,#128C7E);width:0%;transition:width .4s ease"></div>
    </div>

    <div style="padding:18px 20px;overflow-y:auto;flex:1">

      <!-- Stats row -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
        <div style="background:#f8f8f8;border-radius:8px;padding:10px;text-align:center">
          <div id="waSentCount" style="font-size:1.4rem;font-weight:800;color:#25D366">0</div>
          <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;color:#aaa;margin-top:1px">Sent</div>
        </div>
        <div style="background:#f8f8f8;border-radius:8px;padding:10px;text-align:center">
          <div id="waSkipCount" style="font-size:1.4rem;font-weight:800;color:#f0ad4e">0</div>
          <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;color:#aaa;margin-top:1px">Skipped</div>
        </div>
        <div style="background:#f8f8f8;border-radius:8px;padding:10px;text-align:center">
          <div id="waRemCount" style="font-size:1.4rem;font-weight:800;color:#4a0a12">${valid.length}</div>
          <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;color:#aaa;margin-top:1px">Remaining</div>
        </div>
        <div style="background:#f8f8f8;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:1.4rem;font-weight:800;color:#888">${valid.length}</div>
          <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;color:#aaa;margin-top:1px">Total</div>
        </div>
      </div>

      <!-- Current student card -->
      <div id="waStudentCard" style="background:linear-gradient(135deg,#fdf3d7,#fef9ec);border-radius:10px;padding:14px 16px;margin-bottom:14px;border-left:4px solid #c9950a;display:flex;align-items:center;gap:12px">
        <div style="background:#c9950a;color:#fff;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1rem;flex-shrink:0" id="waStudentInitial">?</div>
        <div style="flex:1;min-width:0">
          <div id="waStudentName" style="font-weight:800;font-size:.98rem;color:#4a0a12;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>
          <div id="waStudentMeta" style="font-size:.78rem;color:#666;margin-top:2px"></div>
        </div>
        <div id="waResultBadge" style="padding:4px 10px;border-radius:99px;font-size:.72rem;font-weight:800;flex-shrink:0"></div>
      </div>

      <!-- Auto-mode settings -->
      <div style="background:#f0faf4;border-radius:10px;padding:12px 16px;margin-bottom:14px;border:1px solid #b2dfcb">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div>
            <div style="font-weight:800;font-size:.85rem;color:#155724">⚡ Auto-Mode</div>
            <div style="font-size:.72rem;color:#1e7e34;margin-top:2px">Opens WhatsApp & auto-advances. You just press Send each time.</div>
          </div>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <div id="waToggleTrack" onclick="waToggleAuto()" style="width:44px;height:24px;background:#ccc;border-radius:99px;position:relative;cursor:pointer;transition:background .2s;flex-shrink:0">
              <div id="waToggleThumb" style="position:absolute;top:2px;left:2px;width:20px;height:20px;background:#fff;border-radius:50%;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.2)"></div>
            </div>
            <span id="waToggleLabel" style="font-weight:700;font-size:.8rem;color:#155724">OFF</span>
          </label>
        </div>
        <div id="waTimerRow" style="display:none;margin-top:10px;align-items:center;gap:10px;flex-wrap:wrap">
          <span style="font-size:.78rem;font-weight:700;color:#444">Delay between students:</span>
          <div style="display:flex;gap:6px">
            ${[10,15,20,30].map(s => `<button onclick="waSetDelay(${s})" id="waDelay${s}" style="padding:4px 10px;border-radius:6px;border:2px solid ${s===20?'#25D366':'#ddd'};background:${s===20?'#25D366':'#fff'};color:${s===20?'#fff':'#444'};font-weight:700;font-size:.75rem;cursor:pointer;font-family:Nunito,sans-serif">${s}s</button>`).join('')}
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-left:auto">
            <div id="waCountdownRing" style="position:relative;width:36px;height:36px;flex-shrink:0">
              <svg width="36" height="36" style="transform:rotate(-90deg)">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e8e8e8" stroke-width="3"/>
                <circle id="waCountdownArc" cx="18" cy="18" r="15" fill="none" stroke="#25D366" stroke-width="3" stroke-dasharray="94.2" stroke-dashoffset="0" style="transition:stroke-dashoffset 1s linear"/>
              </svg>
              <div id="waCountdownNum" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;color:#155724"></div>
            </div>
            <span style="font-size:.72rem;color:#888">next in</span>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <button id="waSendBtn" onclick="waSendCurrent()" style="flex:1;min-width:140px;background:#25D366;color:#fff;border:none;padding:12px 16px;border-radius:9px;font-weight:800;font-size:.88rem;cursor:pointer;font-family:Nunito,sans-serif;display:flex;align-items:center;justify-content:center;gap:7px;transition:background .2s">
          ${WA_ICON} Open & Send
        </button>
        <button id="waSkipBtn" onclick="waSkipCurrent()" style="background:#fff;color:#444;border:2px solid #ddd;padding:12px 16px;border-radius:9px;font-weight:700;font-size:.85rem;cursor:pointer;font-family:Nunito,sans-serif;transition:all .2s">
          ⏭ Skip
        </button>
        <button id="waPauseBtn" onclick="waPauseResume()" style="display:none;background:#fff;color:#4a0a12;border:2px solid #4a0a12;padding:12px 16px;border-radius:9px;font-weight:700;font-size:.85rem;cursor:pointer;font-family:Nunito,sans-serif">
          ⏸ Pause
        </button>
        <button onclick="waBulkClose()" style="background:#f5f5f5;color:#888;border:none;padding:12px 14px;border-radius:9px;font-weight:700;font-size:.82rem;cursor:pointer;font-family:Nunito,sans-serif">
          ✕
        </button>
      </div>

      <!-- Keyboard hint -->
      <div style="text-align:center;font-size:.7rem;color:#bbb;margin-bottom:10px">
        ⌨️ <strong>Space</strong> = Send &amp; Next &nbsp;·&nbsp; <strong>S</strong> = Skip &nbsp;·&nbsp; <strong>P</strong> = Pause/Resume
      </div>

      <!-- Sent log -->
      <div id="waLog" style="max-height:130px;overflow-y:auto;border-radius:8px;border:1px solid #eee;display:none">
        <div style="padding:8px 12px;font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#aaa;border-bottom:1px solid #eee;background:#fafafa">Activity Log</div>
        <div id="waLogItems" style="font-size:.76rem"></div>
      </div>

    </div>
  </div>`;

  document.body.appendChild(modal);

  // ── Helpers ──
  function getStudentInfo(r) {
    let mx=0, ob=0, failedSubs=0;
    Object.values(r.subjects||{}).forEach(v=>{
      const vm=Number(v.max||100), vo=Number(v.obt||0);
      mx+=vm;
      if(vo < vm*0.33){ failedSubs++; } else { ob+=vo; }
    });
    const pct = mx ? (ob/mx*100).toFixed(1) : 0;
    const pass = Number(pct)>=33 && failedSubs<2;
    return { pct, pass };
  }

  function updateCard() {
    if (waIdx >= valid.length) return;
    const r = valid[waIdx];
    const { pct, pass } = getStudentInfo(r);
    const initial = r.name.trim()[0].toUpperCase();

    document.getElementById('waStudentInitial').textContent = initial;
    document.getElementById('waStudentName').textContent = r.name;
    document.getElementById('waStudentMeta').innerHTML =
      `📋 ${r.rollNo}${r.srn?' · '+r.srn:''} · Class ${r.class} · 📱 ${r.mobile}`;
    const badge = document.getElementById('waResultBadge');
    badge.textContent = pass ? '✅ PASS' : '❌ FAIL';
    badge.style.background = pass ? '#d4edda' : '#f8d7da';
    badge.style.color = pass ? '#155724' : '#721c24';

    const prog = Math.round((waIdx / valid.length) * 100);
    document.getElementById('waBulkBar').style.width = prog + '%';
    document.getElementById('waHeaderSub').textContent =
      `Student ${waIdx+1} of ${valid.length}${invalid ? ' · '+invalid+' no mobile' : ''}`;
    document.getElementById('waSentCount').textContent = sentLog.filter(x=>x.status==='sent').length;
    document.getElementById('waSkipCount').textContent = sentLog.filter(x=>x.status==='skipped').length;
    document.getElementById('waRemCount').textContent = valid.length - waIdx;

    const log = document.getElementById('waLog');
    if (sentLog.length > 0) log.style.display = 'block';
  }

  function addLog(r, status) {
    sentLog.push({ name: r.name, status });
    const items = document.getElementById('waLogItems');
    const row = document.createElement('div');
    row.style.cssText = 'padding:6px 12px;border-bottom:1px solid #f5f5f5;display:flex;align-items:center;gap:8px';
    row.innerHTML = `<span style="font-size:.85rem">${status==='sent'?'✅':'⏭'}</span>
      <span style="flex:1;color:#333">${r.name}</span>
      <span style="color:#aaa;font-size:.68rem">${status==='sent'?'Opened':'Skipped'}</span>`;
    items.appendChild(row);
    items.parentElement.scrollTop = items.parentElement.scrollHeight;
    document.getElementById('waSentCount').textContent = sentLog.filter(x=>x.status==='sent').length;
    document.getElementById('waSkipCount').textContent = sentLog.filter(x=>x.status==='skipped').length;
    document.getElementById('waLog').style.display = 'block';
  }

  function stopCountdown() {
    if (countInterval) { clearInterval(countInterval); countInterval = null; }
    document.getElementById('waTimerRow').style.display = 'none';
    document.getElementById('waPauseBtn').style.display = 'none';
  }

  function startCountdown() {
    countdown = autoDelay;
    const arc = document.getElementById('waCountdownArc');
    const num = document.getElementById('waCountdownNum');
    const circumference = 94.2;
    document.getElementById('waTimerRow').style.display = 'flex';
    document.getElementById('waPauseBtn').style.display = '';

    function tick() {
      num.textContent = countdown;
      arc.style.strokeDashoffset = circumference * (1 - countdown / autoDelay);
      if (countdown <= 0) {
        clearInterval(countInterval); countInterval = null;
        waSendAndAdvance();
      } else {
        countdown--;
      }
    }
    tick();
    countInterval = setInterval(tick, 1000);
  }

  function advance() {
    waIdx++;
    if (waIdx >= valid.length) {
      // All done
      stopCountdown();
      document.getElementById('waStudentCard').innerHTML =
        `<div style="text-align:center;width:100%;padding:12px 0">
          <div style="font-size:2.2rem">🎉</div>
          <div style="font-weight:800;color:#155724;font-size:1rem;margin-top:6px">All done!</div>
          <div style="font-size:.8rem;color:#888;margin-top:4px">${sentLog.filter(x=>x.status==='sent').length} sent · ${sentLog.filter(x=>x.status==='skipped').length} skipped</div>
        </div>`;
      document.getElementById('waBulkBar').style.width = '100%';
      document.getElementById('waSendBtn').disabled = true;
      document.getElementById('waSendBtn').style.opacity = '.4';
      document.getElementById('waSkipBtn').disabled = true;
      document.getElementById('waSkipBtn').style.opacity = '.4';
      document.getElementById('waRemCount').textContent = '0';
      document.getElementById('waHeaderSub').textContent = 'All students covered!';
      return;
    }
    updateCard();
    if (autoMode) startCountdown();
  }

  // ── Global action functions ──
  window.waSendCurrent = function() {
    if (waIdx >= valid.length) return;
    const r = valid[waIdx];
    const mob = (r.mobile || '').replace(/\D/g, '');
    const msg = buildWhatsAppMessage(r);
    const url = 'https://web.whatsapp.com/send?phone=' + (mob.length===10?'91'+mob:mob) + '&text=' + encodeURIComponent(msg);
    window.open(url, '_blank');
    addLog(r, 'sent');
    if (autoMode) { stopCountdown(); startCountdown(); } else { advance(); }
  };

  window.waSendAndAdvance = function() {
    advance();
    if (waIdx < valid.length) {
      const r = valid[waIdx];
      const mob = (r.mobile || '').replace(/\D/g, '');
      const msg = buildWhatsAppMessage(r);
      const url = 'https://web.whatsapp.com/send?phone=' + (mob.length===10?'91'+mob:mob) + '&text=' + encodeURIComponent(msg);
      window.open(url, '_blank');
      addLog(r, 'sent');
    }
  };

  window.waSkipCurrent = function() {
    if (waIdx >= valid.length) return;
    addLog(valid[waIdx], 'skipped');
    if (autoMode) stopCountdown();
    advance();
  };

  window.waToggleAuto = function() {
    autoMode = !autoMode;
    const track = document.getElementById('waToggleTrack');
    const thumb = document.getElementById('waToggleThumb');
    const label = document.getElementById('waToggleLabel');
    const pauseBtn = document.getElementById('waPauseBtn');
    track.style.background = autoMode ? '#25D366' : '#ccc';
    thumb.style.left = autoMode ? '22px' : '2px';
    label.textContent = autoMode ? 'ON' : 'OFF';
    if (autoMode) {
      startCountdown();
    } else {
      stopCountdown();
      pauseBtn.style.display = 'none';
    }
  };

  window.waSetDelay = function(s) {
    autoDelay = s;
    [10,15,20,30].forEach(x => {
      const b = document.getElementById('waDelay'+x);
      if (b) {
        b.style.borderColor = x===s ? '#25D366' : '#ddd';
        b.style.background = x===s ? '#25D366' : '#fff';
        b.style.color = x===s ? '#fff' : '#444';
      }
    });
    if (autoMode) { stopCountdown(); startCountdown(); }
  };

  window.waPauseResume = function() {
    const btn = document.getElementById('waPauseBtn');
    if (countInterval) {
      clearInterval(countInterval); countInterval = null;
      btn.textContent = '▶ Resume';
      btn.style.color = '#25D366';
      btn.style.borderColor = '#25D366';
    } else {
      btn.textContent = '⏸ Pause';
      btn.style.color = '#4a0a12';
      btn.style.borderColor = '#4a0a12';
      startCountdown();
    }
  };

  window.waBulkClose = function() {
    stopCountdown();
    document.removeEventListener('keydown', waKeyHandler);
    const m = document.getElementById('waBulkModal');
    if (m) m.remove();
  };

  // Keyboard shortcuts
  function waKeyHandler(e) {
    if (!document.getElementById('waBulkModal')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); window.waSendCurrent(); }
    if (e.key.toLowerCase() === 's') window.waSkipCurrent();
    if (e.key.toLowerCase() === 'p') window.waPauseResume();
  }
  document.addEventListener('keydown', waKeyHandler);

  updateCard();
}

// ── DOMContentLoaded init ──
document.addEventListener('DOMContentLoaded', async () => {
  await loadDataJson();
  initTicker();
  loadSchoolLogo();
  loadContactInfo();
});
