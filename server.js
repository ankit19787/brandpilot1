// Minimal Express server to use facebookTokenApi.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import facebookTokenApi from './services/facebookTokenApi.js';
import twitterProxyApi from './services/twitterProxyApi.js';
import authApi from './services/authApi.js';

// Load environment variables from .env.local or .env (whichever exists)
import fs from 'fs';
// dotenv removed for Vercel/production. Use process.env only.

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', facebookTokenApi);
app.use('/api', twitterProxyApi);
app.use('/api', authApi);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
