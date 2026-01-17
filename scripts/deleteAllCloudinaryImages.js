// scripts/deleteAllCloudinaryImages.js
// Deletes all images from your Cloudinary account using the Admin API
// WARNING: This will permanently delete all images. Use with caution.

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get credentials from database
async function getCloudinaryConfig() {
  const configs = await prisma.config.findMany({
    where: {
      key: {
        in: ['cloudinary_cloud_name', 'cloudinary_api_key', 'cloudinary_api_secret', 'cloudinary_api_url', 'cloudinary_api_version']
      }
    }
  });
  
  const configMap = {};
  configs.forEach(config => {
    configMap[config.key] = config.value;
  });
  
  return {
    cloudName: configMap['cloudinary_cloud_name'],
    apiKey: configMap['cloudinary_api_key'], 
    apiSecret: configMap['cloudinary_api_secret'],
    apiUrl: configMap['cloudinary_api_url'] || 'https://api.cloudinary.com',
    apiVersion: configMap['cloudinary_api_version'] || 'v1_1'
  };
}

async function deleteAllImages() {
  try {
    const { cloudName: CLOUD_NAME, apiKey: API_KEY, apiSecret: API_SECRET, apiUrl, apiVersion } = await getCloudinaryConfig();
    
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      throw new Error('Cloudinary configuration missing in database');
    }
    
    // List all images (max 500 per call, use next_cursor for more)
    let nextCursor = null;
    let totalDeleted = 0;
    do {
      const listUrl = `${apiUrl}/${apiVersion}/${CLOUD_NAME}/resources/image`;
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
      const delUrl = `${apiUrl}/${apiVersion}/${CLOUD_NAME}/resources/image/upload`;
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
