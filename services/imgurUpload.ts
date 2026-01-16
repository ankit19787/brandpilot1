// services/imgurUpload.ts
// Utility to upload base64 images to Imgur and return a public URL

const IMGUR_CLIENT_ID = import.meta.env.VITE_IMGUR_CLIENT_ID;

export async function uploadToImgur(base64Image: string): Promise<string> {
  if (!IMGUR_CLIENT_ID) throw new Error('VITE_IMGUR_CLIENT_ID is not set in .env');
  // Remove data URL prefix if present
  const base64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  const res = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: base64, type: 'base64' }),
  });
  const data = await res.json();
  if (!res.ok || !data?.data?.link) {
    throw new Error('Imgur upload failed: ' + (data?.data?.error || res.statusText));
  }
  return data.data.link;
}
