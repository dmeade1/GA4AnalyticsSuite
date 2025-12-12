const fs = require('fs');

const configContent = `const CONFIG = {
    CLIENT_ID: '${process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID_KEY"}',
    DEFAULT_PROPERTY_ID: '${process.env.DEFAULT_PROPERTY_ID || ""}',
    DISCOVERY_DOC: 'https://analyticsdata.googleapis.com/$discovery/rest?version=v1beta',
    SCOPES: 'https://www.googleapis.com/auth/analytics.readonly',
};
`;

fs.writeFileSync('config.js', configContent);
console.log('config.js generated successfully');
