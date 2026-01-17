// Browser-safe API client for frontend components
// This file makes HTTP requests to the backend API instead of using Prisma directly

import { BrandDNA, ContentStrategy } from "../types";

// Use relative path - Vite proxy will forward to backend
const API_PREFIX = '/api';

export const analyzeBrandDNA = async (pastPosts: string, userId?: string): Promise<BrandDNA> => {
  const response = await fetch(`${API_PREFIX}/brand-dna`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pastPosts, userId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze brand DNA');
  }
  
  return await response.json();
};

export const generateContentStrategy = async (dna: BrandDNA, userId?: string): Promise<ContentStrategy> => {
  const response = await fetch(`${API_PREFIX}/content-strategy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dna, userId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate content strategy');
  }
  
  return await response.json();
};

export const generatePost = async (platform: string, topic: string, dna: BrandDNA, userId?: string): Promise<any> => {
  const response = await fetch(`${API_PREFIX}/generate-post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, topic, dna, userId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate post');
  }
  
  const data = await response.json();
  // If userId was provided, return full object with credits, otherwise return just content for backward compatibility
  return userId ? data : data.content;
};

export const generateImage = async (topic: string, dna: BrandDNA, userId?: string): Promise<any> => {
  const response = await fetch(`${API_PREFIX}/generate-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, dna, userId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate image');
  }
  
  const data = await response.json();
  // If userId was provided, return full object with credits, otherwise return just imageUrl for backward compatibility
  return userId ? data : data.imageUrl;
};

export const publishToPlatform = async (platform: string, content: string, metadata?: { imageUrl?: string; userId?: string }) => {
  const response = await fetch(`${API_PREFIX}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, content, metadata })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to publish');
  }
  
  return await response.json();
};

export const getMonetizationPlan = async (dna: BrandDNA, metrics: any, userId?: string): Promise<any> => {
  const response = await fetch(`${API_PREFIX}/monetization-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dna, metrics, userId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate monetization plan');
  }
  
  return await response.json();
};

// Platform API for publishing with status callbacks
export const platformAPI = {
  async publish(platform: string, content: string, onStatus: (status: string) => void, metadata?: { imageUrl?: string; userId?: string }) {
    onStatus(`Preparing ${platform} transmission...`);
    
    try {
      const result = await publishToPlatform(platform, content, metadata);
      onStatus(`Published successfully!`);
      return result;
    } catch (error: any) {
      onStatus(`Error: ${error.message}`);
      throw error;
    }
  }
};

// Database operations
export async function createPost({ userId, platform, content, imageUrl, status, scheduledFor }: {
  userId: string,
  platform: string,
  content: string,
  imageUrl?: string,
  status: string,
  scheduledFor?: Date
}) {
  const response = await fetch(`${API_PREFIX}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, platform, content, imageUrl, status, scheduledFor })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create post');
  }
  
  return await response.json();
}

export async function getUserPosts(userId: string) {
  const response = await fetch(`${API_PREFIX}/posts/${userId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get posts');
  }
  
  return await response.json();
}

export async function createLog({ userId, action, details }: {
  userId?: string,
  action: string,
  details?: string
}) {
  const response = await fetch(`${API_PREFIX}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, action, details })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create log');
  }
  
  return await response.json();
}

export async function getUserLogs(userId: string) {
  const response = await fetch(`${API_PREFIX}/logs/${userId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get logs');
  }
  
  return await response.json();
}
