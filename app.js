// CyberNova Analytics - Backend Integration
// This file connects the existing HTML UI to the FastAPI backend

// API Base URL - automatically uses production URL when deployed
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000/api'
  : 'https://your-backend-name.onrender.com/api'; // Update this after deploying to Render

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
  document.getElementById('dashDate').textContent = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
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
