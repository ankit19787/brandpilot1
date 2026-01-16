import React from 'react';

const Documentation: React.FC = () => (
  <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
    <h1 className="text-3xl font-bold mb-6 text-slate-900">Documentation & Setup Guide</h1>
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-2 text-indigo-700">Supported Platforms</h2>
      <ul className="list-disc ml-6 text-slate-700">
        <li>Facebook (Graph API)</li>
        <li>Instagram (Graph API)</li>
        <li>X (Twitter) (OAuth 1.0a)</li>
      </ul>
    </section>
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-2 text-indigo-700">Environment Configuration</h2>
      <ol className="list-decimal ml-6 text-slate-700 space-y-2">
        <li>
          <b>Clone the repository</b> and install dependencies:
          <pre className="bg-slate-100 rounded p-2 mt-1">git clone &lt;repo-url&gt; && cd brandpilot-os && npm install</pre>
        </li>
        <li>
          <b>Configure environment variables</b> in <code>.env.local</code>:
          <ul className="list-disc ml-6">
            <li><b>VITE_BACKEND_API_URL</b>: Backend API endpoint (default: http://localhost:3001)</li>
            <li><b>VITE_FACEBOOK_PRODUCTION_TOKEN</b>: Facebook Page Access Token</li>
            <li><b>VITE_INSTAGRAM_WA_TOKEN</b>: Instagram Graph API Token</li>
            <li><b>VITE_X_API_KEY</b>, <b>VITE_X_API_SECRET</b>, <b>VITE_X_ACCESS_TOKEN</b>, <b>VITE_X_ACCESS_SECRET</b>: Twitter API credentials</li>
            <li><b>VITE_CLOUDINARY_CLOUD_NAME</b>, <b>VITE_CLOUDINARY_API_KEY</b>, <b>VITE_CLOUDINARY_API_SECRET</b>: Cloudinary credentials for image hosting</li>
            <li><b>VITE_CAPTION_MAX_LENGTH</b>: Max caption length (default: 300)</li>
          </ul>
        </li>
        <li>
          <b>Start the backend server</b>:
          <pre className="bg-slate-100 rounded p-2 mt-1">npm run dev (or node server.js)</pre>
        </li>
        <li>
          <b>Start the frontend</b>:
          <pre className="bg-slate-100 rounded p-2 mt-1">npm run dev</pre>
        </li>
      </ol>
    </section>
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-2 text-indigo-700">Social Platform Setup Steps</h2>
      <ol className="list-decimal ml-6 text-slate-700 space-y-2">
        <li>
          <b>Facebook</b>:
          <ul className="list-disc ml-6">
            <li>Create a Facebook App in the Facebook Developer Console.</li>
            <li>Get a Page Access Token with <b>pages_manage_posts</b> and <b>pages_read_engagement</b> permissions.</li>
            <li>Paste the token in <code>.env.local</code> as <b>VITE_FACEBOOK_PRODUCTION_TOKEN</b>.</li>
          </ul>
        </li>
        <li>
          <b>Instagram</b>:
          <ul className="list-disc ml-6">
            <li>Connect your Instagram Business Account to a Facebook Page.</li>
            <li>Get an Instagram Graph API token (same as Facebook token if linked).</li>
            <li>Paste the token in <code>.env.local</code> as <b>VITE_INSTAGRAM_WA_TOKEN</b>.</li>
          </ul>
        </li>
        <li>
          <b>X (Twitter)</b>:
          <ul className="list-disc ml-6">
            <li>Create a Twitter Developer App.</li>
            <li>Generate API Key, API Secret, Access Token, and Access Secret.</li>
            <li>Paste them in <code>.env.local</code> as <b>VITE_X_API_KEY</b>, <b>VITE_X_API_SECRET</b>, <b>VITE_X_ACCESS_TOKEN</b>, <b>VITE_X_ACCESS_SECRET</b>.</li>
          </ul>
        </li>
        <li>
          <b>Cloudinary (Image Hosting)</b>:
          <ul className="list-disc ml-6">
            <li>Sign up at <a href="https://cloudinary.com/" className="text-indigo-600 underline">cloudinary.com</a>.</li>
            <li>Get your Cloud Name, API Key, and API Secret from the dashboard.</li>
            <li>Paste them in <code>.env.local</code> as <b>VITE_CLOUDINARY_CLOUD_NAME</b>, <b>VITE_CLOUDINARY_API_KEY</b>, <b>VITE_CLOUDINARY_API_SECRET</b>.</li>
          </ul>
        </li>
      </ol>
    </section>
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-2 text-indigo-700">Technologies Used</h2>
      <ul className="list-disc ml-6 text-slate-700">
        <li><b>React</b> (Vite, TypeScript) for frontend</li>
        <li><b>Node.js</b> (Express) for backend API</li>
        <li><b>Cloudinary</b> for public image hosting</li>
        <li><b>Facebook Graph API</b> for Facebook/Instagram posting</li>
        <li><b>Twitter API (OAuth 1.0a)</b> for X (Twitter) posting</li>
        <li><b>dotenv</b> for environment variable management</li>
        <li><b>axios</b> for HTTP requests</li>
      </ul>
    </section>
    <section>
      <h2 className="text-xl font-bold mb-2 text-indigo-700">Troubleshooting & Tips</h2>
      <ul className="list-disc ml-6 text-slate-700">
        <li>Ensure all environment variables are set in <code>.env.local</code> before starting the app.</li>
        <li>Check browser console and backend logs for error details.</li>
        <li>Use the Credentials tab to verify and update API keys/tokens.</li>
        <li>For Cloudinary, ensure your account is not over quota for uploads/deletions.</li>
        <li>Restart the server after updating any environment variables.</li>
      </ul>
    </section>
  </div>
);

export default Documentation;
