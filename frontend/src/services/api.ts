import { localStore } from "@/lib/local-store";
import { docCategories, docPages, type DocCategory, type DocPage } from "@/lib/docs-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("intellix_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function toDataUrl(b64: string): string {
  if (!b64) return "";
  return b64.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mapResolution(quality?: string): string {
  const q = (quality ?? "standard").toLowerCase();
  if (q.includes("ultra") || q.includes("high")) return "high";
  if (q.includes("low")) return "low";
  return "medium";
}

function errorMessage(data: any): string {
  if (!data) return "Request failed";
  if (typeof data.message === "string") return data.message;
  if (Array.isArray(data.message) && data.message.length) return data.message.join(", ");
  return "Request failed";
}

interface GenerationRow {
  id: string;
  prompt: string;
  type: string;
  status: string;
  model: string;
  provider: string;
  imageCount: number;
  resolution?: string;
  ratio?: string;
  createdAt: string;
  error?: string;
  favorite: boolean;
  outputUrls: string[];
  thumbnailUrl: string | null;
}

function mapGeneration(row: any): GenerationRow {
  const images: any[] = Array.isArray(row.images) ? row.images : [];
  const urls = images.map((img) => toDataUrl(typeof img === "string" ? img : img?.b64 ?? ""));
  return {
    id: row.id,
    prompt: row.prompt ?? "",
    type: "IMAGE",
    status: row.status === "success" || row.status === "COMPLETED"
      ? "COMPLETED"
      : row.status === "failed" || row.status === "FAILED"
        ? "FAILED"
        : "PENDING",
    model: row.model ?? "",
    provider: row.provider ?? "",
    imageCount: row.imageCount ?? urls.length,
    resolution: row.resolution,
    ratio: row.ratio,
    createdAt: row.createdAt ?? new Date().toISOString(),
    error: row.error,
    favorite: localStore.isFavorite(row.id),
    outputUrls: urls,
    thumbnailUrl: urls[0] ?? null,
  };
}

const TYPE_KEYWORDS: Record<string, string[]> = {
  images: [],
  logos: ["logo"],
  icons: ["icon"],
  illustrations: ["illustration"],
  wallpapers: ["wallpaper", "background"],
};

function matchesType(row: GenerationRow, type: string): boolean {
  const key = type?.toLowerCase() ?? "";
  if (key === "all" || key === "images" || key === "image") return true;
  const keywords = TYPE_KEYWORDS[key];
  if (!keywords) return true;
  const text = `${row.prompt} ${row.model}`.toLowerCase();
  return keywords.some((k) => text.includes(k));
}

class ApiClient {
  private baseUrl = API_URL;

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...options?.headers },
      ...options,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(errorMessage(data));
    return data as T;
  }

  // ---------- Auth ----------

  async register(body: { name: string; email: string; password: string }) {
    const data = await this.request<{ accessToken: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return { success: true, data: { token: data.accessToken, user: data.user } };
  }

  // ---------- Generation (backend) ----------

  async getGenerations(params?: {
    page?: number;
    limit?: number;
    projectId?: string;
    type?: string;
    status?: string;
    search?: string;
    favorite?: boolean;
  }) {
    const limit = params?.limit ?? 20;
    const offset = params?.page ? (params.page - 1) * limit : 0;
    const data = await this.request<{ total: number; rows: any[] }>(
      `/generation/history?limit=${limit}&offset=${offset}`
    );

    let rows: GenerationRow[] = (data.rows ?? []).map(mapGeneration);
    if (params?.type) rows = rows.filter((r) => matchesType(r, params.type!));
    if (params?.search) {
      const q = params.search.toLowerCase();
      rows = rows.filter((r) => r.prompt.toLowerCase().includes(q));
    }
    if (params?.favorite) rows = rows.filter((r) => r.favorite);
    rows = rows.slice(0, limit);

    return { success: true, data: rows };
  }

  async getGeneration(id: string) {
    const data = await this.getGenerations({ limit: 100 });
    const row = (data.data as GenerationRow[]).find((r) => r.id === id) ?? null;
    return { success: true, data: row };
  }

  async createGeneration(body: Record<string, unknown>) {
    const payload = {
      prompt: String(body.prompt ?? ""),
      negativePrompt: body.negativePrompt ? String(body.negativePrompt) : undefined,
      imageCount: clamp(Number(body.batchCount) || 1, 1, 4),
      ratio: String(body.aspectRatio || body.ratio || "1:1"),
      resolution: mapResolution(String(body.quality ?? "")),
      model: String(body.model || "flux"),
    };

    const data = await this.request<{
      provider: string;
      model: string;
      prompt: string;
      resolution?: string;
      ratio?: string;
      usage?: { usedToday: number; quota: number; remaining: number };
      images?: any[];
    }>("/generate", { method: "POST", body: JSON.stringify(payload) });

    const images: any[] = Array.isArray(data.images) ? data.images : [];
    const urls = images.map((img) => toDataUrl(img?.b64 ?? ""));

    return {
      success: true,
      data: {
        id: `gen_${Date.now()}`,
        provider: data.provider,
        model: data.model,
        prompt: data.prompt ?? payload.prompt,
        imageCount: images.length,
        status: "COMPLETED",
        resolution: data.resolution,
        ratio: data.ratio,
        createdAt: new Date().toISOString(),
        usage: data.usage,
        favorite: false,
        outputUrls: urls,
        thumbnailUrl: urls[0] ?? null,
      },
    };
  }

  async deleteGeneration(id: string) {
    await this.request<Record<string, unknown>>(`/generation/history/${id}`, { method: "DELETE" });
    return { success: true, data: { id } };
  }

  async toggleFavorite(id: string) {
    const favorite = localStore.toggleFavorite(id);
    return { success: true, data: { id, favorite } };
  }

  async getModels() {
    const data = await this.request<{ provider: string; displayName: string; models: { name: string; label: string; maxImages?: number }[] }>("/generation/models");
    return {
      success: true,
      data: (data.models ?? []).map((m) => ({ id: m.name, label: m.label, maxImages: m.maxImages ?? 4 })),
    };
  }

  async getUsage() {
    const data = await this.request<{ usedToday: number; quota: number; remaining: number }>("/usage/me");
    return { success: true, data };
  }

  // ---------- Dashboard composition ----------

  async getDashboardStats() {
    try {
      const [usage, history] = await Promise.all([
        this.getUsage(),
        this.getGenerations({ limit: 100 }),
      ]);
      const rows = (history.data as GenerationRow[]) ?? [];
      const u = usage.data as any;
      return {
        success: true,
        data: {
          totalGenerations: rows.length,
          totalCreditsUsed: u?.usedToday ?? 0,
          credits: u?.remaining ?? 0,
          quota: u?.quota ?? 0,
          projects: localStore.getProjects().length,
          imagesGenerated: rows.length,
        },
      };
    } catch {
      return {
        success: true,
        data: {
          totalGenerations: 0,
          totalCreditsUsed: 0,
          credits: 0,
          quota: 0,
          projects: localStore.getProjects().length,
          imagesGenerated: 0,
        },
      };
    }
  }

  async getRecentActivity() {
    const history = await this.getGenerations({ limit: 8 });
    const rows = (history.data as GenerationRow[]) ?? [];
    const projectItems = localStore.getProjects().slice(0, 3).map((p) => ({
      id: p.id,
      type: "project",
      title: p.name,
      createdAt: p.createdAt,
    }));
    return {
      success: true,
      data: [
        ...rows.map((r) => ({
          id: r.id,
          type: "generation",
          title: r.prompt,
          model: r.model,
          createdAt: r.createdAt,
        })),
        ...projectItems,
      ],
    };
  }

  async getStorageInfo() {
    return { success: true, data: { usedFormatted: "0 B", percent: 0 } };
  }

  async getNotifications() {
    return { success: true, data: { notifications: [], unreadCount: 0 } };
  }

  // ---------- Projects & prompts (local mock) ----------

  async getProjects() {
    return { success: true, data: localStore.getProjects() };
  }

  async getProject(id: string) {
    const project = localStore.getProjects().find((p) => p.id === id) ?? null;
    const history = await this.getGenerations({ limit: 12 });
    return {
      success: true,
      data: project ? { ...project, generations: history.data as GenerationRow[] } : null,
    };
  }

  async createProject(body: { name: string; description?: string }) {
    return { success: true, data: localStore.createProject(body) };
  }

  async updateProject(id: string, data: Record<string, unknown>) {
    const updated = localStore.updateProject(id, data as any);
    return { success: true, data: updated };
  }

  async deleteProject(id: string) {
    localStore.deleteProject(id);
    return { success: true, data: { id } };
  }

  async getPrompts(params?: { category?: string; search?: string }) {
    let prompts = localStore.getPrompts();
    if (params?.category) prompts = prompts.filter((p) => p.category === params.category);
    if (params?.search) prompts = prompts.filter((p) => p.prompt.toLowerCase().includes(params.search!.toLowerCase()));
    return { success: true, data: prompts };
  }

  async createPrompt(body: { prompt: string; category?: string }) {
    return { success: true, data: localStore.addPrompt(body.prompt, body.category) };
  }

  async deletePrompt(id: string) {
    localStore.deletePrompt(id);
    return { success: true, data: { id } };
  }

  // ---------- Docs (static) ----------

  async getDocCategories() {
    return { success: true, data: docCategories as DocCategory[] };
  }

  async getDocPages() {
    return { success: true, data: docPages as DocPage[] };
  }

  async getDocPage(slug: string) {
    const page = docPages.find((p) => p.slug === slug) ?? null;
    return { success: true, data: page };
  }

  async searchDocs(query: string) {
    if (!query) return { success: true, data: [] as DocPage[] };
    const q = query.toLowerCase();
    return {
      success: true,
      data: docPages.filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)),
    };
  }
}

export const api = new ApiClient();
