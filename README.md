# GA4 Analytics Platform for RMSMC

A comprehensive, user-friendly analytics dashboard that connects to Google Analytics 4 (GA4) properties to display key metrics with powerful period comparison capabilities.

![GA4 Analytics Platform](https://img.shields.io/badge/GA4-Analytics-blue) ![OAuth 2.0](https://img.shields.io/badge/Auth-OAuth%202.0-green) ![Chart.js](https://img.shields.io/badge/Charts-Chart.js-ff6384)

## ✨ Features

- 🔐 **Secure OAuth 2.0 Authentication** - Sign in with Google for secure access to GA4 data
- 📊 **Period Comparison** - Compare up to 4 different time periods simultaneously
- 📈 **Interactive Visualizations** - Beautiful charts powered by Chart.js
- 🎨 **Premium UI Design** - Modern dark mode with glassmorphism effects
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- ⚡ **Real-time Data** - Fetch live data directly from GA4 properties
- 🎯 **Key Metrics** - Track users, sessions, page views, engagement rate, and more
- 📅 **Flexible Date Ranges** - Preset options or custom date range selection

## 🚀 Quick Start

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

#### Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application" as the application type
4. Configure authorized origins and redirect URIs:
   - **Authorized JavaScript origins:**
     - `http://localhost:8000` (for local development)
     - Your production domain (if deploying)
   - **Authorized redirect URIs:**
     - `http://localhost:8000` (for local development)
     - Your production domain (if deploying)
5. Click "Create" and copy your **Client ID**

#### Step 3: Configure the Application

1. Open `app.js` in a text editor
2. Find the `CONFIG` object at the top of the file
3. Replace `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com` with your actual Client ID:

```javascript
const CONFIG = {
  CLIENT_ID: 'your-actual-client-id.apps.googleusercontent.com',
  // ... rest of config
};
```

#### Step 4: Start a Local Web Server

The application must be served over HTTP (not opened directly as a file). Choose one of these options:

**Python 3:**
```bash
cd /Users/andrewmeade/Desktop/GA4AnalyticsSuite
python3 -m http.server 8000
```

**Python 2:**
```bash
cd /Users/andrewmeade/Desktop/GA4AnalyticsSuite
python -m SimpleHTTPServer 8000
```

**Node.js:**
```bash
cd /Users/andrewmeade/Desktop/GA4AnalyticsSuite
npx http-server -p 8000
```

**PHP:**
```bash
cd /Users/andrewmeade/Desktop/GA4AnalyticsSuite
php -S localhost:8000
```

#### Step 5: Access the Application

1. Open your browser and navigate to `http://localhost:8000`
2. Click "Sign in with Google"
3. Grant permission to access your GA4 data
4. Enter your GA4 Property ID
5. Select a date range comparison
6. Click "Fetch Analytics Data"

## 📖 Usage Guide

### Finding Your GA4 Property ID

1. Log in to [Google Analytics](https://analytics.google.com/)
2. Click "Admin" in the bottom left
3. Select your property
4. Go to "Property Settings"
5. Your Property ID is displayed at the top (e.g., `123456789`)

### Date Range Presets

The platform offers several preset comparison options:

- **Last 7 Days vs Previous 7 Days** - Week-over-week comparison
- **Last 30 Days vs Previous 30 Days** - Month-over-month comparison
- **Last 90 Days vs Previous 90 Days** - Quarter-over-quarter comparison
- **This Month vs Last Month** - Current month vs previous month
- **This Year vs Last Year** - Year-over-year comparison
- **Custom Date Ranges** - Define your own periods

### Understanding the Metrics

- **Total Users** - Unique users who visited your site/app
- **Sessions** - Total number of sessions initiated
- **Page Views** - Total number of pages/screens viewed
- **Engagement Rate** - Percentage of engaged sessions (sessions lasting >10s, with conversion event, or 2+ page views)

### Comparison Indicators

- **↑ Green** - Metric increased compared to previous period
- **↓ Red** - Metric decreased compared to previous period
- **Percentage** - Shows the exact percentage change

## 🎨 Design Features

- **Dark Mode First** - Optimized for reduced eye strain
- **Glassmorphism** - Modern frosted glass effects on cards
- **Smooth Animations** - Micro-interactions for enhanced UX
- **Gradient Accents** - Vibrant color gradients for visual appeal
- **Responsive Grid** - Adapts to any screen size
- **Premium Typography** - Inter font for clean, modern text

## 🔧 Technical Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Authentication:** Google Identity Services (OAuth 2.0)
- **API:** Google Analytics Data API v1beta
- **Charts:** Chart.js v4.4.0
- **Styling:** Custom CSS with CSS Variables

## 🛡️ Security & Privacy

- **Client-Side Only** - No backend server required
- **OAuth 2.0** - Industry-standard authentication
- **Read-Only Access** - Only requests analytics.readonly scope
- **No Data Storage** - Data is fetched in real-time and not stored
- **Session-Based** - Access token valid only during active session

## 🐛 Troubleshooting

### "Error 403: access_denied" (Access blocked)

This happens because your app is in **Testing** mode and you haven't added your email as a tester.

**The Fix:**
1. Go to [Google Cloud Console OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Look for the **"Test users"** section
3. Click **"Add Users"**
4. Enter your email address (e.g., `andmeade1@gmail.com`)
5. Click **Save**
6. Try signing in again immediately

### "Error 400: redirect_uri_mismatch"

This is the most common error. It means your Google Cloud Console settings don't match your local URL.

**The Fix:**
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID name
3. Under **Authorized JavaScript origins**, make sure you have exactly:
   - `http://localhost:8000`
   - (No trailing slash, no extra spaces)
4. Under **Authorized redirect URIs**, make sure you have exactly:
   - `http://localhost:8000`
5. Click **Save**
6. **Wait 5 minutes** (changes can take a few minutes to propagate)
7. Refresh the page and try again

### "Authentication failed" Error

- Verify your Client ID is correctly configured in `app.js`
- Check that authorized origins include your current domain/localhost
- Ensure you're accessing via HTTP server (not file://)

### "Failed to fetch GA4 data" Error

- Verify the Property ID is correct
- Ensure your Google account has access to the GA4 property
- Check that the GA4 Data API is enabled in Google Cloud Console
- Verify the property has data for the selected date range

### No Data Displayed

- Confirm the date range has available data in GA4
- Check browser console for error messages
- Verify the property is actively collecting data

### Charts Not Rendering

- Ensure Chart.js is loaded (check browser console)
- Verify there is data available for the selected period
- Try refreshing the page

## 📝 Customization

### Adding More Metrics

Edit the `fetchGA4Data` function in `app.js` to add more metrics:

```javascript
metrics: [
  { name: 'totalUsers' },
  { name: 'sessions' },
  { name: 'screenPageViews' },
  { name: 'conversions' },  // Add new metric
  { name: 'totalRevenue' }, // Add new metric
],
```

### Adding Dimensions

Add dimensions to segment your data:

```javascript
dimensions: [
  { name: 'date' },
  { name: 'deviceCategory' }, // Add new dimension
  { name: 'country' },        // Add new dimension
],
```

### Customizing Colors

Edit CSS variables in `styles.css`:

```css
:root {
  --color-accent-primary: #6366f1; /* Change primary color */
  --color-accent-secondary: #8b5cf6; /* Change secondary color */
}
```

## 📚 Resources

- [Google Analytics Data API Documentation](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [GA4 Dimensions & Metrics Explorer](https://ga-dev-tools.google/ga4/dimensions-metrics-explorer/)
- [OAuth 2.0 for Client-Side Web Applications](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)

## 📄 License

This project is provided as-is for RMSMC internal use.

## 🤝 Support

For issues or questions, please contact your development team or refer to the Google Analytics Data API documentation.

---

**Built with ❤️ for RMSMC**
