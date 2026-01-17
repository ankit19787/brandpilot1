// Credit management service
const API_PREFIX = '/api';

export async function getUserCredits(userId: string): Promise<{ credits: number; maxCredits: number; plan: string }> {
  const response = await fetch(`${API_PREFIX}/user/${userId}/credits`);
  if (!response.ok) {
    throw new Error('Failed to fetch user credits');
  }
  return await response.json();
}

export async function deductCredits(userId: string, amount: number, action: string): Promise<{ credits: number; success: boolean }> {
  const response = await fetch(`${API_PREFIX}/user/credits/deduct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amount, action })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to deduct credits');
  }
  
  return await response.json();
}

export async function getMonthlyPostCount(userId: string): Promise<number> {
  const response = await fetch(`${API_PREFIX}/user/${userId}/post-count`);
  if (!response.ok) {
    throw new Error('Failed to fetch post count');
  }
  const data = await response.json();
  return data.count;
}

export async function canCreatePost(userId: string, plan: string, postsLimit: number | null): Promise<{ allowed: boolean; reason?: string }> {
  if (postsLimit === null) {
    return { allowed: true }; // unlimited
  }
  
  const currentCount = await getMonthlyPostCount(userId);
  if (currentCount >= postsLimit) {
    return { allowed: false, reason: `Monthly limit of ${postsLimit} posts reached. Upgrade to Pro for unlimited posts.` };
  }
  
  return { allowed: true };
}
