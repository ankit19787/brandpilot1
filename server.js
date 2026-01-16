// Minimal Express server to use facebookTokenApi.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import facebookTokenApi from './services/facebookTokenApi.js';
import twitterProxyApi from './services/twitterProxyApi.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());


app.use('/api', facebookTokenApi);
app.use('/api', twitterProxyApi);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
