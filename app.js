// CyberNova Analytics - Backend Integration
// This file connects the existing HTML UI to the FastAPI backend

// API Base URL - automatically uses production URL when deployed
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:8000/api'
  : 'https://cybernova-3rvx.onrender.com/api';

// ============================================
// VALIDATION HELPERS
// ============================================

function isValidName(name) {
  // Name must contain only letters, spaces, hyphens, apostrophes — no digits
  return /^[A-Za-z\s'\-]+$/.test(name.trim());
}

function isValidEmail(email) {
  // Must have a valid format: user@domain.tld (e.g. user@gmail.com)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function showFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.classList.add('field-error-border');
  // Remove any existing error for this field
  const existing = input.parentElement.querySelector('.field-error');
  if (existing) existing.remove();
  const errDiv = document.createElement('div');
  errDiv.className = 'field-error';
  errDiv.textContent = message;
  input.parentElement.appendChild(errDiv);
  input.focus();
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearFieldErrors(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.querySelectorAll('.field-error').forEach(e => e.remove());
  container.querySelectorAll('.field-error-border').forEach(e => e.classList.remove('field-error-border'));
}

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

  // Close sidebar on mobile after navigation
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) sidebar.classList.remove('open');
  }
  
  // Render charts if switching to pages that need them
  if (pageId === 'admin-overview') {
    renderAdminDashboard();
  } else if (pageId === 'admin-analytics') {
    renderAnalyticsCharts();
    loadActivityLog();
  } else if (pageId === 'admin-satisfaction') {
    loadSatisfactionData();
  } else if (pageId === 'admin-webinars') {
    loadAdminWebinars();
  }
}

// ============================================
// MOBILE NAV TOGGLE
// ============================================

function toggleMobileNav() {
  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.classList.toggle('open');
}

function closeMobileNav() {
  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.classList.remove('open');
}

function toggleAdminSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    sidebar.classList.toggle('open');
  } else {
    const main = document.querySelector('.admin-main');
    if (sidebar.style.transform === 'translateX(-100%)') {
      sidebar.style.transform = 'translateX(0)';
      main.style.marginLeft = '180px';
    } else {
      sidebar.style.transform = 'translateX(-100%)';
      main.style.marginLeft = '0';
    }
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
  const tab = el.getAttribute('data-tab');
  document.querySelectorAll('.settings-content > div[id^="settingsPanel-"]').forEach(p => p.style.display = 'none');
  const panel = document.getElementById(`settingsPanel-${tab}`);
  if (panel) panel.style.display = 'block';
  if (tab === 'notifications') loadNotifHistory();
}

function saveGeneralSettings() {
  const data = {
    platformName: document.getElementById('gs-platformName')?.value,
    email: document.getElementById('gs-email')?.value,
    phone: document.getElementById('gs-phone')?.value,
    timezone: document.getElementById('gs-timezone')?.value,
  };
  localStorage.setItem('cn-generalSettings', JSON.stringify(data));
  showToast('General settings saved.');
}

function saveDateSettings() {
  const data = {
    dateFormat: document.getElementById('gs-dateFormat')?.value,
    timeFormat: document.getElementById('gs-timeFormat')?.value,
    weekStart: document.getElementById('gs-weekStart')?.value,
  };
  localStorage.setItem('cn-dateSettings', JSON.stringify(data));
  showToast('Date & time settings saved.');
}

function saveItemsPerPage() {
  const val = document.getElementById('gs-itemsPerPage')?.value;
  localStorage.setItem('cn-itemsPerPage', val);
  showToast(`Items per page set to ${val}.`);
}

function saveNotifSettings() {
  const keys = ['newRequest','newWebinar','newFeedback','lowRating','statusChange','capacityWarn'];
  const prefs = {};
  keys.forEach(k => {
    const el = document.getElementById(`notif-${k}`);
    if (el) prefs[k] = el.checked;
  });
  localStorage.setItem('cn-notifPrefs', JSON.stringify(prefs));
}

function loadSavedSettings() {
  // General
  const gen = JSON.parse(localStorage.getItem('cn-generalSettings') || '{}');
  if (gen.platformName && document.getElementById('gs-platformName')) document.getElementById('gs-platformName').value = gen.platformName;
  if (gen.email && document.getElementById('gs-email')) document.getElementById('gs-email').value = gen.email;
  if (gen.phone && document.getElementById('gs-phone')) document.getElementById('gs-phone').value = gen.phone;

  // Date
  const dt = JSON.parse(localStorage.getItem('cn-dateSettings') || '{}');
  if (dt.dateFormat) { const el = document.getElementById('gs-dateFormat'); if (el) el.value = dt.dateFormat; }
  if (dt.timeFormat) { const el = document.getElementById('gs-timeFormat'); if (el) el.value = dt.timeFormat; }
  if (dt.weekStart) { const el = document.getElementById('gs-weekStart'); if (el) el.value = dt.weekStart; }

  // Items per page
  const ipp = localStorage.getItem('cn-itemsPerPage');
  if (ipp) { const el = document.getElementById('gs-itemsPerPage'); if (el) el.value = ipp; }

  // Notification prefs
  const prefs = JSON.parse(localStorage.getItem('cn-notifPrefs') || '{}');
  Object.keys(prefs).forEach(k => {
    const el = document.getElementById(`notif-${k}`);
    if (el) el.checked = prefs[k];
  });
}

function loadNotifHistory() {
  const container = document.getElementById('notifHistoryList');
  if (!container) return;
  const token = localStorage.getItem('authToken');
  if (!token) { container.innerHTML = '<p style="font-size:13px;color:var(--muted);text-align:center;padding:20px 0">Log in to view notification history.</p>'; return; }

  Promise.all([
    fetch(`${API_BASE_URL}/admin/service-requests?limit=5`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
    fetch(`${API_BASE_URL}/admin/webinar-registrations?limit=5`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
    fetch(`${API_BASE_URL}/admin/satisfaction-feedback?limit=5`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.ok ? r.json() : [])
  ]).then(([requests, registrations, feedback]) => {
    const prefs = JSON.parse(localStorage.getItem('cn-notifPrefs') || '{}');
    const events = [];

    if (prefs.newRequest !== false) {
      (Array.isArray(requests) ? requests : []).forEach(r => {
        events.push({ type: 'request', label: `New service request from ${r.full_name}`, sub: r.organization_name || '', time: r.created_at, urgent: false });
      });
    }
    if (prefs.newWebinar !== false) {
      (Array.isArray(registrations) ? registrations : []).forEach(r => {
        events.push({ type: 'webinar', label: `${r.full_name} registered for a webinar`, sub: r.webinar_title || '', time: r.registered_at, urgent: false });
      });
    }
    if (prefs.newFeedback !== false || prefs.lowRating !== false) {
      (Array.isArray(feedback) ? feedback : []).forEach(f => {
        const low = f.rating <= 2;
        if (low && prefs.lowRating === false) return;
        if (!low && prefs.newFeedback === false) return;
        events.push({ type: 'feedback', label: `${low ? 'Low rating alert' : 'Feedback received'}: ${f.respondent_name || 'Anonymous'} rated ${f.rating}/5`, sub: '', time: f.submitted_at, urgent: low });
      });
    }

    events.sort((a, b) => new Date(b.time) - new Date(a.time));

    if (!events.length) {
      container.innerHTML = '<p style="font-size:13px;color:#374151;text-align:center;padding:20px 0">No recent notifications.</p>';
      return;
    }

    container.innerHTML = events.map(e => {
      const d = new Date(e.time).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
      const dot = e.urgent ? '#ef4444' : e.type === 'webinar' ? '#818cf8' : e.type === 'feedback' ? '#f59e0b' : '#00D9FF';
      return `<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid #e5e7eb">
        <div style="width:8px;height:8px;border-radius:50%;background:${dot};flex-shrink:0;margin-top:5px"></div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600;color:#111827">${e.label}</div>
          ${e.sub ? `<div style="font-size:12px;color:#374151;margin-top:2px">${e.sub}</div>` : ''}
          <div style="font-size:11px;color:#6b7280;margin-top:4px">${d}</div>
        </div>
        ${e.urgent ? `<span style="font-size:11px;background:rgba(239,68,68,0.12);color:#dc2626;padding:2px 8px;border-radius:10px;font-weight:600;flex-shrink:0">Urgent</span>` : ''}
      </div>`;
    }).join('');
  }).catch(() => {
    container.innerHTML = '<p style="font-size:13px;color:#374151;text-align:center;padding:20px 0">Could not load notification history.</p>';
  });
}

function exportCSV() {
  const dataType = document.getElementById('exportDataType')?.value;
  if (!dataType) {
    showToast('Please select a data type to export', 'error');
    return;
  }

  const startDate = document.getElementById('exportStartDate')?.value;
  const endDate = document.getElementById('exportEndDate')?.value;

  const typesToExport = dataType === 'all'
    ? ['service_requests', 'webinar_registrations']
    : [dataType];

  let exported = 0;

  typesToExport.forEach(type => {
    if (type === 'service_requests') {
      let data = [...allServiceRequests];
      if (startDate) data = data.filter(r => new Date(r.created_at) >= new Date(startDate));
      if (endDate) data = data.filter(r => new Date(r.created_at) <= new Date(endDate + 'T23:59:59'));
      if (data.length === 0) { showToast('No service requests match the selected filters', 'error'); return; }
      const headers = ['ID','Full Name','Email','Phone','Organization','Country','Industry','Services','Status','Created Date','Notes'];
      const rows = data.map(req => [
        req.id, req.full_name, req.email, req.phone_number || '', req.organization_name,
        req.country, req.industry_sector, req.services.join('; '),
        req.status.replace(/_/g, ' '), new Date(req.created_at).toLocaleDateString('en-GB'),
        (req.additional_notes || '').replace(/"/g, '""')
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      downloadCSV(csv, `service_requests_${new Date().toISOString().split('T')[0]}.csv`);
      exported++;
    }
    if (type === 'webinar_registrations') {
      let data = [...allWebinarRegistrations];
      if (startDate) data = data.filter(r => new Date(r.registered_at) >= new Date(startDate));
      if (endDate) data = data.filter(r => new Date(r.registered_at) <= new Date(endDate + 'T23:59:59'));
      if (data.length === 0) { showToast('No webinar registrations match the selected filters', 'error'); return; }
      const headers = ['ID','Full Name','Email','Phone','Organization','Country','Industry','Webinar Title','Registration Date'];
      const rows = data.map(reg => [
        reg.id, reg.full_name, reg.email, reg.phone_number || '', reg.organization_name || '',
        reg.country || '', reg.industry_sector || '', reg.webinar_title,
        new Date(reg.registered_at).toLocaleDateString('en-GB')
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      downloadCSV(csv, `webinar_registrations_${new Date().toISOString().split('T')[0]}.csv`);
      exported++;
    }
  });

  if (exported > 0) showToast(`Exported ${exported} file${exported > 1 ? 's' : ''} successfully`);
}

// ============================================
// ADMIN DASHBOARD CHART RENDERERS
// ============================================

async function renderAdminDashboard() {
  const barColors = ['#0088FF','#0ea5e9','#06b6d4','#0088FF','#6366f1','#0ea5e9'];
  const statusColorMap = { 'Submitted':'#0088FF', 'Reviewed':'#0ea5e9', 'In Progress':'#d97706', 'Completed':'#059669' };

  // Fetch real data for both charts in parallel
  try {
    const [monthlyData, funnelData] = await Promise.all([
      apiCall('/admin/dashboard/monthly-service-requests'),
      apiCall('/admin/dashboard/conversion-funnel'),
    ]);

    // Bar chart — real monthly service requests
    const barChart = document.getElementById('barChart');
    if (barChart && monthlyData.length) {
      const maxV = Math.max(...monthlyData.map(d => d.count), 1);
      barChart.innerHTML = monthlyData.map((d, i) => `
        <div class="admin-bar-group">
          <div class="admin-bar" style="height:${(d.count/maxV)*170}px;background:${barColors[i % barColors.length]}" title="${d.month}: ${d.count}"></div>
          <div class="admin-bar-label">${d.month}</div>
        </div>`).join('');
    }

    // Pie chart — real status distribution from funnel
    const pieChart = document.getElementById('pieChart');
    const pieLegend = document.getElementById('pieLegend');
    if (pieChart && funnelData.stages && funnelData.stages.length) {
      // Calculate exclusive counts for pie chart (each request in only one slice)
      const total = funnelData.total_requests || 1;
      const stages = funnelData.stages;
      const completedCount = stages.find(s => s.label === 'Completed')?.count || 0;
      const inProgressCount = (stages.find(s => s.label === 'In Progress')?.count || 0) - completedCount;
      const reviewedCount = (stages.find(s => s.label === 'Reviewed')?.count || 0) - (stages.find(s => s.label === 'In Progress')?.count || 0);
      const submittedCount = total - (stages.find(s => s.label === 'Reviewed')?.count || 0);

      const slices = [
        { label: 'Submitted', count: submittedCount, pct: Math.round((submittedCount / total) * 100) },
        { label: 'Reviewed', count: reviewedCount, pct: Math.round((reviewedCount / total) * 100) },
        { label: 'In Progress', count: inProgressCount, pct: Math.round((inProgressCount / total) * 100) },
        { label: 'Completed', count: completedCount, pct: Math.round((completedCount / total) * 100) },
      ].filter(s => s.count > 0);

      let cumAngle = 0;
      const paths = slices.map(d => {
        const angle = (d.pct / 100) * 360;
        if (angle === 0) return '';
        const start = polarToXY(50, 50, 45, cumAngle);
        cumAngle += angle;
        const end = polarToXY(50, 50, 45, cumAngle);
        const large = angle > 180 ? 1 : 0;
        return `<path d="M50,50 L${start.x},${start.y} A45,45 0 ${large},1 ${end.x},${end.y} Z" fill="${statusColorMap[d.label] || '#6b7280'}" stroke="#fff" stroke-width="1.5"/>`;
      });
      pieChart.innerHTML = paths.join('');

      if (pieLegend) {
        pieLegend.innerHTML = slices.map(d =>
          `<div class="admin-legend-item"><div class="admin-legend-dot" style="background:${statusColorMap[d.label] || '#6b7280'}"></div><span>${d.label} (${d.pct}%)</span></div>`
        ).join('');
      }
    }
  } catch (error) {
    console.error('Error rendering admin dashboard charts:', error);
  }
}

async function renderAnalyticsCharts() {
  const token = localStorage.getItem('authToken');
  const headers = { 'Authorization': `Bearer ${token}` };

  // Helper to render a line chart in an SVG
  function drawLineChart(svgId, data, labels, color) {
    const svg = document.getElementById(svgId);
    if (!svg || !data.length) return;
    const w = 500, h = 180, pad = 40, padR = 20, padB = 30;
    const maxV = Math.max(...data, 1);
    const xFn = (i) => pad + (i / Math.max(data.length - 1, 1)) * (w - pad - padR);
    const yFn = (v) => h - padB - ((v / maxV) * (h - pad - padB));
    
    let s = '';
    for (let n = 0; n <= 4; n++) {
      const val = Math.round(maxV * n / 4);
      const yv = yFn(val);
      s += `<line x1="${pad}" y1="${yv}" x2="${w-padR}" y2="${yv}" stroke="#e5e7eb" stroke-width="1"/>`;
      s += `<text x="${pad-8}" y="${yv+4}" text-anchor="end" fill="#9ca3af" font-size="10">${val}</text>`;
    }
    const pts = data.map((v,i) => `${xFn(i)},${yFn(v)}`).join(' ');
    s += `<polygon points="${xFn(0)},${h-padB} ${pts} ${xFn(data.length-1)},${h-padB}" fill="${color}14"/>`;
    s += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += data.map((v,i) => `<circle cx="${xFn(i)}" cy="${yFn(v)}" r="3.5" fill="${color}" stroke="#fff" stroke-width="1.5"/>`).join('');
    s += labels.map((l,i) => `<text x="${xFn(i)}" y="${h-8}" text-anchor="middle" fill="#9ca3af" font-size="10">${l}</text>`).join('');
    svg.innerHTML = s;
  }

  // Helper for donut chart
  function drawDonut(svgId, legendId, data) {
    const svg = document.getElementById(svgId);
    const legend = document.getElementById(legendId);
    if (!svg || !data.length) return;
    let cumAngle = 0;
    const innerR = 28, outerR = 45;
    const paths = data.map(d => {
      const angle = (d.pct / 100) * 360;
      if (angle === 0) return '';
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

  try {
    // Fetch all data in parallel from existing API endpoints
    const [monthlyData, industryData, geoData, funnelData] = await Promise.all([
      apiCall('/admin/dashboard/monthly-service-requests'),
      apiCall('/admin/dashboard/industry-distribution'),
      apiCall('/admin/dashboard/geographic-distribution'),
      apiCall('/admin/dashboard/conversion-funnel'),
    ]);

    // Service Requests line chart — from monthly data
    if (monthlyData.length) {
      drawLineChart('analyticsLineChart1',
        monthlyData.map(d => d.count),
        monthlyData.map(d => d.month),
        '#0088FF');
    }

    // Webinar Registrations line chart — fetch registrations and group by month
    try {
      const webRegs = await apiCall('/admin/webinar-registrations');
      const monthCounts = {};
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      webRegs.forEach(r => {
        const d = new Date(r.registered_at);
        const key = monthNames[d.getMonth()];
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      });
      // Use same months as service requests for alignment
      const webLabels = monthlyData.map(d => d.month);
      const webValues = webLabels.map(m => monthCounts[m] || 0);
      drawLineChart('analyticsLineChart2', webValues, webLabels, '#8b5cf6');
    } catch(e) {
      console.error('Webinar line chart error:', e);
    }

    // Status donut — from conversion funnel
    const statusColors = ['#0088FF','#0ea5e9','#d97706','#059669'];
    if (funnelData.stages && funnelData.stages.length) {
      const total = funnelData.stages[0].count || 1;
      drawDonut('analyticsStatusPie', 'analyticsStatusLegend',
        funnelData.stages.map((s, i) => ({
          label: s.label, pct: s.percentage, count: s.count, color: statusColors[i] || '#e5e7eb'
        }))
      );
    }

    // Industry donut — from industry distribution
    const indColors = ['#0088FF','#8b5cf6','#d97706','#059669','#ef4444','#ec4899'];
    if (industryData.length) {
      drawDonut('analyticsIndustryPie', 'analyticsIndustryLegend',
        industryData.slice(0, 6).map((d, i) => ({
          label: d.industry, pct: d.percentage, count: d.count, color: indColors[i] || '#e5e7eb'
        }))
      );
    }

    // Country horizontal bar chart — from geographic distribution
    if (geoData.length) {
      const cMax = Math.max(...geoData.map(d => d.count), 1);
      const countryChart = document.getElementById('analyticsCountryChart');
      if (countryChart) {
        countryChart.innerHTML = geoData.slice(0, 8).map(d => `
          <div style="display:flex;align-items:center;margin-bottom:14px">
            <div style="font-size:12px;color:#374151;width:100px;flex-shrink:0">${d.country}</div>
            <div style="flex:1;height:14px;background:#e5e7eb;border-radius:4px;margin:0 10px;position:relative">
              <div style="height:100%;border-radius:4px;background:linear-gradient(90deg,#0088FF,#0ea5e9);width:${(d.count/cMax)*100}%"></div>
            </div>
            <div style="font-size:12px;font-weight:600;color:#374151;width:30px;text-align:right">${d.count}</div>
          </div>`).join('');
      }
    }

  } catch (error) {
    console.error('Analytics data load error:', error);
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
    s += `<polygon points="${xFn(0)},${h-padB} ${pts} ${xFn(data.length-1)},${h-padB}" fill="rgba(0,136,255,0.08)"/>`;
    s += `<polyline points="${pts}" fill="none" stroke="#0088FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += data.map((v,i) => `<circle cx="${xFn(i)}" cy="${yFn(v)}" r="4" fill="#0088FF" stroke="#fff" stroke-width="2"/>`).join('');
    s += labels.map((l,i) => `<text x="${xFn(i)}" y="${h-8}" text-anchor="middle" fill="#9ca3af" font-size="10">${l}</text>`).join('');
    svg.innerHTML = s;
  }

  // Satisfaction Score Distribution donut
  const distData = [
    {label:'5 Stars',pct:68,color:'#059669'},
    {label:'4 Stars',pct:22,color:'#0ea5e9'},
    {label:'3 Stars',pct:7,color:'#d97706'},
    {label:'2 Stars',pct:2,color:'#ef4444'},
    {label:'1 Star',pct:1,color:'#dc2626'},
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

  const fbNameVal = document.getElementById('fbName').value;
  const fbEmailVal = document.getElementById('fbEmail').value;

  // Clear previous inline errors for feedback form
  clearFieldErrors('#feedbackForm');

  // Validate optional name/email fields with inline errors
  if (fbNameVal && !isValidName(fbNameVal)) {
    showFieldError('fbName', 'Name must contain only letters (no numbers or special characters).');
    return;
  }
  if (fbEmailVal && !isValidEmail(fbEmailVal)) {
    showFieldError('fbEmail', 'Enter a valid email (e.g. you@gmail.com).');
    return;
  }

  const payload = {
    token: currentFeedbackToken,
    rating: rating,
    experience_rating: expRating,
    recommendation_score: nps,
    liked_most: document.getElementById('fbLikedMost').value || null,
    improvements: document.getElementById('fbImprovements').value || null,
    comments: document.getElementById('fbComments').value || null,
    respondent_name: fbNameVal || null,
    respondent_email: fbEmailVal || null,
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
    s += `<polygon points="${xFn(0)},${h-padB} ${pts} ${xFn(data.length-1)},${h-padB}" fill="rgba(0,136,255,0.08)"/>`;
    s += `<polyline points="${pts}" fill="none" stroke="#0088FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += data.map((v,i) => `<circle cx="${xFn(i)}" cy="${yFn(v)}" r="4" fill="#0088FF" stroke="#fff" stroke-width="2"/>`).join('');
  } else if (data.length === 1) {
    s += `<circle cx="${xFn(0)}" cy="${yFn(data[0])}" r="5" fill="#0088FF" stroke="#fff" stroke-width="2"/>`;
  }
  s += labels.map((l,i) => `<text x="${xFn(i)}" y="${h-8}" text-anchor="middle" fill="#9ca3af" font-size="10">${l}</text>`).join('');
  svg.innerHTML = s;
}

function renderSatDistFromData(distribution) {
  const pieEl = document.getElementById('satDistPie');
  const legendEl = document.getElementById('satDistLegend');
  if (!pieEl || !distribution.length) return;

  const colors = ['#059669','#0ea5e9','#d97706','#ef4444','#dc2626'];
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

  // Update table headers to match richer data
  const thead = document.querySelector('#admin-satisfaction .admin-data-table thead tr');
  if (thead) {
    thead.innerHTML = `
      <th>ID</th><th>Name</th><th>Type</th><th>Form Rating</th><th>First Impression</th>
      <th>How They Found Us</th><th>Why CyberNova</th><th>Comments</th><th>NPS</th><th>Date</th>`;
  }

  tbody.innerHTML = feedback.map(f => {
    const formStars = '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating);
    const expStars = f.experience_rating ? '★'.repeat(f.experience_rating) + '☆'.repeat(5 - f.experience_rating) : '—';
    const date = new Date(f.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const typeLabel = f.feedback_type === 'webinar'
      ? '<span style="background:rgba(99,102,241,0.15);color:#818cf8;padding:2px 8px;border-radius:10px;font-size:11px">Webinar</span>'
      : '<span style="background:rgba(0,136,255,0.15);color:#60a5fa;padding:2px 8px;border-radius:10px;font-size:11px">Service</span>';
    return `<tr>
      <td style="color:var(--muted);font-size:12px">FB-${String(f.id).padStart(3,'0')}</td>
      <td>${f.respondent_name || '<span style="color:var(--muted)">Anonymous</span>'}</td>
      <td>${typeLabel}</td>
      <td style="color:#f59e0b;letter-spacing:1px">${formStars}</td>
      <td style="color:#f59e0b;letter-spacing:1px">${expStars}</td>
      <td style="font-size:13px">${f.liked_most || '<span style="color:var(--muted)">—</span>'}</td>
      <td style="font-size:13px;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${f.improvements || ''}">${f.improvements || '<span style="color:var(--muted)">—</span>'}</td>
      <td style="font-size:13px;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${f.comments || ''}">${f.comments || '<span style="color:var(--muted)">—</span>'}</td>
      <td style="font-size:13px">${f.recommendation_score ? `<strong style="color:var(--accent)">${f.recommendation_score}/10</strong>` : '<span style="color:var(--muted)">—</span>'}</td>
      <td style="color:var(--muted);font-size:12px">${date}</td>
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
  
  // Clear previous inline errors
  clearFieldErrors('#request');

  // Validation — show inline errors on the specific field
  let hasError = false;

  if (!name) {
    showFieldError('fname', 'Full Name is required.');
    hasError = true;
  } else if (!isValidName(name)) {
    showFieldError('fname', 'Name must contain only letters — no numbers or special characters.');
    hasError = true;
  }

  if (!email) {
    showFieldError('femail', 'Email address is required.');
    hasError = true;
  } else if (!isValidEmail(email)) {
    showFieldError('femail', 'Enter a valid email (e.g. you@gmail.com).');
    hasError = true;
  }

  if (!org) { showFieldError('forg', 'Organization is required.'); hasError = true; }
  if (!country) { showFieldError('fcountry', 'Country is required.'); hasError = true; }
  if (!industry) { showFieldError('findustry', 'Industry sector is required.'); hasError = true; }

  if (services.length === 0) {
    showToast('Please select at least one service.', 'error');
    hasError = true;
  }

  if (hasError) return;
  
  const submitBtn = document.querySelector('#request .form-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  
  try {
    const result = await apiCall('/service-requests', {
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

    console.log('Service request result:', result);
    console.log('Feedback URL:', result?.feedback_url);

    // Show success message
    const successEl = document.getElementById('successMsg');
    successEl.innerHTML = 'Your request has been received. A CyberNova analyst will contact you within 24 hours.';
    successEl.style.display = 'block';
    showToast('Assessment request submitted successfully.');
    
    setTimeout(() => { successEl.style.display = 'none'; }, 8000);

    // Open satisfaction modal if feedback token is available
    if (result && result.feedback_url) {
      const token = result.feedback_url.split('feedback=')[1];
      const serviceNames = services.join(', ');
      
      setTimeout(() => {
        openSatisfactionModal({
          type: 'service',
          token: token,
          serviceName: serviceNames,
          fullName: name,
          email: email
        });
      }, 1500);
    }

    // Reset form and clear inline errors
    clearFieldErrors('#request');
    document.getElementById('fname').value = '';
    document.getElementById('femail').value = '';
    document.getElementById('fphone').value = '';
    document.getElementById('forg').value = '';
    document.getElementById('fcountry').value = '';
    document.getElementById('findustry').value = '';
    document.getElementById('fnotes').value = '';
    serviceCheckboxes.forEach(cb => cb.checked = false);

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
    console.log('Loading webinars from API...');
    webinarsData = await apiCall('/webinars');
    console.log('Webinars loaded:', webinarsData.length, 'webinars');
    renderWebinars();
  } catch (error) {
    console.error('Error loading webinars:', error);
    // Don't show toast on initial load to avoid annoying users
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
          Register ${webinar.price ? `— P${webinar.price}` : 'Free'} →
        </button>
      </div>
    </div>
  `).join('');
}

// Store current webinar data for modal
let currentWebinar = null;

function openWebinarModal(webinarId, webinarTitle, webinarDate, webinarTime, price) {
  console.log('openWebinarModal called with:', { webinarId, webinarTitle, webinarDate, webinarTime, price });
  
  // Get the modal element first
  const modalEl = document.getElementById('webinarModal');
  if (!modalEl) {
    console.error('ERROR: webinarModal element not found in DOM!');
    alert('Error: Registration modal not found. Please refresh the page.');
    return;
  }
  
  // Store current webinar data
  currentWebinar = { id: webinarId, title: webinarTitle, price: price };
  
  // Update modal content
  const titleEl = document.getElementById('webinarTitle');
  const detailsEl = document.getElementById('webinarDetails');
  const btnTextEl = document.getElementById('webinarBtnText');
  
  if (titleEl) titleEl.textContent = webinarTitle;
  if (detailsEl) detailsEl.textContent = `${webinarDate} • ${webinarTime}`;
  
  // Update button text with price
  if (btnTextEl) {
    btnTextEl.textContent = price ? `Register — P${price}` : 'Register Free';
  }
  
  // Reset form
  const formEl = document.getElementById('webinarRegistrationForm');
  if (formEl) formEl.reset();
  
  // Hide previous messages
  const successEl = document.getElementById('webinarSuccess');
  const errorEl = document.getElementById('webinarError');
  if (successEl) successEl.style.display = 'none';
  if (errorEl) errorEl.style.display = 'none';
  
  // Clear any previous field errors
  clearFieldErrors('#webinarRegistrationForm');
  
  // Show modal - use both style and attribute to ensure it works
  modalEl.style.display = 'flex';
  modalEl.style.visibility = 'visible';
  modalEl.style.opacity = '1';
  
  console.log('Modal display set to:', modalEl.style.display);
  console.log('Modal element:', modalEl);
}

function closeWebinarModal() {
  const modalEl = document.getElementById('webinarModal');
  if (modalEl) {
    modalEl.style.display = 'none';
  }
  currentWebinar = null;
  clearFieldErrors('#webinarRegistrationForm');
}

async function submitWebinarRegistration(event) {
  event.preventDefault();
  
  const submitBtn = document.getElementById('webinarSubmitBtn');
  const btnText = document.getElementById('webinarBtnText');
  const successMsg = document.getElementById('webinarSuccess');
  const errorMsg = document.getElementById('webinarError');
  
  // Hide previous messages and clear inline errors
  successMsg.style.display = 'none';
  errorMsg.style.display = 'none';
  clearFieldErrors('#webinarRegistrationForm');
  
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

  // Validate name and email with inline errors
  let hasError = false;

  if (!formData.full_name) {
    showFieldError('wFullName', 'Full Name is required.');
    hasError = true;
  } else if (!isValidName(formData.full_name)) {
    showFieldError('wFullName', 'Name must contain only letters — no numbers or special characters.');
    hasError = true;
  }

  if (!formData.email) {
    showFieldError('wEmail', 'Email address is required.');
    hasError = true;
  } else if (!isValidEmail(formData.email)) {
    showFieldError('wEmail', 'Enter a valid email (e.g. you@gmail.com).');
    hasError = true;
  }

  if (hasError) return;
  
  // Disable button and show loading
  submitBtn.disabled = true;
  btnText.textContent = 'Registering...';
  
  try {
    const result = await apiCall('/webinar-registrations', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    
    console.log('Webinar registration result:', result);
    
    // Show success
    successMsg.style.display = 'block';
    showToast(`Registered for: ${currentWebinar.title}`);
    
    // Capture all needed data BEFORE closing modal (closeWebinarModal nulls currentWebinar)
    const webinarTitle = currentWebinar.title;
    const satisfactionData = (result && result.feedback_url) ? {
      type: 'webinar',
      token: result.feedback_url.split('feedback=')[1],
      webinarTitle: webinarTitle,
      fullName: formData.full_name,
      email: formData.email
    } : null;

    // Reload webinars to update counts
    await loadWebinars();

    // Close modal after 2 seconds, then immediately open satisfaction modal
    setTimeout(() => {
      closeWebinarModal();
      if (satisfactionData) {
        openSatisfactionModal(satisfactionData);
      }
    }, 2000);
    
  } catch (error) {
    // Show error
    errorMsg.textContent = error.message.includes('already registered') 
      ? 'You have already registered for this webinar.' 
      : error.message;
    errorMsg.style.display = 'block';
    showToast('Registration failed', 'error');
    
    // Re-enable button
    submitBtn.disabled = false;
    const btnTextContent = currentWebinar.price ? `Register — P${currentWebinar.price}` : 'Register Free';
    btnText.textContent = btnTextContent;
  }
}

// Handles both legacy calls (btn, titleString) and dynamic calls (btn, id, title, price)
async function registerEvent(btn, webinarIdOrTitle, webinarTitle, price, retried = false) {
  console.log('registerEvent called:', { webinarIdOrTitle, webinarTitle, price, webinarsDataLength: webinarsData.length });
  
  let webinarData = null;

  if (typeof webinarIdOrTitle === 'number') {
    // Called from dynamically loaded webinar cards with numeric ID
    webinarData = webinarsData.find(w => w.id === webinarIdOrTitle);
  } else if (typeof webinarIdOrTitle === 'string') {
    // Called from hardcoded HTML buttons with title string — match by partial title
    webinarData = webinarsData.find(w =>
      w.title.toLowerCase().includes(webinarIdOrTitle.toLowerCase()) ||
      webinarIdOrTitle.toLowerCase().includes(w.title.toLowerCase().split(':')[0].trim().toLowerCase())
    );
  }

  console.log('Found webinarData:', webinarData);

  if (webinarData) {
    console.log('About to call openWebinarModal...');
    try {
      openWebinarModal(webinarData.id, webinarData.title, webinarData.event_date, webinarData.event_time, webinarData.price);
      console.log('openWebinarModal completed successfully');
    } catch (error) {
      console.error('Error in openWebinarModal:', error);
      alert('Error opening registration form: ' + error.message);
    }
  } else if (!retried) {
    // Webinars not yet loaded — fetch them first then retry once
    try {
      console.log('Webinar not found, loading webinars...');
      await loadWebinars();
      await registerEvent(btn, webinarIdOrTitle, webinarTitle, price, true);
    } catch (e) {
      console.error('Error loading webinars:', e);
      showToast('Could not load event details. Please try again.', 'error');
    }
  } else {
    console.error('Webinar not found after retry:', webinarIdOrTitle);
    showToast('Event not found. Please refresh the page and try again.', 'error');
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

  // Show loading state on the login button
  const loginBtn = document.querySelector('#login .form-submit');
  const originalBtnText = loginBtn.textContent;
  loginBtn.disabled = true;
  loginBtn.textContent = 'Connecting to server...';
  document.getElementById('loginErr').style.display = 'none';
  
  try {
    console.log('Sending login request to:', `${API_BASE_URL}/admin/auth/login`);
    loginBtn.textContent = 'Signing in...';
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
      loginBtn.disabled = false;
      loginBtn.textContent = originalBtnText;
      return;
    }
    
    const data = await response.json();
    console.log('Login successful, token received');
    localStorage.setItem('authToken', data.access_token);
    loginBtn.textContent = 'Loading dashboard...';
    showToast('Login successful!');
    showPage('dashboard');
    
    // Restore button for future logins
    loginBtn.disabled = false;
    loginBtn.textContent = originalBtnText;
    
  } catch (error) {
    console.error('Login error:', error);
    document.getElementById('loginErr').style.display = 'block';
    showToast('Login failed: ' + error.message, 'error');
    loginBtn.disabled = false;
    loginBtn.textContent = originalBtnText;
  }
}

// ============================================
// DASHBOARD - LOAD ALL DATA
// ============================================

async function loadDashboard() {
  loadSavedSettings();
  try {
    await Promise.all([
      renderAdminDashboard(),
      loadDashboardSummary(),
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
    
    // Update Overview KPI cards (by ID)
    const ovReq = document.getElementById('ovKpiRequests');
    const ovWeb = document.getElementById('ovKpiWebinars');
    const ovConv = document.getElementById('ovKpiConversion');
    const ovSat = document.getElementById('ovKpiSatisfaction');
    if (ovReq) {
      ovReq.textContent = data.total_service_requests;
      ovReq.closest('.kpi-info').querySelector('.change').textContent = `${data.change_service_requests >= 0 ? '↑' : '↓'} ${Math.abs(data.change_service_requests)}% from last month`;
    }
    if (ovWeb) {
      ovWeb.textContent = data.webinar_registrations;
      ovWeb.closest('.kpi-info').querySelector('.change').textContent = `${data.change_webinar_registrations >= 0 ? '↑' : '↓'} ${Math.abs(data.change_webinar_registrations)}% from last month`;
    }
    if (ovConv) {
      ovConv.textContent = `${data.conversion_rate}%`;
      ovConv.closest('.kpi-info').querySelector('.change').textContent = `${data.change_conversion_rate >= 0 ? '↑' : '↓'} ${Math.abs(data.change_conversion_rate)}pp from last month`;
    }
    if (ovSat) {
      ovSat.textContent = `${data.avg_satisfaction} / 5`;
      ovSat.closest('.kpi-info').querySelector('.change').textContent = `${data.change_satisfaction >= 0 ? '↑' : '↓'} ${Math.abs(data.change_satisfaction)} from last month`;
    }

    // Also update Analytics page KPI cards
    const anReq = document.getElementById('analyticsRequests');
    const anWeb = document.getElementById('analyticsWebinars');
    const anClients = document.getElementById('analyticsNewClients');
    const anSat = document.getElementById('analyticsSatisfaction');
    if (anReq) {
      anReq.textContent = data.total_service_requests;
      const changeEl = anReq.closest('.admin-kpi-card').querySelector('.admin-kpi-change');
      if (changeEl) { changeEl.textContent = `${data.change_service_requests >= 0 ? '↑' : '↓'} ${Math.abs(data.change_service_requests)}% from last month`; changeEl.className = `admin-kpi-change ${data.change_service_requests >= 0 ? 'up' : 'down'}`; }
    }
    if (anWeb) {
      anWeb.textContent = data.webinar_registrations;
      const changeEl = anWeb.closest('.admin-kpi-card').querySelector('.admin-kpi-change');
      if (changeEl) { changeEl.textContent = `${data.change_webinar_registrations >= 0 ? '↑' : '↓'} ${Math.abs(data.change_webinar_registrations)}% from last month`; changeEl.className = `admin-kpi-change ${data.change_webinar_registrations >= 0 ? 'up' : 'down'}`; }
    }
    if (anClients) {
      // Derive new clients from confirmed contracts (approximate)
      const confirmedData = await apiCall('/admin/dashboard/conversion-funnel');
      const confirmed = confirmedData.stages.find(s => s.label === 'Completed');
      anClients.textContent = confirmed ? confirmed.count : data.total_service_requests;
      const changeEl = anClients.closest('.admin-kpi-card').querySelector('.admin-kpi-change');
      if (changeEl) { changeEl.textContent = `${data.change_conversion_rate >= 0 ? '↑' : '↓'} ${Math.abs(data.change_conversion_rate)}% from last month`; changeEl.className = `admin-kpi-change ${data.change_conversion_rate >= 0 ? 'up' : 'down'}`; }
    }
    if (anSat) {
      anSat.innerHTML = `${data.avg_satisfaction} <span style="font-size:16px;font-weight:400;color:#6b7280">/ 5</span>`;
      const changeEl = anSat.closest('.admin-kpi-card').querySelector('.admin-kpi-change');
      if (changeEl) { changeEl.textContent = `${data.change_satisfaction >= 0 ? '↑' : '↓'} ${Math.abs(data.change_satisfaction)} from last month`; changeEl.className = `admin-kpi-change ${data.change_satisfaction >= 0 ? 'up' : 'down'}`; }
    }
    
  } catch (error) {
    console.error('Error loading dashboard summary:', error);
  }
}

// loadMonthlyRequests and loadIndustryDistribution are now handled by renderAdminDashboard()
// and renderAnalyticsCharts() respectively, so no separate functions needed.

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
    renderConversionFunnel(data);
  } catch (error) {
    console.error('Error loading conversion funnel:', error);
  }
}

function renderConversionFunnel(data) {
  const stageColors = {
    'Submitted': 'stage-submitted',
    'Reviewed': 'stage-reviewed',
    'In Progress': 'stage-in-progress',
    'Completed': 'stage-completed'
  };

  // Render funnel bars on Overview page
  const convChart = document.getElementById('convChart');
  if (convChart) {
    convChart.innerHTML = data.stages.map(d => `
      <div class="conversion-row" title="${d.label}: ${d.count} of ${data.total_requests} (${d.percentage}%)">
        <div class="conv-label">${d.label}</div>
        <div class="conv-bar-wrap">
          <div class="conv-bar-fill ${stageColors[d.label] || ''}" style="width:${d.percentage}%">
            <span>${d.count}</span>
          </div>
        </div>
        <div class="conv-pct">${d.percentage}%</div>
      </div>
    `).join('');
  }

  // Update Overview KPI card with live conversion rate
  const ovConv = document.getElementById('ovKpiConversion');
  if (ovConv) ovConv.textContent = `${data.conversion_rate}%`;
}

async function loadActivityLog() {
  try {
    const activities = await apiCall('/admin/activity-log');
    renderActivityLog(activities);
  } catch (error) {
    console.error('Error loading activity log:', error);
    const container = document.getElementById('analyticsActivityTable');
    if (container) container.innerHTML = '<div class="empty-state">Unable to load activity log</div>';
  }
}

function renderActivityLog(activities) {
  const container = document.getElementById('analyticsActivityTable');
  if (!container) return;

  if (!activities.length) {
    container.innerHTML = '<div class="empty-state">No activity recorded yet</div>';
    return;
  }

  const iconMap = {
    service_request: '<svg viewBox="0 0 24 24" fill="none" stroke="#0088FF" stroke-width="2" style="width:16px;height:16px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    status_update: '<svg viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" style="width:16px;height:16px"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    webinar_registration: '<svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" style="width:16px;height:16px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
    feedback: '<svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" style="width:16px;height:16px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  };

  const rows = activities.map(a => {
    const icon = iconMap[a.activity_type] || iconMap.service_request;
    const dt = new Date(a.created_at);
    const dateStr = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      + ', ' + dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    return `<tr>
      <td>${icon}</td>
      <td>${a.title}</td>
      <td>${a.details || '-'}</td>
      <td>${dateStr}</td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <table class="admin-data-table">
      <thead><tr><th style="width:30px"></th><th>Activity</th><th>Details</th><th>Date &amp; Time</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ============================================
// WEBINAR MANAGEMENT (ADMIN)
// ============================================

async function loadAdminWebinars() {
  try {
    const webinars = await apiCall('/webinars');
    renderAdminWebinarsTable(webinars);
  } catch (error) {
    console.error('Error loading admin webinars:', error);
    const tbody = document.getElementById('webinarsTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#ef4444">Failed to load webinars</td></tr>';
  }
}

function renderAdminWebinarsTable(webinars) {
  const tbody = document.getElementById('webinarsTableBody');
  if (!tbody) return;

  if (!webinars.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#6b7280">No webinars yet. Click "Create New Webinar" to add one.</td></tr>';
    return;
  }

  tbody.innerHTML = webinars.map(w => {
    const priceDisplay = w.price && w.price > 0 ? `P ${w.price}` : 'Free';
    const capacityDisplay = w.capacity || 'Unlimited';
    return `<tr>
      <td>${w.id}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${w.title}</td>
      <td><span class="admin-badge" style="background:#eff6ff;color:#0088FF">${w.event_type}</span></td>
      <td>${w.event_date}</td>
      <td>${w.event_time}</td>
      <td>${priceDisplay}</td>
      <td>${capacityDisplay}</td>
      <td>${w.registration_count}</td>
      <td>
        <button class="admin-action-btn" onclick="editWebinar(${w.id})" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="admin-action-btn" onclick="deleteWebinar(${w.id}, '${w.title.replace(/'/g, "\\'")}', ${w.registration_count})" title="Delete" style="color:#ef4444">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    </tr>`;
  }).join('');
}

function openWebinarModal(webinarId = null) {
  const modal = document.getElementById('adminWebinarModal');
  const form = document.getElementById('adminWebinarForm');
  const title = document.getElementById('webinarModalTitle');
  
  if (!modal || !form) return;
  
  form.reset();
  document.getElementById('wbId').value = '';
  
  // Set minimum date to today to prevent past dates
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('wbDate').setAttribute('min', today);
  
  if (webinarId) {
    // Edit mode - fetch webinar data
    title.textContent = 'Edit Webinar';
    apiCall('/webinars')
      .then(webinars => {
        const webinar = webinars.find(w => w.id === webinarId);
        if (webinar) {
          document.getElementById('wbId').value = webinar.id;
          document.getElementById('wbTitle').value = webinar.title;
          document.getElementById('wbType').value = webinar.event_type;
          document.getElementById('wbDescription').value = webinar.description;
          document.getElementById('wbDate').value = webinar.event_date;
          document.getElementById('wbTime').value = webinar.event_time;
          document.getElementById('wbTimezone').value = webinar.timezone;
          document.getElementById('wbPrice').value = webinar.price || 0;
          document.getElementById('wbCapacity').value = webinar.capacity || '';
          document.getElementById('wbGradient').value = webinar.banner_gradient || '';
          document.getElementById('wbTagColor').value = webinar.tag_color || '';
        }
      });
  } else {
    // Create mode
    title.textContent = 'Create New Webinar';
  }
  
  modal.style.display = 'flex';
}

function closeAdminWebinarModal() {
  const modal = document.getElementById('adminWebinarModal');
  if (modal) modal.style.display = 'none';
}

async function saveWebinar(event) {
  event.preventDefault();
  
  const webinarId = document.getElementById('wbId').value;
  const data = {
    title: document.getElementById('wbTitle').value,
    description: document.getElementById('wbDescription').value,
    event_type: document.getElementById('wbType').value,
    event_date: document.getElementById('wbDate').value,
    event_time: document.getElementById('wbTime').value,
    timezone: document.getElementById('wbTimezone').value,
    price: parseFloat(document.getElementById('wbPrice').value) || null,
    capacity: parseInt(document.getElementById('wbCapacity').value) || null,
    banner_gradient: document.getElementById('wbGradient').value || null,
    tag_color: document.getElementById('wbTagColor').value || null
  };
  
  try {
    const url = webinarId 
      ? `/admin/webinars/${webinarId}`
      : '/admin/webinars';
    const method = webinarId ? 'PUT' : 'POST';
    
    const response = await apiCall(url, {
      method: method,
      body: JSON.stringify(data)
    });
    // apiCall already parsed JSON and threw on error, so treat response as success data
    const result = response;
    
    showToast(webinarId ? 'Webinar updated successfully' : 'Webinar created successfully');
    closeAdminWebinarModal();
    await loadAdminWebinars();
    
    // Reload webinars on events page if it's visible
    if (document.getElementById('events').classList.contains('active')) {
      await loadWebinars();
    }
  } catch (error) {
    console.error('Error saving webinar:', error);
    showToast(error.message || 'Failed to save webinar', 'error');
  }
}

async function editWebinar(webinarId) {
  openWebinarModal(webinarId);
}

async function deleteWebinar(webinarId, title, registrationCount) {
  const confirmMsg = registrationCount > 0
    ? `Delete "${title}"?\n\nWarning: This webinar has ${registrationCount} registration(s). All registrations will be permanently deleted.`
    : `Delete "${title}"?`;
  
  if (!confirm(confirmMsg)) return;
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/admin/webinars/${webinarId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to delete webinar' }));
      throw new Error(error.detail || 'Failed to delete webinar');
    }
    
    showToast('Webinar deleted successfully');
    await loadAdminWebinars();
    
    // Reload webinars on events page if it's visible
    if (document.getElementById('events').classList.contains('active')) {
      await loadWebinars();
    }
  } catch (error) {
    console.error('Error deleting webinar:', error);
    showToast(error.message || 'Failed to delete webinar', 'error');
  }
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
    renderOverviewServiceRequests(data); // Also update Overview page table
  } catch (error) {
    console.error('Error loading service requests:', error);
  }
}

function renderOverviewServiceRequests(requests) {
  const container = document.getElementById('overviewServiceTable');
  if (!container) return;
  
  // Show only the 5 most recent requests
  const recent = requests.slice(0, 5);
  
  if (recent.length === 0) {
    container.innerHTML = '<div class="empty-state">No service requests yet</div>';
    return;
  }
  
  container.innerHTML = `
    <table class="admin-data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Client Name</th>
          <th>Service</th>
          <th>Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${recent.map(req => `
          <tr>
            <td>SR-${String(req.id).padStart(3, '0')}</td>
            <td>${req.full_name}</td>
            <td>${req.services[0] || 'N/A'}</td>
            <td>${new Date(req.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
            <td><span class="status-badge status-${req.status}">${req.status.replace(/_/g, ' ')}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Store all requests for filtering
let allServiceRequests = [];

function renderServiceRequestsTable(requests) {
  const container = document.getElementById('serviceRequestsTable');
  if (!container) return;
  
  // Store all requests globally for filtering
  allServiceRequests = requests;
  
  if (requests.length === 0) {
    container.innerHTML = '<div class="empty-state">No service requests yet</div>';
    return;
  }
  
  container.innerHTML = `
    <table class="admin-data-table">
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
            <td><span class="status-badge ${req.status}">${req.status.replace(/_/g, ' ')}</span></td>
            <td>
              <select class="status-select" onchange="updateRequestStatus(${req.id}, this.value); this.value='';">
                <option value="">Change Status</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  // Attach filter event listeners
  attachServiceRequestFilters();
}

function attachServiceRequestFilters() {
  const searchInput = document.getElementById('srSearch');
  const statusFilter = document.getElementById('srStatusFilter');
  const serviceFilter = document.getElementById('srServiceFilter');
  
  if (searchInput) {
    searchInput.removeEventListener('input', filterServiceRequests);
    searchInput.addEventListener('input', filterServiceRequests);
  }
  if (statusFilter) {
    statusFilter.removeEventListener('change', filterServiceRequests);
    statusFilter.addEventListener('change', filterServiceRequests);
  }
  if (serviceFilter) {
    serviceFilter.removeEventListener('change', filterServiceRequests);
    serviceFilter.addEventListener('change', filterServiceRequests);
  }
}

function filterServiceRequests() {
  const searchTerm = document.getElementById('srSearch')?.value.toLowerCase() || '';
  const statusValue = document.getElementById('srStatusFilter')?.value || '';
  const serviceValue = document.getElementById('srServiceFilter')?.value || '';
  
  let filtered = allServiceRequests.filter(req => {
    // Search filter
    const matchesSearch = !searchTerm || 
      req.full_name.toLowerCase().includes(searchTerm) ||
      req.email.toLowerCase().includes(searchTerm) ||
      req.organization_name.toLowerCase().includes(searchTerm) ||
      req.services.some(s => s.toLowerCase().includes(searchTerm));
    
    // Status filter
    const matchesStatus = !statusValue || req.status === statusValue;
    
    // Service filter
    const matchesService = !serviceValue || req.services.includes(serviceValue);
    
    return matchesSearch && matchesStatus && matchesService;
  });
  
  // Re-render with filtered data
  const container = document.getElementById('serviceRequestsTable');
  if (!container) return;
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No matching service requests found</div>';
    return;
  }
  
  container.innerHTML = `
    <table class="admin-data-table">
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
        ${filtered.map(req => `
          <tr>
            <td>${req.full_name}</td>
            <td>${req.organization_name}</td>
            <td>${req.country}</td>
            <td>${req.industry_sector}</td>
            <td>${req.services.join(', ')}</td>
            <td>${new Date(req.created_at).toLocaleDateString()}</td>
            <td><span class="status-badge ${req.status}">${req.status.replace(/_/g, ' ')}</span></td>
            <td>
              <select class="status-select" onchange="updateRequestStatus(${req.id}, this.value); this.value='';">
                <option value="">Change Status</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
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
    renderOverviewWebinarRegistrations(data); // Also update Overview page table
  } catch (error) {
    console.error('Error loading webinar registrations:', error);
  }
}

function renderOverviewWebinarRegistrations(registrations) {
  const container = document.getElementById('overviewWebinarTable');
  if (!container) return;
  
  // Show only the 5 most recent registrations
  const recent = registrations.slice(0, 5);
  
  if (recent.length === 0) {
    container.innerHTML = '<div class="empty-state">No webinar registrations yet</div>';
    return;
  }
  
  container.innerHTML = `
    <table class="admin-data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Attendee</th>
          <th>Webinar</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${recent.map(reg => `
          <tr>
            <td>WR-${String(reg.id).padStart(3, '0')}</td>
            <td>${reg.full_name}</td>
            <td>${reg.webinar_title}</td>
            <td>${new Date(reg.registered_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Store all webinar registrations for filtering
let allWebinarRegistrations = [];

function renderWebinarRegistrationsTable(registrations) {
  const container = document.getElementById('webinarRegistrationsTable');
  if (!container) return;
  
  // Store globally for filtering
  allWebinarRegistrations = registrations;
  
  if (registrations.length === 0) {
    container.innerHTML = '<div class="empty-state">No webinar registrations yet</div>';
    return;
  }
  
  container.innerHTML = `
    <table class="admin-data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Registrant Name</th>
          <th>Email</th>
          <th>Webinar</th>
          <th>Type</th>
          <th>Registration Date</th>
        </tr>
      </thead>
      <tbody>
        ${registrations.map(reg => `
          <tr>
            <td>WR-${String(reg.id).padStart(3, '0')}</td>
            <td>${reg.full_name}</td>
            <td>${reg.email}</td>
            <td>${reg.webinar_title}</td>
            <td>${reg.webinar_type || 'Webinar'}</td>
            <td>${new Date(reg.registered_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  // Attach filter event listeners
  attachWebinarRegistrationFilters();
}

function attachWebinarRegistrationFilters() {
  const searchInput = document.getElementById('wrSearch');
  const typeFilter = document.getElementById('wrTypeFilter');
  const dateFilter = document.getElementById('wrDateFilter');
  
  if (searchInput) {
    searchInput.removeEventListener('input', filterWebinarRegistrations);
    searchInput.addEventListener('input', filterWebinarRegistrations);
  }
  if (typeFilter) {
    typeFilter.removeEventListener('change', filterWebinarRegistrations);
    typeFilter.addEventListener('change', filterWebinarRegistrations);
  }
  if (dateFilter) {
    dateFilter.removeEventListener('change', filterWebinarRegistrations);
    dateFilter.addEventListener('change', filterWebinarRegistrations);
  }
}

function filterWebinarRegistrations() {
  const searchTerm = document.getElementById('wrSearch')?.value.toLowerCase() || '';
  const typeValue = document.getElementById('wrTypeFilter')?.value || '';
  const dateValue = document.getElementById('wrDateFilter')?.value || '';
  
  let filtered = allWebinarRegistrations.filter(reg => {
    // Search filter
    const matchesSearch = !searchTerm || 
      reg.full_name.toLowerCase().includes(searchTerm) ||
      reg.email.toLowerCase().includes(searchTerm) ||
      reg.webinar_title.toLowerCase().includes(searchTerm);
    
    // Type filter
    const matchesType = !typeValue || (reg.webinar_type || 'Webinar') === typeValue;
    
    // Date filter - show registrations from selected date onwards
    const regDate = new Date(reg.registered_at);
    const matchesDate = !dateValue || regDate.toISOString().split('T')[0] === dateValue;
    
    return matchesSearch && matchesType && matchesDate;
  });
  
  // Re-render with filtered data
  const container = document.getElementById('webinarRegistrationsTable');
  if (!container) return;
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No matching webinar registrations found</div>';
    return;
  }
  
  container.innerHTML = `
    <table class="admin-data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Registrant Name</th>
          <th>Email</th>
          <th>Webinar</th>
          <th>Type</th>
          <th>Registration Date</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(reg => `
          <tr>
            <td>WR-${String(reg.id).padStart(3, '0')}</td>
            <td>${reg.full_name}</td>
            <td>${reg.email}</td>
            <td>${reg.webinar_title}</td>
            <td>${reg.webinar_type || 'Webinar'}</td>
            <td>${new Date(reg.registered_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ============================================
// CSV EXPORT FUNCTIONS
// ============================================

function exportServiceRequestsCSV() {
  if (allServiceRequests.length === 0) {
    showToast('No service requests to export', 'error');
    return;
  }
  
  // CSV headers
  const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Organization', 'Country', 'Industry', 'Services', 'Status', 'Created Date', 'Notes'];
  
  // CSV rows
  const rows = allServiceRequests.map(req => [
    req.id,
    req.full_name,
    req.email,
    req.phone_number || '',
    req.organization_name,
    req.country,
    req.industry_sector,
    req.services.join('; '),
    req.status.replace(/_/g, ' '),
    new Date(req.created_at).toLocaleDateString('en-GB'),
    (req.additional_notes || '').replace(/"/g, '""')
  ]);
  
  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Download
  downloadCSV(csvContent, `service_requests_${new Date().toISOString().split('T')[0]}.csv`);
  showToast('Service requests exported successfully');
}

function exportWebinarRegistrationsCSV() {
  if (allWebinarRegistrations.length === 0) {
    showToast('No webinar registrations to export', 'error');
    return;
  }
  
  // CSV headers
  const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Organization', 'Country', 'Industry', 'Webinar Title', 'Webinar Type', 'Registration Date'];
  
  // CSV rows
  const rows = allWebinarRegistrations.map(reg => [
    reg.id,
    reg.full_name,
    reg.email,
    reg.phone_number || '',
    reg.organization_name || '',
    reg.country || '',
    reg.industry_sector || '',
    reg.webinar_title,
    reg.webinar_type || 'Webinar',
    new Date(reg.registered_at).toLocaleDateString('en-GB')
  ]);
  
  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Download
  downloadCSV(csvContent, `webinar_registrations_${new Date().toISOString().split('T')[0]}.csv`);
  showToast('Webinar registrations exported successfully');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

// ============================================
// PDF DOWNLOAD FOR RESOURCES
// ============================================

function downloadResourcePDF(title, content) {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    // Header bar
    doc.setFillColor(5, 10, 14);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(0, 217, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('CyberNova', margin, 26);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('AI-Powered Cybersecurity Analytics', pageWidth - margin, 26, { align: 'right' });

    // Title
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 58);

    // Divider
    doc.setDrawColor(0, 136, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, 63, pageWidth - margin, 63);

    // Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Published: ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), margin, 70);
    doc.text('CyberNova Analytics Ltd | www.cybernova.com', margin, 76);

    // Body content
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(content, maxWidth);
    let y = 88;
    lines.forEach(line => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      // Bold lines starting with - or a number
      if (/^(\d+\.|-)/.test(line.trim())) {
        doc.setFont('helvetica', 'bold');
        doc.text(line, margin, y);
        doc.setFont('helvetica', 'normal');
      } else {
        doc.text(line, margin, y);
      }
      y += 7;
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('CONFIDENTIAL - CyberNova Analytics Ltd', margin, 290);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 290, { align: 'right' });
    }

    const filename = title.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_') + '.pdf';
    doc.save(filename);
    showToast(`Downloaded: ${title}.pdf`);
  } catch (error) {
    console.error('PDF generation error:', error);
    showToast('Failed to generate PDF. Please try again.', 'error');
  }
}

// ============================================
// SATISFACTION MODAL FUNCTIONS
// ============================================

let currentSatisfactionData = null;

function openSatisfactionModal(data) {
  currentSatisfactionData = data;
  const modal = document.getElementById('satisfactionModal');
  const context = document.getElementById('satisfactionContext');

  if (data.type === 'service') {
    // First-time client — questions about the enquiry process
    context.textContent = `Thanks for reaching out about ${data.serviceName}. We'd love your quick feedback on the process.`;
    document.getElementById('modalRatingLabel').textContent = 'How easy was the enquiry form to fill out? *';
    document.getElementById('modalExpLabel').textContent = 'Your first impression of CyberNova? *';
    document.getElementById('modalLikedLabel').innerHTML = 'How did you hear about us? <span style="font-weight:400;opacity:0.6">(optional)</span>';
    document.getElementById('modalImprovementsLabel').innerHTML = 'What made you choose CyberNova? <span style="font-weight:400;opacity:0.6">(optional)</span>';

    // Swap liked field to a dropdown
    const likedEl = document.getElementById('modalLikedMost');
    if (likedEl.tagName === 'TEXTAREA') {
      likedEl.outerHTML = `<select id="modalLikedMost" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-family:'Electrolize',sans-serif;color:var(--text);background:var(--bg);box-sizing:border-box">
        <option value="">Select an option...</option>
        <option value="Google / Search Engine">Google / Search Engine</option>
        <option value="Social Media">Social Media</option>
        <option value="Word of mouth / Referral">Word of mouth / Referral</option>
        <option value="LinkedIn">LinkedIn</option>
        <option value="Industry event or conference">Industry event or conference</option>
        <option value="News article or blog">News article or blog</option>
        <option value="Other">Other</option>
      </select>`;
    } else {
      likedEl.value = '';
    }

    document.getElementById('modalImprovements').placeholder = 'e.g. Reputation, pricing, specific services...';

  } else if (data.type === 'webinar') {
    // Webinar registrant
    context.textContent = `Thanks for registering for: ${data.webinarTitle}. How was the registration experience?`;
    document.getElementById('modalRatingLabel').textContent = 'How easy was registration? *';
    document.getElementById('modalExpLabel').textContent = 'Your overall impression of CyberNova? *';
    document.getElementById('modalLikedLabel').innerHTML = 'What did you like most? <span style="font-weight:400;opacity:0.6">(optional)</span>';
    document.getElementById('modalImprovementsLabel').innerHTML = 'What can we improve? <span style="font-weight:400;opacity:0.6">(optional)</span>';

    // Swap liked field to textarea if currently a select
    const likedEl = document.getElementById('modalLikedMost');
    if (likedEl.tagName === 'SELECT') {
      likedEl.outerHTML = `<textarea id="modalLikedMost" rows="2" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-family:'Electrolize',sans-serif;resize:vertical;color:var(--text);background:var(--bg);box-sizing:border-box" placeholder="Tell us what you enjoyed..."></textarea>`;
    } else {
      likedEl.value = '';
    }

    document.getElementById('modalImprovements').placeholder = 'Suggestions for improvement...';
  }

  // Reset form values
  document.getElementById('modalRating').value = '';
  document.getElementById('modalExpRatingVal').value = '';
  document.getElementById('modalNPS').value = '';
  document.getElementById('modalImprovements').value = '';
  document.getElementById('modalComments').value = '';
  document.getElementById('modalFeedbackError').style.display = 'none';

  // Reset star ratings visually
  document.querySelectorAll('#modalStarRating span').forEach(s => s.style.color = '#374151');
  document.querySelectorAll('#modalExpStars span').forEach(s => s.style.color = '#374151');
  document.querySelectorAll('#modalNpsScore .nps-btn').forEach(btn => {
    btn.style.background = '';
    btn.style.color = '';
  });

modal.style.display = 'flex';
}

function closeSatisfactionModal() {
  document.getElementById('satisfactionModal').style.display = 'none';
  currentSatisfactionData = null;
  clearFieldErrors('#feedbackForm');
}

function setModalStarRating(rating) {
  document.getElementById('modalRating').value = rating;
  const stars = document.querySelectorAll('#modalStarRating span');
  stars.forEach((star, idx) => {
    star.style.color = idx < rating ? '#fbbf24' : '#d1d5db';
  });
}

function setModalExpRating(rating) {
  document.getElementById('modalExpRatingVal').value = rating;
  const stars = document.querySelectorAll('#modalExpStars span');
  stars.forEach((star, idx) => {
    star.style.color = idx < rating ? '#fbbf24' : '#d1d5db';
  });
}

function setModalNPS(score) {
  document.getElementById('modalNPS').value = score;
  const btns = document.querySelectorAll('#modalNpsScore .nps-btn');
  btns.forEach((btn, idx) => {
    if (idx + 1 === score) {
      btn.style.background = '#00D9FF';
      btn.style.color = '#050A0E';
    } else {
      btn.style.background = '#e5e7eb';
      btn.style.color = '#374151';
    }
  });
}

async function submitModalFeedback() {
  const rating = parseInt(document.getElementById('modalRating').value);
  const expRating = parseInt(document.getElementById('modalExpRatingVal').value);
  const errEl = document.getElementById('modalFeedbackError');
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

  const nps = parseInt(document.getElementById('modalNPS').value) || null;

  const payload = {
    token: currentSatisfactionData.token,
    rating: rating,
    experience_rating: expRating,
    recommendation_score: nps,
    liked_most: document.getElementById('modalLikedMost').value || null,
    improvements: document.getElementById('modalImprovements').value || null,
    comments: document.getElementById('modalComments').value || null,
    respondent_name: currentSatisfactionData.fullName || null,
    respondent_email: currentSatisfactionData.email || null,
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

    closeSatisfactionModal();
    showToast('Thank you for your feedback.');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Always load webinars on page load so they're ready when user clicks register
  loadWebinars();

  // Warm-up ping: wake up the Render backend early so subsequent calls are fast
  const warmupUrl = API_BASE_URL.replace('/api', '/health');
  fetch(warmupUrl, { method: 'GET', mode: 'cors' })
    .then(() => console.log('Backend warm-up complete'))
    .catch(() => console.log('Backend warming up...'));

  // Auto-clear field errors when user starts typing
  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('field-error-border')) {
      const err = e.target.parentElement.querySelector('.field-error');
      if (err) err.remove();
      e.target.classList.remove('field-error-border');
    }
  });
});
