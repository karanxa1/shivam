/**
 * Gets the Web OAuth Client ID using the service account credentials
 */
import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync('./service-account.json', 'utf8'));
initializeApp({ credential: cert(sa) });

const app = getApp();
const token = await app.options.credential.getAccessToken();
const accessToken = token.access_token;

// Try the correct API endpoint for Firebase Auth config
const endpoints = [
  `https://firebase.googleapis.com/v1beta1/projects/${sa.project_id}`,
  `https://identitytoolkit.googleapis.com/admin/v2/projects/${sa.project_id}/config`,
];

for (const url of endpoints) {
  console.log(`\nFetching: ${url}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    // Look for anything with "client" or "oauth" in it
    const str = JSON.stringify(json, null, 2);
    if (str.includes('client') || str.includes('oauth') || str.includes('google')) {
      console.log(str.substring(0, 2000));
    } else {
      console.log('No OAuth info found in this endpoint');
      console.log(str.substring(0, 500));
    }
  } catch {
    console.log('Non-JSON response:', text.substring(0, 200));
  }
}
