// ===================================
// Configuration Example
// ===================================
// Copy this file to config.js and update with your credentials

const CONFIG = {
    // OAuth 2.0 Client ID from Google Cloud Console
    // Get this from: https://console.cloud.google.com/apis/credentials
    CLIENT_ID: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',

    // Default GA4 Property ID (optional)
    // Find this in GA4: Admin → Property Settings → Property ID
    DEFAULT_PROPERTY_ID: '',

    // GA4 Data API Discovery Document (do not change)
    DISCOVERY_DOC: 'https://analyticsdata.googleapis.com/$discovery/rest?version=v1beta',

    // OAuth Scopes (do not change unless you know what you're doing)
    SCOPES: 'https://www.googleapis.com/auth/analytics.readonly',
};

// ===================================
// Setup Instructions
// ===================================
/*
1. Go to Google Cloud Console: https://console.cloud.google.com/

2. Create or select a project

3. Enable the Google Analytics Data API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Analytics Data API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     * http://localhost:8000 (for local development)
     * Your production domain (if deploying)
   - Add authorized redirect URIs:
     * http://localhost:8000 (for local development)
     * Your production domain (if deploying)
   - Click "Create"
   - Copy the Client ID

5. Update this file:
   - Replace 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com' with your actual Client ID
   - Optionally set DEFAULT_PROPERTY_ID

6. Rename this file to config.js (or update app.js to import from this file)

7. Start a local web server:
   - Python 3: python3 -m http.server 8000
   - Python 2: python -m SimpleHTTPServer 8000
   - Node.js: npx http-server -p 8000
   - Or use any other local web server

8. Open http://localhost:8000 in your browser

9. Sign in with your Google account that has access to GA4

10. Enter your GA4 Property ID and start analyzing!
*/
