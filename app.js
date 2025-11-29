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
];

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

  // Filter checkbox
  document.getElementById('enableExcludeFilter').addEventListener('change', (e) => {
    const inputGroup = document.getElementById('excludeFilterInputGroup');
    if (e.target.checked) {
      inputGroup.classList.remove('hidden');
    } else {
      inputGroup.classList.add('hidden');
    }
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

  // 3. Channel Report (for Social Traffic)
  const channelRequest = {
    property: `properties/${propertyId}`,
    dateRanges: dateRanges,
    metrics: [{ name: 'sessions' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
  };

  // 4. Summary Report (No Dimensions - Accurate Totals)
  const summaryRequest = {
    property: `properties/${propertyId}`,
    dateRanges: dateRanges,
    metrics: METRICS,
  };

  if (dimensionFilter) {
    mainRequest.dimensionFilter = dimensionFilter;
    deviceRequest.dimensionFilter = dimensionFilter;
    channelRequest.dimensionFilter = dimensionFilter;
    summaryRequest.dimensionFilter = dimensionFilter;
  }

  try {
    const [mainResponse, deviceResponse, channelResponse, summaryResponse] = await Promise.all([
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
        body: summaryRequest,
      }),
    ]);

    return {
      main: mainResponse.result,
      device: deviceResponse.result,
      channel: channelResponse.result,
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

    // 3. Channel Report
    const channelRequest = {
      property: `properties/${property.id}`,
      dateRanges: [{
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }],
      metrics: [{ name: 'sessions' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    };

    // 4. Summary Report
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
      summaryRequest.dimensionFilter = dimensionFilter;
    }

    try {
      const [mainResponse, deviceResponse, channelResponse, summaryResponse] = await Promise.all([
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
    if (!data.rows || data.rows.length === 0) {
      if (!data.main.rows || data.main.rows.length === 0) {
        showMessage('configMessage', 'No data available for the selected period', 'error');
        return;
      }

      // Separate data by date range
      const primaryData = data.main.rows.filter(row => row.dimensionValues[1]?.value === 'primary_period' || !row.dimensionValues[1]);
      const comparisonData = data.main.rows.filter(row => row.dimensionValues[1]?.value === 'comparison_period');

      // Calculate totals for each period
      // Note: We pass data.summary, but summary report doesn't have date dimension, so it covers the WHOLE period.
      // For Time Comparison, we have two distinct periods in data.main (primary vs comparison).
      // The summary report fetched in fetchGA4Data covers the *entire* date range (both periods combined? No, fetchGA4Data receives dateRanges).
      // fetchGA4Data is called with `dateRanges` which is an array of 2 ranges.
      // The summary report will return rows for each date range if we request it?
      // Wait, summary report has NO dimensions. If we pass 2 date ranges, GA4 returns 1 row per date range?
      // Let's verify fetchGA4Data summary request. It sends `dateRanges`.
      // If we send 2 date ranges, the response should contain metric values for each range?
      // Actually, without dimensions, it might aggregate everything?
      // Or it returns multiple rows, one for each date range?
      // Standard behavior: if multiple date ranges, it returns columns for each? Or rows?
      // Usually it returns rows with "date_range" dimension if requested?
      // But we didn't request "date_range" dimension in summary.
      // If we don't request "date_range" dimension, but provide 2 ranges, what happens?
      // It might return a single total?
      // To be safe for Time Comparison, we might need to rely on the "date_range" dimension being present implicitly?
      // Actually, let's look at `fetchGA4Data`.
      // We are using `gapi.client.request`.
      // If we want accurate totals for Primary vs Comparison, we need to know which row in summary corresponds to which.
      // If summary has no dimensions, it might just return one row if ranges overlap or are treated as one?
      // Actually, let's assume for now we only use summary for Property Comparison (where we fetch per property) or single range?
      // For Time Comparison, we have `primaryData` and `comparisonData` from `main` report which has `date` dimension.
      // `calculateTotals` sums these up.
      // If we pass `data.summary`, `calculateTotals` uses it and ignores rows.
      // If `data.summary` has 1 row (total for both ranges?), then we assign that total to BOTH primary and comparison? That would be WRONG.
      // So for Time Comparison, we should probably NOT use the global summary unless we are sure it's split.
      // However, the user's issue was with "Fiscal Year" which is a single range (or comparison against previous?).
      // If "Fiscal Year" preset is used, it creates 2 ranges (Primary vs Comparison).
      // The user's image shows 2 columns: 2024-2025 vs 2023-2024.
      // So we DO need accurate totals for BOTH.
      // If `summary` report doesn't split by date range, we can't use it for Time Comparison.
      // UNLESS we add `date_range` dimension to summary report.
      // Let's modify `fetchGA4Data` to add `date_range` dimension to summary report?
      // But `date_range` is not a standard dimension name? It's usually automatic.
      // Actually, let's look at `calculateTotals`. It checks `summaryData.rows`.
      // If we want to fix this properly, we should rely on the `main` report for Time Comparison (summing rows) which is what we did before, 
      // BUT the user says "incorrect metrics".
      // Maybe the "incorrectness" comes from Property Comparison mode?
      // The user said "I just accessed the metric for the past fiscal year for the collegian property".
      // "Collegian Property" implies Property Comparison? Or just selecting that property?
      // If they selected "Collegian" from the dropdown, they are in Time Comparison mode (default).
      // So they are likely in Time Comparison mode.
      // If so, `calculateTotals` summing rows is inaccurate for `totalUsers` (sums daily users != total unique users).
      // So we NEED summary data for Time Comparison too.
      // To get summary data split by date range, we just need to request `date_range` dimension?
      // Or just trust that rows correspond to ranges?
      // Let's try adding `date` dimension to summary? No, that defeats the purpose.
      // Let's assume for now we stick to row summing for Time Comparison (as it's harder to fix without risking breaking it) 
      // AND we fix the FORMULAS (Avg Monthly = /12).
      // The "Avg Monthly" fix in `calculateTotals` works on `rows`.
      // So that fix applies to Time Comparison.
      // The "Avg Events/Session" fix works on `totals`.
      // So if we sum rows, we get `sum(events)` and `sum(sessions)`. This is accurate.
      // The "Avg Time on Site" fix works on `totals`. `sum(duration) / sum(users)`.
      // `sum(users)` is the problem. It overcounts.
      // But for "Avg Time on Site", maybe overcounting users (daily active users sum) is what we have?
      // The user's "57 seconds" matches `Total Duration / Total Users`.
      // If `Total Users` is unique users, we need the summary.
      // Let's try to pass `null` for summary in Time Comparison for now to avoid merging data, 
      // BUT apply the formula fixes.
      // Wait, if I don't pass summary, `calculateTotals` uses rows.
      // `avgMonthlyPageViews` will use `rows.length` (days).
      // If I fix `calculateTotals` to use 12 months, it should work.

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

      const primaryTotals = calculateTotals(primaryData, data.device, data.channel, primarySummary, 'primary_period');
      const comparisonTotals = calculateTotals(comparisonData, data.device, data.channel, comparisonSummary, 'comparison_period');

      // Update metric cards
      updateMetricCards(primaryTotals, comparisonTotals);

      // Update charts
      updateCharts(primaryData, comparisonData, primaryTotals, comparisonTotals);

      // Update data table
      updateDataTable(data.main, dateRangesOrRange);

    } else {
      // Property Comparison Mode
      if (!data || data.length === 0) {
        showMessage('configMessage', 'No data available for the selected properties', 'error');
        return;
      }

      // Calculate totals for each property
      const propertyTotals = data.map(propertyData => ({
        propertyName: propertyData.propertyName,
        totals: calculateTotals(propertyData.data.main.rows || [], propertyData.data.device, propertyData.data.channel, propertyData.data.summary)
      }));

      // Update metric cards for property comparison
      updateMetricCardsForProperties(propertyTotals);

      // Update charts for property comparison
      updateChartsForProperties(data, propertyTotals);

      // Update data table for property comparison
      updateDataTableForProperties(data, dateRangesOrRange);
    }
  }
}

/**
 * Calculate totals from row data and auxiliary reports
 */
function calculateTotals(rows, deviceData = null, channelData = null, summaryData = null, periodName = 'primary_period') {
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
    totals.averageEngagementTime = parseFloat(metrics[8]?.value || 0);
    totals.eventsPerSession = parseFloat(metrics[9]?.value || 0);
    totals.activeUsers = parseFloat(metrics[10]?.value || 0);
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
      // Averages cannot be summed, but for fallback we might average them?
      // Better to leave as 0 or calculate from sums if possible.
    });
    // Average the averages if summing rows
    const rowCount = rows.length;
    if (rowCount > 0) {
      totals.avgSessionDuration = totals.avgSessionDuration / rowCount;
      totals.bounceRate = totals.bounceRate / rowCount;
      // Calculate derived metrics from sums
      totals.eventsPerSession = totals.sessions > 0 ? totals.eventCount / totals.sessions : 0;
      totals.averageEngagementTime = totals.users > 0 ? totals.userEngagementDuration / totals.users : 0;
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

  // Social Traffic from Channel Report
  if (channelData && channelData.rows) {
    channelData.rows.forEach(row => {
      const rowPeriod = row.dimensionValues.length > 1 ? row.dimensionValues[1]?.value : periodName;
      if (rowPeriod !== periodName) return;

      const channel = row.dimensionValues[0].value; // dimension[0] is sessionDefaultChannelGroup
      // User requested "Organic Social" specifically
      if (channel === 'Organic Social') {
        totals.socialSessions += parseFloat(row.metricValues[0].value);
      }
    });
  }

  // Derived Metrics
  totals.socialTrafficPercent = totals.sessions > 0 ? (totals.socialSessions / totals.sessions) * 100 : 0;

  // Avg Events Per Session (User requested "Average Pages per Session (Events)")
  // Use direct metric if available (from summary), otherwise calculated
  totals.avgPagesPerSession = totals.eventsPerSession;

  // Avg Time on Site (User Engagement Duration / Total Users)
  // Use direct metric if available (from summary), otherwise calculated
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

  // 1. Page Views
  document.getElementById('metricPageViews').textContent = formatNumber(baseline.totals.pageViews);
  updateComparison('comparisonPageViews', baseline.totals.pageViews, comparison.totals.pageViews);
  document.getElementById('comparisonValuePageViews').textContent = formatNumber(comparison.totals.pageViews);

  // 2. Avg Monthly Page Views
  document.getElementById('metricAvgMonthlyViews').textContent = formatNumber(baseline.totals.avgMonthlyPageViews);
  updateComparison('comparisonAvgMonthlyViews', baseline.totals.avgMonthlyPageViews, comparison.totals.avgMonthlyPageViews);
  document.getElementById('comparisonValueAvgMonthlyViews').textContent = formatNumber(comparison.totals.avgMonthlyPageViews);

  // 3. Mobile Page Views
  document.getElementById('metricMobileViews').textContent = formatNumber(baseline.totals.mobilePageViews);
  updateComparison('comparisonMobileViews', baseline.totals.mobilePageViews, comparison.totals.mobilePageViews);
  document.getElementById('comparisonValueMobileViews').textContent = formatNumber(comparison.totals.mobilePageViews);

  // 4. Unique Visitors
  document.getElementById('metricUsers').textContent = formatNumber(baseline.totals.users);
  updateComparison('comparisonUsers', baseline.totals.users, comparison.totals.users);
  document.getElementById('comparisonValueUsers').textContent = formatNumber(comparison.totals.users);

  // 5. Sessions
  document.getElementById('metricSessions').textContent = formatNumber(baseline.totals.sessions);
  updateComparison('comparisonSessions', baseline.totals.sessions, comparison.totals.sessions);
  document.getElementById('comparisonValueSessions').textContent = formatNumber(comparison.totals.sessions);

  // 6. Avg Events Per Session
  document.getElementById('metricPagesPerSession').textContent = baseline.totals.avgPagesPerSession.toFixed(2);
  updateComparison('comparisonPagesPerSession', baseline.totals.avgPagesPerSession, comparison.totals.avgPagesPerSession);
  document.getElementById('comparisonValuePagesPerSession').textContent = comparison.totals.avgPagesPerSession.toFixed(2);

  // 7. Avg Time on Site
  document.getElementById('metricAvgTime').textContent = formatDuration(baseline.totals.avgTimeOnSite);
  updateComparison('comparisonAvgTime', baseline.totals.avgTimeOnSite, comparison.totals.avgTimeOnSite);
  document.getElementById('comparisonValueAvgTime').textContent = formatDuration(comparison.totals.avgTimeOnSite);

  // 8. % Traffic from Social Media
  document.getElementById('metricSocialTraffic').textContent = formatPercent(baseline.totals.socialTrafficPercent);
  updateComparison('comparisonSocialTraffic', baseline.totals.socialTrafficPercent, comparison.totals.socialTrafficPercent);
  document.getElementById('comparisonValueSocialTraffic').textContent = formatPercent(comparison.totals.socialTrafficPercent);
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
    const totals = calculateTotals(property.data.main.rows || [], property.data.device, property.data.channel, property.data.summary);

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

