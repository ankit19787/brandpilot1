// Minimal Express server to use facebookTokenApi.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import facebookTokenApi from './services/facebookTokenApi.js';
import twitterProxyApi from './services/twitterProxyApi.js';

// Load environment variables from .env.local or .env (whichever exists)
import fs from 'fs';
import dotenv from 'dotenv';
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
} else {
  dotenv.config();
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', facebookTokenApi);
app.use('/api', twitterProxyApi);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
