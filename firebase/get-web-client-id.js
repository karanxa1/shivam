/**
 * Gets the Web OAuth 2.0 Client ID from Google Cloud for this Firebase project
 */
import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync('./service-account.json', 'utf8'));
initializeApp({ credential: cert(sa) });

const app = getApp();
const token = await app.options.credential.getAccessToken();
const accessToken = token.access_token;
const projectId = sa.project_id;

// List all OAuth 2.0 clients in the project via Google Cloud API
console.log('Fetching OAuth 2.0 clients from Google Cloud...\n');
const res = await fetch(
  `https://iap.googleapis.com/v1/projects/${projectId}/brands`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const text = await res.text();
console.log('Brands:', text.substring(0, 500));

// Try the correct API - list OAuth clients
const res2 = await fetch(
  `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`
);
const tokenInfo = await res2.json();
console.log('\nToken info (scope check):', JSON.stringify(tokenInfo, null, 2));

// The Web Client ID for Firebase is auto-created and follows this pattern:
// PROJECT_NUMBER-hash.apps.googleusercontent.com
// We can find it via the Cloud Resource Manager
const res3 = await fetch(
  `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const projectInfo = await res3.json();
console.log('\nProject number:', projectInfo.projectNumber);

// List OAuth clients via the API
const res4 = await fetch(
  `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
);
const info = await res4.json();
console.log('\nService account info:', JSON.stringify(info, null, 2));
