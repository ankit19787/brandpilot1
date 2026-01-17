
export interface BrandDNA {
  voice: string;
  personality: string[];
  contentPillars: string[];
  audienceType: string;
  writingStyle: string;
  isSample?: boolean; // Flag to indicate if this is sample data
}

export const SAMPLE_DNA: BrandDNA = {
  voice: "Visionary but pragmatic tech leader",
  personality: ["Analytical", "Empathetic", "Futuristic", "Transparent"],
  contentPillars: [
    "AI-Native Workflows",
    "Product Strategy for Founders",
    "Mental Health in Tech",
    "The Solopreneur Journey"
  ],
  audienceType: "Early-stage founders and senior product managers (mid-30s) looking for leverage.",
  writingStyle: "Short, punchy sentences. Uses bullet points for clarity. Avoids corporate jargon. Focuses on 'First Principles' thinking."
};

export const TUTORING_TIK_DNA: BrandDNA = {
  voice: "The encouraging mentor who simplifies the complex",
  personality: ["Empathetic", "Clear", "Encouraging", "Data-Driven"],
  contentPillars: [
    "Hyper-efficient Study Hacks",
    "Exam Anxiety Management",
    "The Science of Active Recall",
    "Parent-Tutor Collaboration"
  ],
  audienceType: "High school students (14-18) and concerned parents looking for grade breakthroughs.",
  writingStyle: "Action-oriented, supportive, and jargon-free. Uses analogies to explain difficult concepts. Focuses on 'quick wins' for students."
};

export interface ContentStrategy {
  dailyStrategy: string;
  platformFocus: string[];
  suggestedHooks: string[];
  recommendedMix: {
    storytelling: number;
    authority: number;
    cta: number;
  };
}

export interface ContentItem {
  id: string;
  platform: string;
  content: string;
  imageUrl?: string;
  title?: string;
  status: 'Draft' | 'Scheduled' | 'Published';
  scheduledFor: string; // ISO date string
  createdAt: string;
}

export const SAMPLE_SCHEDULED_POSTS: ContentItem[] = [
  {
    id: '1',
    platform: 'Instagram',
    content: "Why 90% of AI startups will fail in 2024: They are building wrappers, not workflows. True value lies in the unique data moats and operational integration. #AI #Founders",
    status: 'Scheduled',
    scheduledFor: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    createdAt: new Date().toISOString()
  }
];

export interface PerformanceMetric {
  name: string;
  reach: number;
  engagement: number;
  growth: number;
}

export interface MonetizationIdea {
  title: string;
  description: string;
  estimatedRevenue: string;
  readiness: 'High' | 'Medium' | 'Low';
}

export interface PlatformConnection {
  id: string;
  name: string;
  isConnected: boolean;
  username?: string;
  apiQuota?: number;
  lastSync?: string;
}

export type PlanType = 'free' | 'pro' | 'business' | 'enterprise';

export interface UserPlan {
  plan: PlanType;
  credits: number;
  maxCredits: number;
}

export type ActiveTab = 'dashboard' | 'dna' | 'strategist' | 'engine' | 'performance' | 'monetization' | 'calendar' | 'connections' | 'credentials' | 'payment-history' | 'credits' | 'profile' | 'email-logs' | 'documentation' | 'adminposts' | 'platform-responses' | 'api-test';
