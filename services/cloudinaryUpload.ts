// services/cloudinaryUpload.ts
// Utility to upload base64 images to Cloudinary and return a public URL

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET;

export async function uploadToCloudinary(base64Image: string): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials are not set in .env');
  }
  // Remove data URL prefix if present
  const base64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
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
