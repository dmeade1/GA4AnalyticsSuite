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

// Configurable Metrics
const METRICS = [
  { name: 'totalUsers' },
  { name: 'sessions' },
  { name: 'screenPageViews' },
  { name: 'engagedSessions' },
  { name: 'averageSessionDuration' },
  { name: 'bounceRate' },
  { name: 'eventCount' },
  { name: 'userEngagementDuration' },
  { name: 'activeUsers' },
];

// Chart instances
let trendChart = null;
let comparisonChart = null;
let overviewChart = null;
let overviewTimeframe = 'ytd'; // 'ytd' or 'fiscal'

// Property Metadata (ID, Name, Logo)
const PROPERTIES = [
  { id: '352990478', name: 'RMSMC', logo: 'images/logos/rmsmc.png' },
  { id: '321341958', name: 'Collegian', logo: 'images/logos/collegian.png' },
  { id: '352970688', name: 'KCSU', logo: 'images/logos/kcsu.png' },
  { id: '397333725', name: 'Fifty03', logo: 'images/logos/fifty03.png' },
  { id: '352975714', name: 'College Avenue', logo: 'images/logos/college-avenue.png' }
];

// Preloaded Logo Images
const propertyLogos = {};

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

  // Preload logos
  preloadLogos();
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

  // Initialize Google Identity Services first
  google.accounts.id.initialize({
    client_id: CONFIG.CLIENT_ID,
    callback: () => { }, // Dummy callback (not used)
  });

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
  console.log('showAuthenticatedUI called');
  // Hide auth required message
  document.getElementById('authRequired').classList.add('hidden');

  // Show configuration panel
  document.getElementById('configPanel').classList.remove('hidden');

  // Show Overview Section and Fetch Data
  document.getElementById('overviewSection').classList.remove('hidden');
  fetchAndRenderOverviewGraph();

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
  document.getElementById('overviewSection').classList.add('hidden');
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

  // Filter checkbox
  document.getElementById('enableExcludeFilter').addEventListener('change', (e) => {
    const inputGroup = document.getElementById('excludeFilterInputGroup');
    if (e.target.checked) {
      inputGroup.classList.remove('hidden');
    } else {
      inputGroup.classList.add('hidden');
    }
  });

  // Log Scale Toggle
  document.getElementById('logScaleToggle').addEventListener('change', () => {
    // Re-render charts with new scale setting
    // We need to store the last data to re-render without fetching
    if (window.lastChartData) {
      if (comparisonMode === 'time') {
        updateCharts(window.lastChartData.primaryData, window.lastChartData.comparisonData, window.lastChartData.primaryTotals, window.lastChartData.comparisonTotals);
      } else {
        updateChartsForProperties(window.lastChartData.propertyTotals, window.lastChartData.dateRange);
      }
    }
  });


  // Overview Graph Controls
  document.getElementById('overviewYTD').addEventListener('click', () => {
    setOverviewTimeframe('ytd');
  });

  document.getElementById('overviewFiscal').addEventListener('click', () => {
    setOverviewTimeframe('fiscal');
  });

  document.getElementById('overviewLogScale').addEventListener('click', () => {
    if (window.lastOverviewData) {
      renderOverviewChart(window.lastOverviewData);
    }
  });
}

/**
 * Preload property logos for chart use
 */
function preloadLogos() {
  const targetSize = 32; // Size in pixels for the logos on the chart

  PROPERTIES.forEach(prop => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Allow canvas manipulation

    img.onload = function () {
      // Create a canvas to resize the image
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');

      // Draw the image scaled to the target size
      ctx.drawImage(img, 0, 0, targetSize, targetSize);

      // Store the canvas as the logo (Chart.js can use canvas as pointStyle)
      propertyLogos[prop.id] = canvas;
    };

    img.src = prop.logo;
  });
}

/**
 * Set Overview Timeframe
 */
function setOverviewTimeframe(mode) {
  overviewTimeframe = mode;

  // Update buttons
  const ytdBtn = document.getElementById('overviewYTD');
  const fiscalBtn = document.getElementById('overviewFiscal');

  if (mode === 'ytd') {
    ytdBtn.classList.replace('btn-outline', 'btn-primary');
    fiscalBtn.classList.replace('btn-primary', 'btn-outline');
  } else {
    ytdBtn.classList.replace('btn-primary', 'btn-outline');
    fiscalBtn.classList.replace('btn-outline', 'btn-primary');
  }

  // Fetch new data
  if (gapiInited && gisInited && accessToken) {
    fetchAndRenderOverviewGraph();
  }
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

  // Toggle metric card views based on mode
  const timeViews = document.querySelectorAll('.time-view');
  const propertyViews = document.querySelectorAll('.property-view');

  if (comparisonMode === 'time') {
    timeViews.forEach(el => el.classList.remove('hidden'));
    propertyViews.forEach(el => el.classList.add('hidden'));
  } else {
    timeViews.forEach(el => el.classList.add('hidden'));
    propertyViews.forEach(el => el.classList.remove('hidden'));
  }
}

/**
 * Handle date range preset change
 */
function handleDateRangeChange(e) {
  const customRanges = document.getElementById('customDateRanges');
  const customTimeRanges = document.getElementById('customTimeRanges');
  const customPropertyRanges = document.getElementById('customPropertyRanges');
  const fiscalYearHelper = document.getElementById('fiscalYearHelper');

  if (e.target.value === 'custom') {
    customRanges.classList.remove('hidden');
    customTimeRanges.classList.remove('hidden');
    customPropertyRanges.classList.add('hidden');
    fiscalYearHelper.classList.add('hidden');
  } else if (e.target.value === 'fiscal_year') {
    customRanges.classList.add('hidden');
    fiscalYearHelper.classList.remove('hidden');
  } else {
    customRanges.classList.add('hidden');
    fiscalYearHelper.classList.add('hidden');
  }
}

/**
 * Handle single date range change (property comparison mode)
 */
function handleSingleDateRangeChange(e) {
  const customRanges = document.getElementById('customDateRanges');
  const customTimeRanges = document.getElementById('customTimeRanges');
  const customPropertyRanges = document.getElementById('customPropertyRanges');
  const fiscalYearHelperSingle = document.getElementById('fiscalYearHelperSingle');

  if (e.target.value === 'custom') {
    customRanges.classList.remove('hidden');
    customTimeRanges.classList.add('hidden');
    customPropertyRanges.classList.remove('hidden');
    fiscalYearHelperSingle.classList.add('hidden');
  } else if (e.target.value === 'fiscal_year') {
    customRanges.classList.add('hidden');
    fiscalYearHelperSingle.classList.remove('hidden');
  } else {
    customRanges.classList.add('hidden');
    fiscalYearHelperSingle.classList.add('hidden');
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

    case 'fiscal_year':
      // Fiscal Year: July 1 to June 30
      // Last Completed Fiscal Year (e.g. if today is Nov 2025, show July 1, 2024 - June 30, 2025)
      const currentYear = today.getFullYear();
      const isBeforeJune30 = today.getMonth() < 5 || (today.getMonth() === 5 && today.getDate() < 30);

      const fyEndYear = isBeforeJune30 ? currentYear - 1 : currentYear;

      primaryEnd = new Date(fyEndYear, 5, 30); // June 30
      primaryStart = new Date(fyEndYear - 1, 6, 1); // July 1 previous year

      comparisonEnd = new Date(fyEndYear - 1, 5, 30); // June 30 of comparison year
      comparisonStart = new Date(fyEndYear - 2, 6, 1); // July 1 of comparison year
      break;

    default:
      // Default to 7 days if no match
      primaryEnd = new Date(today);
      primaryStart = new Date(today);
      primaryStart.setDate(today.getDate() - 7);
      comparisonEnd = new Date(primaryStart);
      comparisonStart = new Date(primaryStart);
      comparisonStart.setDate(primaryStart.getDate() - 7);
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

    case 'fiscal_year':
      // Fiscal Year: July 1 to June 30
      // Target Last Completed Fiscal Year
      const currentYear = today.getFullYear();
      const isBeforeJune30 = today.getMonth() < 5 || (today.getMonth() === 5 && today.getDate() < 30);

      const fyEndYear = isBeforeJune30 ? currentYear - 1 : currentYear;

      end = new Date(fyEndYear, 5, 30); // June 30
      start = new Date(fyEndYear - 1, 6, 1); // July 1 previous year
      break;

    default:
      // Default to 7 days
      end = new Date(today);
      start = new Date(today);
      start.setDate(today.getDate() - 7);
      break;
  }

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

/**
 * Build dimension filter from UI inputs
 */
function buildDimensionFilter() {
  const enableExclude = document.getElementById('enableExcludeFilter').checked;
  const excludePath = document.getElementById('excludePagePath').value.trim();

  if (enableExclude && excludePath) {
    return {
      notExpression: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'CONTAINS',
            value: excludePath,
            caseSensitive: false
          }
        }
      }
    };
  }

  return null;
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

      // Build dimension filter
      const dimensionFilter = buildDimensionFilter();

      // Fetch data from GA4
      const data = await fetchGA4Data(propertyId, dateRanges, dimensionFilter);

      // Update dashboard
      updateDashboard(data, dateRanges, 'time');

      // Store data for re-rendering (log scale toggle)
      window.lastChartData = {
        primaryData: data.main.rows,
        comparisonData: data.main.rows, // Simplified for now, logic in updateDashboard handles splitting
        primaryTotals: calculateTotals(data.summary.rows[0]),
        comparisonTotals: calculateTotals(data.summary.rows[1] || data.summary.rows[0])
      };

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

      // Build dimension filter
      const dimensionFilter = buildDimensionFilter();

      // Fetch data for all properties
      const multiPropertyData = await fetchMultiPropertyData(selectedProperties, dateRange, dimensionFilter);

      // Update dashboard
      updateDashboard(multiPropertyData, dateRange, 'property', selectedProperties);

      // Store data for re-rendering
      window.lastChartData = {
        propertyTotals: multiPropertyData,
        dateRange: dateRange
      };
    }

    // Fetch and render overview graph (always)
    fetchAndRenderOverviewGraph();

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
 * Fetches 3 reports: Main (metrics), Device (mobile views), Channel (social traffic)
 */
async function fetchGA4Data(propertyId, dateRanges, dimensionFilter = null) {
  // 1. Main Report (Daily Trend)
  const mainRequest = {
    property: `properties/${propertyId}`,
    dateRanges: dateRanges,
    metrics: METRICS,
    dimensions: [{ name: 'date' }],
  };

  // 2. Device Report (for Mobile Page Views)
  const deviceRequest = {
    property: `properties/${propertyId}`,
    dateRanges: dateRanges,
    metrics: [{ name: 'screenPageViews' }],
    dimensions: [{ name: 'deviceCategory' }],
  };

  // 3. Channel Report (for Social Traffic AND Events Per Session)
  // User navigation: Acquisition -> Traffic Acquisition (Session Primary Channel Group) -> Events Per Session
  const channelRequest = {
    property: `properties/${propertyId}`,
    dateRanges: dateRanges,
    metrics: [
      { name: 'sessions' },
      { name: 'eventCount' }  // Changed to eventCount to calculate manually
    ],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
  };

  // 4. Engagement Report (for Average Engagement Time Per Active User)
  // User navigation: Engagement -> Page Path and Screen Class -> Average Engagement Time Per Active User
  const engagementRequest = {
    property: `properties/${propertyId}`,
    dateRanges: dateRanges,
    metrics: [{ name: 'userEngagementDuration' }],
    dimensions: [{ name: 'pagePath' }],
  };

  // 5. Summary Report (No Dimensions - Accurate Totals)
  const summaryRequest = {
    property: `properties/${propertyId}`,
    dateRanges: dateRanges,
    metrics: METRICS,
  };

  if (dimensionFilter) {
    mainRequest.dimensionFilter = dimensionFilter;
    deviceRequest.dimensionFilter = dimensionFilter;
    channelRequest.dimensionFilter = dimensionFilter;
    engagementRequest.dimensionFilter = dimensionFilter;
    summaryRequest.dimensionFilter = dimensionFilter;
  }

  try {
    const [mainResponse, deviceResponse, channelResponse, engagementResponse, summaryResponse] = await Promise.all([
      gapi.client.request({
        path: 'https://analyticsdata.googleapis.com/v1beta/properties/' + propertyId + ':runReport',
        method: 'POST',
        body: mainRequest,
      }),
      gapi.client.request({
        path: 'https://analyticsdata.googleapis.com/v1beta/properties/' + propertyId + ':runReport',
        method: 'POST',
        body: deviceRequest,
      }),
      gapi.client.request({
        path: 'https://analyticsdata.googleapis.com/v1beta/properties/' + propertyId + ':runReport',
        method: 'POST',
        body: channelRequest,
      }),
      gapi.client.request({
        path: 'https://analyticsdata.googleapis.com/v1beta/properties/' + propertyId + ':runReport',
        method: 'POST',
        body: engagementRequest,
      }),
      gapi.client.request({
        path: 'https://analyticsdata.googleapis.com/v1beta/properties/' + propertyId + ':runReport',
        method: 'POST',
        body: summaryRequest,
      }),
    ]);

    return {
      main: mainResponse.result,
      device: deviceResponse.result,
      channel: channelResponse.result,
      engagement: engagementResponse.result,
      summary: summaryResponse.result,
    };
  } catch (error) {
    throw new Error(error.result?.error?.message || 'Failed to fetch GA4 data');
  }
}

/**
 * Fetch data from multiple GA4 properties
 */
async function fetchMultiPropertyData(properties, dateRange, dimensionFilter = null) {
  const allData = [];

  for (const property of properties) {
    // 1. Main Report
    const mainRequest = {
      property: `properties/${property.id}`,
      dateRanges: [{
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }],
      metrics: METRICS,
      dimensions: [{ name: 'date' }],
    };

    // 2. Device Report
    const deviceRequest = {
      property: `properties/${property.id}`,
      dateRanges: [{
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }],
      metrics: [{ name: 'screenPageViews' }],
      dimensions: [{ name: 'deviceCategory' }],
    };

    // 3. Channel Report (with Events Per Session)
    const channelRequest = {
      property: `properties/${property.id}`,
      dateRanges: [{
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }],
      metrics: [
        { name: 'sessions' },
        { name: 'eventCount' }
      ],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    };

    // 4. Engagement Report
    const engagementRequest = {
      property: `properties/${property.id}`,
      dateRanges: [{
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }],
      metrics: [{ name: 'userEngagementDuration' }],
      dimensions: [{ name: 'pagePath' }],
    };

    // 5. Summary Report
    const summaryRequest = {
      property: `properties/${property.id}`,
      dateRanges: [{
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }],
      metrics: METRICS,
    };

    if (dimensionFilter) {
      mainRequest.dimensionFilter = dimensionFilter;
      deviceRequest.dimensionFilter = dimensionFilter;
      channelRequest.dimensionFilter = dimensionFilter;
      engagementRequest.dimensionFilter = dimensionFilter;
      summaryRequest.dimensionFilter = dimensionFilter;
    }

    try {
      const [mainResponse, deviceResponse, channelResponse, engagementResponse, summaryResponse] = await Promise.all([
        gapi.client.request({
          path: 'https://analyticsdata.googleapis.com/v1beta/properties/' + property.id + ':runReport',
          method: 'POST',
          body: mainRequest,
        }),
        gapi.client.request({
          path: 'https://analyticsdata.googleapis.com/v1beta/properties/' + property.id + ':runReport',
          method: 'POST',
          body: deviceRequest,
        }),
        gapi.client.request({
          path: 'https://analyticsdata.googleapis.com/v1beta/properties/' + property.id + ':runReport',
          method: 'POST',
          body: channelRequest,
        }),
        gapi.client.request({
          path: 'https://analyticsdata.googleapis.com/v1beta/properties/' + property.id + ':runReport',
          method: 'POST',
          body: engagementRequest,
        }),
        gapi.client.request({
          path: 'https://analyticsdata.googleapis.com/v1beta/properties/' + property.id + ':runReport',
          method: 'POST',
          body: summaryRequest,
        }),
      ]);

      allData.push({
        propertyId: property.id,
        propertyName: property.name,
        data: {
          main: mainResponse.result,
          device: deviceResponse.result,
          channel: channelResponse.result,
          engagement: engagementResponse.result,
          summary: summaryResponse.result,
        },
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
    if (!data.main.rows || data.main.rows.length === 0) {
      showMessage('configMessage', 'No data available for the selected period', 'error');
      return;
    }

    // Separate data by date range
    const primaryData = data.main.rows.filter(row => row.dimensionValues[1]?.value === 'primary_period' || !row.dimensionValues[1]);
    const comparisonData = data.main.rows.filter(row => row.dimensionValues[1]?.value === 'comparison_period');

    // Extract summary data for each period
    // When we pass 2 date ranges to GA4, summary returns rows for each range
    // We need to match them to primary vs comparison period
    let primarySummary = null;
    let comparisonSummary = null;

    if (data.summary && data.summary.rows) {
      // GA4 returns rows in order of dateRanges array
      // First row = primary period, second row = comparison period
      if (data.summary.rows.length >= 1) {
        primarySummary = { rows: [data.summary.rows[0]] };
      }
      if (data.summary.rows.length >= 2) {
        comparisonSummary = { rows: [data.summary.rows[1]] };
      }
    }

    const primaryTotals = calculateTotals(primaryData, data.device, data.channel, primarySummary, data.engagement, 'primary_period');
    const comparisonTotals = calculateTotals(comparisonData, data.device, data.channel, comparisonSummary, data.engagement, 'comparison_period');

    // Update metric cards
    updateMetricCards(primaryTotals, comparisonTotals);

    // Update charts
    updateCharts(primaryData, comparisonData, primaryTotals, comparisonTotals);

    // Update data table
    updateDataTable(data.main, dateRangesOrRange);

  } else if (mode === 'property') {
    // Property Comparison Mode
    if (!data || data.length === 0) {
      showMessage('configMessage', 'No data available for the selected properties', 'error');
      return;
    }

    // Calculate totals for each property
    const propertyTotals = data.map(propertyData => ({
      propertyName: propertyData.propertyName,
      totals: calculateTotals(propertyData.data.main.rows || [], propertyData.data.device, propertyData.data.channel, propertyData.data.summary, propertyData.data.engagement)
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
 * Calculate totals from row data and auxiliary reports
 */
function calculateTotals(rows, deviceData = null, channelData = null, summaryData = null, engagementData = null, periodName = 'primary_period') {
  const totals = {
    users: 0,
    sessions: 0,
    pageViews: 0,
    engagedSessions: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    eventCount: 0,
    userEngagementDuration: 0,
    averageEngagementTime: 0,
    eventsPerSession: 0,
    activeUsers: 0,
    mobilePageViews: 0,
    socialSessions: 0,
    avgMonthlyPageViews: 0,
  };

  // Use Summary Data if available (More accurate for totals)
  if (summaryData && summaryData.rows && summaryData.rows.length > 0) {
    const metrics = summaryData.rows[0].metricValues;
    totals.users = parseFloat(metrics[0]?.value || 0);
    totals.sessions = parseFloat(metrics[1]?.value || 0);
    totals.pageViews = parseFloat(metrics[2]?.value || 0);
    totals.engagedSessions = parseFloat(metrics[3]?.value || 0);
    totals.avgSessionDuration = parseFloat(metrics[4]?.value || 0);
    totals.bounceRate = parseFloat(metrics[5]?.value || 0);
    totals.eventCount = parseFloat(metrics[6]?.value || 0);
    totals.userEngagementDuration = parseFloat(metrics[7]?.value || 0);
    totals.activeUsers = parseFloat(metrics[8]?.value || 0);
  } else if (rows && rows.length > 0) {
    // Fallback to summing rows (Less accurate for users)
    rows.forEach(row => {
      const metrics = row.metricValues;
      totals.users += parseFloat(metrics[0]?.value || 0);
      totals.sessions += parseFloat(metrics[1]?.value || 0);
      totals.pageViews += parseFloat(metrics[2]?.value || 0);
      totals.engagedSessions += parseFloat(metrics[3]?.value || 0);
      totals.avgSessionDuration += parseFloat(metrics[4]?.value || 0);
      totals.bounceRate += parseFloat(metrics[5]?.value || 0);
      totals.eventCount += parseFloat(metrics[6]?.value || 0);
      totals.userEngagementDuration += parseFloat(metrics[7]?.value || 0);
    });
    // Average the averages if summing rows
    const rowCount = rows.length;
    if (rowCount > 0) {
      totals.avgSessionDuration = totals.avgSessionDuration / rowCount;
      totals.bounceRate = totals.bounceRate / rowCount;
    }
  }

  // Mobile Page Views from Device Report
  if (deviceData && deviceData.rows) {
    deviceData.rows.forEach(row => {
      // Check if row belongs to current period (if date dimension exists)
      // If summary report (no date dimension), we assume it matches the period
      const rowPeriod = row.dimensionValues.length > 1 ? row.dimensionValues[1]?.value : periodName;
      if (rowPeriod !== periodName) return;

      const category = row.dimensionValues[0].value.toLowerCase(); // dimension[0] is deviceCategory
      if (category === 'mobile' || category === 'tablet') {
        totals.mobilePageViews += parseFloat(row.metricValues[0].value);
      }
    });
  }

  // Social Traffic and Events Per Session from Channel Report
  // User navigation: Acquisition -> Traffic Acquisition (Session Primary Channel Group) -> Events Per Session
  if (channelData && channelData.rows) {
    let channelSessions = 0;
    let channelEvents = 0;

    channelData.rows.forEach(row => {
      const rowPeriod = row.dimensionValues.length > 1 ? row.dimensionValues[1]?.value : periodName;
      if (rowPeriod !== periodName) return;

      const channel = row.dimensionValues[0].value; // dimension[0] is sessionDefaultChannelGroup

      // Social Traffic (User requested "Organic Social" specifically)
      if (channel === 'Organic Social') {
        totals.socialSessions += parseFloat(row.metricValues[0].value);
      }

      // Accumulate Sessions and Events for Events/Session calculation
      // metricValues[0] = sessions, metricValues[1] = eventCount
      if (row.metricValues[0] && row.metricValues[1]) {
        channelSessions += parseFloat(row.metricValues[0].value || 0);
        channelEvents += parseFloat(row.metricValues[1].value || 0);
      }
    });

    // Calculate Events Per Session (Total Events / Total Sessions from Channel Report)
    if (channelSessions > 0) {
      totals.eventsPerSession = channelEvents / channelSessions;
    }
  }

  // Average Engagement Time from Engagement Report
  // User navigation: Engagement -> Page Path and Screen Class -> Average Engagement Time Per Active User
  if (engagementData && engagementData.rows) {
    let totalEngagementDuration = 0;

    engagementData.rows.forEach(row => {
      const rowPeriod = row.dimensionValues.length > 1 ? row.dimensionValues[1]?.value : periodName;
      if (rowPeriod !== periodName) return;

      // Sum up userEngagementDuration across all pages
      totalEngagementDuration += parseFloat(row.metricValues[0]?.value || 0);
    });

    // Calculate average time on site (Total Engagement Duration / Active Users)
    // Active Users must come from Summary Report (totals.activeUsers)
    if (totals.activeUsers > 0) {
      totals.averageEngagementTime = totalEngagementDuration / totals.activeUsers;
    } else if (totals.users > 0) {
      // Fallback to Total Users if Active Users is 0 or missing
      totals.averageEngagementTime = totalEngagementDuration / totals.users;
    }
  }

  // Derived Metrics
  totals.socialTrafficPercent = totals.sessions > 0 ? (totals.socialSessions / totals.sessions) * 100 : 0;

  // Avg Events Per Session (User requested "Average Pages per Session (Events)")
  totals.avgPagesPerSession = totals.eventsPerSession;

  // Avg Time on Site (User Engagement Duration / Active Users)
  totals.avgTimeOnSite = totals.averageEngagementTime;

  // Avg Monthly Page Views
  // If the date range is approximately a year (364-367 days), divide by 12.
  // Otherwise, calculate months dynamically.
  if (rows && rows.length > 0) {
    const days = rows.length;
    if (days >= 364 && days <= 367) {
      totals.avgMonthlyPageViews = totals.pageViews / 12;
    } else {
      const months = days / 30.44;
      totals.avgMonthlyPageViews = months > 0 ? totals.pageViews / months : 0;
    }
  } else {
    // Fallback if no rows (e.g. summary only) - assume 1 month or use pageViews
    // Ideally we should pass the date range duration to this function
    totals.avgMonthlyPageViews = totals.pageViews;
  }

  return totals;
}

/**
 * Update metric cards
 */
function updateMetricCards(primary, comparison) {
  // 1. Page Views
  document.getElementById('metricPageViews').textContent = formatNumber(primary.pageViews);
  updateComparison('comparisonPageViews', primary.pageViews, comparison.pageViews);
  document.getElementById('comparisonValuePageViews').textContent = formatNumber(comparison.pageViews);

  // 2. Avg Monthly Page Views (New)
  document.getElementById('metricAvgMonthlyViews').textContent = formatNumber(primary.avgMonthlyPageViews);
  updateComparison('comparisonAvgMonthlyViews', primary.avgMonthlyPageViews, comparison.avgMonthlyPageViews);
  document.getElementById('comparisonValueAvgMonthlyViews').textContent = formatNumber(comparison.avgMonthlyPageViews);

  // 3. Mobile Page Views
  document.getElementById('metricMobileViews').textContent = formatNumber(primary.mobilePageViews);
  updateComparison('comparisonMobileViews', primary.mobilePageViews, comparison.mobilePageViews);
  document.getElementById('comparisonValueMobileViews').textContent = formatNumber(comparison.mobilePageViews);

  // 4. Unique Visitors (Total Users)
  document.getElementById('metricUsers').textContent = formatNumber(primary.users);
  updateComparison('comparisonUsers', primary.users, comparison.users);
  document.getElementById('comparisonValueUsers').textContent = formatNumber(comparison.users);

  // 5. Sessions
  document.getElementById('metricSessions').textContent = formatNumber(primary.sessions);
  updateComparison('comparisonSessions', primary.sessions, comparison.sessions);
  document.getElementById('comparisonValueSessions').textContent = formatNumber(comparison.sessions);

  // 6. Avg Events Per Session (Renamed from Pages/Session)
  document.getElementById('metricPagesPerSession').textContent = primary.avgPagesPerSession.toFixed(2);
  updateComparison('comparisonPagesPerSession', primary.avgPagesPerSession, comparison.avgPagesPerSession);
  document.getElementById('comparisonValuePagesPerSession').textContent = comparison.avgPagesPerSession.toFixed(2);

  // 7. Avg Time on Site (Seconds -> MM:SS)
  document.getElementById('metricAvgTime').textContent = formatDuration(primary.avgTimeOnSite);
  updateComparison('comparisonAvgTime', primary.avgTimeOnSite, comparison.avgTimeOnSite);
  document.getElementById('comparisonValueAvgTime').textContent = formatDuration(comparison.avgTimeOnSite);

  // 8. % Traffic from Social Media
  document.getElementById('metricSocialTraffic').textContent = formatPercent(primary.socialTrafficPercent);
  updateComparison('comparisonSocialTraffic', primary.socialTrafficPercent, comparison.socialTrafficPercent);
  document.getElementById('comparisonValueSocialTraffic').textContent = formatPercent(comparison.socialTrafficPercent);
}

/**
 * Format duration in seconds to MM:SS
 */
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
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
  const isLogScale = document.getElementById('logScaleToggle').checked;

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
        type: isLogScale ? 'logarithmic' : 'linear',
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
          display: false,
        },
      },
    },
  };
}

/**
 * Fetch and render overview graph for all properties
 */
async function fetchAndRenderOverviewGraph() {
  console.log('fetchAndRenderOverviewGraph called');

  const chartContainer = document.getElementById('overviewChart').parentElement;

  // Show loading state
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'overviewLoading';
  loadingDiv.className = 'flex-center h-full';
  loadingDiv.innerHTML = '<div class="spinner"></div><span class="ml-sm text-muted">Loading overview data...</span>';

  // Ensure relative positioning for absolute loading overlay if needed, 
  // or just append if we want to replace content. 
  // Chart.js uses the canvas, so we can overlay or hide the canvas.
  // Let's just append a loading overlay.
  chartContainer.style.position = 'relative';
  loadingDiv.style.position = 'absolute';
  loadingDiv.style.top = '0';
  loadingDiv.style.left = '0';
  loadingDiv.style.width = '100%';
  loadingDiv.style.height = '100%';
  loadingDiv.style.background = 'rgba(255, 255, 255, 0.8)';
  loadingDiv.style.zIndex = '10';

  // Remove existing loading/error if any
  const existingLoading = document.getElementById('overviewLoading');
  if (existingLoading) existingLoading.remove();
  const existingError = document.getElementById('overviewError');
  if (existingError) existingError.remove();

  chartContainer.appendChild(loadingDiv);

  // Determine date range based on selected timeframe
  const today = new Date();
  let startDate, endDate;

  if (overviewTimeframe === 'ytd') {
    // Year to Date (Jan 1 to Today)
    startDate = formatDate(new Date(today.getFullYear(), 0, 1));
    endDate = formatDate(today);
  } else {
    // Fiscal Year (July 1 - June 30)
    const currentYear = today.getFullYear();
    const isBeforeJuly = today.getMonth() < 6; // Jan=0, June=5

    if (isBeforeJuly) {
      startDate = formatDate(new Date(currentYear - 1, 6, 1));
      endDate = formatDate(new Date(currentYear, 5, 30));
    } else {
      startDate = formatDate(new Date(currentYear, 6, 1));
      endDate = formatDate(new Date(currentYear + 1, 5, 30));
    }
  }

  const dateRange = { startDate, endDate };

  try {
    // Fetch daily page views for all properties
    // Use map to create promises, but catch individual errors to prevent Promise.all from failing entirely
    // OR use Promise.allSettled
    const promises = PROPERTIES.map(async (prop) => {
      try {
        const request = {
          property: `properties/${prop.id}`,
          dateRanges: [dateRange],
          metrics: [{ name: 'screenPageViews' }],
          dimensions: [{ name: 'date' }]
        };

        const response = await gapi.client.request({
          path: 'https://analyticsdata.googleapis.com/v1beta/properties/' + prop.id + ':runReport',
          method: 'POST',
          body: request,
        });

        return {
          id: prop.id,
          name: prop.name,
          rows: response.result.rows || []
        };
      } catch (err) {
        console.error(`Error fetching data for ${prop.name} (${prop.id}):`, err);
        return null; // Return null for failed requests
      }
    });

    const results = await Promise.all(promises);

    // Filter out failed requests
    const validResults = results.filter(r => r !== null);

    if (validResults.length === 0) {
      throw new Error('No data available for any property. Please check permissions.');
    }

    // Store for re-rendering (log scale)
    window.lastOverviewData = validResults;

    // Remove loading
    loadingDiv.remove();

    // Render Chart
    renderOverviewChart(validResults);

  } catch (error) {
    console.error('Error fetching overview data:', error);
    loadingDiv.remove();

    // Show error message in container
    const errorDiv = document.createElement('div');
    errorDiv.id = 'overviewError';
    errorDiv.className = 'flex-center h-full text-danger';
    errorDiv.style.flexDirection = 'column';
    errorDiv.innerHTML = `<p>Failed to load graph data.</p><p class="text-sm text-muted">${error.message}</p>`;
    chartContainer.appendChild(errorDiv);
  }
}

function renderOverviewChart(data) {
  if (overviewChart) overviewChart.destroy();

  const ctx = document.getElementById('overviewChart').getContext('2d');
  const isLogScale = document.getElementById('overviewLogScale').checked;

  // Helper function to get week start date (Sunday) for a given date
  function getWeekStart(dateStr) {
    // dateStr format: YYYYMMDD
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // 0-indexed
    const day = parseInt(dateStr.substring(6, 8));
    const date = new Date(year, month, day);

    // Get Sunday of this week
    const dayOfWeek = date.getDay();
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - dayOfWeek);

    return weekStart;
  }

  function formatWeekLabel(weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startStr = `${(weekStart.getMonth() + 1).toString().padStart(2, '0')}/${weekStart.getDate().toString().padStart(2, '0')}`;
    const endStr = `${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}/${weekEnd.getDate().toString().padStart(2, '0')}`;

    return `${startStr}-${endStr}`;
  }

  // Aggregate data by week for each property
  const weeklyData = data.map(prop => {
    const weekMap = new Map();

    prop.rows.forEach(row => {
      const dateStr = row.dimensionValues[0].value;
      const weekStart = getWeekStart(dateStr);
      const weekKey = weekStart.toISOString().split('T')[0];

      const views = parseFloat(row.metricValues[0].value || 0);

      if (weekMap.has(weekKey)) {
        weekMap.set(weekKey, weekMap.get(weekKey) + views);
      } else {
        weekMap.set(weekKey, views);
      }
    });

    return {
      id: prop.id,
      name: prop.name,
      weekMap: weekMap
    };
  });

  // Get all unique week keys across all properties and sort them
  const allWeeks = new Set();
  weeklyData.forEach(prop => {
    prop.weekMap.forEach((_, weekKey) => allWeeks.add(weekKey));
  });

  const sortedWeeks = Array.from(allWeeks).sort();

  // Create labels from sorted weeks
  const labels = sortedWeeks.map(weekKey => {
    const weekStart = new Date(weekKey);
    return formatWeekLabel(weekStart);
  });

  // Define colors for the 5 properties
  const colors = [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6'  // Violet
  ];

  const datasets = weeklyData.map((prop, index) => {
    // Map weekly data to align with sorted weeks
    const alignedData = sortedWeeks.map(weekKey => {
      return prop.weekMap.get(weekKey) || 0;
    });

    // Create pointRadius array: 0 for all points except the last one (which shows the logo)
    const pointRadiusArray = alignedData.map((_, idx) => idx === alignedData.length - 1 ? 32 : 0);

    // Create pointStyle array: only use logo for the last point
    const pointStyleArray = alignedData.map((_, idx) =>
      idx === alignedData.length - 1 ? (propertyLogos[prop.id] || 'circle') : 'circle'
    );

    return {
      label: prop.name,
      data: alignedData,
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length],
      borderWidth: 3, // Thicker lines
      tension: 0.4,
      pointStyle: pointStyleArray,
      radius: pointRadiusArray,
      pointRadius: pointRadiusArray,
      hoverRadius: 8,
      pointHoverRadius: 8,
      pointBackgroundColor: 'white',
    };
  });

  console.log('Rendering Overview Chart (v5) with radius 4');

  overviewChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: false, // Use boxes instead of circles
            boxWidth: 15,
            boxHeight: 15,
            padding: 20,
            font: { family: 'Inter', size: 12 }
          }
        },
        tooltip: {
          usePointStyle: true,
          padding: 12,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 12 }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#64748b',
            maxTicksLimit: 12 // Limit x-axis labels
          }
        },
        y: {
          type: isLogScale ? 'logarithmic' : 'linear',
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          beginAtZero: false, // Don't force y-axis to start at 0
          ticks: {
            color: '#64748b',
            maxTicksLimit: 20 // More tick marks for better granularity
          }
        }
      }
    }
  });
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
  html += '</tbody></table>';
  tableContainer.innerHTML = html;
}

/**
 * Update charts for property comparison
 */
function updateChartsForProperties(data, propertyTotals) {
  // Destroy existing charts
  if (trendChart) trendChart.destroy();
  if (comparisonChart) comparisonChart.destroy();

  const isLogScale = document.getElementById('logScaleToggle').checked;

  // Trend Chart - Line chart showing daily trends for all properties
  // We need to align dates across properties.
  // Assuming all properties return data for the same date range.
  const trendCtx = document.getElementById('trendChart').getContext('2d');

  // Use dates from the first property as labels
  const firstPropertyData = data[0].data.main.rows || [];
  const labels = firstPropertyData.map(row => {
    const date = row.dimensionValues[0].value;
    return `${date.substring(4, 6)}/${date.substring(6, 8)}`;
  });

  const datasets = data.map((prop, index) => {
    const color = index === 0 ? 'rgb(99, 102, 241)' : 'rgb(139, 92, 246)'; // Primary vs Secondary colors
    return {
      label: prop.propertyName,
      data: (prop.data.main.rows || []).map(row => parseFloat(row.metricValues[0].value)), // Users
      borderColor: color,
      backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
      tension: 0.4,
    };
  });

  trendChart = new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: getChartOptions('Daily User Trends'),
  });

  // Comparison Chart - Bar chart comparing totals
  const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');

  const comparisonDatasets = data.map((prop, index) => {
    const color = index === 0 ? 'rgba(99, 102, 241, 0.8)' : 'rgba(139, 92, 246, 0.8)';
    return {
      label: prop.propertyName,
      data: [
        propertyTotals[index].totals.users,
        propertyTotals[index].totals.sessions,
        propertyTotals[index].totals.pageViews
      ],
      backgroundColor: color,
    };
  });

  comparisonChart = new Chart(comparisonCtx, {
    type: 'bar',
    data: {
      labels: ['Users', 'Sessions', 'Page Views'],
      datasets: comparisonDatasets,
    },
    options: getChartOptions('Property Comparison'),
  });
}

/**
 * Update data table for property comparison
 */
function updateDataTableForProperties(data, dateRange) {
  const tableContainer = document.getElementById('dataTable');

  let html = '<table style="width: 100%; border-collapse: collapse;">';
  html += '<thead><tr style="border-bottom: 1px solid var(--color-border);">';
  html += '<th style="padding: var(--spacing-sm); text-align: left; color: var(--color-text-secondary);">Date</th>';
  data.forEach(prop => {
    html += `<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">${prop.propertyName} Users</th>`;
  });
  html += '</tr></thead>';
  html += '<tbody>';

  // Assuming all properties have same number of rows and aligned dates
  const rowCount = data[0].data.main.rows ? data[0].data.main.rows.length : 0;

  for (let i = 0; i < rowCount; i++) {
    const row = data[0].data.main.rows[i];
    const date = row.dimensionValues[0].value;

    html += `<tr style="border-bottom: 1px solid var(--color-border);">`;
    html += `<td style="padding: var(--spacing-sm); color: var(--color-text-primary);">${formatDateString(date)}</td>`;

    data.forEach(prop => {
      const propRow = prop.data.main.rows ? prop.data.main.rows[i] : null;
      const users = propRow ? parseFloat(propRow.metricValues[0].value) : 0;
      html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatNumber(users)}</td>`;
    });

    html += '</tr>';
  }

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
/**
 * Update metric cards for property comparison mode
 */
function updateMetricCardsForProperties(propertyTotals) {
  // We need at least 2 properties for comparison
  if (propertyTotals.length < 2) {
    console.warn('Property comparison requires at least 2 properties');
    return;
  }

  const prop1 = propertyTotals[0];
  const prop2 = propertyTotals[1];

  // Helper to render enhanced property card
  const renderEnhancedPropertyCard = (elementId, metric, formatFn = formatNumber, isVolume = true) => {
    const container = document.getElementById(elementId);
    if (!container) return;

    const prop1Value = prop1.totals[metric];
    const prop2Value = prop2.totals[metric];

    // Calculate percentage difference
    const calcChange = (current, previous) => {
      if (!previous || previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    // For time-period changes, we'll show 0% for now (needs previous period data)
    const prop1Change = 0; // TODO: Calculate from previous period
    const prop2Change = 0; // TODO: Calculate from previous period

    // Calculate property comparison
    const maxValue = Math.max(prop1Value, prop2Value);
    const minValue = Math.min(prop1Value, prop2Value);
    const ratio = minValue > 0 ? (maxValue / minValue).toFixed(1) : 0;
    const percentDiff = minValue > 0 ? (((maxValue - minValue) / minValue) * 100).toFixed(0) : 0;
    const prop1Width = maxValue > 0 ? (prop1Value / maxValue) * 100 : 0;
    const prop2Width = maxValue > 0 ? (prop2Value / maxValue) * 100 : 0;

    let html = `
      <!-- Time Period Comparison Section -->
      <div class="time-period-section">
        <div class="time-period-label">Current Period vs Previous</div>
        <div class="time-period-grid">
          <div class="time-period-property">
            <div class="time-period-property-name">${prop1.propertyName}</div>
            <div class="time-period-value-row">
              <span class="time-period-value">${formatFn(prop1Value)}</span>
              ${prop1Change !== 0 ? `
                <span class="time-period-change ${prop1Change >= 0 ? 'positive' : 'negative'}">
                  ${prop1Change >= 0 ? '↑' : '↓'}${Math.abs(prop1Change).toFixed(1)}%
                </span>
              ` : ''}
            </div>
          </div>
          <div class="time-period-property">
            <div class="time-period-property-name">${prop2.propertyName}</div>
            <div class="time-period-value-row">
              <span class="time-period-value">${formatFn(prop2Value)}</span>
              ${prop2Change !== 0 ? `
                <span class="time-period-change ${prop2Change >= 0 ? 'positive' : 'negative'}">
                  ${prop2Change >= 0 ? '↑' : '↓'}${Math.abs(prop2Change).toFixed(1)}%
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Comparison Divider -->
      <div class="comparison-divider">
        <div class="comparison-divider-label">Property Comparison</div>
      </div>

      <!-- Property 1 Bar -->
      <div class="property-bar-row">
        <div class="property-bar-header">
          <span class="property-bar-name">${prop1.propertyName}</span>
          <span class="property-bar-value">${formatFn(prop1Value)}</span>
        </div>
        <div class="property-bar-container">
          <div class="property-bar-fill primary" style="width: ${prop1Width}%"></div>
        </div>
      </div>

      <!-- Property 2 Bar -->
      <div class="property-bar-row">
        <div class="property-bar-header">
          <span class="property-bar-name">${prop2.propertyName}</span>
          <span class="property-bar-value">${formatFn(prop2Value)}</span>
        </div>
        <div class="property-bar-container">
          <div class="property-bar-fill secondary" style="width: ${prop2Width}%"></div>
        </div>
      </div>

      <!-- Comparison Summary -->
      <div class="comparison-summary">
        ${metric.includes('Percent') ?
        `<strong>Difference:</strong> ${Math.abs(prop1Value - prop2Value).toFixed(1)} percentage points` :
        `<strong>Ratio:</strong> ${ratio}:1 <span style="margin-left: 12px;">(${percentDiff}% ${prop1Value > prop2Value ? 'higher' : 'lower'})</span>`
      }
      </div>
    `;

    container.innerHTML = html;
  };

  // Render each metric card
  renderEnhancedPropertyCard('propertyViewPageViews', 'pageViews', formatNumber, true);
  renderEnhancedPropertyCard('propertyViewAvgMonthlyViews', 'avgMonthlyPageViews', formatNumber, true);
  renderEnhancedPropertyCard('propertyViewMobileViews', 'mobilePageViews', formatNumber, true);
  renderEnhancedPropertyCard('propertyViewUsers', 'users', formatNumber, true);
  renderEnhancedPropertyCard('propertyViewSessions', 'sessions', formatNumber, true);
  renderEnhancedPropertyCard('propertyViewPagesPerSession', 'avgPagesPerSession', (v) => v.toFixed(2), false);
  renderEnhancedPropertyCard('propertyViewAvgTime', 'avgTimeOnSite', formatDuration, false);
  renderEnhancedPropertyCard('propertyViewSocialTraffic', 'socialTrafficPercent', formatPercent, false);

  // Add insights card after the metrics grid
  addInsightsCard(prop1, prop2);
}

function addInsightsCard(prop1, prop2) {
  // Find the dashboard element and check if insights card already exists
  const dashboard = document.getElementById('dashboard');
  let insightsCard = document.getElementById('insightsCard');

  if (!insightsCard) {
    insightsCard = document.createElement('div');
    insightsCard.id = 'insightsCard';
    insightsCard.className = 'insights-card';
    dashboard.appendChild(insightsCard);
  }

  // Calculate insights
  const trafficRatio = (prop1.totals.pageViews / prop2.totals.pageViews).toFixed(1);
  const engagementProp1 = prop1.totals.avgPagesPerSession;
  const engagementProp2 = prop2.totals.avgPagesPerSession;
  const timeRatio = (prop1.totals.avgTimeOnSite / prop2.totals.avgTimeOnSite).toFixed(1);

  insightsCard.innerHTML = `
    <h2>Key Insights</h2>
    <div class="insights-grid">
      <div class="insight-box blue">
        <div class="insight-label">Traffic Scale</div>
        <div class="insight-value">${trafficRatio}× ${trafficRatio > 1 ? 'larger' : 'smaller'}</div>
        <div class="insight-description">${prop1.propertyName} drives ${trafficRatio > 1 ? 'more' : 'less'} traffic</div>
      </div>
      <div class="insight-box yellow">
        <div class="insight-label">Engagement Quality</div>
        <div class="insight-value">${engagementProp1.toFixed(2)} vs ${engagementProp2.toFixed(2)}</div>
        <div class="insight-description">Events per session comparison</div>
      </div>
      <div class="insight-box purple">
        <div class="insight-label">Time on Site</div>
        <div class="insight-value">${timeRatio}× ${timeRatio > 1 ? 'longer' : 'shorter'}</div>
        <div class="insight-description">${prop1.propertyName} retention comparison</div>
      </div>
    </div>
  `;
}

/**
 * Update charts for property comparison mode
 */
function updateChartsForProperties(propertyData, propertyTotals) {
  // Destroy existing charts
  if (trendChart) trendChart.destroy();
  if (comparisonChart) comparisonChart.destroy();

  // Get dates from first property
  const firstProperty = propertyData[0].data.main;
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
    data: (property.data.main.rows || []).map(row => parseFloat(row.metricValues[0].value)),
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
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Page Views</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Avg Monthly</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Mobile Views</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Users</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Sessions</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Events/Session</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">Time on Site</th>';
  html += '<th style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-secondary);">% Social</th>';
  html += '</tr></thead>';
  html += '<tbody>';

  propertyData.forEach(property => {
    const totals = calculateTotals(property.data.main.rows || [], property.data.device, property.data.channel, property.data.summary, property.data.engagement);

    html += `<tr style="border-bottom: 1px solid var(--color-border);">`;
    html += `<td style="padding: var(--spacing-sm); color: var(--color-text-primary); font-weight: 600;">${property.propertyName}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatNumber(totals.pageViews)}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatNumber(totals.avgMonthlyPageViews)}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatNumber(totals.mobilePageViews)}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatNumber(totals.users)}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatNumber(totals.sessions)}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${totals.avgPagesPerSession.toFixed(2)}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatDuration(totals.avgTimeOnSite)}</td>`;
    html += `<td style="padding: var(--spacing-sm); text-align: right; color: var(--color-text-primary);">${formatPercent(totals.socialTrafficPercent)}</td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';
  tableContainer.innerHTML = html;
}

