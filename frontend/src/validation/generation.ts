import { z } from "zod";

export const generationSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(5000, "Prompt too long"),
  negativePrompt: z.string().max(2000).optional(),
  type: z.string().min(1),
  model: z.string().min(1),
  style: z.string().optional(),
  quality: z.string().optional(),
  aspectRatio: z.string().optional(),
  resolution: z.string().optional(),
  seed: z.string().optional(),
  cfgScale: z.string().optional(),
  guidance: z.string().optional(),
  steps: z.number().min(1).max(150).optional(),
  batchCount: z.number().min(1).max(10).optional(),
  upscaler: z.string().optional(),
  faceEnhance: z.boolean().optional(),
  removeBg: z.boolean().optional(),
  transparentBg: z.boolean().optional(),
  hdMode: z.boolean().optional(),
  private: z.boolean().optional(),
  projectId: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional(),
});

export const apiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
});

export type GenerationInput = z.infer<typeof generationSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ApiKeyInput = z.infer<typeof apiKeySchema>;
