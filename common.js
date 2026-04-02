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
  return 'F';
}
function gradeClass(g) {
  if (g.startsWith('A')) return 'grade-A';
  if (g.startsWith('B')) return 'grade-B';
  if (g.startsWith('C')) return 'grade-C';
  if (g.startsWith('D')) return 'grade-D';
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
  let totalMax = 0, totalObt = 0;
  const subRows = Object.entries(subs).map(([name, v]) => {
    const mx = Number(v.max)||100, ob = Number(v.obt)||0;
    totalMax += mx; totalObt += ob;
    const pass = ob >= mx * 0.33;
    return `<tr>
      <td>${name}</td>
      <td style="text-align:center">${mx}</td>
      <td style="text-align:center;font-weight:700">${ob}</td>
      <td style="text-align:center;font-weight:700;color:${pass?'#155724':'#721c24'}">${pass?'Pass':'Fail'}</td>
    </tr>`;
  }).join('');
  const pct = totalMax ? (totalObt/totalMax*100).toFixed(1) : 0;
  const grade = getGrade(Number(pct));
  const isPass = Number(pct) >= 33;
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
        <th style="text-align:center;width:140px">Marks Obtained</th>
        <th style="text-align:center;width:80px">Status</th>
      </tr>
    </thead>
    <tbody>${subRows || '<tr><td colspan="4" style="text-align:center;color:#888;padding:16px">No subject data available</td></tr>'}</tbody>
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
  let totalMax = 0, totalObt = 0;
  const lines = [];
  Object.entries(subs).forEach(([name, v]) => {
    const mx = Number(v.max)||100, ob = Number(v.obt)||0;
    totalMax += mx; totalObt += ob;
    lines.push(`  ${name}: ${ob}/${mx}`);
  });
  const pct  = totalMax ? (totalObt/totalMax*100).toFixed(1) : 0;
  const grade = getGrade(Number(pct));
  const pass  = Number(pct) >= 33;

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

// ── WhatsApp Bulk Sender — opens a guided modal ──
function whatsappBulk(results) {
  const valid = results.filter(r => r.mobile && r.mobile.replace(/\D/g,'').length >= 10);
  const invalid = results.length - valid.length;

  // Remove existing modal if any
  const old = document.getElementById('waBulkModal');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'waBulkModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Nunito,sans-serif';

  modal.innerHTML = `
    <div style="background:#fff;border-radius:12px;box-shadow:0 8px 48px rgba(0,0,0,.3);width:100%;max-width:560px;overflow:hidden">
      <div style="background:#4a0a12;color:#fff;padding:18px 24px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:800;font-size:1.1rem">💬 Send Results via WhatsApp</div>
          <div style="font-size:.78rem;color:rgba(255,255,255,.7);margin-top:2px">${valid.length} students with mobile numbers${invalid?' · '+invalid+' skipped (no mobile)':''}</div>
        </div>
        <button onclick="document.getElementById('waBulkModal').remove()" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:32px;height:32px;border-radius:50%;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
      </div>
      <div style="padding:20px 24px">
        ${valid.length === 0 ? `<div style="text-align:center;padding:24px;color:#888"><div style="font-size:2.5rem;margin-bottom:8px">⚠️</div><p>No students have mobile numbers stored.<br><small>Add <strong>Mobile</strong> column to your Excel file and re-upload.</small></p></div>` : `
        <div style="background:#d4edda;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:.85rem;color:#155724">
          <strong>How it works:</strong> Click <em>"Open WhatsApp"</em> for each student. WhatsApp Web/App opens with the result pre-filled — just tap Send. Click <em>"Next →"</em> to continue.
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-weight:700;color:#4a0a12">Student <span id="waIdx">1</span> of ${valid.length}</div>
          <div style="background:#f0f0f4;border-radius:99px;height:8px;flex:1;margin:0 14px;overflow:hidden"><div id="waProgress" style="height:100%;background:#c9950a;border-radius:99px;transition:width .3s;width:${valid.length?Math.round(1/valid.length*100):0}%"></div></div>
          <span id="waPct" style="font-size:.78rem;color:#888;white-space:nowrap">${valid.length?Math.round(1/valid.length*100):0}%</span>
        </div>
        <div id="waStudentCard" style="background:#fdf3d7;border-radius:8px;padding:14px 18px;margin-bottom:16px;border-left:4px solid #c9950a">
          <div id="waStudentName" style="font-weight:800;font-size:1rem;color:#4a0a12"></div>
          <div id="waStudentMeta" style="font-size:.82rem;color:#666;margin-top:3px"></div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button id="waOpenBtn" onclick="waOpenCurrent()" style="flex:1;background:#25D366;color:#fff;border:none;padding:11px 18px;border-radius:8px;font-weight:800;font-size:.9rem;cursor:pointer;font-family:Nunito,sans-serif;display:flex;align-items:center;justify-content:center;gap:8px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Open WhatsApp
          </button>
          <button id="waNextBtn" onclick="waNext()" style="background:#4a0a12;color:#fff;border:none;padding:11px 18px;border-radius:8px;font-weight:800;font-size:.9rem;cursor:pointer;font-family:Nunito,sans-serif">Next →</button>
          <button onclick="document.getElementById('waBulkModal').remove()" style="background:#f0f0f4;color:#444;border:none;padding:11px 14px;border-radius:8px;font-weight:700;font-size:.82rem;cursor:pointer;font-family:Nunito,sans-serif">✕ Close</button>
        </div>
        <div style="margin-top:12px;text-align:center;font-size:.75rem;color:#aaa" id="waSkipInfo"></div>
        `}
      </div>
    </div>`;

  document.body.appendChild(modal);

  if (valid.length === 0) return;

  let idx = 0;
  window._waBulkList = valid;
  window._waIdx = 0;

  function updateCard() {
    const r = window._waBulkList[window._waIdx];
    let mx=0,ob=0; Object.values(r.subjects||{}).forEach(v=>{mx+=Number(v.max||100);ob+=Number(v.obt||0);});
    const pct = mx?(ob/mx*100).toFixed(1):0;
    const pass = Number(pct)>=33;
    document.getElementById('waIdx').textContent = window._waIdx + 1;
    document.getElementById('waProgress').style.width = Math.round((window._waIdx+1)/valid.length*100) + '%';
    document.getElementById('waPct').textContent = Math.round((window._waIdx+1)/valid.length*100) + '%';
    document.getElementById('waStudentName').textContent = r.name;
    document.getElementById('waStudentMeta').innerHTML =
      `Roll: ${r.rollNo}${r.srn?' | SRN: '+r.srn:''} | Class ${r.class} | 📱 ${r.mobile} | ${pct}% — <strong style="color:${pass?'#155724':'#721c24'}">${pass?'PASS':'FAIL'}</strong>`;
    const isLast = window._waIdx >= valid.length - 1;
    document.getElementById('waNextBtn').textContent = isLast ? '✅ Done' : 'Next →';
    document.getElementById('waSkipInfo').textContent = isLast ? 'All students covered!' : `${valid.length - window._waIdx - 1} remaining`;
  }

  window.waOpenCurrent = function() {
    whatsappResult(window._waBulkList[window._waIdx]);
  };

  window.waNext = function() {
    if (window._waIdx >= valid.length - 1) {
      document.getElementById('waBulkModal').remove();
      return;
    }
    window._waIdx++;
    updateCard();
  };

  updateCard();
}

// ── DOMContentLoaded init ──
document.addEventListener('DOMContentLoaded', async () => {
  await loadDataJson();
  initTicker();
  loadSchoolLogo();
  loadContactInfo();
});
