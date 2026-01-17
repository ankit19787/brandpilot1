// Plan service to handle credit management and feature restrictions

export interface PlanLimits {
  posts: number | null; // null = unlimited
  platforms: string[];
  credits: number;
  analytics_days: number;
  autoPosting: boolean;
  teamSize: number;
  brandDNA: boolean;
  contentStrategy: boolean;
  monetization: boolean;
  apiAccess: boolean;
  customImages: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    posts: 10,
    platforms: ['Instagram', 'Facebook'],
    credits: 1000,
    analytics_days: 7,
    autoPosting: false,
    teamSize: 1,
    brandDNA: false,
    contentStrategy: false,
    monetization: false,
    apiAccess: false,
    customImages: false
  },
  pro: {
    posts: null, // unlimited
    platforms: ['Instagram', 'Facebook', 'X (Twitter)', 'LinkedIn', 'YouTube'],
    credits: 10000,
    analytics_days: 90,
    autoPosting: true,
    teamSize: 1,
    brandDNA: true,
    contentStrategy: true,
    monetization: true,
    apiAccess: false,
    customImages: true
  },
  business: {
    posts: null, // unlimited
    platforms: ['Instagram', 'Facebook', 'X (Twitter)', 'LinkedIn', 'YouTube', 'WhatsApp'],
    credits: 50000,
    analytics_days: 365,
    autoPosting: true,
    teamSize: 5,
    brandDNA: true,
    contentStrategy: true,
    monetization: true,
    apiAccess: true,
    customImages: true
  },
  enterprise: {
    posts: null, // unlimited
    platforms: ['Instagram', 'Facebook', 'X (Twitter)', 'LinkedIn', 'YouTube', 'WhatsApp', 'TikTok', 'Pinterest'],
    credits: 999999, // effectively unlimited
    analytics_days: 99999,
    autoPosting: true,
    teamSize: 999,
    brandDNA: true,
    contentStrategy: true,
    monetization: true,
    apiAccess: true,
    customImages: true
  }
};

export const CREDIT_COSTS = {
  generatePost: 10,
  generateImage: 50,
  brandDNAAnalysis: 100,
  contentStrategy: 50,
  monetizationPlan: 30,
  publishPost: 5
};

export function canUseFeature(plan: string, feature: keyof PlanLimits): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return limits[feature] as boolean;
}

export function canAccessPlatform(plan: string, platform: string): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return limits.platforms.includes(platform);
}

export function hasCreditsFor(currentCredits: number, action: keyof typeof CREDIT_COSTS): boolean {
  return currentCredits >= CREDIT_COSTS[action];
}

export function calculateCreditsNeeded(action: keyof typeof CREDIT_COSTS): number {
  return CREDIT_COSTS[action];
}

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}
