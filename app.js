// ===================================
// GA4 Analytics Platform - Main Application
// ===================================

// Configuration
// Configuration is loaded from config.js

// Global State
let tokenClient;
let gapiInited = false;
let gisInited = false;
let accessToken = null;
let currentPropertyId = null;
let comparisonMode = 'time'; // 'time' or 'property'

// Chart instances
let trendChart = null;
let comparisonChart = null;

// ===================================
// Initialization
// ===================================

/**
 * Initialize the application when the page loads
 */
document.addEventListener('DOMContentLoaded', () => {
  // Load Google API Client Library
  gapiLoaded();

  // Load Google Identity Services
  gisLoaded();

  // Set up event listeners
  setupEventListeners();

  // Initialize date inputs with default values
  initializeDateInputs();
});

/**
 * Callback after Google API Client Library loads
 */
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

/**
 * Initialize the Google API Client
 */
async function initializeGapiClient() {
  try {
    await gapi.client.init({
      discoveryDocs: [CONFIG.DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
  } catch (error) {
    console.error('Error initializing GAPI client:', error);
  }
}

/**
 * Callback after Google Identity Services loads
 */
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: CONFIG.SCOPES,
    callback: handleAuthCallback,
  });
  gisInited = true;
  maybeEnableButtons();
}

/**
 * Enable sign-in button when both libraries are loaded
 */
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    showSignInButton();
  }
}

// ===================================
// Authentication
// ===================================

/**
 * Show the sign-in button
 */
function showSignInButton() {
  const signInButton = document.getElementById('signInButton');
  const authButtonContainer = document.getElementById('authButtonContainer');

  // Create Google Sign-In button
  google.accounts.id.renderButton(
    signInButton,
    {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
    }
  );

  // Also add to auth required section
  const authButton = document.createElement('button');
  authButton.className = 'btn btn-primary btn-lg';
  authButton.textContent = '🔐 Sign in with Google';
  authButton.onclick = handleAuthClick;
  authButtonContainer.appendChild(authButton);

  signInButton.classList.remove('hidden');
}

/**
 * Handle sign-in button click
 */
function handleAuthClick() {
  if (gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    // Skip display of account chooser and consent dialog for an existing session
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

/**
 * Handle authentication callback
 */
function handleAuthCallback(resp) {
  if (resp.error !== undefined) {
    console.error('Authentication error:', resp);
    showMessage('configMessage', 'Authentication failed. Please try again.', 'error');
    return;
  }

  accessToken = resp.access_token;
  gapi.client.setToken({ access_token: accessToken });

  // Update UI to show authenticated state
  showAuthenticatedUI();
}

/**
 * Update UI after successful authentication
 */
function showAuthenticatedUI() {
  // Hide auth required message
  document.getElementById('authRequired').classList.add('hidden');

  // Show configuration panel
  document.getElementById('configPanel').classList.remove('hidden');

  // Show user info (if available from Google Identity)
  const signInButton = document.getElementById('signInButton');
  const userInfo = document.getElementById('userInfo');
  const signOutButton = document.getElementById('signOutButton');

  signInButton.classList.add('hidden');
  userInfo.classList.remove('hidden');
  signOutButton.classList.remove('hidden');

  // Try to get user info from token
  getUserInfo();
}

/**
 * Get user information from Google
 */
async function getUserInfo() {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const userInfo = await response.json();
      document.getElementById('userName').textContent = userInfo.name;
      document.getElementById('userAvatar').src = userInfo.picture;
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    document.getElementById('userName').textContent = 'User';
  }
}

/**
 * Handle sign-out
 */
function handleSignOut() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
    accessToken = null;
  }

  // Reset UI
  document.getElementById('authRequired').classList.remove('hidden');
  document.getElementById('configPanel').classList.add('hidden');
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('signInButton').classList.remove('hidden');
  document.getElementById('userInfo').classList.add('hidden');
  document.getElementById('signOutButton').classList.add('hidden');
}

// ===================================
// Event Listeners
// ===================================

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Sign out button
  document.getElementById('signOutButton').addEventListener('click', handleSignOut);

  // Fetch data button
  document.getElementById('fetchDataButton').addEventListener('click', handleFetchData);

  // Comparison mode selector
  document.getElementById('comparisonMode').addEventListener('change', handleComparisonModeChange);

  // Date range preset selectors
  document.getElementById('dateRangePreset').addEventListener('change', handleDateRangeChange);
  document.getElementById('singleDateRange').addEventListener('change', handleSingleDateRangeChange);

  // Property ID input - save to state
  document.getElementById('propertyId').addEventListener('change', (e) => {
    currentPropertyId = e.target.value.trim();
  });
}

/**
 * Handle comparison mode change
 */
function handleComparisonModeChange(e) {
  comparisonMode = e.target.value;

  // Toggle UI elements based on mode
  const singlePropertyGroup = document.getElementById('singlePropertyGroup');
  const multiPropertyGroup = document.getElementById('multiPropertyGroup');
  const dateRangePresetGroup = document.getElementById('dateRangePresetGroup');
  const singleDateRangeGroup = document.getElementById('singleDateRangeGroup');

  if (comparisonMode === 'time') {
    singlePropertyGroup.classList.remove('hidden');
    multiPropertyGroup.classList.add('hidden');
    dateRangePresetGroup.classList.remove('hidden');
    singleDateRangeGroup.classList.add('hidden');
  } else {
    singlePropertyGroup.classList.add('hidden');
    multiPropertyGroup.classList.remove('hidden');
    dateRangePresetGroup.classList.add('hidden');
    singleDateRangeGroup.classList.remove('hidden');
  }

  // Reset custom date ranges
  document.getElementById('customDateRanges').classList.add('hidden');
}

/**
 * Handle date range preset change
 */
function handleDateRangeChange(e) {
  const customRanges = document.getElementById('customDateRanges');
  const customTimeRanges = document.getElementById('customTimeRanges');
  const customPropertyRanges = document.getElementById('customPropertyRanges');

  if (e.target.value === 'custom') {
    customRanges.classList.remove('hidden');
    customTimeRanges.classList.remove('hidden');
    customPropertyRanges.classList.add('hidden');
  } else {
    customRanges.classList.add('hidden');
  }
}

/**
 * Handle single date range change (property comparison mode)
 */
function handleSingleDateRangeChange(e) {
  const customRanges = document.getElementById('customDateRanges');
  const customTimeRanges = document.getElementById('customTimeRanges');
  const customPropertyRanges = document.getElementById('customPropertyRanges');

  if (e.target.value === 'custom') {
    customRanges.classList.remove('hidden');
    customTimeRanges.classList.add('hidden');
    customPropertyRanges.classList.remove('hidden');
  } else {
    customRanges.classList.add('hidden');
  }
}

// ===================================
// Date Range Utilities
// ===================================

/**
 * Initialize date inputs with default values
 */
function initializeDateInputs() {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);

  document.getElementById('startDate1').value = formatDate(sevenDaysAgo);
  document.getElementById('endDate1').value = formatDate(today);
  document.getElementById('startDate2').value = formatDate(fourteenDaysAgo);
  document.getElementById('endDate2').value = formatDate(sevenDaysAgo);
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date ranges based on selected preset
 */
function getDateRanges() {
  const preset = document.getElementById('dateRangePreset').value;
  const today = new Date();

  if (preset === 'custom') {
    return [
      {
        startDate: document.getElementById('startDate1').value,
        endDate: document.getElementById('endDate1').value,
        name: 'primary_period',
      },
      {
        startDate: document.getElementById('startDate2').value,
        endDate: document.getElementById('endDate2').value,
        name: 'comparison_period',
      },
    ];
  }

  // Calculate preset date ranges
  let primaryStart, primaryEnd, comparisonStart, comparisonEnd;

  switch (preset) {
    case '7days':
      primaryEnd = new Date(today);
      primaryStart = new Date(today);
      primaryStart.setDate(today.getDate() - 7);
      comparisonEnd = new Date(primaryStart);
      comparisonStart = new Date(primaryStart);
      comparisonStart.setDate(primaryStart.getDate() - 7);
      break;

    case '30days':
      primaryEnd = new Date(today);
      primaryStart = new Date(today);
      primaryStart.setDate(today.getDate() - 30);
      comparisonEnd = new Date(primaryStart);
      comparisonStart = new Date(primaryStart);
      comparisonStart.setDate(primaryStart.getDate() - 30);
      break;

    case '90days':
      primaryEnd = new Date(today);
      primaryStart = new Date(today);
      primaryStart.setDate(today.getDate() - 90);
      comparisonEnd = new Date(primaryStart);
      comparisonStart = new Date(primaryStart);
      comparisonStart.setDate(primaryStart.getDate() - 90);
      break;

    case 'month':
      primaryEnd = new Date(today);
      primaryStart = new Date(today.getFullYear(), today.getMonth(), 1);
      comparisonEnd = new Date(primaryStart);
      comparisonEnd.setDate(comparisonEnd.getDate() - 1);
      comparisonStart = new Date(comparisonEnd.getFullYear(), comparisonEnd.getMonth(), 1);
      break;

    case 'year':
      primaryEnd = new Date(today);
      primaryStart = new Date(today.getFullYear(), 0, 1);
      comparisonEnd = new Date(primaryStart);
      comparisonEnd.setDate(comparisonEnd.getDate() - 1);
      comparisonStart = new Date(comparisonEnd.getFullYear(), 0, 1);
      break;
  }

  return [
    {
      startDate: formatDate(primaryStart),
      endDate: formatDate(primaryEnd),
      name: 'primary_period',
    },
    {
      startDate: formatDate(comparisonStart),
      endDate: formatDate(comparisonEnd),
      name: 'comparison_period',
    },
  ];
}

/**
 * Get single date range for property comparison mode
 */
function getSingleDateRange() {
  const preset = document.getElementById('singleDateRange').value;
  const today = new Date();

  if (preset === 'custom') {
    return {
      startDate: document.getElementById('startDateSingle').value,
      endDate: document.getElementById('endDateSingle').value,
    };
  }

  // Calculate preset date range
  let start, end;

  switch (preset) {
    case '7days':
      end = new Date(today);
      start = new Date(today);
      start.setDate(today.getDate() - 7);
      break;

    case '30days':
      end = new Date(today);
      start = new Date(today);
      start.setDate(today.getDate() - 30);
      break;

    case '90days':
      end = new Date(today);
      start = new Date(today);
      start.setDate(today.getDate() - 90);
      break;

    case 'month':
      end = new Date(today);
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;

    case 'year':
      end = new Date(today);
      start = new Date(today.getFullYear(), 0, 1);
      break;
  }

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

// ===================================
// GA4 Data Fetching
// ===================================

/**
 * Handle fetch data button click
 */
async function handleFetchData() {
  // Show loading state
  document.getElementById('loadingState').classList.remove('hidden');
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('configMessage').classList.add('hidden');

  try {
    if (comparisonMode === 'time') {
      // Time comparison mode: single property, two time periods
      const propertyId = document.getElementById('propertyId').value.trim();

      if (!propertyId) {
        throw new Error('Please select a GA4 Property');
      }

      currentPropertyId = propertyId;

      // Get date ranges
      const dateRanges = getDateRanges();

      // Fetch data from GA4
      const data = await fetchGA4Data(propertyId, dateRanges);

      // Update dashboard
      updateDashboard(data, dateRanges, 'time');

    } else {
      // Property comparison mode: multiple properties, single time period
      const selectedProperties = Array.from(
        document.querySelectorAll('input[name="properties"]:checked')
      ).map(cb => ({
        id: cb.value,
        name: cb.parentElement.textContent.trim()
      }));

      if (selectedProperties.length < 2) {
        throw new Error('Please select at least 2 properties to compare');
      }

      // Get single date range
      const dateRange = getSingleDateRange();

      // Fetch data for all properties
      const multiPropertyData = await fetchMultiPropertyData(selectedProperties, dateRange);

      // Update dashboard
      updateDashboard(multiPropertyData, dateRange, 'property', selectedProperties);
    }

    // Hide loading, show dashboard
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    showMessage('configMessage', 'Data fetched successfully!', 'success');
  } catch (error) {
    console.error('Error fetching GA4 data:', error);
    document.getElementById('loadingState').classList.add('hidden');
    showMessage('configMessage', `Error: ${error.message}`, 'error');
  }
}

/**
 * Fetch data from GA4 Data API
 */
async function fetchGA4Data(propertyId, dateRanges) {
  const request = {
    property: `properties/${propertyId}`,
    dateRanges: dateRanges,
    metrics: [
      { name: 'totalUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'engagedSessions' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
    ],
    dimensions: [
      { name: 'date' },
    ],
  };

  try {
    const response = await gapi.client.request({
      path: 'https://analyticsdata.googleapis.com/v1beta/properties/' + propertyId + ':runReport',
      method: 'POST',
      body: request,
    });

    return response.result;
  } catch (error) {
    throw new Error(error.result?.error?.message || 'Failed to fetch GA4 data');
  }
}

/**
 * Fetch data from multiple GA4 properties
 */
async function fetchMultiPropertyData(properties, dateRange) {
  const allData = [];

  for (const property of properties) {
    const request = {
      property: `properties/${property.id}`,
      dateRanges: [{
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'engagedSessions' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      dimensions: [
        { name: 'date' },
      ],
    };

    try {
      const response = await gapi.client.request({
        path: 'https://analyticsdata.googleapis.com/v1beta/properties/' + property.id + ':runReport',
        method: 'POST',
        body: request,
      });

      allData.push({
        propertyId: property.id,
        propertyName: property.name,
        data: response.result,
      });
    } catch (error) {
      console.error(`Error fetching data for ${property.name}:`, error);
      throw new Error(`Failed to fetch data for ${property.name}: ${error.result?.error?.message || error.message}`);
    }
  }

  return allData;
}

// ===================================
// Dashboard Updates
// ===================================

/**
 * Update dashboard with fetched data
 */
function updateDashboard(data, dateRangesOrRange, mode = 'time', properties = null) {
  if (mode === 'time') {
    // Time comparison mode: existing logic
    if (!data.rows || data.rows.length === 0) {
      showMessage('configMessage', 'No data available for the selected period', 'error');
      return;
    }

    // Separate data by date range
    const primaryData = data.rows.filter(row => row.dimensionValues[1]?.value === 'primary_period' || !row.dimensionValues[1]);
    const comparisonData = data.rows.filter(row => row.dimensionValues[1]?.value === 'comparison_period');

    // Calculate totals for each period
    const primaryTotals = calculateTotals(primaryData);
    const comparisonTotals = calculateTotals(comparisonData);

    // Update metric cards
    updateMetricCards(primaryTotals, comparisonTotals);

    // Update charts
    updateCharts(primaryData, comparisonData, primaryTotals, comparisonTotals);

    // Update data table
    updateDataTable(data, dateRangesOrRange);

  } else {
    // Property comparison mode: new logic
    if (!data || data.length === 0) {
      showMessage('configMessage', 'No data available for the selected properties', 'error');
      return;
    }

    // Calculate totals for each property
    const propertyTotals = data.map(propertyData => ({
      propertyName: propertyData.propertyName,
      totals: calculateTotals(propertyData.data.rows || [])
    }));

    // Update metric cards for property comparison
    updateMetricCardsForProperties(propertyTotals);

    // Update charts for property comparison
    updateChartsForProperties(data, propertyTotals);

    // Update data table for property comparison
    updateDataTableForProperties(data, dateRangesOrRange);
  }
}

/**
 * Calculate totals from row data
 */
function calculateTotals(rows) {
  const totals = {
    users: 0,
    sessions: 0,
    pageViews: 0,
    engagedSessions: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
  };

  if (!rows || rows.length === 0) return totals;

  rows.forEach(row => {
    const metrics = row.metricValues;
    totals.users += parseFloat(metrics[0]?.value || 0);
    totals.sessions += parseFloat(metrics[1]?.value || 0);
    totals.pageViews += parseFloat(metrics[2]?.value || 0);
    totals.engagedSessions += parseFloat(metrics[3]?.value || 0);
    totals.avgSessionDuration += parseFloat(metrics[4]?.value || 0);
    totals.bounceRate += parseFloat(metrics[5]?.value || 0);
  });

  // Calculate averages
  const rowCount = rows.length;
  totals.avgSessionDuration = totals.avgSessionDuration / rowCount;
  totals.bounceRate = totals.bounceRate / rowCount;
  totals.engagementRate = totals.sessions > 0 ? (totals.engagedSessions / totals.sessions) * 100 : 0;

  return totals;
}

/**
 * Update metric cards
 */
function updateMetricCards(primary, comparison) {
  // Users
  document.getElementById('metricUsers').textContent = formatNumber(primary.users);
  updateComparison('comparisonUsers', primary.users, comparison.users);

  // Sessions
  document.getElementById('metricSessions').textContent = formatNumber(primary.sessions);
  updateComparison('comparisonSessions', primary.sessions, comparison.sessions);

  // Page Views
  document.getElementById('metricPageViews').textContent = formatNumber(primary.pageViews);
  updateComparison('comparisonPageViews', primary.pageViews, comparison.pageViews);

  // Engagement Rate
  document.getElementById('metricEngagement').textContent = formatPercent(primary.engagementRate);
  updateComparison('comparisonEngagement', primary.engagementRate, comparison.engagementRate);
}

/**
 * Update comparison indicator
 */
function updateComparison(elementId, current, previous) {
  const element = document.getElementById(elementId);

  if (previous === 0) {
    element.textContent = '-';
    element.className = 'metric-change neutral';
    return;
  }

  const change = ((current - previous) / previous) * 100;
  const isPositive = change > 0;
  const isNegative = change < 0;

  element.textContent = `${isPositive ? '↑' : isNegative ? '↓' : ''} ${Math.abs(change).toFixed(1)}%`;
  element.className = `metric-change ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`;
}

/**
 * Update charts
 */
function updateCharts(primaryData, comparisonData, primaryTotals, comparisonTotals) {
  // Destroy existing charts
  if (trendChart) trendChart.destroy();
  if (comparisonChart) comparisonChart.destroy();

  // Trend Chart - Line chart showing daily trends
  const trendCtx = document.getElementById('trendChart').getContext('2d');
  const labels = primaryData.map(row => {
    const date = row.dimensionValues[0].value;
    return `${date.substring(4, 6)}/${date.substring(6, 8)}`;
  });

  trendChart = new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Users (Primary)',
          data: primaryData.map(row => parseFloat(row.metricValues[0].value)),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Users (Comparison)',
          data: comparisonData.map(row => parseFloat(row.metricValues[0].value)),
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
          borderDash: [5, 5],
        },
      ],
    },
    options: getChartOptions('Daily User Trends'),
  });

  // Comparison Chart - Bar chart comparing totals
  const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');

  comparisonChart = new Chart(comparisonCtx, {
    type: 'bar',
    data: {
      labels: ['Users', 'Sessions', 'Page Views'],
      datasets: [
        {
          label: 'Primary Period',
          data: [primaryTotals.users, primaryTotals.sessions, primaryTotals.pageViews],
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
        },
        {
          label: 'Comparison Period',
          data: [comparisonTotals.users, comparisonTotals.sessions, comparisonTotals.pageViews],
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
        },
      ],
    },
    options: getChartOptions('Period Comparison'),
  });
}

/**
 * Get chart options with consistent styling
 */
function getChartOptions(title) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#334155',
          font: {
            family: 'Inter',
          },
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        ticks: {
          color: '#64748b',
          font: {
            family: 'Inter',
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.2)',
        },
      },
      x: {
        ticks: {
          color: '#64748b',
          font: {
            family: 'Inter',
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.2)',
        },
      },
    },
  };
}

/**
 * Update data table
 */
function updateDataTable(data, dateRanges) {
  const tableContainer = document.getElementById('dataTable');

  let html = '<table style="width: 100%; border-collapse: collapse;">';
  html += '<thead><tr style="border-bottom: 1px solid var(--color-border);">';
  html += '<th style="padding: var(--spacing-sm); text-align: left; color: var(--color-text-secondary);">Date</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: left; color: var(--color-text-secondary);">Period</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Users</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Sessions</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Page Views</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Engagement Rate</th>';
  html += '</tr></thead>';
  html += '<tbody>';

  data.rows.forEach((row, index) => {
    const date = row.dimensionValues[0].value;
    const period = row.dimensionValues[1]?.value || 'primary_period';
    const users = parseFloat(row.metricValues[0].value);
    const sessions = parseFloat(row.metricValues[1].value);
    const pageViews = parseFloat(row.metricValues[2].value);
    const engagedSessions = parseFloat(row.metricValues[3].value);
    const engagementRate = sessions > 0 ? (engagedSessions / sessions) * 100 : 0;

    html += `<tr style="border-bottom: 1px solid var(--color-border);">`;
    html += `<td style="padding: var(--spacing-sm); color: var(--color-text-primary);">${formatDateString(date)}</td>`;
    html += `<td style="padding: var(--spacing-sm); color: var(--color-text-tertiary);">${period === 'primary_period' ? 'Primary' : 'Comparison'}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatNumber(users)}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatNumber(sessions)}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatNumber(pageViews)}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatPercent(engagementRate)}</td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';
  tableContainer.innerHTML = html;
}

// ===================================
// Utility Functions
// ===================================

/**
 * Format number with commas
 */
function formatNumber(num) {
  return Math.round(num).toLocaleString();
}

/**
 * Format as percentage
 */
function formatPercent(num) {
  return `${num.toFixed(1)}%`;
}

/**
 * Format date string from YYYYMMDD to MM/DD/YYYY
 */
function formatDateString(dateStr) {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${month}/${day}/${year}`;
}

/**
 * Show message to user
 */
function showMessage(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.className = type === 'error' ? 'error-message' : 'success-message';
  element.classList.remove('hidden');

  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      element.classList.add('hidden');
    }, 5000);
  }
}

// ===================================
// Property Comparison Functions
// ===================================

/**
 * Update metric cards for property comparison mode
 */
function updateMetricCardsForProperties(propertyTotals) {
  // Use first property as baseline, show comparison to it
  const baseline = propertyTotals[0];
  const comparison = propertyTotals[1] || baseline;

  document.getElementById('metricUsers').textContent = formatNumber(baseline.totals.users);
  updateComparison('comparisonUsers', baseline.totals.users, comparison.totals.users);

  document.getElementById('metricSessions').textContent = formatNumber(baseline.totals.sessions);
  updateComparison('comparisonSessions', baseline.totals.sessions, comparison.totals.sessions);

  document.getElementById('metricPageViews').textContent = formatNumber(baseline.totals.pageViews);
  updateComparison('comparisonPageViews', baseline.totals.pageViews, comparison.totals.pageViews);

  document.getElementById('metricEngagement').textContent = formatPercent(baseline.totals.engagementRate);
  updateComparison('comparisonEngagement', baseline.totals.engagementRate, comparison.totals.engagementRate);
}

/**
 * Update charts for property comparison mode
 */
function updateChartsForProperties(propertyData, propertyTotals) {
  // Destroy existing charts
  if (trendChart) trendChart.destroy();
  if (comparisonChart) comparisonChart.destroy();

  // Get dates from first property
  const firstProperty = propertyData[0].data;
  const labels = (firstProperty.rows || []).map(row => {
    const date = row.dimensionValues[0].value;
    return `${date.substring(4, 6)}/${date.substring(6, 8)}`;
  });

  // Trend Chart - Line chart showing daily trends for each property
  const trendCtx = document.getElementById('trendChart').getContext('2d');
  const colors = [
    'rgb(99, 102, 241)',
    'rgb(139, 92, 246)',
    'rgb(16, 185, 129)',
    'rgb(245, 158, 11)',
    'rgb(239, 68, 68)'
  ];

  const datasets = propertyData.map((property, index) => ({
    label: property.propertyName,
    data: (property.data.rows || []).map(row => parseFloat(row.metricValues[0].value)),
    borderColor: colors[index % colors.length],
    backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
    tension: 0.4,
  }));

  trendChart = new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: getChartOptions('Daily User Trends by Property'),
  });

  // Comparison Chart - Bar chart comparing totals across properties
  const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');

  comparisonChart = new Chart(comparisonCtx, {
    type: 'bar',
    data: {
      labels: propertyTotals.map(p => p.propertyName),
      datasets: [
        {
          label: 'Users',
          data: propertyTotals.map(p => p.totals.users),
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
        },
        {
          label: 'Sessions',
          data: propertyTotals.map(p => p.totals.sessions),
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
        },
        {
          label: 'Page Views',
          data: propertyTotals.map(p => p.totals.pageViews),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
        },
      ],
    },
    options: getChartOptions('Property Comparison'),
  });
}

/**
 * Update data table for property comparison mode
 */
function updateDataTableForProperties(propertyData, dateRange) {
  const tableContainer = document.getElementById('dataTable');

  let html = '<table style="width: 100%; border-collapse: collapse;">';
  html += '<thead><tr style="border-bottom: 1px solid var(--color-border);">';
  html += '<th style="padding: var(--spacing-sm); text-align: left; color: var(--color-text-secondary);">Property</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Users</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Sessions</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Page Views</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Engagement Rate</th>';
  html += '</tr></thead>';
  html += '<tbody>';

  propertyData.forEach(property => {
    const totals = calculateTotals(property.data.rows || []);

    html += `<tr style="border-bottom: 1px solid var(--color-border);">`;
    html += `<td style="padding: var(--spacing-sm); color: var(--color-text-primary); font-weight: 600;">${property.propertyName}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatNumber(totals.users)}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatNumber(totals.sessions)}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatNumber(totals.pageViews)}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatPercent(totals.engagementRate)}</td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';
  tableContainer.innerHTML = html;
}
