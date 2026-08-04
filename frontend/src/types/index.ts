export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  type: string;
  model: string;
  style?: string;
  quality?: string;
  aspectRatio?: string;
  resolution?: string;
  seed?: string;
  cfgScale?: string;
  guidance?: string;
  steps?: number;
  batchCount?: number;
  upscaler?: string;
  faceEnhance?: boolean;
  removeBg?: boolean;
  transparentBg?: boolean;
  hdMode?: boolean;
  private?: boolean;
  projectId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalImages: number;
  totalVideos: number;
  totalGenerations: number;
  creditsUsed: number;
  creditsRemaining: number;
  storageUsed: number;
  plan: string;
  popularModels: { model: string; count: number }[];
  recentActivity: ActivityItem[];
  usageByDay: { date: string; count: number }[];
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface BillingInfo {
  plan: string;
  credits: number;
  creditsUsed: number;
  subscriptionStatus?: string;
  currentPeriodEnd?: string;
  paymentMethod?: string;
}
