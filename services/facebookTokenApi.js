import express from 'express';
import { PrismaClient } from '@prisma/client';
const router = express.Router();
const prisma = new PrismaClient();


// GET /api/token/:platform - returns current token for a social platform
// Supported platforms: facebook, instagram, twitter
router.get('/token/:platform', async (req, res) => {
  const platform = req.params.platform;
  const key = `${platform}_token`;
  console.log(`[GET /token/${platform}] Looking for key: ${key}`);
  try {
    const config = await prisma.config.findUnique({ where: { key } });
    console.log(`[GET /token/${platform}] DB result:`, config);
    if (config && config.value) {
      res.json({ token: config.value });
    } else {
      res.status(404).json({ error: `Token for ${platform} not found in database config` });
    }
  } catch (error) {
    console.error(`[GET /token/${platform}] DB error:`, error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});


// POST /api/update-token/:platform - update token for a social platform
router.post('/update-token/:platform', async (req, res) => {
  const platform = req.params.platform;
  const key = `${platform}_token`;
  const { token } = req.body;
  console.log(`[POST /update-token/${platform}] Request body:`, req.body);
  if (!token) {
    console.warn(`[POST /update-token/${platform}] Missing token in request body.`);
    return res.status(400).json({ error: 'Token value required in request body' });
  }
  try {
    const updated = await prisma.config.upsert({
      where: { key },
      update: { value: token },
      create: { key, value: token },
    });
    console.log(`[POST /update-token/${platform}] Upserted config:`, updated);
    res.json({ success: true, config: updated });
  } catch (error) {
    console.error(`[POST /update-token/${platform}] DB error:`, error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

export default router;
