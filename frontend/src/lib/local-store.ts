export interface StoredProject {
  id: string;
  name: string;
  description?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredPrompt {
  id: string;
  prompt: string;
  category?: string;
  favorite: boolean;
  createdAt: string;
}

const PROJECTS_KEY = "intellix_projects";
const PROMPTS_KEY = "intellix_prompts";
const FAVORITES_KEY = "intellix_favorite_generations";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return safeParse(window.localStorage.getItem(key), fallback);
}

function save(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export const localStore = {
  getProjects(): StoredProject[] {
    return load<StoredProject[]>(PROJECTS_KEY, []);
  },

  saveProjects(projects: StoredProject[]) {
    save(PROJECTS_KEY, projects);
  },

  createProject(data: { name: string; description?: string }): StoredProject {
    const now = new Date().toISOString();
    const project: StoredProject = {
      id: uid(),
      name: data.name,
      description: data.description,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    this.saveProjects([project, ...this.getProjects()]);
    return project;
  },

  updateProject(id: string, data: Partial<StoredProject>): StoredProject | null {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return null;
    projects[index] = {
      ...projects[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.saveProjects(projects);
    return projects[index];
  },

  deleteProject(id: string): boolean {
    const projects = this.getProjects();
    const next = projects.filter((p) => p.id !== id);
    if (next.length === projects.length) return false;
    this.saveProjects(next);
    return true;
  },

  getPrompts(): StoredPrompt[] {
    return load<StoredPrompt[]>(PROMPTS_KEY, []);
  },

  savePrompts(prompts: StoredPrompt[]) {
    save(PROMPTS_KEY, prompts);
  },

  addPrompt(prompt: string, category?: string): StoredPrompt {
    const entry: StoredPrompt = {
      id: uid(),
      prompt,
      category,
      favorite: false,
      createdAt: new Date().toISOString(),
    };
    this.savePrompts([entry, ...this.getPrompts()]);
    return entry;
  },

  deletePrompt(id: string): boolean {
    const prompts = this.getPrompts();
    const next = prompts.filter((p) => p.id !== id);
    if (next.length === prompts.length) return false;
    this.savePrompts(next);
    return true;
  },

  getFavorites(): string[] {
    return load<string[]>(FAVORITES_KEY, []);
  },

  isFavorite(id: string): boolean {
    return this.getFavorites().includes(id);
  },

  toggleFavorite(id: string): boolean {
    const favorites = this.getFavorites();
    const next = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    save(FAVORITES_KEY, next);
    return !favorites.includes(id);
  },
};
