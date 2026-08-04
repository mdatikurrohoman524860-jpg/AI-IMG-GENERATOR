import { api } from './client';
import type {
  AdminExecutionList,
  ModelRoute,
  ModelRouteStep,
  NodeLibrary,
  ProviderAdmin,
  ProviderCredential,
  ProviderModel,
  ProviderTestResult,
  RoutingVariable,
  StorageAsset,
  StorageDriver,
  StorageProvider,
  ToolAdmin,
  WorkflowExecution,
} from './types';

export async function fetchAdminProviders(): Promise<ProviderAdmin[]> {
  const { data } = await api.get('/admin/providers');
  return data;
}

export interface ProviderPatch {
  displayName?: string;
  baseUrl?: string;
  enabled?: boolean;
  supportsImages?: boolean;
  supportsVision?: boolean;
  supportsVideo?: boolean;
  priority?: number;
  timeoutMs?: number;
  maxRpm?: number;
  maxTpm?: number;
  apiKey?: string;
}

export async function createAdminProvider(payload: {
  name: string;
  displayName: string;
  baseUrl?: string;
  enabled?: boolean;
  supportsImages?: boolean;
  supportsVision?: boolean;
  supportsVideo?: boolean;
  priority?: number;
  timeoutMs?: number;
  maxRpm?: number;
  maxTpm?: number;
  imageEndpoint?: string;
  apiKey?: string;
  models?: Array<{
    displayName: string;
    internalName: string;
    enabled?: boolean;
    supportsImages?: boolean;
    supportsVision?: boolean;
    supportsVideo?: boolean;
  }>;
}): Promise<{ id: string; name: string }> {
  const { data } = await api.post('/admin/providers', payload);
  return data;
}

export async function updateAdminProvider(
  id: string,
  patch: ProviderPatch,
): Promise<{ id: string; changed: string[] }> {
  const { data } = await api.patch(`/admin/providers/${id}`, patch);
  return data;
}

export async function testAdminProvider(id: string): Promise<{
  ok: boolean;
  latencyMs: number;
  status: number;
  message: string;
}> {
  const { data } = await api.post(`/admin/providers/${id}/test`);
  return data;
}

export async function createAdminProviderModel(
  providerId: string,
  payload: {
    displayName: string;
    internalName: string;
    supportsImages?: boolean;
    supportsVision?: boolean;
    supportsVideo?: boolean;
    maxTokens?: number;
  },
): Promise<ProviderModel> {
  const { data } = await api.post(`/admin/providers/${providerId}/models`, payload);
  return data;
}

export async function updateAdminProviderModel(
  providerId: string,
  modelId: string,
  patch: {
    displayName?: string;
    internalName?: string;
    enabled?: boolean;
    supportsImages?: boolean;
    supportsVision?: boolean;
    supportsVideo?: boolean;
    maxTokens?: number;
    hidden?: boolean;
  },
): Promise<ProviderModel> {
  const { data } = await api.patch(
    `/admin/providers/${providerId}/models/${modelId}`,
    patch,
  );
  return data;
}

export async function deleteAdminProviderModel(
  providerId: string,
  modelId: string,
): Promise<{ deleted: boolean }> {
  const { data } = await api.delete(`/admin/providers/${providerId}/models/${modelId}`);
  return data;
}

export interface ProviderCredentialPayload {
  label?: string;
  enabled?: boolean;
  priority?: number;
  apiKey?: string;
}

export async function createAdminProviderCredential(
  providerId: string,
  payload: ProviderCredentialPayload,
): Promise<ProviderCredential> {
  const { data } = await api.post(`/admin/providers/${providerId}/credentials`, payload);
  return data;
}

export async function updateAdminProviderCredential(
  providerId: string,
  credentialId: string,
  patch: ProviderCredentialPayload,
): Promise<ProviderCredential> {
  const { data } = await api.patch(
    `/admin/providers/${providerId}/credentials/${credentialId}`,
    patch,
  );
  return data;
}

export async function deleteAdminProviderCredential(
  providerId: string,
  credentialId: string,
): Promise<{ removed: boolean }> {
  const { data } = await api.delete(
    `/admin/providers/${providerId}/credentials/${credentialId}`,
  );
  return data;
}

export async function testAdminProviderCredential(
  providerId: string,
  credentialId: string,
): Promise<ProviderTestResult> {
  const { data } = await api.post(
    `/admin/providers/${providerId}/credentials/${credentialId}/test`,
  );
  return data;
}

export async function fetchAdminTools(): Promise<ToolAdmin[]> {
  const { data } = await api.get('/admin/tools');
  return data;
}

export async function updateAdminTool(
  key: string,
  patch: {
    enabled?: boolean;
    defaultBinding?: Array<{ provider: string; model: string }>;
  },
): Promise<ToolAdmin> {
  const { data } = await api.patch(`/admin/tools/${key}`, patch);
  return data;
}

export async function fetchStorageAssets(
  limit = 100,
  offset = 0,
): Promise<StorageAsset[]> {
  const { data } = await api.get('/admin/storage/assets', {
    params: { limit, offset },
  });
  return data;
}

export async function deleteStorageAsset(id: string): Promise<{ deleted: boolean }> {
  const { data } = await api.delete(`/admin/storage/assets/${id}`);
  return data;
}

export async function fetchStorageProviders(): Promise<StorageProvider[]> {
  const { data } = await api.get('/admin/storage/providers');
  return data;
}

export interface StorageProviderPayload {
  name?: string;
  driver?: StorageDriver;
  config?: Record<string, unknown>;
  enabled?: boolean;
  isActive?: boolean;
  priority?: number;
}

export async function createStorageProvider(
  payload: StorageProviderPayload,
): Promise<StorageProvider> {
  const { data } = await api.post('/admin/storage/providers', payload);
  return data;
}

export async function updateStorageProvider(
  id: string,
  payload: StorageProviderPayload,
): Promise<StorageProvider> {
  const { data } = await api.patch(`/admin/storage/providers/${id}`, payload);
  return data;
}

export async function deleteStorageProvider(id: string): Promise<{ removed: boolean }> {
  const { data } = await api.delete(`/admin/storage/providers/${id}`);
  return data;
}

export async function testStorageProvider(
  id: string,
): Promise<{ ok: boolean; latencyMs: number; message: string }> {
  const { data } = await api.post(`/admin/storage/providers/${id}/test`);
  return data;
}

export async function fetchAdminRoutes(): Promise<ModelRoute[]> {
  const { data } = await api.get('/admin/routes');
  return data;
}

export async function createAdminRoute(payload: {
  name: string;
  description?: string;
  steps?: ModelRouteStep[];
  retryPolicy?: Record<string, unknown>;
}): Promise<ModelRoute> {
  const { data } = await api.post('/admin/routes', payload);
  return data;
}

export async function updateAdminRoute(
  id: string,
  patch: {
    name?: string;
    description?: string | null;
    steps?: ModelRouteStep[];
    retryPolicy?: Record<string, unknown>;
    enabled?: boolean;
  },
): Promise<ModelRoute> {
  const { data } = await api.patch(`/admin/routes/${id}`, patch);
  return data;
}

export async function deleteAdminRoute(id: string): Promise<{ removed: boolean }> {
  const { data } = await api.delete(`/admin/routes/${id}`);
  return data;
}

export async function fetchNodeLibrary(): Promise<NodeLibrary> {
  const { data } = await api.get('/admin/nodes');
  return data;
}

export async function syncModelCapabilities(): Promise<number> {
  const { data } = await api.post('/admin/nodes/sync-model-capabilities');
  return data;
}

export async function fetchStorageAssetFile(
  id: string,
): Promise<{ blob: Blob; mime: string | null }> {
  const { data } = await api.get<Blob>(`/admin/storage/assets/${id}/file`, {
    responseType: 'blob',
  });
  const mime = (data as Blob).type || null;
  return { blob: data as Blob, mime };
}

export async function fetchRoutingVariables(): Promise<RoutingVariable[]> {
  const { data } = await api.get('/admin/routing-variables');
  return data;
}

export async function fetchAdminExecutions(params: {
  status?: string;
  workflowId?: string;
  source?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminExecutionList> {
  const { data } = await api.get('/orchestrator/executions', { params });
  return data;
}

export async function fetchAdminExecution(id: string): Promise<WorkflowExecution> {
  const { data } = await api.get(`/orchestrator/executions/${id}`);
  return data;
}

export async function retryAdminExecution(id: string): Promise<{ id: string }> {
  const { data } = await api.post(`/orchestrator/executions/${id}/retry`);
  return data;
}

export interface ProjectWorkflow {
  id: string;
  name: string;
  enabled: boolean;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  secretKeyLast4: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  workflows: ProjectWorkflow[];
  workflowCount: number;
  executionCount: number;
}

export async function fetchProjects(): Promise<ProjectSummary[]> {
  const { data } = await api.get('/projects');
  return data;
}

export async function clearAuditLogs(): Promise<{ removed: number }> {
  const { data } = await api.delete('/admin/audit');
  return data;
}

export async function createProject(payload: {
  name: string;
  description?: string;
  workflowIds?: string[];
}): Promise<ProjectSummary & { secretKey: string }> {
  const { data } = await api.post('/projects', payload);
  return data;
}

export async function updateProject(
  id: string,
  payload: { name?: string; description?: string; enabled?: boolean },
): Promise<ProjectSummary> {
  const { data } = await api.patch(`/projects/${id}`, payload);
  return data;
}

export async function linkWorkflows(id: string, workflowIds: string[]): Promise<{ linked: number }> {
  const { data } = await api.post(`/projects/${id}/workflows`, { workflowIds });
  return data;
}

export async function unlinkWorkflow(id: string, workflowId: string): Promise<unknown> {
  const { data } = await api.delete(`/projects/${id}/workflows/${workflowId}`);
  return data;
}

export async function regenerateProjectKey(id: string): Promise<{ id: string; secretKey: string }> {
  const { data } = await api.post(`/projects/${id}/regenerate-key`);
  return data;
}

export async function deleteProject(id: string): Promise<{ id: string }> {
  const { data } = await api.delete(`/projects/${id}`);
  return data;
}
