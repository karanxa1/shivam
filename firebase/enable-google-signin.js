/**
 * Enables Google Sign-In for the Firebase project and retrieves the OAuth client ID
 */
import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync('./service-account.json', 'utf8'));
initializeApp({ credential: cert(sa) });

const app = getApp();
const token = await app.options.credential.getAccessToken();
const accessToken = token.access_token;
const projectId = sa.project_id;

// Step 1: Check current Google Sign-In status
console.log('Checking Google Sign-In status...');
const checkRes = await fetch(
  `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const config = await checkRes.json();
const googleEnabled = config?.signIn?.google?.enabled;
console.log('Google Sign-In currently enabled:', googleEnabled ?? false);

// Step 2: Enable Google Sign-In
console.log('\nEnabling Google Sign-In...');
const enableRes = await fetch(
  `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=signIn.google.enabled`,
  {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      signIn: {
        google: { enabled: true }
      }
    })
  }
);
const enableResult = await enableRes.json();
console.log('Enable result:', JSON.stringify(enableResult?.signIn?.google ?? enableResult?.error ?? enableResult, null, 2));

// Step 3: List OAuth clients to find the Web Client ID
console.log('\nFetching OAuth clients...');
const oauthRes = await fetch(
  `https://identitytoolkit.googleapis.com/v1/projects/${projectId}:listOAuthClients`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const oauthText = await oauthRes.text();
console.log('OAuth clients response:', oauthText.substring(0, 1000));

// Step 4: Try to get the default web client ID from the project
console.log('\nFetching Firebase web apps...');
const appsRes = await fetch(
  `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const appsData = await appsRes.json();
console.log('Web apps:', JSON.stringify(appsData, null, 2));

// Step 5: Get the web app config which contains the client ID
if (appsData.apps?.length > 0) {
  const appName = appsData.apps[0].name;
  const configRes = await fetch(
    `https://firebase.googleapis.com/v1beta1/${appName}/config`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const configData = await configRes.json();
  console.log('\nWeb app config:');
  console.log(JSON.stringify(configData, null, 2));
}
