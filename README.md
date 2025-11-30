# GA4 Analytics Platform for RMSMC

A comprehensive, user-friendly analytics dashboard that connects to Google Analytics 4 (GA4) properties to display key metrics with powerful period comparison capabilities.

![GA4 Analytics Platform](https://img.shields.io/badge/GA4-Analytics-blue) ![OAuth 2.0](https://img.shields.io/badge/Auth-OAuth%202.0-green) ![Chart.js](https://img.shields.io/badge/Charts-Chart.js-ff6384)

## Features

- **Secure OAuth 2.0 Authentication** - Sign in with Google for secure access to GA4 data
- **Period Comparison** - Compare up to 4 different time periods simultaneously
- **Interactive Visualizations** - Beautiful charts powered by Chart.js
- **Premium UI Design** - Modern dark mode with glassmorphism effects
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Real-time Data** - Fetch live data directly from GA4 properties
- **Key Metrics** - Track users, sessions, page views, engagement rate, and more
- **Flexible Date Ranges** - Preset options or custom date range selection

## Quick Start

### Prerequisites

1. **Google Cloud Project** with GA4 Data API enabled
2. **OAuth 2.0 Client ID** configured for web application
3. **GA4 Property ID** that you want to analyze
4. A local web server (Python, Node.js, or any HTTP server)

### Setup Instructions

#### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Analytics Data API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Analytics Data API"
   - Click "Enable"

#### Step 2: Configure OAuth Consent Screen

**This step is critical and must be done before creating credentials:**

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace account)
3. Fill in the required fields:
   - **App name:** GA4 Analytics Platform (or your preferred name)
   - **User support email:** Your email address
   - **Developer contact information:** Your email address
4. Click "Save and Continue"
5. Skip the "Scopes" section (click "Save and Continue")
6. **Add Test Users** (IMPORTANT):
   - Click "Add Users"
   - Enter your Google account email address
   - Click "Add"
   - Click "Save and Continue"
7. Review and click "Back to Dashboard"

> **Note:** Your app will remain in "Testing" mode. Only users you add as test users will be able to sign in. This is normal for internal tools.

#### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application" as the application type
4. Give it a name (e.g., "GA4 Analytics Web Client")
5. Configure authorized origins and redirect URIs:
   
   **Authorized JavaScript origins:**
   - `http://localhost:8000`
   - Add your production domain if deploying (e.g., `https://yourdomain.com`)
   
   **Authorized redirect URIs:**
   - `http://localhost:8000`
   - Add your production domain if deploying (e.g., `https://yourdomain.com`)

6. Click "Create"
7. **Copy your Client ID** - you'll need this in the next step

#### Step 4: Configure the Application

1. Open `app.js` in a text editor
2. Find the `CONFIG` object at the top of the file (around line 2-10)
3. Replace the placeholder with your actual Client ID:

```javascript
const CONFIG = {
  CLIENT_ID: 'your-actual-client-id.apps.googleusercontent.com',
  SCOPES: 'https://www.googleapis.com/auth/analytics.readonly',
  DISCOVERY_DOC: 'https://analyticsdata.googleapis.com/$discovery/rest?version=v1beta',
};
```

**Example:**
```javascript
const CONFIG = {
  CLIENT_ID: '123456789-abc123def456.apps.googleusercontent.com',
  // ... rest stays the same
};
```

#### Step 5: Start a Local Web Server

The application **must** be served over HTTP (not opened directly as a `file://`). Choose one of these options:

**Python 3:**
```bash
python3 -m http.server 8000
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

**Node.js (http-server):**
```bash
npx http-server -p 8000
```

**Node.js (live-server with auto-reload):**
```bash
npx live-server --port=8000
```

**PHP:**
```bash
php -S localhost:8000
```

#### Step 6: Access the Application

1. Open your browser and navigate to `http://localhost:8000`
2. Click "Sign in with Google"
3. Sign in with the Google account you added as a test user
4. Grant permission to access your GA4 data (you'll see a warning that the app is unverified - this is normal)
5. Enter your GA4 Property ID
6. Select a date range comparison preset or choose custom dates
7. Click "Fetch Analytics Data"

## Usage Guide

### Finding Your GA4 Property ID

1. Log in to [Google Analytics](https://analytics.google.com/)
2. Click "Admin" (gear icon) in the bottom left
3. In the "Property" column, select your property
4. Click "Property Settings"
5. Your Property ID is displayed at the top (format: `123456789`)

### Date Range Presets

The platform offers several preset comparison options:

- **Last 7 Days vs Previous 7 Days** - Week-over-week comparison
- **Last 30 Days vs Previous 30 Days** - Month-over-month comparison
- **Last 90 Days vs Previous 90 Days** - Quarter-over-quarter comparison
- **This Month vs Last Month** - Current month vs previous month
- **This Year vs Last Year** - Year-over-year comparison
- **Custom Date Ranges** - Define up to 4 custom periods for comparison

### Understanding the Metrics

- **Total Users** - Unique users who visited your site/app during the period
- **Sessions** - Total number of sessions initiated by users
- **Page Views** - Total number of pages/screens viewed
- **Engagement Rate** - Percentage of engaged sessions (sessions lasting >10 seconds, with a conversion event, or 2+ page views)

### Comparison Indicators

- **↑ Green Numbers** - Metric increased compared to previous period (positive change)
- **↓ Red Numbers** - Metric decreased compared to previous period (negative change)
- **Percentage** - Shows the exact percentage change between periods

## Design Features

- **Dark Mode First** - Optimized for reduced eye strain during extended use
- **Glassmorphism** - Modern frosted glass effects on metric cards
- **Smooth Animations** - Subtle micro-interactions for enhanced UX
- **Gradient Accents** - Vibrant color gradients for visual appeal
- **Responsive Grid** - Automatically adapts to any screen size
- **Premium Typography** - Inter font family for clean, modern text

## Technical Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Authentication:** Google Identity Services (OAuth 2.0)
- **API:** Google Analytics Data API v1beta
- **Charts:** Chart.js v4.4.0
- **Styling:** Custom CSS with CSS Variables for theming

## Security & Privacy

- **Client-Side Only** - No backend server required, runs entirely in the browser
- **OAuth 2.0** - Industry-standard authentication protocol
- **Read-Only Access** - Only requests `analytics.readonly` scope (cannot modify data)
- **No Data Storage** - Data is fetched in real-time via API and not stored locally
- **Session-Based** - Access token is valid only during the active browser session
- **No Server Transmission** - Your GA4 data never touches any third-party servers

## Troubleshooting

### "Error 403: access_denied" or "Access blocked: This app's request is invalid"

This happens because your app is in **Testing** mode and your email isn't added as a test user.

**The Fix:**
1. Go to [Google Cloud Console OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Scroll down to the **"Test users"** section
3. Click **"Add Users"**
4. Enter your Google account email address (the one you're trying to sign in with)
5. Click **"Add"** then **"Save"**
6. **Important:** Close all browser windows and try again
7. You should now be able to sign in (you'll still see an "unverified app" warning - click "Continue")

### "Error 400: redirect_uri_mismatch"

This error means your Google Cloud Console authorized URIs don't match your current URL.

**The Fix:**
1. Check the exact URL in your browser (e.g., `http://localhost:8000`)
2. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, verify you have exactly:
   - `http://localhost:8000` (no trailing slash, no `https`, correct port)
5. Under **Authorized redirect URIs**, verify you have exactly:
   - `http://localhost:8000`
6. Click **"Save"**
7. **Wait 5 minutes** for changes to propagate
8. Clear your browser cache and try again

**Common mistakes:**
- Using `https://` instead of `http://` for localhost
- Wrong port number (e.g., `8080` instead of `8000`)
- Trailing slashes (e.g., `http://localhost:8000/`)
- Extra spaces or typos

### "Failed to fetch GA4 data" or "Error fetching analytics data"

**Possible causes and fixes:**

1. **Incorrect Property ID:**
   - Double-check the Property ID in GA4 Admin settings
   - Make sure there are no spaces or extra characters

2. **No access to property:**
   - Verify your Google account has at least Viewer access to the GA4 property
   - Check in GA4 Admin → Property Access Management

3. **API not enabled:**
   - Go to [Google Cloud Console APIs](https://console.cloud.google.com/apis/library)
   - Search for "Google Analytics Data API"
   - Ensure it shows "Enabled" (not "Enable")

4. **No data for date range:**
   - Check if the property has data for the selected dates
   - Try selecting "Last 7 days" to verify

5. **Property is GA4, not Universal Analytics:**
   - This tool only works with GA4 properties (not UA)
   - GA4 Property IDs are typically 9 digits
   - UA Property IDs start with "UA-" (not supported)

### "Authentication failed" or Sign-in Button Not Working

1. Verify your Client ID is correct in `app.js`
2. Ensure you're accessing via a web server (not `file://`)
3. Check browser console (F12) for specific error messages
4. Try a different browser (Chrome works best)
5. Clear browser cache and cookies
6. Disable browser extensions that might block OAuth

### No Data Displayed After Successful Fetch

1. Open browser console (F12) and check for JavaScript errors
2. Verify the date range has data in GA4 directly
3. Check that all metrics are spelled correctly in the code
4. Try a simpler date range (e.g., "Last 7 days")

### Charts Not Rendering

1. Check that Chart.js loaded successfully (view browser console)
2. Verify data was fetched (check network tab in DevTools)
3. Try refreshing the page
4. Clear browser cache

### "This app is blocked" Message

If Google says the app is blocked:
1. This happens when too many users try to use an unverified app
2. For internal tools, keep your app in "Testing" mode
3. Only add the specific users who need access as test users
4. You can add up to 100 test users in Testing mode

## Customization

### Adding More Metrics

Edit the `fetchGA4Data` function in `app.js` to request additional metrics:

```javascript
metrics: [
  { name: 'totalUsers' },
  { name: 'sessions' },
  { name: 'screenPageViews' },
  { name: 'engagementRate' },
  { name: 'bounceRate' },        // Add bounce rate
  { name: 'averageSessionDuration' }, // Add avg session duration
  { name: 'conversions' },       // Add conversions
  { name: 'totalRevenue' },      // Add revenue (if e-commerce enabled)
],
```

See [GA4 Metrics Reference](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#metrics) for all available metrics.

### Adding Dimensions for Segmentation

Add dimensions to break down your data:

```javascript
dimensions: [
  { name: 'date' },              // Required for charts
  { name: 'deviceCategory' },    // Segment by device type
  { name: 'country' },           // Segment by country
  { name: 'city' },              // Segment by city
  { name: 'sessionSource' },     // Segment by traffic source
],
```

See [GA4 Dimensions Reference](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#dimensions) for all available dimensions.

### Customizing the Color Scheme

Edit CSS variables in `styles.css`:

```css
:root {
  /* Primary brand colors */
  --color-accent-primary: #6366f1;    /* Indigo - change to your brand color */
  --color-accent-secondary: #8b5cf6;  /* Purple - change to complement */
  
  /* Background colors */
  --color-bg-primary: #0f172a;        /* Dark background */
  --color-bg-secondary: #1e293b;      /* Card background */
  
  /* Text colors */
  --color-text-primary: #f1f5f9;      /* Main text */
  --color-text-secondary: #94a3b8;    /* Secondary text */
}
```

### Changing Chart Colors

Edit the chart configuration in `app.js`:

```javascript
backgroundColor: 'rgba(99, 102, 241, 0.2)',  // Fill color
borderColor: 'rgb(99, 102, 241)',            // Line color
```

## Deployment

To deploy this application to production:

1. **Update OAuth Settings:**
   - Add your production domain to Authorized JavaScript origins
   - Add your production domain to Authorized redirect URIs

2. **Use HTTPS:**
   - Production deployments should always use HTTPS
   - Update the Client ID configuration if needed

3. **Consider Publishing:**
   - If you want users outside your test user list to access the app
   - You'll need to go through Google's verification process
   - Or keep it in Testing mode with all users added as test users (max 100)

4. **Hosting Options:**
   - GitHub Pages (free, easy)
   - Netlify (free tier available)
   - Vercel (free tier available)
   - Your own web server

## Resources

- [Google Analytics Data API Documentation](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [GA4 Dimensions & Metrics Explorer](https://ga-dev-tools.google/ga4/dimensions-metrics-explorer/)
- [OAuth 2.0 for Client-Side Web Applications](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/overview)

## Getting Help

If you're stuck:

1. Check the browser console (F12) for error messages
2. Review the troubleshooting section above
3. Verify all setup steps were completed correctly
4. Check that your Google account has proper GA4 access
5. Try with a different browser or in incognito mode

## License

This project is provided as-is for RMSMC internal use.

---

**Last Updated:** November 2025
