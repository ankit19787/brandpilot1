// scripts/deleteAllCloudinaryImages.js
// Deletes all images from your Cloudinary account using the Admin API
// WARNING: This will permanently delete all images. Use with caution.

import axios from 'axios';
import dotenv from 'dotenv';
import process from 'process';

dotenv.config({ path: '.env.local' });

const CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.VITE_CLOUDINARY_API_KEY;
const API_SECRET = process.env.VITE_CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('Cloudinary credentials missing in .env.local');
  process.exit(1);
}

async function deleteAllImages() {
  try {
    // List all images (max 500 per call, use next_cursor for more)
    let nextCursor = null;
    let totalDeleted = 0;
    do {
      const listUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image`;
      const auth = {
        username: API_KEY,
        password: API_SECRET
      };
      const params = nextCursor ? { next_cursor: nextCursor, max_results: 500 } : { max_results: 500 };
      const listRes = await axios.get(listUrl, { auth, params });
      const images = listRes.data.resources;
      if (!images.length) break;
      const publicIds = images.map(img => img.public_id);
      // Delete in batches
      const delUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/upload`;
      const delRes = await axios.delete(delUrl, {
        auth,
        params: { public_ids: publicIds }
      });
      totalDeleted += delRes.data.deleted ? Object.keys(delRes.data.deleted).length : 0;
      nextCursor = listRes.data.next_cursor;
      console.log(`Deleted ${publicIds.length} images. Next cursor: ${nextCursor}`);
    } while (nextCursor);
    console.log(`All done. Total images deleted: ${totalDeleted}`);
  } catch (err) {
    console.error('Error deleting images:', err.response ? err.response.data : err.message);
  }
}

deleteAllImages();
