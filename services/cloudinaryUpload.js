// services/cloudinaryUpload.js
// Utility to upload base64 images to Cloudinary and return a public URL

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getConfigValue(key) {
  const config = await prisma.config.findUnique({ where: { key } });
  return config?.value || "";
}

// Helper to get platform API URLs
async function getPlatformConfig() {
  return {
    cloudinaryApiUrl: await getConfigValue('cloudinary_api_url'),
    cloudinaryApiVersion: await getConfigValue('cloudinary_api_version'),
  };
}

export async function uploadToCloudinary(base64Image) {
  const CLOUDINARY_CLOUD_NAME = await getConfigValue('cloudinary_cloud_name');
  const CLOUDINARY_API_KEY = await getConfigValue('cloudinary_api_key');
  const CLOUDINARY_API_SECRET = await getConfigValue('cloudinary_api_secret');
  const { cloudinaryApiUrl, cloudinaryApiVersion } = await getPlatformConfig();
  
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials are not set in database config');
  }
  // Remove data URL prefix if present
  const base64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  const version = cloudinaryApiVersion || 'v1_1';
  const url = `${cloudinaryApiUrl || 'https://api.cloudinary.com'}/${version}/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', `data:image/png;base64,${base64}`);
  formData.append('upload_preset', 'ml_default'); // Default unsigned preset for free accounts
  // If you have a signed preset, you can use API key/secret for more control

  const res = await fetch(url, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok || !data?.secure_url) {
    throw new Error('Cloudinary upload failed: ' + (data?.error?.message || res.statusText));
  }
  return data.secure_url;
}
