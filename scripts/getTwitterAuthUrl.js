/**
 * Generate Twitter OAuth 2.0 Authorization URL
 * Step 1 of OAuth 2.0 flow
 */

const CLIENT_ID = 'Y3F6TUtSMUh6X3JGaGRkdllPZ1c6MTpjaQ';
const REDIRECT_URI = 'http://localhost:3001/api/twitter/oauth2/callback';
const STATE = Math.random().toString(36).substring(7);
const CODE_CHALLENGE = 'challenge'; // For PKCE (simplified)

const scopes = [
  'tweet.read',
  'tweet.write',
  'users.read',
  'offline.access'
].join('%20');

const authUrl = `https://twitter.com/i/oauth2/authorize?` +
  `response_type=code` +
  `&client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${scopes}` +
  `&state=${STATE}` +
  `&code_challenge=${CODE_CHALLENGE}` +
  `&code_challenge_method=plain`;

console.log('\n🐦 Twitter OAuth 2.0 Authorization\n');
console.log('Step 1: Visit this URL in your browser:');
console.log('━'.repeat(80));
console.log(authUrl);
console.log('━'.repeat(80));
console.log('\nStep 2: Authorize the app');
console.log('Step 3: Copy the "code" from the redirect URL');
console.log('Step 4: Run: node scripts/getTwitterOAuth2Token.js <code>');
console.log('');
