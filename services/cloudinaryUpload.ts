// services/cloudinaryUpload.ts
// Utility to upload base64 images to Cloudinary and return a public URL
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to fetch Cloudinary credentials from database
async function getCloudinaryCredentials() {
  const configs = await prisma.config.findMany({
    where: {
      key: {
        in: ['cloudinary_cloud_name', 'cloudinary_api_key', 'cloudinary_api_secret']
      }
    }
  });
  
  const configMap = Object.fromEntries(configs.map(c => [c.key, c.value]));
  
  return {
    cloudName: configMap['cloudinary_cloud_name'],
    apiKey: configMap['cloudinary_api_key'],
    apiSecret: configMap['cloudinary_api_secret']
  };
}

export async function uploadToCloudinary(base64Image: string): Promise<string> {
  const { cloudName, apiKey, apiSecret } = await getCloudinaryCredentials();
  
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials are not configured in database. Please add them via the Credentials tab.');
  }
  // Remove data URL prefix if present
  const base64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
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
