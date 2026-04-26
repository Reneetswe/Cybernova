// CyberNova Analytics - Backend Integration
// This file connects the existing HTML UI to the FastAPI backend

// API Base URL - automatically uses production URL when deployed
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:8000/api'
  : 'https://cybernova-3rvx.onrender.com/api';

// ============================================
// API HELPER FUNCTIONS
// ============================================

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============================================
// NAVIGATION (Keep existing function)
// ============================================

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
  
  // Hide main nav when on dashboard or feedback page, show otherwise
  const mainNav = document.querySelector('body > nav');
  if (mainNav) {
    mainNav.style.display = (id === 'dashboard' || id === 'feedback') ? 'none' : 'flex';
  }
  
  if (id === 'dashboard') {
    if (!localStorage.getItem('authToken')) {
      showPage('login');
      showToast('Please login to access dashboard', 'error');
      return;
    }
    loadDashboard();
  }
  
  if (id === 'events') {
    loadWebinars();
  }
}

// ============================================
// ADMIN DASHBOARD NAVIGATION
// ============================================

function showAdminPage(pageId) {
  // Hide all sub-pages
  document.querySelectorAll('.admin-sub-page').forEach(p => p.classList.remove('active'));
  // Show target
  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');
  
  // Update sidebar active state
  document.querySelectorAll('.admin-sidebar-nav a').forEach(a => a.classList.remove('active'));
  const clickedLink = document.querySelector(`.admin-sidebar-nav a[onclick*="${pageId}"]`);
  if (clickedLink) clickedLink.classList.add('active');
  
  // Scroll content to top
  const content = document.querySelector('.admin-content');
  if (content) content.scrollTo(0, 0);
  
  // Render charts if switching to pages that need them
  if (pageId === 'admin-overview') {
    renderAdminDashboard();
  } else if (pageId === 'admin-analytics') {
    renderAnalyticsCharts();
  } else if (pageId === 'admin-satisfaction') {
    loadSatisfactionData();
  }
}

function toggleAdminSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const main = document.querySelector('.admin-main');
  if (sidebar.style.transform === 'translateX(-100%)') {
    sidebar.style.transform = 'translateX(0)';
    main.style.marginLeft = '180px';
  } else {
    sidebar.style.transform = 'translateX(-100%)';
    main.style.marginLeft = '0';
  }
}

function adminLogout() {
  localStorage.removeItem('authToken');
  showPage('home');
  showToast('Logged out successfully');
}

function showSettingsTab(el) {
  document.querySelectorAll('.settings-tabs a').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
}

function exportCSV() {
  showToast('Exporting CSV... Download will start shortly.');
}

// ============================================
// ADMIN DASHBOARD CHART RENDERERS
// ============================================

function renderAdminDashboard() {
  // Bar chart
  const months = ['Jan','Feb','Mar','Apr','May','Jun'];
  const vals = [95, 105, 80, 115, 210, 150];
  const maxV = Math.max(...vals);
  const barChart = document.getElementById('barChart');
  if (barChart) {
    barChart.innerHTML = vals.map((v,i) => `
      <div class="admin-bar-group">
        <div class="admin-bar" style="height:${(v/maxV)*170}px;background:#9ca3af" title="${months[i]}: ${v}"></div>
        <div class="admin-bar-label">${months[i]}</div>
      </div>`).join('');
  }

  // Pie chart - Requests by Status
  const statuses = [
    {label:'Pending',pct:40,color:'#6b7280'},
    {label:'Reviewed',pct:25,color:'#9ca3af'},
    {label:'In Progress',pct:20,color:'#d1d5db'},
    {label:'Completed',pct:15,color:'#e5e7eb'},
  ];
  let cumAngle = 0;
  const paths = statuses.map(d => {
    const angle = (d.pct / 100) * 360;
    const start = polarToXY(50, 50, 45, cumAngle);
    cumAngle += angle;
    const end = polarToXY(50, 50, 45, cumAngle);
    const large = angle > 180 ? 1 : 0;
    return `<path d="M50,50 L${start.x},${start.y} A45,45 0 ${large},1 ${end.x},${end.y} Z" fill="${d.color}" stroke="#fff" stroke-width="1.5"/>`;
  });
  const pieChart = document.getElementById('pieChart');
  if (pieChart) pieChart.innerHTML = paths.join('');
  const pieLegend = document.getElementById('pieLegend');
  if (pieLegend) pieLegend.innerHTML = statuses.map(d =>
    `<div class="admin-legend-item"><div class="admin-legend-dot" style="background:${d.color}"></div><span>${d.label} (${d.pct}%)</span></div>`
  ).join('');
}

function renderAnalyticsCharts() {
  // Helper to render a line chart in an SVG
  function drawLineChart(svgId, data, labels, color) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const w = 500, h = 180, pad = 40, padR = 20, padB = 30;
    const maxV = Math.max(...data);
    const xFn = (i) => pad + (i / (data.length - 1)) * (w - pad - padR);
    const yFn = (v) => h - padB - ((v / maxV) * (h - pad - padB));
    
    let s = '';
    // Grid lines + Y labels
    for (let n = 0; n <= 4; n++) {
      const val = Math.round(maxV * n / 4);
      const yv = yFn(val);
      s += `<line x1="${pad}" y1="${yv}" x2="${w-padR}" y2="${yv}" stroke="#e5e7eb" stroke-width="1"/>`;
      s += `<text x="${pad-8}" y="${yv+4}" text-anchor="end" fill="#9ca3af" font-size="10">${val}</text>`;
    }
    // Area fill
    const pts = data.map((v,i) => `${xFn(i)},${yFn(v)}`).join(' ');
    s += `<polygon points="${xFn(0)},${h-padB} ${pts} ${xFn(data.length-1)},${h-padB}" fill="rgba(156,163,175,0.08)"/>`;
    // Line
    s += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    // Dots
    s += data.map((v,i) => `<circle cx="${xFn(i)}" cy="${yFn(v)}" r="3.5" fill="${color}" stroke="#fff" stroke-width="1.5"/>`).join('');
    // X labels
    s += labels.map((l,i) => `<text x="${xFn(i)}" y="${h-8}" text-anchor="middle" fill="#9ca3af" font-size="10">${l}</text>`).join('');
    svg.innerHTML = s;
  }

  // Service Requests line chart
  drawLineChart('analyticsLineChart1', [8,12,18,22,15,25,28], ['20 Apr','27 Apr','04 May','11 May','18 May','',''], '#374151');
  // Webinar Registrations line chart
  drawLineChart('analyticsLineChart2', [5,10,8,15,20,18,25], ['20 Apr','27 Apr','04 May','11 May','18 May','',''], '#374151');

  // Helper for donut chart (ring, not filled)
  function drawDonut(svgId, legendId, data) {
    const svg = document.getElementById(svgId);
    const legend = document.getElementById(legendId);
    if (!svg) return;
    let cumAngle = 0;
    const innerR = 28, outerR = 45;
    const paths = data.map(d => {
      const angle = (d.pct / 100) * 360;
      const s1 = polarToXY(50,50,outerR,cumAngle);
      const s2 = polarToXY(50,50,innerR,cumAngle);
      cumAngle += angle;
      const e1 = polarToXY(50,50,outerR,cumAngle);
      const e2 = polarToXY(50,50,innerR,cumAngle);
      const large = angle > 180 ? 1 : 0;
      return `<path d="M${s1.x},${s1.y} A${outerR},${outerR} 0 ${large},1 ${e1.x},${e1.y} L${e2.x},${e2.y} A${innerR},${innerR} 0 ${large},0 ${s2.x},${s2.y} Z" fill="${d.color}" stroke="#fff" stroke-width="1"/>`;
    });
    svg.innerHTML = paths.join('');
    if (legend) legend.innerHTML = data.map(d =>
      `<div class="admin-legend-item"><div class="admin-legend-dot" style="background:${d.color}"></div><span>${d.label} ${d.count ? d.count+' ('+d.pct+'%)' : d.pct+'%'}</span></div>`
    ).join('');
  }

  // Status donut
  drawDonut('analyticsStatusPie', 'analyticsStatusLegend', [
    {label:'Completed',pct:48.4,count:62,color:'#374151'},
    {label:'In Progress',pct:26.6,count:34,color:'#6b7280'},
    {label:'Pending',pct:16.4,count:21,color:'#9ca3af'},
    {label:'Cancelled',pct:8.6,count:11,color:'#d1d5db'},
  ]);

  // Industry donut
  drawDonut('analyticsIndustryPie', 'analyticsIndustryLegend', [
    {label:'Technology',pct:28,count:28,color:'#374151'},
    {label:'Finance',pct:22,count:22,color:'#6b7280'},
    {label:'Healthcare',pct:16,count:16,color:'#9ca3af'},
    {label:'Education',pct:12,count:12,color:'#d1d5db'},
    {label:'Other',pct:22,count:22,color:'#e5e7eb'},
  ]);

  // Country horizontal bar chart
  const countries = [
    {c:'South Africa',n:41},{c:'United States',n:23},{c:'United Kingdom',n:18},{c:'Australia',n:9},{c:'Canada',n:7}
  ];
  const cMax = 50;
  const countryChart = document.getElementById('analyticsCountryChart');
  if (countryChart) {
    countryChart.innerHTML = countries.map(d => `
      <div style="display:flex;align-items:center;margin-bottom:14px">
        <div style="font-size:12px;color:#374151;width:100px;flex-shrink:0">${d.c}</div>
        <div style="flex:1;height:14px;background:#e5e7eb;border-radius:4px;margin:0 10px;position:relative">
          <div style="height:100%;border-radius:4px;background:#374151;width:${(d.n/cMax)*100}%"></div>
        </div>
        <div style="font-size:12px;font-weight:600;color:#374151;width:30px;text-align:right">${d.n}</div>
      </div>`).join('') +
      `<div style="display:flex;justify-content:space-between;padding:0 110px 0 110px;margin-top:4px">
        <span style="font-size:10px;color:#9ca3af">0</span>
        <span style="font-size:10px;color:#9ca3af">10</span>
        <span style="font-size:10px;color:#9ca3af">20</span>
        <span style="font-size:10px;color:#9ca3af">30</span>
        <span style="font-size:10px;color:#9ca3af">40</span>
        <span style="font-size:10px;color:#9ca3af">50</span>
      </div>`;
  }
}

function renderSatisfactionCharts() {
  // Satisfaction Score Over Time line chart
  const svg = document.getElementById('satLineChart');
  if (svg) {
    const data = [4.2,4.0,4.3,4.5,4.4,4.6];
    const labels = ['01 May','08 May','15 May','22 May','29 May',''];
    const w = 500, h = 200, pad = 40, padR = 20, padB = 30;
    const maxV = 5, minV = 0;
    const xFn = (i) => pad + (i / (data.length - 1)) * (w - pad - padR);
    const yFn = (v) => h - padB - ((v - minV) / (maxV - minV)) * (h - pad - padB);
    
    let s = '';
    for (let n = 0; n <= 5; n++) {
      const yv = yFn(n);
      s += `<line x1="${pad}" y1="${yv}" x2="${w-padR}" y2="${yv}" stroke="#e5e7eb" stroke-width="1"/>`;
      s += `<text x="${pad-8}" y="${yv+4}" text-anchor="end" fill="#9ca3af" font-size="10">${n}</text>`;
    }
    const pts = data.map((v,i) => `${xFn(i)},${yFn(v)}`).join(' ');
    s += `<polygon points="${xFn(0)},${h-padB} ${pts} ${xFn(data.length-1)},${h-padB}" fill="rgba(156,163,175,0.08)"/>`;
    s += `<polyline points="${pts}" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += data.map((v,i) => `<circle cx="${xFn(i)}" cy="${yFn(v)}" r="4" fill="#374151" stroke="#fff" stroke-width="2"/>`).join('');
    s += labels.map((l,i) => `<text x="${xFn(i)}" y="${h-8}" text-anchor="middle" fill="#9ca3af" font-size="10">${l}</text>`).join('');
    svg.innerHTML = s;
  }

  // Satisfaction Score Distribution donut
  const distData = [
    {label:'5 Stars',pct:68,color:'#374151'},
    {label:'4 Stars',pct:22,color:'#6b7280'},
    {label:'3 Stars',pct:7,color:'#9ca3af'},
    {label:'2 Stars',pct:2,color:'#d1d5db'},
    {label:'1 Star',pct:1,color:'#e5e7eb'},
  ];
  const pieEl = document.getElementById('satDistPie');
  const legendEl = document.getElementById('satDistLegend');
  if (pieEl) {
    let cumAngle = 0;
    const innerR = 28, outerR = 45;
    const paths = distData.map(d => {
      const angle = (d.pct / 100) * 360;
      const s1 = polarToXY(50,50,outerR,cumAngle);
      const s2 = polarToXY(50,50,innerR,cumAngle);
      cumAngle += angle;
      const e1 = polarToXY(50,50,outerR,cumAngle);
      const e2 = polarToXY(50,50,innerR,cumAngle);
      const large = angle > 180 ? 1 : 0;
      return `<path d="M${s1.x},${s1.y} A${outerR},${outerR} 0 ${large},1 ${e1.x},${e1.y} L${e2.x},${e2.y} A${innerR},${innerR} 0 ${large},0 ${s2.x},${s2.y} Z" fill="${d.color}" stroke="#fff" stroke-width="1"/>`;
    });
    pieEl.innerHTML = paths.join('');
  }
  if (legendEl) {
    legendEl.innerHTML = distData.map(d =>
      `<div class="admin-legend-item"><div class="admin-legend-dot" style="background:${d.color}"></div><span>${d.label} (${d.pct}%)</span></div>`
    ).join('');
  }
}

// ============================================
// CUSTOMER FEEDBACK FORM (Public)
// ============================================

let currentFeedbackToken = null;

function setStarRating(n) {
  document.getElementById('fbRating').value = n;
  document.querySelectorAll('#starRating span').forEach(s => {
    s.style.color = parseInt(s.dataset.star) <= n ? '#f59e0b' : '#d1d5db';
  });
}

function setExpRating(n) {
  document.getElementById('fbExpRating').value = n;
  document.querySelectorAll('#expRating span').forEach(s => {
    s.style.color = parseInt(s.dataset.star) <= n ? '#f59e0b' : '#d1d5db';
  });
}

function setNPS(n) {
  document.getElementById('fbNPS').value = n;
  document.querySelectorAll('#npsScore .nps-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.textContent) <= n);
  });
}

async function initFeedbackForm(token) {
  const loading = document.getElementById('feedbackLoading');
  const invalid = document.getElementById('feedbackInvalid');
  const form = document.getElementById('feedbackForm');
  const context = document.getElementById('feedbackContext');

  try {
    const res = await fetch(`${API_BASE_URL}/feedback/validate/${token}`);
    if (!res.ok) throw new Error('Invalid token');
    const data = await res.json();
    currentFeedbackToken = token;

    // Set context text
    const label = data.service_name || data.webinar_title || 'CyberNova Service';
    const typeLabel = data.feedback_type === 'webinar' ? 'webinar' : 'service';
    context.textContent = `Thank you for using CyberNova. Please rate your experience with our ${typeLabel}: ${label}`;

    // Pre-fill name/email if available
    if (data.full_name) document.getElementById('fbName').value = data.full_name;
    if (data.email) document.getElementById('fbEmail').value = data.email;

    loading.style.display = 'none';
    form.style.display = 'block';
  } catch (e) {
    loading.style.display = 'none';
    invalid.style.display = 'block';
  }
}

async function submitSatisfactionFeedback() {
  const rating = parseInt(document.getElementById('fbRating').value);
  const expRating = parseInt(document.getElementById('fbExpRating').value);
  const errEl = document.getElementById('feedbackError');
  errEl.style.display = 'none';

  if (!rating || rating < 1 || rating > 5) {
    errEl.textContent = 'Please select a satisfaction rating (1-5 stars).';
    errEl.style.display = 'block';
    return;
  }
  if (!expRating || expRating < 1 || expRating > 5) {
    errEl.textContent = 'Please select an overall experience rating (1-5 stars).';
    errEl.style.display = 'block';
    return;
  }

  const nps = parseInt(document.getElementById('fbNPS').value) || null;

  const payload = {
    token: currentFeedbackToken,
    rating: rating,
    experience_rating: expRating,
    recommendation_score: nps,
    liked_most: document.getElementById('fbLikedMost').value || null,
    improvements: document.getElementById('fbImprovements').value || null,
    comments: document.getElementById('fbComments').value || null,
    respondent_name: document.getElementById('fbName').value || null,
    respondent_email: document.getElementById('fbEmail').value || null,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/feedback/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Submission failed');
    }

    document.getElementById('feedbackForm').style.display = 'none';
    document.getElementById('feedbackSuccess').style.display = 'block';
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
  }
}

// Check for feedback token in URL on page load
(function checkFeedbackURL() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('feedback');
  if (token) {
    showPage('feedback');
    initFeedbackForm(token);
  }
})();

// ============================================
// ADMIN SATISFACTION — LIVE DATA
// ============================================

async function loadSatisfactionData() {
  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${API_BASE_URL}/admin/satisfaction-analytics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load satisfaction data');
    const data = await res.json();

    // Update KPI cards
    const summary = data.summary;
    const kpiCards = document.querySelectorAll('#admin-satisfaction .admin-kpi-card');
    if (kpiCards.length >= 4) {
      kpiCards[0].querySelector('.admin-kpi-value').textContent = `${summary.average_score} / 5`;
      kpiCards[0].querySelector('.admin-kpi-change').textContent = `${summary.change_avg_score >= 0 ? '↑' : '↓'} ${Math.abs(summary.change_avg_score)}% from last month`;
      kpiCards[0].querySelector('.admin-kpi-change').className = `admin-kpi-change ${summary.change_avg_score >= 0 ? 'up' : 'down'}`;

      kpiCards[1].querySelector('.admin-kpi-value').textContent = summary.total_feedback;
      kpiCards[1].querySelector('.admin-kpi-change').textContent = `${summary.change_total_feedback >= 0 ? '↑' : '↓'} ${Math.abs(summary.change_total_feedback)}% from last month`;
      kpiCards[1].querySelector('.admin-kpi-change').className = `admin-kpi-change ${summary.change_total_feedback >= 0 ? 'up' : 'down'}`;

      kpiCards[2].querySelector('.admin-kpi-value').textContent = `${summary.positive_percentage}%`;
      kpiCards[2].querySelector('.admin-kpi-change').textContent = `${summary.change_positive >= 0 ? '↑' : '↓'} ${Math.abs(summary.change_positive)}% from last month`;
      kpiCards[2].querySelector('.admin-kpi-change').className = `admin-kpi-change ${summary.change_positive >= 0 ? 'up' : 'down'}`;

      kpiCards[3].querySelector('.admin-kpi-value').textContent = `${summary.negative_percentage}%`;
      kpiCards[3].querySelector('.admin-kpi-change').textContent = `${summary.change_negative >= 0 ? '↓' : '↑'} ${Math.abs(summary.change_negative)}% from last month`;
      kpiCards[3].querySelector('.admin-kpi-change').className = `admin-kpi-change ${summary.change_negative <= 0 ? 'up' : 'down'}`;
    }

    // Render trend line chart from real data
    renderSatTrendFromData(data.trend);

    // Render distribution donut from real data
    renderSatDistFromData(data.distribution);

    // Render recent feedback table from real data
    renderFeedbackTable(data.recent_feedback);

    // Show low rating alerts if any
    if (data.low_rating_alerts && data.low_rating_alerts.length > 0) {
      renderLowRatingAlerts(data.low_rating_alerts);
    }
  } catch (e) {
    console.error('Satisfaction data load error:', e);
    // Fall back to static charts
    renderSatisfactionCharts();
  }
}

function renderSatTrendFromData(trend) {
  const svg = document.getElementById('satLineChart');
  if (!svg || !trend.length) { renderSatisfactionCharts(); return; }

  const data = trend.map(t => t.average_rating);
  const labels = trend.map(t => {
    const d = new Date(t.date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  });

  const w = 500, h = 200, pad = 40, padR = 20, padB = 30;
  const maxV = 5, minV = 0;
  const xFn = (i) => pad + (i / Math.max(data.length - 1, 1)) * (w - pad - padR);
  const yFn = (v) => h - padB - ((v - minV) / (maxV - minV)) * (h - pad - padB);

  let s = '';
  for (let n = 0; n <= 5; n++) {
    const yv = yFn(n);
    s += `<line x1="${pad}" y1="${yv}" x2="${w-padR}" y2="${yv}" stroke="#e5e7eb" stroke-width="1"/>`;
    s += `<text x="${pad-8}" y="${yv+4}" text-anchor="end" fill="#9ca3af" font-size="10">${n}</text>`;
  }
  if (data.length > 1) {
    const pts = data.map((v,i) => `${xFn(i)},${yFn(v)}`).join(' ');
    s += `<polygon points="${xFn(0)},${h-padB} ${pts} ${xFn(data.length-1)},${h-padB}" fill="rgba(156,163,175,0.08)"/>`;
    s += `<polyline points="${pts}" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += data.map((v,i) => `<circle cx="${xFn(i)}" cy="${yFn(v)}" r="4" fill="#374151" stroke="#fff" stroke-width="2"/>`).join('');
  } else if (data.length === 1) {
    s += `<circle cx="${xFn(0)}" cy="${yFn(data[0])}" r="5" fill="#374151" stroke="#fff" stroke-width="2"/>`;
  }
  s += labels.map((l,i) => `<text x="${xFn(i)}" y="${h-8}" text-anchor="middle" fill="#9ca3af" font-size="10">${l}</text>`).join('');
  svg.innerHTML = s;
}

function renderSatDistFromData(distribution) {
  const pieEl = document.getElementById('satDistPie');
  const legendEl = document.getElementById('satDistLegend');
  if (!pieEl || !distribution.length) return;

  const colors = ['#374151','#6b7280','#9ca3af','#d1d5db','#e5e7eb'];
  const starLabels = ['5 Stars','4 Stars','3 Stars','2 Stars','1 Star'];

  let cumAngle = 0;
  const innerR = 28, outerR = 45;
  const paths = distribution.map((d, idx) => {
    const pct = d.percentage || 0;
    if (pct === 0) return '';
    const angle = (pct / 100) * 360;
    const s1 = polarToXY(50,50,outerR,cumAngle);
    const s2 = polarToXY(50,50,innerR,cumAngle);
    cumAngle += angle;
    const e1 = polarToXY(50,50,outerR,cumAngle);
    const e2 = polarToXY(50,50,innerR,cumAngle);
    const large = angle > 180 ? 1 : 0;
    return `<path d="M${s1.x},${s1.y} A${outerR},${outerR} 0 ${large},1 ${e1.x},${e1.y} L${e2.x},${e2.y} A${innerR},${innerR} 0 ${large},0 ${s2.x},${s2.y} Z" fill="${colors[idx]}" stroke="#fff" stroke-width="1"/>`;
  });
  pieEl.innerHTML = paths.join('');

  if (legendEl) {
    legendEl.innerHTML = distribution.map((d, idx) =>
      `<div class="admin-legend-item"><div class="admin-legend-dot" style="background:${colors[idx]}"></div><span>${starLabels[idx]} (${d.percentage}%)</span></div>`
    ).join('');
  }
}

function renderFeedbackTable(feedback) {
  const tbody = document.querySelector('#admin-satisfaction .admin-data-table tbody');
  if (!tbody || !feedback.length) return;

  tbody.innerHTML = feedback.map(f => {
    const stars = '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating);
    const date = new Date(f.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return `<tr>
      <td>FB-${String(f.id).padStart(3,'0')}</td>
      <td>${f.respondent_name || 'Anonymous'}</td>
      <td>${f.feedback_type === 'webinar' ? 'Webinar' : 'Service'}</td>
      <td style="color:#f59e0b">${stars}</td>
      <td>${f.comments || '—'}</td>
      <td>${date}</td>
      <td><button style="background:none;border:none;cursor:pointer;color:#6b7280"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></td>
    </tr>`;
  }).join('');

  // Update pagination info
  const paginationInfo = document.querySelector('#admin-satisfaction .admin-pagination-info');
  if (paginationInfo) {
    paginationInfo.textContent = `Showing 1 to ${feedback.length} of ${feedback.length} feedback entries`;
  }
}

function renderLowRatingAlerts(alerts) {
  // Insert an alert banner above the feedback table
  const card = document.querySelector('#admin-satisfaction .admin-card');
  if (!card) return;
  let alertDiv = document.getElementById('lowRatingAlerts');
  if (!alertDiv) {
    alertDiv = document.createElement('div');
    alertDiv.id = 'lowRatingAlerts';
    alertDiv.style.cssText = 'background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:20px';
    card.parentNode.insertBefore(alertDiv, card);
  }
  alertDiv.innerHTML = `<h4 style="margin:0 0 8px;color:#dc2626;font-size:14px;font-weight:600">⚠ Low Rating Alerts (${alerts.length})</h4>` +
    alerts.map(a => `<div style="padding:6px 0;border-bottom:1px solid #fecaca;font-size:13px;color:#374151">
      <strong>${a.respondent_name || 'Anonymous'}</strong> rated <strong style="color:#dc2626">${a.rating}/5</strong> — ${a.comments || 'No comment'} 
      <span style="color:#9ca3af;font-size:11px">(${new Date(a.submitted_at).toLocaleDateString()})</span>
    </div>`).join('');
}

// ============================================
// TOAST NOTIFICATIONS (Enhanced)
// ============================================

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type === 'error' ? 'error' : ''}`;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3000);
}

// ============================================
// SERVICE REQUEST FORM
// ============================================

async function submitForm() {
  const name = document.getElementById('fname').value;
  const email = document.getElementById('femail').value;
  const phone = document.getElementById('fphone').value;
  const org = document.getElementById('forg').value;
  const country = document.getElementById('fcountry').value;
  const industry = document.getElementById('findustry').value;
  const notes = document.getElementById('fnotes').value;
  
  // Get selected services
  const serviceCheckboxes = document.querySelectorAll('.service-checkboxes input[type=checkbox]:checked');
  const services = Array.from(serviceCheckboxes).map(cb => cb.value);
  
  // Validation
  if (!name || !email || !org || !country || !industry) {
    showToast('⚠️ Please fill in all required fields', 'error');
    return;
  }
  
  if (services.length === 0) {
    showToast('⚠️ Please select at least one service', 'error');
    return;
  }
  
  const submitBtn = document.querySelector('#request .form-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  
  try {
    await apiCall('/service-requests', {
      method: 'POST',
      body: JSON.stringify({
        full_name: name,
        email: email,
        phone_number: phone || null,
        organization_name: org,
        country: country,
        industry_sector: industry,
        services: services,
        additional_notes: notes || null
      })
    });
    
    document.getElementById('successMsg').style.display = 'block';
    showToast('✅ Assessment request submitted!');
    
    // Reset form
    document.getElementById('fname').value = '';
    document.getElementById('femail').value = '';
    document.getElementById('fphone').value = '';
    document.getElementById('forg').value = '';
    document.getElementById('fcountry').value = '';
    document.getElementById('findustry').value = '';
    document.getElementById('fnotes').value = '';
    serviceCheckboxes.forEach(cb => cb.checked = false);
    
    setTimeout(() => {
      document.getElementById('successMsg').style.display = 'none';
    }, 5000);
    
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Assessment Request →';
  }
}

// ============================================
// WEBINARS & EVENTS
// ============================================

let webinarsData = [];

async function loadWebinars() {
  try {
    webinarsData = await apiCall('/webinars');
    renderWebinars();
  } catch (error) {
    console.error('Error loading webinars:', error);
    showToast('Error loading webinars', 'error');
  }
}

function renderWebinars() {
  const container = document.querySelector('#events .events-grid');
  if (!container) return;
  
  container.innerHTML = webinarsData.map(webinar => `
    <div class="event-card">
      <div class="event-banner" style="background: ${webinar.banner_gradient || 'linear-gradient(90deg, var(--accent), var(--accent2))'}"></div>
      <div class="event-body">
        <div class="event-tag" style="background: ${webinar.tag_color || 'rgba(0,136,255,0.1)'}; color: var(--accent2); border: 1px solid rgba(0,136,255,0.2)">${webinar.event_type}</div>
        <h3>${webinar.title}</h3>
        <p>${webinar.description}</p>
        <div class="event-meta">
          <span>📅 ${webinar.event_date}</span>
          <span>⏰ ${webinar.event_time}</span>
          <span>👥 ${webinar.registration_count} registered</span>
        </div>
        <button class="event-btn" onclick="registerEvent(this, ${webinar.id}, '${webinar.title.replace(/'/g, "\\'")}', ${webinar.price || 'null'})">
          Register ${webinar.price ? `— R${webinar.price}` : 'Free'} →
        </button>
      </div>
    </div>
  `).join('');
}

// Store current webinar data for modal
let currentWebinar = null;

function openWebinarModal(webinarId, webinarTitle, webinarDate, webinarTime, price) {
  console.log('Opening webinar modal:', webinarId, webinarTitle);
  currentWebinar = { id: webinarId, title: webinarTitle, price: price };
  
  // Update modal content
  const titleEl = document.getElementById('webinarTitle');
  const detailsEl = document.getElementById('webinarDetails');
  const btnTextEl = document.getElementById('webinarBtnText');
  const modalEl = document.getElementById('webinarModal');
  
  console.log('Modal elements:', { titleEl, detailsEl, btnTextEl, modalEl });
  
  if (!titleEl || !detailsEl || !btnTextEl || !modalEl) {
    console.error('Modal elements not found!');
    return;
  }
  
  titleEl.textContent = webinarTitle;
  detailsEl.textContent = `${webinarDate} • ${webinarTime}`;
  
  // Update button text with price
  const btnText = price ? `Register — R${price}` : 'Register Free';
  btnTextEl.textContent = btnText;
  
  // Reset form
  const formEl = document.getElementById('webinarRegistrationForm');
  if (formEl) formEl.reset();
  
  const successEl = document.getElementById('webinarSuccess');
  const errorEl = document.getElementById('webinarError');
  if (successEl) successEl.style.display = 'none';
  if (errorEl) errorEl.style.display = 'none';
  
  // Show modal
  modalEl.style.display = 'flex';
  console.log('Modal should now be visible');
}

function closeWebinarModal() {
  document.getElementById('webinarModal').style.display = 'none';
  currentWebinar = null;
}

async function submitWebinarRegistration(event) {
  event.preventDefault();
  
  const submitBtn = document.getElementById('webinarSubmitBtn');
  const btnText = document.getElementById('webinarBtnText');
  const successMsg = document.getElementById('webinarSuccess');
  const errorMsg = document.getElementById('webinarError');
  
  // Hide previous messages
  successMsg.style.display = 'none';
  errorMsg.style.display = 'none';
  
  // Get form data
  const formData = {
    webinar_id: currentWebinar.id,
    full_name: document.getElementById('wFullName').value,
    email: document.getElementById('wEmail').value,
    phone_number: document.getElementById('wPhone').value || null,
    organization_name: document.getElementById('wOrg').value || null,
    country: document.getElementById('wCountry').value || null,
    industry_sector: document.getElementById('wIndustry').value || null
  };
  
  // Disable button and show loading
  submitBtn.disabled = true;
  btnText.textContent = 'Registering...';
  
  try {
    await apiCall('/webinar-registrations', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    
    // Show success
    successMsg.style.display = 'block';
    showToast(`✅ Registered for: ${currentWebinar.title}`);
    
    // Reload webinars to update counts
    await loadWebinars();
    
    // Close modal after 2 seconds
    setTimeout(() => {
      closeWebinarModal();
    }, 2000);
    
  } catch (error) {
    // Show error
    errorMsg.textContent = error.message.includes('already registered') 
      ? '⚠️ You have already registered for this webinar' 
      : `⚠️ ${error.message}`;
    errorMsg.style.display = 'block';
    showToast('Registration failed', 'error');
    
    // Re-enable button
    submitBtn.disabled = false;
    const btnTextContent = currentWebinar.price ? `Register — R${currentWebinar.price}` : 'Register Free';
    btnText.textContent = btnTextContent;
  }
}

// Legacy function for compatibility - now opens modal
async function registerEvent(btn, webinarId, webinarTitle, price) {
  // This function is kept for backward compatibility but now opens the modal
  const webinarData = webinarsData.find(w => w.id === webinarId);
  if (webinarData) {
    openWebinarModal(webinarId, webinarTitle, webinarData.event_date, webinarData.event_time, price);
  }
}

// ============================================
// ADMIN LOGIN
// ============================================

async function doLogin() {
  console.log('doLogin called');
  const email = document.getElementById('lemail').value;
  const password = document.getElementById('lpassword').value;
  
  console.log('Login attempt:', email);
  
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);
  
  try {
    console.log('Sending login request to:', `${API_BASE_URL}/admin/auth/login`);
    const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: 'POST',
      body: formData
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Login failed:', errorData);
      document.getElementById('loginErr').style.display = 'block';
      showToast('Login failed: ' + (errorData.detail || 'Invalid credentials'), 'error');
      return;
    }
    
    const data = await response.json();
    console.log('Login successful, token received');
    localStorage.setItem('authToken', data.access_token);
    showToast('Login successful!');
    showPage('dashboard');
    
  } catch (error) {
    console.error('Login error:', error);
    document.getElementById('loginErr').style.display = 'block';
    showToast('Login failed: ' + error.message, 'error');
  }
}

// ============================================
// DASHBOARD - LOAD ALL DATA
// ============================================

async function loadDashboard() {
  // Render the static admin overview charts immediately
  renderAdminDashboard();
  
  try {
    await Promise.all([
      loadDashboardSummary(),
      loadMonthlyRequests(),
      loadIndustryDistribution(),
      loadGeographicDistribution(),
      loadConversionFunnel(),
      loadCustomerSatisfaction(),
      loadServiceRequests(),
      loadWebinarRegistrations()
    ]);
  } catch (error) {
    console.error('Dashboard load error:', error);
    if (error.message.includes('401') || error.message.includes('credentials')) {
      localStorage.removeItem('authToken');
      showPage('login');
      showToast('Session expired. Please login again.', 'error');
    }
  }
}

async function loadDashboardSummary() {
  try {
    const data = await apiCall('/admin/dashboard/summary');
    
    // Update KPI cards
    document.querySelector('.kpi-card:nth-child(1) .kpi-value').textContent = data.total_service_requests;
    document.querySelector('.kpi-card:nth-child(1) .kpi-change').textContent = `↑ ${data.change_service_requests}% vs last month`;
    
    document.querySelector('.kpi-card:nth-child(2) .kpi-value').textContent = data.webinar_registrations;
    document.querySelector('.kpi-card:nth-child(2) .kpi-change').textContent = `↑ ${data.change_webinar_registrations}% vs last month`;
    
    document.querySelector('.kpi-card:nth-child(3) .kpi-value').textContent = `${data.conversion_rate}%`;
    document.querySelector('.kpi-card:nth-child(3) .kpi-change').textContent = `↑ ${data.change_conversion_rate}pp vs last month`;
    
    document.querySelector('.kpi-card:nth-child(4) .kpi-value').textContent = data.avg_satisfaction;
    document.querySelector('.kpi-card:nth-child(4) .kpi-change').textContent = `↑ ${data.change_satisfaction} vs last month`;
    
  } catch (error) {
    console.error('Error loading dashboard summary:', error);
  }
}

async function loadMonthlyRequests() {
  try {
    const data = await apiCall('/admin/dashboard/monthly-service-requests');
    renderBarChart(data);
  } catch (error) {
    console.error('Error loading monthly requests:', error);
  }
}

function renderBarChart(data) {
  const barChart = document.getElementById('barChart');
  if (!barChart || data.length === 0) return;
  
  const maxV = Math.max(...data.map(d => d.count));
  barChart.innerHTML = data.map(d => `
    <div class="bar-group">
      <div class="bar" style="height:${(d.count/maxV)*170}px;background:linear-gradient(180deg,var(--accent),rgba(0,201,167,0.4))" title="${d.month}: ${d.count}"></div>
      <div class="bar-label">${d.month}</div>
    </div>
  `).join('');
}

async function loadIndustryDistribution() {
  try {
    const data = await apiCall('/admin/dashboard/industry-distribution');
    renderPieChart(data);
  } catch (error) {
    console.error('Error loading industry distribution:', error);
  }
}

function renderPieChart(industries) {
  if (industries.length === 0) return;
  
  const colors = ['#00C9A7', '#0088FF', '#9B59B6', '#FF6B35', '#F39C12', '#6A8A9A'];
  let cumAngle = 0;
  
  const paths = industries.slice(0, 6).map((d, i) => {
    const angle = (d.percentage / 100) * 360;
    const start = polarToXY(50, 50, 45, cumAngle);
    cumAngle += angle;
    const end = polarToXY(50, 50, 45, cumAngle);
    const large = angle > 180 ? 1 : 0;
    return `<path d="M50,50 L${start.x},${start.y} A45,45 0 ${large},1 ${end.x},${end.y} Z" fill="${colors[i]}" stroke="var(--bg)" stroke-width="1.5"/>`;
  });
  
  document.getElementById('pieChart').innerHTML = paths.join('');
  document.getElementById('pieLegend').innerHTML = industries.slice(0, 6).map((d, i) =>
    `<div class="legend-item"><div class="legend-dot" style="background:${colors[i]}"></div><span>${d.industry} ${d.percentage}%</span></div>`
  ).join('');
}

function polarToXY(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

async function loadGeographicDistribution() {
  try {
    const data = await apiCall('/admin/dashboard/geographic-distribution');
    renderGeoChart(data);
  } catch (error) {
    console.error('Error loading geographic distribution:', error);
  }
}

function renderGeoChart(data) {
  const geoChart = document.getElementById('geoChart');
  if (!geoChart || data.length === 0) return;
  
  const gMax = data[0].count;
  geoChart.innerHTML = data.map(d => `
    <div class="conversion-row">
      <div class="conv-label" style="font-size:12px">${d.country}</div>
      <div class="conv-bar-wrap"><div class="conv-bar-fill" style="width:${(d.count/gMax)*100}%;background:linear-gradient(90deg,var(--accent2),var(--accent))"></div></div>
      <div class="conv-pct" style="color:var(--accent2)">${d.count}</div>
    </div>
  `).join('');
}

async function loadConversionFunnel() {
  try {
    const data = await apiCall('/admin/dashboard/conversion-funnel');
    renderConversionFunnel(data.stages);
  } catch (error) {
    console.error('Error loading conversion funnel:', error);
  }
}

function renderConversionFunnel(stages) {
  const convChart = document.getElementById('convChart');
  if (!convChart) return;
  
  convChart.innerHTML = stages.map(d => `
    <div class="conversion-row">
      <div class="conv-label">${d.label}</div>
      <div class="conv-bar-wrap"><div class="conv-bar-fill" style="width:${d.percentage}%"></div></div>
      <div class="conv-pct">${d.percentage}%</div>
    </div>
  `).join('');
}

async function loadCustomerSatisfaction() {
  try {
    const data = await apiCall('/admin/dashboard/customer-satisfaction');
    renderSatisfaction(data);
  } catch (error) {
    console.error('Error loading customer satisfaction:', error);
  }
}

function renderSatisfaction(data) {
  const satChart = document.getElementById('satChart');
  if (!satChart) return;
  
  document.querySelector('.sat-score').textContent = data.average_rating;
  document.querySelector('.sat-sub').textContent = `Based on ${data.total_reviews} reviews`;
  
  const satMax = Math.max(...data.rating_distribution.map(d => d.count));
  satChart.innerHTML = data.rating_distribution.map(d => `
    <div class="sat-row">
      <div class="sat-star-label">${'★'.repeat(d.stars)}</div>
      <div class="sat-track"><div class="sat-fill" style="width:${satMax > 0 ? (d.count/satMax)*100 : 0}%"></div></div>
      <div class="sat-count">${d.count}</div>
    </div>
  `).join('');
}

// ============================================
// ADMIN TABLES - SERVICE REQUESTS
// ============================================

async function loadServiceRequests() {
  try {
    const data = await apiCall('/admin/service-requests');
    renderServiceRequestsTable(data);
  } catch (error) {
    console.error('Error loading service requests:', error);
  }
}

function renderServiceRequestsTable(requests) {
  const container = document.getElementById('serviceRequestsTable');
  if (!container) return;
  
  if (requests.length === 0) {
    container.innerHTML = '<div class="empty-state">No service requests yet</div>';
    return;
  }
  
  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Organization</th>
          <th>Country</th>
          <th>Industry</th>
          <th>Services</th>
          <th>Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${requests.map(req => `
          <tr>
            <td>${req.full_name}</td>
            <td>${req.organization_name}</td>
            <td>${req.country}</td>
            <td>${req.industry_sector}</td>
            <td>${req.services.join(', ')}</td>
            <td>${new Date(req.created_at).toLocaleDateString()}</td>
            <td><span class="status-badge status-${req.status}">${req.status.replace(/_/g, ' ')}</span></td>
            <td>
              <select class="status-select" onchange="updateRequestStatus(${req.id}, this.value); this.value='';">
                <option value="">Change Status</option>
                <option value="new_inquiry">New Inquiry</option>
                <option value="qualified">Qualified</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="negotiation">Negotiation</option>
                <option value="confirmed_contract">Confirmed Contract</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function updateRequestStatus(requestId, newStatus) {
  if (!newStatus) return;
  
  try {
    await apiCall(`/admin/service-requests/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    
    showToast('Status updated successfully');
    await loadDashboard(); // Reload all dashboard data
    
  } catch (error) {
    showToast(`Error updating status: ${error.message}`, 'error');
  }
}

// ============================================
// ADMIN TABLES - WEBINAR REGISTRATIONS
// ============================================

async function loadWebinarRegistrations() {
  try {
    const data = await apiCall('/admin/webinar-registrations');
    renderWebinarRegistrationsTable(data);
  } catch (error) {
    console.error('Error loading webinar registrations:', error);
  }
}

function renderWebinarRegistrationsTable(registrations) {
  const container = document.getElementById('webinarRegistrationsTable');
  if (!container) return;
  
  if (registrations.length === 0) {
    container.innerHTML = '<div class="empty-state">No webinar registrations yet</div>';
    return;
  }
  
  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Webinar</th>
          <th>Email</th>
          <th>Country</th>
          <th>Registration Date</th>
        </tr>
      </thead>
      <tbody>
        ${registrations.map(reg => `
          <tr>
            <td>${reg.full_name}</td>
            <td>${reg.webinar_title}</td>
            <td>${reg.email}</td>
            <td>${reg.country || 'N/A'}</td>
            <td>${new Date(reg.registered_at).toLocaleDateString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Load webinars on events page if it's the active page
  if (document.getElementById('events').classList.contains('active')) {
    loadWebinars();
  }
});
